import * as libreofficeConvert from 'libreoffice-convert';
import * as moment from 'moment';
import { Op, QueryTypes, Sequelize, Transaction } from 'sequelize';
import Company from 'src/database/models/companies.model';
import Log from 'src/database/models/logs.model';
import NumberEntry from 'src/database/models/numbers.model';
import ProjectPull from 'src/database/models/project-pulls.model';
import Project from 'src/database/models/projects.model';
import Setting from 'src/database/models/setting.model';
import User from 'src/database/models/users.model';
import WorkLog from 'src/database/models/work-logs.model';
import { CompanyService } from 'src/modules/company/services/company.service';
import { InvoiceDetailDto } from 'src/modules/invoices/dto/invoice-detail.dto';
import { InvoiceService } from 'src/modules/invoices/services/invoice.service';
import { OfferDetailDto } from 'src/modules/offers/dto/offer-detail.dto';
import { OfferService } from 'src/modules/offers/services/offer.service';
import { ProjectDetailDto } from 'src/modules/projects/dto/project-detail.dto';
import { ProjectService } from 'src/modules/projects/services/project.service';
import { HolidayDto } from 'src/modules/setting/dto/holiday.dto';
import { UsersService } from 'src/modules/users/services/user.service';
import { WorkItemService } from 'src/modules/work-item/services/work-item.service';
import { ActionEnum, FileTypeEnum } from 'src/shared/enums';
import { CacheService } from 'src/shared/services/cache.service';
import { BadRequestError, daysCountSince, formatDate, NotFoundError, shortTime, timeInRange } from 'src/shared/utils';
import { promisify } from 'util';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import {
  EmployeeProjectsResponseDto,
  HourDetail,
  HourDetailRowDto,
  InvoiceReportDto,
  parseSpentStringToHours,
  ProjectsWithLogsQueryDto,
  ProjectWithRateReportDto,
  ProjectWithRateReportInterface,
  ReportProjectWithInvoiceDto,
  UserReportDetailsDto,
  UserReportOverallDto,
} from '../dto';
import WorkItem from 'src/database/models/work-items.model';
import ProjectDetails from 'src/database/models/project-details.model';
import { Invoice, InvoiceAdditionalCost, InvoiceDetail, InvoiceLabel, InvoiceProduct } from 'src/database/models';
import InvoicePayments from 'src/database/models/invoice-payments.model';
import Task from 'src/database/models/task.model';
import Product from 'src/database/models/products.model';

interface ProjectHadLogs {
  id: number;
  name: string;
  location: string;
  number: string;
  status: string;
}

interface HourBalanceDate {
  date: Date;
  expectedHours: number;
  actualHours: number;
}

interface EmployeeProject {
  number: string;
  name: string;
  product_id: number;
  task: string;
  is_internal: boolean;
  hours: number;
}

@Injectable()
export class ReportService {
  private readonly convertAsync = promisify(libreofficeConvert.convert);

  constructor(
    @Inject('SETTING_REPOSITORY')
    private readonly settingRepository: typeof Setting,
    @Inject('LOG_REPOSITORY')
    private readonly logRepository: typeof Log,
    @Inject('PROJECT_REPOSITORY')
    private readonly projectRepository: typeof Project,
    @Inject(forwardRef(() => OfferService))
    private readonly offerService: OfferService,
    @Inject(forwardRef(() => InvoiceService))
    private readonly invoiceService: InvoiceService,
    private readonly projectService: ProjectService,
    private readonly cacheService: CacheService,
    private readonly companyService: CompanyService,
    private readonly usersService: UsersService,
    private readonly workItemService: WorkItemService,
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
    @Inject('INVOICE_PAYMENTS_REPOSITORY')
    private readonly invoicePaymentsRepository: typeof InvoicePayments,
  ) {}

  async getUsersReport(companyId: number): Promise<UserReportOverallDto[]> {
    const GET_USERS_REPORT_SQL = await this.cacheService.getConfigValue('GET_USERS_REPORT_SQL');
    const query = GET_USERS_REPORT_SQL;

    const results = await User.sequelize.query<UserReportOverallDto>(query, {
      type: QueryTypes.SELECT,
      replacements: { companyId },
      mapToModel: true,
    });

    if (!results) {
      throw new NotFoundError('Users not found');
    }

    return results;
  }

