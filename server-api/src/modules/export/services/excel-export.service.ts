import { forwardRef, Inject, Injectable } from '@nestjs/common';
import User from 'src/database/models/users.model';
import { BadRequestError, dateToShortString, formatDate } from 'src/shared/utils';
import * as ExcelJS from 'exceljs';
import Invoice from 'src/database/models/invoices.model';
import InvoiceDetail from 'src/database/models/invoice-details.model';
import InvoiceProduct from 'src/database/models/invoice-products.model';
import { OfferService } from 'src/modules/offers/services/offer.service';
import { DashboardService } from 'src/modules/dashboard/services/dashboard.service';
import { Op, WhereOptions } from 'sequelize';
import Setting from 'src/database/models/setting.model';
import Customer from 'src/database/models/customers.model';
import { ReportService } from 'src/modules/report/services/report.service';
import { CompanyService } from 'src/modules/company/services/company.service';
import { SettingService } from 'src/modules/setting/services/setting.service';
import { BaseUser, JobRates } from 'src/shared/dto';
import { BaseInvoice } from 'src/shared/dto/invoice.dto';
import { CodeEnum } from 'src/shared/enums';
import NumberEntry from 'src/database/models/numbers.model';
import { STATUS_LABEL } from 'src/shared/constants/invoice-status-label.constant';
import {
  offerXLSXColumns,
  userXLSXColumns,
  addressesXLSXColumns,
  expenseXLSXColumns,
  projectInvoiceXLSXColumns,
} from 'src/shared/constants/xlsx-column.constant';
import {
  invoiceXLSXHeader,
  offerXLSXHeader,
  projectXLSXHeader,
  userWithRateXLSXHeader,
  userXLSXHeader,
  addressesXLSXHeader,
  expenseNoRateXLSXHeader,
  expenseXLSXHeader,
  mainProjectXLSXFixedHeader,
  connectedProjectXLSXHeader,
} from 'src/shared/constants/xlsx-header.constant';
import InvoiceAdditionalCost from 'src/database/models/invoice-additional-costs.model';
import InvoiceLabel from 'src/database/models/invoice-labels.model';

@Injectable()
export class ExcelExportService {
  constructor(
    @Inject('CUSTOMER_REPOSITORY')
    private readonly customerRepository: typeof Customer,
    @Inject('USER_REPOSITORY')
    private readonly userRepository: typeof User,
    @Inject('SETTING_REPOSITORY')
    private readonly settingRepository: typeof Setting,
    @Inject('INVOICE_REPOSITORY')
    private readonly invoiceRepository: typeof Invoice,
    @Inject('INVOICE_DETAIL_REPOSITORY')
    private readonly invoiceDetailRepository: typeof InvoiceDetail,
    @Inject('INVOICE_PRODUCT_REPOSITORY')
    private readonly invoiceProductRepository: typeof InvoiceProduct,
    @Inject('INVOICE_ADDITIONAL_COST_REPOSITORY')
    private readonly invoiceAdditionalCostRepository: typeof InvoiceAdditionalCost,
    @Inject('INVOICE_LABEL_REPOSITORY')
    private readonly invoiceLabelRepository: typeof InvoiceLabel,
    @Inject(forwardRef(() => OfferService))
    private readonly offersService: OfferService,
    @Inject(forwardRef(() => DashboardService))
    private readonly dashboardService: DashboardService,
    private readonly reportService: ReportService,
    private readonly companyService: CompanyService,
    private readonly settingService: SettingService,
  ) {}

  /** Works the same way as report.php */
  async exportInvoicesXLSX(
    currentUser: User,
    startDate: Date,
    endDate: Date,
    status: string,
    customerId: string,
  ): Promise<Buffer> {
    if (customerId === '0' || customerId === '') {
      customerId = 'all';
    }
    if (status === '') {
      status = 'all';
    }

    // Create ExcelJS Workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Worksheet');

    // Create Header
    invoiceXLSXHeader.forEach((header) => {
      this.createCell(worksheet.getCell(header.index), header.heading, header.style, header.alignment);
    });

    // Create Body
    let finalTotalNet = 0;
    let finalTotalGross = 0;
    const startRowIndex = 4;
    let lastRowIndex = 0;

    const baseInvoices: BaseInvoice[] = await this.getBaseInvoices(
      currentUser.company_id,
      status,
      dateToShortString(startDate),
      dateToShortString(endDate),
      customerId,
    );
    const invoices = this.transformInvoices(baseInvoices);

    invoices.forEach((invoice, index) => {
      const chargedOn = invoice.charged_on ? invoice.charged_on : invoice.date;
      const chargedDate = typeof chargedOn === 'string' ? new Date(chargedOn.split('.')[0]) : chargedOn;
      const dueDate = invoice.due_on ?? '';

      worksheet.getCell(`A${startRowIndex + index}`).value = formatDate(chargedDate, 'DD.MM.YYYY', true);
      worksheet.getCell(`B${startRowIndex + index}`).value = dueDate ? formatDate(dueDate, 'DD.MM.YYYY', true) : '';
      worksheet.getCell(`C${startRowIndex + index}`).value = '';
      worksheet.getCell(`D${startRowIndex + index}`).value = '';
      worksheet.getCell(`E${startRowIndex + index}`).value = '';
      worksheet.getCell(`F${startRowIndex + index}`).value = '';
      worksheet.getCell(`G${startRowIndex + index}`).value = '';
      this.createCell(
        worksheet.getCell(`H${startRowIndex + index}`),
        invoice.number,
        { name: 'Calibri' },
        { horizontal: 'left' },
      );
      worksheet.getCell(`I${startRowIndex + index}`).value = invoice.title;
      worksheet.getCell(`J${startRowIndex + index}`).value = invoice.ref_number;
      worksheet.getCell(`K${startRowIndex + index}`).value = invoice.customer;
      worksheet.getCell(`L${startRowIndex + index}`).value = STATUS_LABEL[invoice.status] ?? '';
      worksheet.getCell(`M${startRowIndex + index}`).value = '';

      const net = invoice.net_amount + invoice.net_amount_nk;
      const gross = invoice.gross_amount + invoice.gross_amount_nk;
      const netRounded = this.formatFloat(net);
      const grossRounded = this.formatFloat(gross);
      this.createCell(
        worksheet.getCell(`N${startRowIndex + index}`),
        netRounded,
        { name: 'Calibri' },
        { horizontal: 'left' },
      );
      this.createCell(
        worksheet.getCell(`O${startRowIndex + index}`),
        grossRounded,
        { name: 'Calibri' },
        { horizontal: 'left' },
      );

      finalTotalNet += net;
      finalTotalGross += gross;
      lastRowIndex = startRowIndex + index;
    });

    // Create Footer
    worksheet.getCell(`M${lastRowIndex + 1}`).value = 'TOTAL';
    this.createCell(
      worksheet.getCell(`N${lastRowIndex + 1}`),
      this.formatFloat(finalTotalNet),
      { name: 'Calibri', bold: true, underline: true },
      { horizontal: 'left' },
    );
    this.createCell(
      worksheet.getCell(`O${lastRowIndex + 1}`),
      this.formatFloat(finalTotalGross),
      { name: 'Calibri', bold: true, underline: true },
      { horizontal: 'left' },
    );

    const xlsxBuffer = (await workbook.xlsx.writeBuffer()) as Buffer;
    return xlsxBuffer;
  }