  async getUserReport(
    userId: string,
    companyId: number,
    startDate: Date,
    endDate: Date,
  ): Promise<UserReportDetailsDto> {
    // Get target user & validate if target user is in the same company
    const existingUser = await this.usersService.findOneByIdString(userId);
    if (existingUser.company_id !== companyId) {
      throw new NotFoundError('User not found');
    }

    // Get target company setting
    const companySetting = await this.settingRepository.findOne({
      where: {
        company_id: companyId,
      },
    });

    if (!companySetting) {
      throw new NotFoundError('Company setting not found');
    }
    // Get task name & product id from company time sheet
    interface CompanyTimeSheet {
      [key: string]: unknown;
    }
    const companyTimeSheet = companySetting.timesheet as CompanyTimeSheet;
    let taskName: string = '';
    let productId: number = 0;
    if (typeof companyTimeSheet['default_holiday_task'] === 'string' && !!companyTimeSheet['default_holiday_task']) {
      taskName = companyTimeSheet['default_holiday_task'];
    }
    if (
      typeof companyTimeSheet['default_holiday_product'] === 'number' &&
      companyTimeSheet['default_holiday_product'] >= 0
    ) {
      productId = companyTimeSheet['default_holiday_product'];
    }

    let taskId: number;

    // Get task id from task name and products belonging to the company
    await Task.findOne({
      attributes: ['id'],
      where: {
        name: taskName,
        product_id: productId,
      },
      include: [
        {
          model: Product,
          as: 'product',
          where: {
            company_id: companyId,
          },
        },
      ],
      raw: true,
    }).then((task) => (taskId = task?.id));

    // Get flex hours from user time sheet
    const userTimeSheet = await this.workItemService.getTimesheetPeriods(existingUser.id);
    if (!userTimeSheet) {
      throw new NotFoundError('Time sheet not found');
    }

    let flexHours = 0;
    for (const timeSheet of userTimeSheet) {
      const timeSheetStartDate = new Date(timeSheet.start_date);

      if (timeSheetStartDate.getTime() <= startDate.getTime()) {
        flexHours = timeSheet.latest_flex_hours;
      }
    }

    // Count holidays from company time sheet
    const companySettingHolidays = companyTimeSheet['holidays'] as HolidayDto[];
    const appliedHolidays: HolidayDto[] = [];
    for (const holiday of companySettingHolidays) {
      if (holiday.date) {
        const holidayDate = new Date(holiday.date);
        const holidayDay = holidayDate.getDay();

        // Check if holiday is Saturday or Sunday to get applied holiday
        if (holidayDay !== 0 && holidayDay !== 6 && startDate.getFullYear() === holidayDate.getFullYear()) {
          appliedHolidays.push({
            date: holidayDate,
            label: holiday.label,
          });
        }
      }
    }
    if (appliedHolidays.length === 0) {
      // append holiday with null date
    }

    // Get filtered ranges from user time sheet
    interface Range {
      start: Date;
      end: Date;
      hours: number;
      days: number;
    }
    const filteredRanges: Range[] = [];
    for (const timesheet of userTimeSheet) {
      const timeSheetStartDate = new Date(timesheet.start_date);
      const timeSheetEndDate = new Date(timesheet.end_date);
      if (timeInRange(startDate, endDate, timeSheetStartDate, timeSheetEndDate)) {
        filteredRanges.push({
          start: timeSheetStartDate,
          end: timeSheetEndDate,
          hours: timesheet.actual_hours_per_day,
          days: daysCountSince(timeSheetStartDate, timeSheetEndDate) + 1,
        });
      }
    }
    if (filteredRanges.length === 0) {
      filteredRanges.push({
        start: startDate,
        end: endDate,
        hours: userTimeSheet[userTimeSheet.length - 1]?.actual_hours_per_day ?? 0,
        days: daysCountSince(startDate, new Date(endDate.getFullYear() + 1, 0, 1, 0, 0, 0, 0)),
      });
    }

    // Hour balance date
    const combined: HourBalanceDate[] = [];
    for (const range of filteredRanges) {
      if (timeInRange(startDate, endDate, range.start, range.end)) {
        const data = await this.getUserHourBalanceInRange(
          companyId,
          existingUser.id,
          range.start,
          range.end,
          range.hours,
          appliedHolidays,
        );

        combined.push(...data);
      }
    }

    // OT date
    const combinedOT: HourBalanceDate[] = [];
    for (const range of filteredRanges) {
      if (timeInRange(startDate, endDate, range.start, range.end)) {
        const data = await this.getUserHourBalanceOTInRange(
          companyId,
          existingUser.id,
          range.start,
          range.end,
          0,
          appliedHolidays,
        );

        combinedOT.push(...data);
      }
    }

    // Sum
    let expected: number = 0;
    let actual: number = 0;
    for (const time of combined) {
      if (typeof time.expectedHours === 'string') {
        expected += parseFloat(time.expectedHours);
      }
      if (typeof time.actualHours === 'string') {
        actual += parseFloat(time.actualHours);
      }
    }
    for (const time of combinedOT) {
      if (typeof time.actualHours === 'string') {
        actual += parseFloat(time.actualHours);
      }
    }

    // Holiday Used hours
    const holidayUsedHours = await this.getUserUsedHolidayHoursInRange(
      existingUser.id,
      productId,
      taskId,
      startDate,
      endDate,
    );

    // Holiday periods
    const holidayPeriods = await this.getUserHolidayPeriods(existingUser.id);
    let holidaysPrev: number = 0;
    let holidaysCredit: number = 0;
    for (const period of holidayPeriods) {
      const periodStartDate = new Date(period['start_date']);
      const periodEndDate = new Date(period['end_date']);
      if (periodStartDate.getFullYear() === startDate.getFullYear()) {
        holidaysPrev += period.latest;

        if (!period['end_date'] || isNaN(periodEndDate.getTime())) {
          period['end_date'] = new Date(startDate.getFullYear(), 11, 31);
        }

        const daysCount = daysCountSince(periodStartDate, new Date(endDate.getTime() + 24 * 60 * 60 * 1000));
        const baseStartDate = new Date(startDate.getFullYear(), 0, 1);
        const baseEndDate = new Date(startDate.getFullYear(), 11, 31);
        const base = daysCount / daysCountSince(baseStartDate, baseEndDate);

        const amount = period['amount'];
        const actualHoursPerDay = period['actual_hours_per_day'];

        holidaysCredit += amount * base * actualHoursPerDay;
      }
    }

    // Make sure that all values are numeric
    const holidayUsedHoursInNumber: number =
      holidayUsedHours && holidayUsedHours.length > 0 ? parseFloat(holidayUsedHours[0].used_hours) : 0;

    return {
      user: existingUser,
      expected_hours: expected.toFixed(2),
      prev_hours: flexHours.toFixed(2),
      actual_hours: actual.toFixed(2),
      current_hours: (flexHours + actual - expected).toFixed(2),
      holidays_credit: holidaysCredit.toFixed(2),
      holidays_prev: holidaysPrev.toFixed(2),
      holidays_used: holidayUsedHoursInNumber.toFixed(2),
      holidays_available: (holidaysCredit + holidaysPrev - holidayUsedHoursInNumber).toFixed(2),
    };
  }

  async projectOverview(companyId: number, status: string): Promise<ProjectDetailDto[]> {
    if (!status || status === '') {
      status = 'active';
    }
    const projects = await this.projectService.getProjectsSummary(companyId, status);

    return projects;
  }

  async listOffer(currentUser: User, status: string): Promise<OfferDetailDto[]> {
    const offers = await this.offerService.listOffers(currentUser, status);

    return offers.detailedOffers;
  }

  async listInvoiceReport(companyId: number, invoiceReportDto: InvoiceReportDto): Promise<InvoiceDetailDto[]> {
    return await this.invoiceService.listInvoiceReport(companyId, invoiceReportDto);
  }

  async queryHourDetailRows(projectID: number, companyID: number, date: Date): Promise<HourDetailRowDto[]> {
    const startDate = moment(date).startOf('month').format('YYYY-MM-DD');
    const endDate = moment(date).endOf('month').format('YYYY-MM-DD');

    const GET_HOURS_DETAIL_PROJECT_REPORT = await this.cacheService.getConfigValue('GET_HOURS_DETAIL_PROJECT_REPORT');
    const query = GET_HOURS_DETAIL_PROJECT_REPORT;

    const hourDetails = await WorkLog.sequelize.query<HourDetailRowDto>(query, {
      type: QueryTypes.SELECT,
      replacements: {
        projectID,
        companyID,
        startDate,
        endDate,
      },
    });
    if (!hourDetails) {
      throw new NotFoundError('Hour details not found');
    }

    return hourDetails;
  }