  /** Works the same way as reportoffers.php */
  async exportOffersXLSX(currentUser: User, status: string): Promise<Buffer> {
    if (status === '') {
      status = 'all';
    }

    // Create ExcelJS Workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Worksheet');

    // Create Header
    offerXLSXHeader.forEach((header) => {
      this.createCell(worksheet.getCell(header.index), header.heading, header.style, header.alignment);
    });

    // Create body
    const startRowIndex = 4;
    const offers = await this.offersService.listOffers(currentUser, status);

    offers.detailedOffers.forEach((offer, index) => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const customerCompany = offer.customer.company;

      worksheet.getCell(`A${startRowIndex + index}`).value = offer.id ?? 0;
      worksheet.getCell(`B${startRowIndex + index}`).value =
        customerCompany || `${offer.customer.first_name} ${offer.customer.last_name}`;
      worksheet.getCell(`C${startRowIndex + index}`).value = offer.name;
      worksheet.getCell(`D${startRowIndex + index}`).value =
        offer.detail_cost.total_gross + offer.detail_cost.total_gross_nk;
      worksheet.getCell(`E${startRowIndex + index}`).value = offer.status;
    });

    // Set column width
    offerXLSXColumns.forEach((column) => {
      this.setWidthColumn(worksheet, column.index, column.width);
    });