  async projectsWithHours(companyId: number, projectID: number, date: string): Promise<HourDetail[]> {
    const submitDate = new Date(date);
    if (!submitDate) {
      throw new BadRequestError('Invalid date format');
    }

    // Fetch project details
    const project = await this.projectService.selectProject(companyId, projectID);
    if (!project) {
      throw new NotFoundError('Project not found');
    }

    // Query for hour details
    const hourDetails = await this.queryHourDetailRows(projectID, companyId, submitDate);

    // Process the hour details (assuming ParseSpentToHours is a custom method on HourDetail)
    const formattedResult: HourDetail[] = hourDetails.map((row) => ({
      spent_string: row.spent,
      task: row.task,
      date: row.date,
      spent: parseSpentStringToHours(row.spent),
      user: {
        id: row.user__id,
        name: row.user__name || '',
        email: row.user__email,
        first_name: row.user__first_name,
        last_name: row.user__last_name,
      },
    }));

    return formattedResult;
  }

  async projectsWithLogs(
    companyId: number,
    query: ProjectsWithLogsQueryDto,
  ): Promise<{
    count: number;
    error: boolean;
    more_ids: number[];
    payload: ProjectHadLogs[];
  }> {
    const { start, end, company_id, status } = query;

    // Parsing dates
    const submitStartDate = moment(start, 'YYYY-MM-DD');
    const submitEndDate = moment(end, 'YYYY-MM-DD');

    if (!submitStartDate.isValid() || !submitEndDate.isValid()) {
      throw new BadRequestError('Invalid date format');
    }

    let companyIds: string[] = [];
    if (company_id && company_id.length > 0) {
      companyIds = company_id.split(',');
    }

    const startDate = submitStartDate.startOf('day').toDate();
    const endDate = submitEndDate.endOf('day').toDate();
    if (!startDate) {
      throw new BadRequestError('Invalid start date');
    }
    if (!endDate) {
      throw new BadRequestError('Invalid end date');
    }
    let moreIds: number[] = [];

    let getAllIncludeConnected = false;

    // Handling connected companies and getting additional project IDs

    if (companyIds.length === 0) {
      // Insert an arbitrary value to make sure the loop runs
      companyIds.push('0');
    }
    for (const id of companyIds) {
      const selCompanyId = parseInt(id, 10);
      if (selCompanyId === 0 || companyId === selCompanyId) {
        getAllIncludeConnected = true;
        break;
      } else {
        const tmpIds = await this.projectService.getAdditionalProjectIdsFromConnected(
          companyId,
          selCompanyId,
          startDate,
          endDate,
        );
        moreIds = [...moreIds, ...tmpIds];
      }
    }

    if (getAllIncludeConnected === true) {
      const shares = await this.companyService.selectShares(companyId);
      for (const share of shares) {
        const tmpCompany = await this.companyService.selectCompanyFromSignature(share.signature);
        const tmpIds = await this.projectService.getAdditionalProjectIdsFromConnected(
          companyId,
          tmpCompany.id,
          startDate,
          endDate,
        );
        moreIds = [...moreIds, ...tmpIds];
      }
    }

    // Fetching projects with logs
    let projects: ProjectHadLogs[];

    if (getAllIncludeConnected === true) {
      projects = await this.projectService.getProjectWithLogs(companyId, startDate, endDate);
    } else {
      projects = await this.projectService.getProjectWithLogsFromIds(moreIds, startDate, endDate);
    }

    // Filtering by status
    if (status && status !== 'all') {
      projects = projects.filter((project) => project.status === status);
    }

    return {
      count: projects.length,
      error: false,
      more_ids: moreIds,
      payload: projects,
    };
  }

  async selectPull(companyID: number, projectID: number): Promise<ProjectPull> {
    const pull = await ProjectPull.findOne({
      where: {
        project_id: projectID,
        company_id: companyID,
      },
    });

    return pull;
  }

  async projectWithRateReport(
    companyId: number,
    projectId: number,
    startDate: Date,
    endDate: Date,
    filter: string,
    companyIdsStr: string,
  ): Promise<ProjectWithRateReportDto[]> {
    // Fetch pull data from other companies
    const pull = await this.selectPull(companyId, projectId);

    // Construct project report array
    const projectReports = [{ companyId, projectId }];
    if (pull && pull.metadata.project_ids) {
      for (const pullProjectId of pull.metadata.project_ids) {
        const pullProject = await this.projectRepository.findOne({
          where: {
            id: pullProjectId,
            deleted_at: null,
          },
        });
        projectReports.push({
          companyId: pullProject.company_id,
          projectId: pullProject.id,
        });
      }
    }

    const companyIds = companyIdsStr ? companyIdsStr.split(',') : [];
    const willQueryAll = companyIds.length === 1 && companyIds[0] === '0';

    let wls: ProjectWithRateReportInterface[] = [];

    for (const pr of projectReports) {
      if (!willQueryAll) {
        if (!companyIds.includes(String(pr.companyId))) {
          continue;
        }
      }

      let tmpWls: ProjectWithRateReportInterface[];

      tmpWls = await this.projectService.getProjectReportWithRate(pr.companyId, pr.projectId);
      if (filter === 'all') {
        tmpWls = await this.projectService.getProjectReportWithRate(pr.companyId, pr.projectId);
      } else {
        tmpWls = await this.projectService.getProjectReportWithRate(pr.companyId, pr.projectId, startDate, endDate);
      }

      wls = [...wls, ...tmpWls];
    }

    // Transform data
    for (const wl of wls) {
      const spentTmp = parseSpentStringToHours(wl.spent);
      wl.spent_in_hours = Math.round(spentTmp * 100) / 100;
    }

    const result: ProjectWithRateReportDto[] = wls.map((wl) => ({
      id: wl.id,
      number: wl.number,
      name: wl.name,
      product_name: wl.product_name,
      task: wl.task,
      job: wl.job,
      staff_name: wl.staff_name,
      staff_id: wl.staff_id,
      rate: Number(wl.rate),
      date: wl.date,
      hours: wl.spent_in_hours, // We'll update this below
      comment: wl.comment,
    }));

    return result;
  }

  async projectWithInvoiceReport(projectId: number, companyId: number): Promise<ReportProjectWithInvoiceDto> {
    const projectDetail = await this.getProjectDetail(projectId);

    const projects: Partial<ProjectDetailDto>[] = [
      {
        ...projectDetail,
        detail_cost: await this.projectService.getDetailProjectCost(projectDetail.id),
      },
    ];

    // Pull data from other companies
    const pull = await this.selectPull(companyId, projectId);

    try {
      const otherProjectIds = pull?.metadata?.project_ids || [];
      for (const otherProjectId of otherProjectIds) {
        const otherProjectDetail = await this.getProjectDetail(otherProjectId);

        if (otherProjectDetail) {
          otherProjectDetail.detail_cost = await this.projectService.getDetailProjectCost(otherProjectId);
          projects.push(otherProjectDetail);
        }
      }

      // Fetch invoices for each project using Sequelize instead of raw SQL
      for (const project of projects as ProjectDetailDto[]) {
        const invoices = (await this.invoiceRepository.findAll({
          where: {
            project_id: project.id,
            status: {
              [Op.notIn]: ['cancelled'],
            },
            deleted_at: null,
          },
          include: [
            {
              model: this.invoiceDetailRepository,
              as: 'details',
              include: [
                {
                  model: this.invoiceAdditionalCostRepository,
                  as: 'additional_costs',
                },
                {
                  model: this.invoiceLabelRepository,
                  as: 'internal_descs',
                },
                {
                  model: this.invoiceProductRepository,
                  as: 'quote_items',
                },
                {
                  model: this.invoicePaymentsRepository,
                  as: 'paid_histories',
                },
              ],
            },
          ],
          order: [['id', 'ASC']],
          raw: true,
        })) as InvoiceDetailDto[];

        for (const invoice of invoices) {
          if (invoice.company_id !== companyId) {
            invoice.is_connected = true;
          }
          invoice.detail_cost = await this.invoiceService.getDetailInvoiceCost(invoice.id);
        }

        project.invoices = invoices;
      }

      return {
        project: projects[0],
        projects: projects,
      };
    } catch (error) {
      throw new BadRequestError(`Error fetching project with invoice report: ${error}`);
    }
  }

  async getReportFileName(companyId: number, projectId: number): Promise<string> {
    // Fetch the project (similar to `selectProject` in Go)
    const project = await this.projectService.selectProject(companyId, projectId);
    if (!project) {
      throw new NotFoundError('Project not found');
    }

    // Initialize number with the project number ID
    let number = project.number.id.toString();

    // If `customId` is not empty, use it instead
    if (project.number.custom_id && project.number.custom_id.trim() !== '') {
      number = project.number.custom_id;
    }

    // Return the formatted string
    return `${number} ${project.name}`;
  }