    const xlsxBuffer = (await workbook.xlsx.writeBuffer()) as Buffer;
    return xlsxBuffer;
  }

  /** Works the same way as reportprojects.php */
  async exportProjectsXLSX(currentUser: User, status: string = 'all'): Promise<Buffer> {
    // Create ExcelJS Workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Worksheet');

    // Create Header
    projectXLSXHeader.forEach((header) => {
      this.createCell(worksheet.getCell(header.index), header.heading, header.style, header.alignment);
    });

    // Create body
    const startRowIndex = 4;
    const summary = await this.dashboardService.getSummary(currentUser.company_id, status);
    const projects = summary.projects;

    projects.forEach((project, index) => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const customerCompany = project.customer.company;

      worksheet.getCell(`A${startRowIndex + index}`).value = project.number.custom_id || project.number.id;
      worksheet.getCell(`B${startRowIndex + index}`).value =
        customerCompany || `${project.customer.first_name} ${project.customer.last_name}`;
      worksheet.getCell(`C${startRowIndex + index}`).value = project.name;
      worksheet.getCell(`D${startRowIndex + index}`).value = project.invoiced;
      worksheet.getCell(`E${startRowIndex + index}`).value = project.remaining;
      worksheet.getCell(`F${startRowIndex + index}`).value = project.total_hours;
      worksheet.getCell(`G${startRowIndex + index}`).value = project.logged_hours;
      worksheet.getCell(`H${startRowIndex + index}`).value = project.date;
      worksheet.getCell(`I${startRowIndex + index}`).value = project.end_on || '';
    });

    const xlsxBuffer = (await workbook.xlsx.writeBuffer()) as Buffer;
    return xlsxBuffer;
  }

  /** Works the same way as report_users_with_rate.php */
  async exportUsersWithRateXLSX(currentUser: User): Promise<Buffer> {
    // Create ExcelJS Workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Worksheet');

    // Create Header
    userWithRateXLSXHeader.forEach((header) => {
      this.createCell(worksheet.getCell(header.index), header.heading, header.style, header.alignment);
    });

    // Create Body
    const baseUsers = await this.getBaseUsers(currentUser.company_id);
    const startRowIndex = 4;

    baseUsers.forEach((user, index) => {
      worksheet.getCell(`A${startRowIndex + index}`).value = `${user.first_name ?? ''} ${user.last_name ?? ''}`;
      this.createCell(
        worksheet.getCell(`B${startRowIndex + index}`),
        user.dob ? formatDate(user.dob, 'YYYY') : '',
        { name: 'Calibri' },
        { horizontal: 'right' },
      );
      worksheet.getCell(`C${startRowIndex + index}`).value = user.job ?? '';
      this.createCell(
        worksheet.getCell(`D${startRowIndex + index}`),
        user.rate,
        { name: 'Calibri' },
        { horizontal: 'right' },
      );
    });

    const xlsxBuffer = (await workbook.xlsx.writeBuffer()) as Buffer;
    return xlsxBuffer;
  }

  /** Works the same way as reportusers.php */
  async exportUserXLSX(currentUser: User): Promise<Buffer> {
    // Create ExcelJS Workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Worksheet');

    // Create Header
    userXLSXHeader.forEach((header) => {
      this.createCell(worksheet.getCell(header.index), header.heading, header.style, header.alignment);
    });

    // Create Body
    const baseUsers = await this.getBaseUsers(currentUser.company_id);
    const startRowIndex = 4;

    baseUsers.forEach((user, index) => {
      const dobFormatted = user.dob ? formatDate(user.dob, 'DD.MM.YYYY') : '';
      const startWorkDate = user.start_work_date ? formatDate(user.start_work_date, 'DD.MM.YYYY') : '';
      const fullAddress = `${user.address ?? ''} - ${user.place ?? ''}`;

      worksheet.getCell(`A${startRowIndex + index}`).value = `${user.first_name ?? ''} ${user.last_name ?? ''}`;
      worksheet.getCell(`B${startRowIndex + index}`).value = `${fullAddress}\n${user.email ?? ''}\n${user.phone ?? ''}`;
      worksheet.getCell(`C${startRowIndex + index}`).value = `${user.job ?? ''}\n${dobFormatted}`;
      worksheet.getCell(`D${startRowIndex + index}`).value = startWorkDate;
    });

    // Set column width
    userXLSXColumns.forEach((column) => {
      this.setWidthColumn(worksheet, column.index, column.width);
    });

    const xlsxBuffer = (await workbook.xlsx.writeBuffer()) as Buffer;
    return xlsxBuffer;
  }

  /** Works the same way as reportaddresses.php */
  async exportAddressesXLSX(companyId: number): Promise<Buffer> {
    // Create ExcelJS Workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Worksheet');

    // Create Header
    addressesXLSXHeader.forEach((header) => {
      this.createCell(worksheet.getCell(header.index), header.heading, header.style, header.alignment);
    });

    // Create Body
    const customers = await this.getCustomers(companyId);
    const startRowIndex = 4;

    customers.forEach((customer, index) => {
      const name = customer.name ? customer.name : `${customer.first_name ?? ''} ${customer.last_name ?? ''}`;

      worksheet.getRow(startRowIndex + index).height = 40;
      worksheet.getCell(`A${startRowIndex + index}`).value = name;
      worksheet.getCell(`B${startRowIndex + index}`).value = customer.category ?? '';
      worksheet.getCell(`C${startRowIndex + index}`).value = customer.metadata.address ?? '';
      this.createCell(
        worksheet.getCell(`D${startRowIndex + index}`),
        customer.metadata.postcode ?? '',
        {},
        { horizontal: 'right' },
      );
      worksheet.getCell(`E${startRowIndex + index}`).value = customer.metadata.place ?? '';
      worksheet.getCell(`F${startRowIndex + index}`).value = customer.metadata.email ?? '';
      worksheet.getCell(`G${startRowIndex + index}`).value = customer.metadata.phone ?? '';
    });

    // Set column width
    addressesXLSXColumns.forEach((column) => {
      this.setWidthColumn(worksheet, column.index, column.width);
    });

    const xlsxBuffer = (await workbook.xlsx.writeBuffer()) as Buffer;
    return xlsxBuffer;
  }

  /**
   * @deprecated: Keep old logic in Golang but Frontend only use case exportExpenseXLSX
   */
  async exportExpense(
    currentUser: User,
    projectId: number,
    type: string,
    startDate: Date,
    endDate: Date,
    companyId: string,
  ): Promise<Buffer> {
    switch (type) {
      case CodeEnum.XLSXTypeInvoices:
        return await this.exportInvoicesXLSX(currentUser, startDate, endDate, '', '');
      case CodeEnum.XLSXTypeProjects:
        return await this.exportProjectsXLSX(currentUser);
      case CodeEnum.XLSXTypeOffers:
        return await this.exportOffersXLSX(currentUser, '');
      case CodeEnum.XLSXTypeUsers:
        return await this.exportUserXLSX(currentUser);
      case CodeEnum.XLSXTypeUsersWithRate:
        return await this.exportUsersWithRateXLSX(currentUser);
      case CodeEnum.XLSXTypeAddresses:
        return await this.exportAddressesXLSX(currentUser.company_id);
      case CodeEnum.XLSXTypeListEffortExternal:
      case CodeEnum.XLSXTypeListEffortExternalNoRate:
      case CodeEnum.XLSXTypeListEffortInternal:
      case CodeEnum.XLSXTypeListEffortInternalNoRate:
        return await this.exportExpenseXLSX(currentUser, type, companyId, projectId, startDate, endDate);
      case CodeEnum.XLSXTypeProjectInvoices:
        throw new BadRequestError('not implemented');
      default:
        throw new BadRequestError('Type export is invalid');
    }
  }

  /** Works the same way as reportexpenses.php */
  async exportExpenseXLSX(
    currentUser: User,
    type: string,
    companyId: string,
    projectId: number,
    startDate: Date,
    endDate: Date,
  ): Promise<Buffer> {
    // Create ExcelJS Workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Worksheet');

    const expenses = await this.reportService.projectWithRateReport(
      currentUser.company_id,
      projectId,
      startDate,
      endDate,
      '',
      companyId,
    );
    const isInternal = type.includes('internal');
    const noRate = type.includes('without');

    // Create Header
    if (noRate) {
      expenseNoRateXLSXHeader(startDate, endDate).forEach((header) => {
        this.createCell(worksheet.getCell(header.index), header.heading, header.style, header.alignment);
      });
    } else {
      expenseXLSXHeader(startDate, endDate).forEach((header) => {
        this.createCell(worksheet.getCell(header.index), header.heading, header.style, header.alignment);
      });
    }

    // Create Body
    let startRowIndex = 7;
    const data: {
      number: string;
      name: string;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      meta: any;
    } = { number: '', name: '', meta: {} };

    expenses.forEach((expense) => {
      const logDate = formatDate(expense.date, 'DD-MM-YYYY');

      data.number = expense.number.trim();
      data.name = expense.name.trim();
      data.meta[expense.product_name] = {
        ...data.meta[expense.product_name],
        [expense.staff_id]: {
          name: isInternal ? expense.staff_name : `${expense.job} ${expense.staff_id}`,
          logs: {
            ...(data.meta[expense.product_name] && data.meta[expense.product_name][expense.staff_id]
              ? data.meta[expense.product_name][expense.staff_id].logs
              : {}),
            [logDate]: {
              [expense.task]: {
                hours: expense.hours,
              },
            },
          },
        },
      };
      data.meta[expense.product_name][expense.staff_id]['rate'] = noRate ? 0 : expense.rate;
      if (isInternal) {
        data.meta[expense.product_name][expense.staff_id]['logs'][logDate][expense.task]['comment'] = expense.comment;
      }
    });

    worksheet.getCell(`A${startRowIndex}`).value = data.number;
    worksheet.getCell(`B${startRowIndex}`).value = data.name;

    let productHours = 0;
    let productCosts = 0;

    for (const product of Object.keys(data.meta)) {
      startRowIndex++;
      let sumHours = 0;
      let sumCosts = 0;
      this.createCell(worksheet.getCell(`C${startRowIndex}`), product, { name: 'Calibri', bold: true });

      for (const staffId of Object.keys(data.meta[product])) {
        const staffMetadata = data.meta[product][staffId];
        const currentRate = parseFloat(staffMetadata['rate']);
        let totalHours = 0;
        let totalCosts = 0;
        startRowIndex++;
        this.createCell(worksheet.getCell(`D${startRowIndex}`), staffMetadata['name'], { name: 'Calibri', bold: true });
        this.createCell(worksheet.getCell(`F${startRowIndex}`), staffMetadata['rate'] || '', { name: 'Calibri' });

        for (const logDate of Object.keys(staffMetadata['logs'])) {
          for (const task of Object.keys(staffMetadata['logs'][logDate])) {
            startRowIndex++;
            worksheet.getCell(`E${startRowIndex}`).value = logDate;
            worksheet.getCell(`G${startRowIndex}`).value = staffMetadata['logs'][logDate][task]['hours'];
            const cost = parseFloat(staffMetadata['logs'][logDate][task]['hours']) * currentRate;
            worksheet.getCell(`H${startRowIndex}`).value = cost;

            if (isInternal) {
              worksheet.getCell(`I${startRowIndex}`).value = staffMetadata['logs'][logDate][task]['comment'];
            }

            totalHours += parseFloat(staffMetadata['logs'][logDate][task]['hours']);
            totalCosts += cost;
          }
        }
        startRowIndex++;
        worksheet.getCell(`D${startRowIndex}`).value = `Total ${staffMetadata['name']}`;
        worksheet.getCell(`G${startRowIndex}`).value = totalHours;
        worksheet.getCell(`H${startRowIndex}`).value = totalCosts;

        sumHours += totalHours;
        sumCosts += totalCosts;
      }
      startRowIndex++;
      this.createCell(worksheet.getCell(`C${startRowIndex}`), `Total ${product}`, { name: 'Calibri', bold: true });
      worksheet.getCell(`G${startRowIndex}`).value = sumHours;
      worksheet.getCell(`H${startRowIndex}`).value = sumCosts;

      productHours += sumHours;
      productCosts += sumCosts;
    }
    startRowIndex++;
    this.createCell(worksheet.getCell(`B${startRowIndex}`), `Total`, { name: 'Calibri', bold: true });
    this.createCell(worksheet.getCell(`G${startRowIndex}`), productHours.toString(), { name: 'Calibri', bold: true });
    this.createCell(worksheet.getCell(`H${startRowIndex}`), productCosts.toString(), { name: 'Calibri', bold: true });

    // Set column width
    expenseXLSXColumns(noRate).forEach((column) => {
      this.setWidthColumn(worksheet, column.index, column.width);
    });

    const xlsxBuffer = (await workbook.xlsx.writeBuffer()) as Buffer;
    return xlsxBuffer;
  }

  /** Work the same way as report_project_invoices.php */
  async exportProjectInvoicesXLSX(currentUser: User, projectId: number): Promise<Buffer> {
    // Create ExcelJS Workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Worksheet', {
      pageSetup: {
        paperSize: 9,
        orientation: 'landscape',
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
        horizontalCentered: true,
        verticalCentered: false,
      },
      views: [
        {
          showGridLines: false,
        },
      ],
    });
    const numberCells: string[] = [];

    // Set column width
    projectInvoiceXLSXColumns.forEach((column) => {
      this.setWidthColumn(worksheet, column.index, column.width);
    });

    // Get data
    const company = await this.companyService.selectCompany(currentUser.company_id);
    const setting = await this.settingService.selectSetting(currentUser.company_id);
    const data = await this.reportService.projectWithInvoiceReport(projectId, currentUser.company_id);

    const mainProject = data.project;
    const connectedProjects = data.projects;

    // Create main project fixed header
    mainProjectXLSXFixedHeader(company, setting, mainProject).forEach((header) => {
      this.createCell(worksheet.getCell(header.index), header.heading, header.style, header.alignment);
    });
    this.setCellBackground(worksheet, ['A14', 'B14', 'C14', 'D14'], undefined, true);
    numberCells.push(...['C12', 'D12', 'C17', 'D17']);

    // Create main project dynamic header
    let rowIndex = 18;
    const totalProjectCostPositions: { [projectId: string]: number } = {};
    const hourCostTotalPositions: { [projectId: string]: number } = {};
    const totalInvoicePositions: { [projectId: string]: number } = {};
    const totalCostPositions: { [projectId: string]: number } = {};

    // Projektertrag section
    connectedProjects.forEach((project) => {
      worksheet.getCell(`A${rowIndex}`).value = `Rechnungen ${project.company.name ?? ''}`;
      totalProjectCostPositions[project.id] = rowIndex++;
    });
    worksheet.getCell(`A${rowIndex}`).value = 'Total Projektertrag (immer positiv)';
    worksheet.getCell(`C${rowIndex}`).value = { formula: `SUM(C17:C${rowIndex - 1})` };
    worksheet.getCell(`D${rowIndex}`).value = { formula: `SUM(D17:D${rowIndex - 1})` };
    this.setCellBackground(
      worksheet,
      [`A${rowIndex}`, `B${rowIndex}`, `C${rowIndex}`, `D${rowIndex}`],
      { argb: 'F2CEEF', theme: 1 },
      true,
    );
    numberCells.push(...[`C${rowIndex}`, `D${rowIndex}`]);

    // Leistungsrendite section
    rowIndex += 2;
    worksheet.getCell(`A${rowIndex++}`).value = 'Leistungsrendite';
    let mainHourPosition = rowIndex;

    connectedProjects.forEach((project) => {
      worksheet.getCell(`A${rowIndex}`).value = `Rechnungen ${project.company.name ?? ''}`;
      hourCostTotalPositions[project.id] = rowIndex++;
    });
    this.createCell(worksheet.getCell(`A${rowIndex}`), 'Total Leistungsertrag', {
      name: 'Calibri',
      size: 11,
      bold: true,
    });
    worksheet.getCell(`C${rowIndex}`).value = { formula: `SUM(C${mainHourPosition}:C${rowIndex - 1})` };
    worksheet.getCell(`D${rowIndex}`).value = { formula: `SUM(D${mainHourPosition}:D${rowIndex - 1})` };
    this.setCellBackground(
      worksheet,
      [`A${rowIndex}`, `B${rowIndex}`, `C${rowIndex}`, `D${rowIndex}`],
      { argb: 'F2CEEF', theme: 1 },
      true,
    );
    numberCells.push(...[`C${rowIndex}`, `D${rowIndex}`]);

    // Stundenaufwand Plan4 Architekten section
    worksheet.getCell(`A${++rowIndex}`).value = 'Stundenaufwand Plan4 Architekten';
    mainHourPosition = rowIndex++;
    this.createCell(worksheet.getCell(`A${rowIndex}`), 'Stundenertrag (min. 130.-/h)', {
      name: 'Calibri',
      size: 12,
      bold: true,
    });
    worksheet.getCell(`C${rowIndex}`).value = { formula: `C${rowIndex - 2}/B${rowIndex - 1}` };
    worksheet.getCell(`D${rowIndex}`).value = { formula: `D${rowIndex - 2}/B${rowIndex - 1}` };
    this.setCellBackground(
      worksheet,
      [`A${rowIndex}`, `B${rowIndex}`, `C${rowIndex}`, `D${rowIndex}`],
      { argb: 'F2CEEF', theme: 1 },
      true,
    );
    this.setBorderForRange(worksheet, rowIndex, rowIndex, 1, 4, 'thick', {
      top: true,
      bottom: true,
      left: false,
      right: false,
    });
    numberCells.push(...[`C${rowIndex}`, `D${rowIndex}`]);

    // Invoices of projects section
    let isFirst = false;
    connectedProjects.forEach((project, index) => {
      if (!isFirst) {
        rowIndex += 3;
      } else {
        isFirst = true;
      }

      const detailCost = project.detail_cost;
      const totalProjectNet = detailCost.total_net + detailCost.total_netnk;
      const totalProjectGross = detailCost.total_gross + detailCost.total_grossnk;

      const boxStartRowIndex = rowIndex;
      // Create box header
      this.createCell(worksheet.getCell(`A${rowIndex}`), `Honorarangebot ${project.company.name}`, {
        name: 'Calibri',
        size: 14,
        bold: true,
      });
      this.createCell(worksheet.getCell(`C${rowIndex}`), totalProjectNet, { name: 'Calibri', size: 12, bold: true });
      this.createCell(worksheet.getCell(`D${rowIndex}`), totalProjectGross, { name: 'Calibri', size: 12, bold: true });
      numberCells.push(...[`C${rowIndex}`, `D${rowIndex}`]);

      const totalProjectPosition = rowIndex++;
      this.createCell(worksheet.getCell(`C${rowIndex}`), '(exkl. MWST)', { name: 'Calibri' }, { horizontal: 'right' });
      this.createCell(worksheet.getCell(`D${rowIndex}`), '(inkl. MWST)', { name: 'Calibri' }, { horizontal: 'right' });

      // Create box sub header
      rowIndex += 2;
      const { rowIndex: updatedRowIndex, xlsxHeader } = connectedProjectXLSXHeader(rowIndex);
      rowIndex = updatedRowIndex;
      xlsxHeader.forEach((header) => {
        this.createCell(worksheet.getCell(header.index), header.heading, header.style, header.alignment);

        worksheet.getCell(`A${rowIndex}`).border = { bottom: { style: 'thin' } };
        worksheet.getCell(`B${rowIndex}`).border = { bottom: { style: 'thin' } };
        worksheet.getCell(`C${rowIndex}`).border = { bottom: { style: 'thin' } };
        worksheet.getCell(`D${rowIndex}`).border = { bottom: { style: 'thin' } };
        worksheet.getCell(`E${rowIndex}`).border = { bottom: { style: 'thin' } };
      });

      // Create body
      rowIndex++;
      const startSumFromRow = rowIndex;
      project.invoices.forEach((invoice) => {
        const detailCost = invoice.detail_cost;
        worksheet.getCell(`A${rowIndex}`).value = invoice.name;
        this.createCell(
          worksheet.getCell(`B${rowIndex}`),
          formatDate(invoice.details?.date, 'MM/DD/YYYY'),
          { name: 'Calibri' },
          { horizontal: 'right' },
        );
        this.createCell(
          worksheet.getCell(`C${rowIndex}`),
          detailCost.total_net + detailCost.total_net_nk,
          { name: 'Calibri' },
          { horizontal: 'right' },
        );
        this.createCell(
          worksheet.getCell(`D${rowIndex}`),
          detailCost.total_gross + detailCost.total_gross_nk,
          { name: 'Calibri' },
          { horizontal: 'right' },
        );
        this.createCell(
          worksheet.getCell(`E${rowIndex++}`),
          STATUS_LABEL[invoice.status],
          { name: 'Calibri', size: 10, bold: true },
          { horizontal: 'right' },
        );
      });
      const endSumFromRow = rowIndex - 1;

      // Total invoice
      worksheet.getCell(`A${rowIndex}`).value = 'Total';
      worksheet.getCell(`C${rowIndex}`).value = { formula: `IFERROR(SUM(C${startSumFromRow}:C${endSumFromRow}), 0)` };
      worksheet.getCell(`D${rowIndex}`).value = { formula: `IFERROR(SUM(D${startSumFromRow}:D${endSumFromRow}), 0` };
      numberCells.push(...[`C${rowIndex}`, `D${rowIndex}`]);
      const totalInvoicePosition = rowIndex;
      totalInvoicePositions[index] = rowIndex++;

      // Create footer
      this.createCell(worksheet.getCell(`A${rowIndex}`), 'Offener Honorarbetrag', {
        name: 'Calibri',
        size: 10,
        bold: true,
      });
      // Set bg color for cells
      if (project.id === mainProject.id) {
        this.setCellBackground(
          worksheet,
          [`A${rowIndex}`, `B${rowIndex}`, `C${rowIndex}`, `D${rowIndex}`, `E${rowIndex}`],
          { argb: 'F2CEEF', theme: 1 },
          true,
        );
      } else {
        this.setCellBackground(
          worksheet,
          [`A${rowIndex}`, `B${rowIndex}`, `C${rowIndex}`, `D${rowIndex}`, `E${rowIndex}`],
          { argb: 'FBE2D5', theme: 1 },
          true,
        );
      }

      worksheet.getCell(`C${rowIndex}`).value = { formula: `C${totalProjectPosition} - C${totalInvoicePosition}` };
      worksheet.getCell(`D${rowIndex}`).value = { formula: `D${totalProjectPosition} - D${totalInvoicePosition}` };
      numberCells.push(...[`C${rowIndex}`, `D${rowIndex}`]);

      const costPosition = rowIndex;
      totalCostPositions[index] = rowIndex++;

      // Aufwand in h (effektiv) line
      this.createCell(worksheet.getCell(`A${rowIndex}`), 'Aufwand in h (effektiv)', {
        name: 'Calibri',
        size: 10,
        bold: true,
      });
      this.createCell(
        worksheet.getCell(`B${rowIndex}`),
        project.logged_hours,
        { name: 'Calibri', size: 10, bold: true },
        { horizontal: 'left' },
      );

      // Ertrag pro h line
      const hourPosition = rowIndex++;
      this.createCell(worksheet.getCell(`A${rowIndex}`), 'Ertrag pro h', { name: 'Calibri', size: 10, bold: true });
      this.createCell(
        worksheet.getCell(`C${rowIndex}`),
        project.logged_hours > 0 ? { formula: `C${totalInvoicePosition} / B${hourPosition}` } : '',
        { name: 'Calibri', bold: true },
      );
      numberCells.push(`C${rowIndex}`);

      // Restleitung in Stunden line
      rowIndex++;
      if (project.id === mainProject.id) {
        this.createCell(worksheet.getCell(`A${rowIndex}`), 'Restleitung in Stunden', {
          name: 'Calibri',
          size: 10,
          bold: true,
        });
        this.setCellBackground(worksheet, [`A${rowIndex}`, `B${rowIndex}`, `C${rowIndex}`], undefined, true);
        worksheet.getCell(`B${rowIndex}`).value =
          project.details['rate_per_hour'] > 0 ? project.details['rate_per_hour'] : 0;
        worksheet.getCell(`C${rowIndex}`).value = { formula: `C17 / B${rowIndex}` };
      } else {
        this.createCell(worksheet.getCell(`A${rowIndex}`), 'Restertrag pro h', {
          name: 'Calibri',
          size: 10,
          bold: true,
        });
        worksheet.getCell(`B${rowIndex}`).value =
          project.details['rate_per_hour'] > 0 ? project.details['rate_per_hour'] : 0;
        worksheet.getCell(`C${rowIndex}`).value = { formula: `C${costPosition} / B${rowIndex}` };
      }
      numberCells.push(`C${rowIndex}`);
      const boxEndRowIndex = rowIndex;

      // Create border for box
      this.setBorderForRange(worksheet, boxStartRowIndex, boxEndRowIndex);

      worksheet.getCell(`C${totalProjectCostPositions[project.id]}`).value = { formula: `-C${totalInvoicePosition}` };
      worksheet.getCell(`D${totalProjectCostPositions[project.id]}`).value = { formula: `-D${totalInvoicePosition}` };
      worksheet.getCell(`C${hourCostTotalPositions[project.id]}`).value = { formula: `C${totalInvoicePosition}` };
      worksheet.getCell(`D${hourCostTotalPositions[project.id]}`).value = { formula: `D${totalInvoicePosition}` };
      numberCells.push(
        ...[
          `C${totalProjectCostPositions[project.id]}`,
          `D${totalProjectCostPositions[project.id]}`,
          `C${hourCostTotalPositions[project.id]}`,
          `D${hourCostTotalPositions[project.id]}`,
        ],
      );

      if (project.id === mainProject.id) {
        this.createCell(
          worksheet.getCell(`B${mainHourPosition}`),
          { formula: `B${hourPosition}` },
          { name: 'Calibri' },
          { horizontal: 'left' },
        );
        worksheet.getCell('C13').value = { formula: `-C${totalInvoicePosition}` };
        worksheet.getCell('D13').value = { formula: `-D${totalInvoicePosition}` };
        this.createCell(
          worksheet.getCell('C14'),
          { formula: 'SUM(C12:C13)' },
          { name: 'Calibri', size: 10, bold: true },
        );
        this.createCell(
          worksheet.getCell('D14'),
          { formula: 'SUM(D12:D13)' },
          { name: 'Calibri', size: 11, bold: true },
        );
        numberCells.push('C13', 'D13', 'C14', 'D14');
      }
    });

    rowIndex += 2;
    worksheet.getCell(`E${rowIndex}`).value = formatDate(new Date(), 'MM.DD.YYYY HH:mm:ss UTC', true);

    this.formatNumberCell(worksheet, numberCells);

    const xlsxBuffer = (await workbook.xlsx.writeBuffer()) as Buffer;
    return xlsxBuffer;
  }

  private createCell(
    cell: ExcelJS.Cell,
    value: ExcelJS.CellValue,
    fontStyle: Partial<ExcelJS.Font> = {},
    alignment: Partial<ExcelJS.Alignment> = {},
  ) {
    cell.font = fontStyle;
    cell.alignment = alignment;
    cell.value = value;
  }

  private formatNumberCell(worksheet: ExcelJS.Worksheet, cellsIndex: string[]) {
    for (const cellIndex of cellsIndex) {
      worksheet.getCell(cellIndex).worksheet.getCell(cellIndex).numFmt =
        '_ * #,##0.00_ ;_ * -#,##0.00_ ;_ * "-"??_ ;_ @_ ';
    }
  }

  private setCellBackground(
    worksheet: ExcelJS.Worksheet,
    cellsIndex: string | string[],
    color: ExcelJS.Color = { argb: 'F2CEEF', theme: 1 },
    textBold: boolean = false,
  ) {
    if (typeof cellsIndex === 'string') {
      cellsIndex = [cellsIndex];
    }

    for (const cellIndex of cellsIndex) {
      worksheet.getCell(cellIndex).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: color,
      };

      if (textBold) {
        worksheet.getCell(cellIndex).font = { bold: true, size: 11 };
      }
    }
  }

  private setBorderForRange(
    worksheet: ExcelJS.Worksheet,
    boxStartRowIndex: number,
    boxEndRowIndex: number,
    boxStartColIndex: number = 1,
    boxEndColIndex: number = 5,
    borderStyle: ExcelJS.BorderStyle = 'thin',
    border: { top: boolean; bottom: boolean; left: boolean; right: boolean } = {
      top: true,
      bottom: true,
      left: true,
      right: true,
    },
  ) {
    for (let rowIndex = boxStartRowIndex; rowIndex <= boxEndRowIndex; rowIndex++) {
      for (let colIndex = boxStartColIndex; colIndex <= boxEndColIndex; colIndex++) {
        const cell = worksheet.getCell(rowIndex, colIndex);

        // Get current border style of cell
        const cellBorderTopStyle = cell.border && cell.border.top?.style ? cell.border.top?.style : undefined;
        const cellBorderBottomStyle = cell.border && cell.border.bottom?.style ? cell.border.bottom?.style : undefined;
        const cellBorderLeftStyle = cell.border && cell.border.left?.style ? cell.border.left?.style : undefined;
        const cellBorderRightStyle = cell.border && cell.border.right?.style ? cell.border.right?.style : undefined;

        // Set border style
        cell.border = {
          top: {
            style: rowIndex === boxStartRowIndex && border.top !== false ? borderStyle : cellBorderTopStyle,
          },
          bottom: {
            style: rowIndex === boxEndRowIndex && border.bottom !== false ? borderStyle : cellBorderBottomStyle,
          },
          left: {
            style: colIndex === 1 && border.left !== false ? borderStyle : cellBorderLeftStyle,
          },
          right: {
            style: colIndex === 5 && border.right !== false ? borderStyle : cellBorderRightStyle,
          },
        };
      }
    }
  }

  private autoResizeColumn(worksheet: ExcelJS.Worksheet, columnIndex: string) {
    const column = worksheet.getColumn(columnIndex);
    let maxWidth = 10;
    column.eachCell({ includeEmpty: true }, (cell) => {
      if (cell.value) {
        const cellLength = cell.value.toString().length;
        if (cellLength > maxWidth) {
          maxWidth = cellLength;
        }
      }
    });
    column.width = maxWidth + 2;
  }

  private setWidthColumn(worksheet: ExcelJS.Worksheet, columnIndex: string, width: number) {
    if (width === -1) {
      this.autoResizeColumn(worksheet, columnIndex);
    } else {
      worksheet.getColumn(columnIndex).width = width;
    }
  }

  private formatFloat(num: number): number {
    if (Number.isInteger(num)) {
      return num;
    }

    const formatted = parseFloat(num.toFixed(2));
    return formatted % 1 === 0 ? Math.floor(formatted) : formatted;
  }

  private async getBaseInvoices(
    companyId: number,
    status: string,
    startDate: string,
    endDate: string,
    customerId: string,
  ): Promise<BaseInvoice[]> {
    // Generate where options
    const whereOptions: WhereOptions<Invoice> = {
      company_id: companyId,
      deleted_at: null,
    };
    if (startDate !== '' && endDate !== '') {
      whereOptions.charged_on = {
        [Op.between]: [new Date(startDate), new Date(new Date(endDate).getTime() + 86400000 - 1)],
      };
    }
    if (customerId !== '' && customerId !== 'all') {
      whereOptions.customer_id = {
        [Op.in]: customerId.split(','),
      };
    }

    const statuses = status.split(',');
    if (statuses.length === 1) {
      if (status === 'reminders') {
        whereOptions.status = {
          [Op.or]: ['reminder1', 'reminder2'],
        };
      } else if (status !== 'all') {
        whereOptions.status = status;
      }
    } else if (statuses.length > 1) {
      const additionalStatuses = [...statuses];

      if (statuses.find((status) => status === 'reminders')) {
        additionalStatuses.push(...['reminder1', 'reminder2']);
      }
      whereOptions.status = {
        [Op.in]: additionalStatuses,
      };
    }

    const invoices = await this.invoiceRepository.findAll({
      where: whereOptions,
      include: [
        {
          model: NumberEntry,
          as: 'number',
        },
        {
          model: Customer,
          as: 'customer',
        },
        {
          model: InvoiceDetail,
          as: 'details',
          include: [
            {
              model: InvoiceProduct,
              as: 'quote_items',
            },
            {
              model: InvoiceAdditionalCost,
              as: 'additional_costs',
              where: { is_active: true },
              required: false,
            },
            {
              model: InvoiceLabel,
              as: 'internal_descs',
              where: { is_active: true },
              required: false,
            },
          ],
        },
      ],
      order: [['id', 'DESC']],
      raw: true,
      nest: true,
    });

    return invoices.map((invoice) => {
      const invoiceNumber = invoice.number?.custom_id || invoice.number?.id;
      const customer =
        invoice.customer?.name || `${invoice.customer?.first_name || ''} ${invoice.customer?.last_name || ''}`;

      return {
        id: invoice.id,
        charged_on: invoice.charged_on ? invoice.charged_on.toISOString().split('T')[0] : '',
        due_on: invoice.due_on ? invoice.due_on.toISOString().split('T')[0] : '',
        number: invoiceNumber ? invoiceNumber.toString() : '',
        title: invoice.name,
        customer,
        status: invoice.status,
        details: invoice.details,
      };
    });
  }

  private transformInvoices(invoices: BaseInvoice[]): BaseInvoice[] {
    return invoices.map((invoice) => {
      const details = invoice.details;
      invoice.date = details?.date.toISOString().split('T')[0] || '';
      invoice.ref_number = details?.slip_number ?? '';

      invoice.net_amount = 0;
      invoice.gross_amount = 0;
      invoice.net_amount_nk = 0;
      invoice.gross_amount_nk = 0;
      const discountPercent = (details?.discount_percent || 0) / 100;

      let NKincluded = false;

      // Process quote items
      for (const quoteItem of invoice.details?.quote_items || []) {
        if (quoteItem.type === 'title' || !quoteItem.cost || quoteItem.optional) {
          continue;
        }

        let itemCost = quoteItem.cost || 0;

        if (!quoteItem.is_nk && quoteItem.apply_discount) {
          itemCost = itemCost * (1 - discountPercent);
          NKincluded = true;
        }

        const vatAmount = (itemCost * (quoteItem.vat_rate || 0)) / 100;

        if (quoteItem.type === 'individual' && quoteItem.is_nk) {
          invoice.net_amount_nk += itemCost;
          invoice.gross_amount_nk += itemCost + vatAmount;
        } else {
          invoice.net_amount += itemCost;
          invoice.gross_amount += itemCost + vatAmount;
        }
      }

      // Process additional costs
      for (const additionalCost of invoice.details?.additional_costs || []) {
        if (!additionalCost.is_active || !additionalCost.value) {
          continue;
        }

        const costValue = additionalCost.value || 0;

        // Additional costs are typically added to the net amount
        // and don't usually have VAT, but this depends on business logic
        invoice.net_amount += costValue;
        invoice.gross_amount += costValue;
      }

      // Apply discount if no NK items included
      if (!NKincluded) {
        invoice.net_amount = invoice.net_amount * (1 - discountPercent);
        invoice.gross_amount = invoice.gross_amount * (1 - discountPercent);
      }

      return invoice;
    });
  }
  private async getBaseUsers(companyId: number): Promise<BaseUser[]> {
    // Get users in company
    const users = await this.userRepository.findAll({
      where: {
        id: { [Op.ne]: 1 },
        company_id: companyId,
        deleted_at: null,
        is_active: true,
      },
      order: [['id', 'DESC']],
      raw: true,
    });

    // Get job rates from settings
    const settings = await this.settingRepository.findOne({
      where: {
        company_id: companyId,
      },
      raw: true,
    });
    const jobRates: JobRates[] = settings.timesheet.jobs || [];

    const baseUsers: BaseUser[] = users.map((user) => {
      const rate = jobRates.find((jobRate) => jobRate.label === user.job)?.rate || '';
      return Object.assign(new BaseUser(), user, { rate });
    });

    return baseUsers;
  }

  private async getCustomers(companyId: number): Promise<Customer[]> {
    return await this.customerRepository.findAll({
      where: {
        deleted_at: null,
        company_id: companyId,
      },
      raw: true,
    });
  }
}