  async effortEmployeeProjects(
    currentUser: User,
    userId: number,
    startDate: Date,
    endDate: Date,
  ): Promise<{
    error: boolean;
    payload: EmployeeProjectsResponseDto;
  }> {
    const submitStartDate = shortTime(startDate, false);
    const submitEndDate = shortTime(endDate, true);

    // Call the service to get employee projects
    const employeeProjects = await this.getEmployeeProjects(
      currentUser.company_id,
      userId,
      submitStartDate,
      submitEndDate,
    );
    if (!employeeProjects) {
      throw new NotFoundError('Employee projects not found');
    }

    // Get company settings
    const companySetting = await this.settingRepository.findOne({
      where: {
        company_id: currentUser.company_id,
      },
    });

    // Get product id
    interface CompanyTimeSheet {
      [key: string]: unknown;
    }
    const companyTimeSheet = companySetting.timesheet as CompanyTimeSheet;
    let productId: number;
    if (
      typeof companyTimeSheet['default_holiday_product'] === 'number' &&
      companyTimeSheet['default_holiday_product'] >= 0
    ) {
      productId = companyTimeSheet['default_holiday_product'];
    }

    // Get target user
    const existingUser = await this.usersService.findOneByIdString(userId.toString());

    // Prepare the response structure
    const res: EmployeeProjectsResponseDto = {
      billable: [],
      internal: [],
      holiday: [],
      user: existingUser.dataValues,
    };

    // Classify the employee projects
    for (const project of employeeProjects) {
      if (project.product_id === productId) {
        res.holiday.push(project);
      } else if (project.is_internal) {
        res.internal.push(project);
      } else {
        res.billable.push(project);
      }
    }

    return {
      error: false,
      payload: res,
    };
  }

  async saveInvoicesXLSXLogs(currentUser: User, status: string, fileName: string): Promise<void> {
    if (!status) {
      status = 'all';
    }

    // Start transaction
    const transaction = await this.settingRepository.sequelize.transaction();

    try {
      // Save log
      const logMetadata = {
        project_xlsx_code: fileName,
        project_status: status,
      };
      await this.saveLog(transaction, currentUser, FileTypeEnum.Invoice, ActionEnum.ExportXLSX, logMetadata);

      // Commit transaction & return file name code
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw new BadRequestError('Error while saving invoices xlsx logs');
    }
  }

  async saveOffersXLSXLogs(currentUser: User, fileName: string): Promise<void> {
    // Start transaction
    const transaction = await this.settingRepository.sequelize.transaction();

    try {
      // Save log
      const logMetadata = {
        offer_xlsx_code: fileName,
      };
      await this.saveLog(transaction, currentUser, FileTypeEnum.Offer, ActionEnum.ExportXLSX, logMetadata);

      // Commit transaction & return file name code
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw new BadRequestError('Error while saving offers xlsx logs');
    }
  }

  async saveProjectsXLSXLogs(currentUser: User, fileName: string): Promise<void> {
    // Start transaction
    const transaction = await this.settingRepository.sequelize.transaction();

    try {
      // Save log
      const logMetadata = {
        project_xlsx_code: fileName,
      };
      await this.saveLog(transaction, currentUser, FileTypeEnum.Project, ActionEnum.ExportXLSX, logMetadata);

      // Commit transaction & return file name code
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw new BadRequestError('Error while saving projects xlsx logs');
    }
  }

  async saveUsersWithRateXLSXLogs(currentUser: User, fileName: string): Promise<void> {
    // Start transaction
    const transaction = await this.settingRepository.sequelize.transaction();

    try {
      // Save log
      const logMetadata = {
        users_with_rate_xlsx_code: fileName,
      };
      await this.saveLog(transaction, currentUser, FileTypeEnum.User, ActionEnum.ExportXLSX, logMetadata);

      // Commit transaction & return file name code
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw new BadRequestError('Error while saving users with rate xlsx logs');
    }
  }

  async saveUsersXLSXLogs(currentUser: User, fileName: string): Promise<void> {
    // Start transaction
    const transaction = await this.settingRepository.sequelize.transaction();

    try {
      // Save log
      const logMetadata = {
        users_with_rate_xlsx_code: fileName,
      };
      await this.saveLog(transaction, currentUser, FileTypeEnum.User, ActionEnum.ExportXLSX, logMetadata);

      // Commit transaction & return file name code
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw new BadRequestError('Error while saving users xlsx logs');
    }
  }

  async saveExpensesXLSXLogs(currentUser: User, fileName: string): Promise<void> {
    // Start transaction
    const transaction = await this.settingRepository.sequelize.transaction();

    try {
      // Save log
      const logMetadata = {
        ['efforts-xlsx']: fileName,
      };
      await this.saveLog(transaction, currentUser, FileTypeEnum.User, ActionEnum.ExportXLSX, logMetadata);

      // Commit transaction & return file name code
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw new BadRequestError('Error when exporting expenses xlsx');
    }
  }

  async saveAddressesXLSXLogs(currentUser: User, fileName: string): Promise<void> {
    // Start transaction
    const transaction = await this.settingRepository.sequelize.transaction();

    try {
      // Save log
      const logMetadata = {
        addresses_xlsx_code: fileName,
      };
      await this.saveLog(transaction, currentUser, FileTypeEnum.Customer, ActionEnum.ExportXLSX, logMetadata);

      // Commit transaction & return file name code
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw new BadRequestError('Error while saving addresses xlsx logs');
    }
  }

  async saveProjectInvoicesWithTypeLogs(currentUser: User, fileName: string, type: 'xlsx' | 'pdf'): Promise<void> {
    const downloadCode = type === 'xlsx' ? 'project-invoices-xlsx' : 'project-invoices-list-pdf';
    const actionType = type === 'xlsx' ? ActionEnum.ExportXLSX : ActionEnum.ExportPDF;
    const logReportType = '';

    // Start transaction
    const transaction = await this.settingRepository.sequelize.transaction();

    try {
      // Save log
      const logMetadata = {
        [downloadCode]: fileName,
      };
      await this.saveLog(transaction, currentUser, logReportType, actionType, logMetadata);

      // Commit transaction & return file name code
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw new BadRequestError('Error when exporting project invoices with type');
    }
  }

  async exportProjectInvoicesWithTypePdf(xlsxBuffer: Buffer): Promise<Buffer> {
    return await this.convertAsync(xlsxBuffer, '.pdf', undefined);
  }

  private async getUserHourBalanceInRange(
    companyId: number,
    userId: number,
    startDate: Date,
    endDate: Date,
    expectedHours: number,
    holidays: HolidayDto[],
  ): Promise<HourBalanceDate[]> {
    const h: Date[] = [];
    for (const holiday of holidays) {
      h.push(holiday.date as Date);
    }

    let query = await this.cacheService.getConfigValue('GET_USER_HOUR_BALANCE_IN_RANGE');

    // Handle before query
    if (h.length === 0) {
      query = query.replaceAll(' AND d NOT IN (?)', '');
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let replacements: any[] = [startDate, endDate, userId, startDate, endDate, companyId, expectedHours];
    if (h.length > 0) {
      const handledHolidays = h.map((holiday) => formatDate(holiday, 'YYYY-MM-DD HH:mm:ss'));
      replacements = [startDate, endDate, handledHolidays, userId, startDate, endDate, companyId, expectedHours];
    }

    // Execute query
    const data = await this.settingRepository.sequelize.query<HourBalanceDate>(query, {
      replacements,
      type: QueryTypes.SELECT,
    });

    return data;
  }

  private async getUserHourBalanceOTInRange(
    companyId: number,
    userId: number,
    startDate: Date,
    endDate: Date,
    expectedHours: number,
    holidays: HolidayDto[],
  ): Promise<HourBalanceDate[]> {
    const h: Date[] = [];
    for (const holiday of holidays) {
      h.push(holiday.date as Date);
    }

    let query = await this.cacheService.getConfigValue('GET_USER_HOUR_BALANCE_OT_IN_RANGE');

    // Handle before query
    if (h.length === 0) {
      query = query.replaceAll(' OR d IN (?)', '');
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let replacements: any[] = [startDate, endDate, userId, startDate, endDate, companyId, expectedHours];
    if (h.length > 0) {
      const handledHolidays = h.map((holiday) => formatDate(holiday, 'YYYY-MM-DD HH:mm:ss'));
      replacements = [startDate, endDate, handledHolidays, userId, startDate, endDate, companyId, expectedHours];
    }

    // Execute query
    const data = await this.settingRepository.sequelize.query<HourBalanceDate>(query, {
      replacements,
      type: QueryTypes.SELECT,
    });

    return data;
  }

  private async getUserUsedHolidayHoursInRange(
    userId: number,
    productId: number,
    taskId: number,
    startDate: Date,
    endDate: Date,
  ): Promise<
    {
      used_hours: string;
    }[]
  > {
    const startDateInUTC: Date = new Date(startDate.toUTCString());
    const endDateInUTC: Date = new Date(endDate.toUTCString());

    // Refactor from GET_USER_USED_HOLIDAY_HOURS_IN_RANGE raw query, need to test again carefully
    const data = (await WorkItem.findAll({
      attributes: [
        [Sequelize.fn('COALESCE', Sequelize.fn('SUM', Sequelize.col('work_logs.spent_in_hour')), 0), 'used_hours'],
      ],
      where: {
        product_id: productId,
        [Op.or]: [{ task_id: taskId }, { task_id: null }], // update to get task-level and product-level work items
      },
      include: [
        {
          model: WorkLog,
          as: 'work_logs',
          attributes: [],
          required: true,
          where: {
            user_id: userId,
            date: {
              [Op.between]: [startDateInUTC, endDateInUTC],
            },
            deleted_at: null,
          },
        },
      ],
      raw: true,
      nest: true,
    })) as unknown as { used_hours: string }[];

    return data;
  }

  private async getUserHolidayPeriods(userId: number) {
    const query = await this.cacheService.getConfigValue('GET_USER_HOLIDAY_PERIODS');
    const data = await this.settingRepository.sequelize.query<{
      start_date: Date;
      end_date: Date;
      actual_hours_per_day: number;
      amount: number;
      latest: number;
    }>(query, {
      replacements: [userId],
      type: QueryTypes.SELECT,
    });

    // Make sure that the actual_hours_per_day, amount, and latest are numeric. If not, set them to 0
    data.forEach((period) => {
      period.actual_hours_per_day = +period.actual_hours_per_day || 0;
      period.amount = +period.amount || 0;
      period.latest = +period.latest || 0;
    });

    return data;
  }

  private async getEmployeeProjects(
    companyId: number,
    userId: number,
    startDate: Date,
    endDate: Date,
  ): Promise<EmployeeProject[]> {
    const query = await this.cacheService.getConfigValue('GET_EMPLOYEE_PROJECTS');
    const results = await WorkLog.sequelize.query<EmployeeProject>(query, {
      replacements: {
        companyId: companyId,
        userId: userId,
        startDate: startDate,
        endDate: endDate,
      },
      type: QueryTypes.SELECT,
    });

    return results;
  }

  private async getProjectDetail(projectId: number): Promise<ProjectDetailDto> {
    const project = await this.projectRepository.findOne({
      where: {
        id: projectId,
        deleted_at: null,
      },
      attributes: {
        include: [
          [
            Sequelize.literal(`(
              SELECT 
                COALESCE(SUM(wl.spent_in_hour), 0.0)::real 
              FROM 
                work_items wi 
              JOIN 
                work_logs wl 
              ON 
                wi.id = wl.work_item_id 
                AND wl.deleted_at IS NULL 
              WHERE 
                wi.project_id = ${projectId}
            )`),
            'logged_hours',
          ],
        ],
        exclude: ['deleted_by', 'deleted_at'],
      },
      include: [
        {
          model: NumberEntry,
          as: 'number',
          attributes: ['id', 'custom_id'],
        },
        {
          model: Company,
          as: 'company',
          attributes: {
            exclude: ['deleted_by', 'deleted_at'],
          },
        },
        {
          model: ProjectDetails,
          as: 'details',
          attributes: ['rate_per_hour'],
        },
      ],
      raw: true,
      nest: true,
    });

    if (!project) {
      throw new BadRequestError('Project not found');
    }

    const projectDetail: ProjectDetailDto = Object.assign(
      ProjectDetailDto.build().get({ plain: true }) as ProjectDetailDto,
      project,
    );
    return projectDetail;
  }

  private async saveLog(
    transaction: Transaction,
    user: User,
    type: string,
    action: string,
    metadata: object,
  ): Promise<Log> {
    const log = await this.logRepository.create(
      {
        company_id: user.company_id,
        ref_id: user.id,
        type,
        action,
        created_at: new Date(),
        metadata,
      },
      { transaction },
    );

    return log;
  }
}
