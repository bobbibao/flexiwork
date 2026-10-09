import Export from 'src/database/models/exports.model';
import { OfferService } from 'src/modules/offers/services/offer.service';
import { BadRequestError } from 'src/shared/utils';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { ExportCreateDto, PreviewQueryDto } from '../dto';
import { InvoiceService } from 'src/modules/invoices/services/invoice.service';
import { ProjectService } from 'src/modules/projects/services/project.service';
import { ReportService } from 'src/modules/report/services/report.service';
import { ExcelExportService } from './excel-export.service';
import { ExportCode } from '../constants';
import { CodeEnum } from 'src/shared/enums';
import User from 'src/database/models/users.model';
import { isNumberString } from 'class-validator';

@Injectable()
export class ExportService {
  constructor(
    @Inject('EXPORT_REPOSITORY')
    private readonly exportRepository: typeof Export,
    @Inject(forwardRef(() => OfferService))
    private readonly offerService: OfferService,
    @Inject(forwardRef(() => InvoiceService))
    private readonly invoiceService: InvoiceService,
    @Inject(forwardRef(() => ProjectService))
    private readonly projectService: ProjectService,
    private readonly reportService: ReportService,
    private readonly excelExportService: ExcelExportService,
  ) {}

  async selectOrCreateExport(exp: ExportCreateDto): Promise<[Export, boolean]> {
    const [result, isCreated] = await this.exportRepository.findOrCreate({
      where: {
        company_id: exp.company_id,
        document_id: exp.document_id,
        type: exp.type,
        template_id: exp.template_id,
      },
      defaults: {
        ...exp,
      },
    });

    return [result, isCreated];
  }

  async validateParams(previewQueryDto: PreviewQueryDto): Promise<void> {
    const { type, code: token, id, start, end } = previewQueryDto;

    // File type and token are required for all endpoints. If they are not provided, throw a BadRequestError
    if (!type || !token) {
      throw new BadRequestError('File type and code are required!');
    }

    switch (type) {
      case ExportCode.INVOICE:
      case ExportCode.OFFER:
      case ExportCode.PROJECT: {
        // In these cases, id is required. If it is not provided, throw a BadRequestError
        if (!id) {
          throw new BadRequestError('Id is required for this export type!');
        }
        break;
      }
      case ExportCode.REPORT_PROJECT_ALL_INVOICES: {
        // In these cases, id, start(start_date) and end(end_date) are required. If they are not provided or start_date is greater than end_date, throw a BadRequestError
        if (!id || !start || !end) {
          throw new BadRequestError('Id, start date and end date are required for this export type!');
        }
        const startDate = new Date(start);
        const endDate = new Date(end);
        if (startDate > endDate) {
          throw new BadRequestError('Start date must be less than or equal end!');
        }
        break;
      }
      case ExportCode.REPORT_INVOICES: {
        // In these cases, start(start_date) and end(end_date) are required. If they are not provided or start_date is greater than end_date, throw a BadRequestError
        if (!start || !end) {
          throw new BadRequestError('Start date and end date are required for this export type!');
        }
        const startDate = new Date(start);
        const endDate = new Date(end);
        if (startDate > endDate) {
          throw new BadRequestError('Start date must be less than or equal end!');
        }
        break;
      }
    }
  }

  async previewFileExport(
    user: User,
    fileType: string,
    previewQueryDto: PreviewQueryDto = { type: null, code: null },
  ): Promise<Buffer | string> {
    const { id, type, start, end, status = 'all', preview } = previewQueryDto;

    // Validate id
    let idInNumber = 0;
    if (isNumberString(id)) {
      idInNumber = parseInt(id);
    }

    // Handle to export file in buffer
    switch (type) {
      // Offer page
      case ExportCode.OFFER:
        return await this.offerService.exportFileOffer(user.company_id, idInNumber, fileType);
      // Invoice page
      case ExportCode.INVOICE:
        return await this.invoiceService.exportFileInvoice(user.company_id, idInNumber, fileType, preview);
      // Project page
      case ExportCode.PROJECT:
        return await this.projectService.exportFileProject(user.company_id, idInNumber, fileType);
      // Report page - Addresses tab
      case ExportCode.REPORT_ADDRESS: {
        // Generate xlsx file buffer
        if (fileType === 'xlsx') {
          return await this.excelExportService.exportAddressesXLSX(user.company_id);
        }
        break;
      }
      // Report page - Offers tab
      case ExportCode.REPORT_OFFER: {
        // Generate xlsx file buffer
        if (fileType === 'xlsx') {
          return await this.excelExportService.exportOffersXLSX(user, status);
        }
        break;
      }
      // Report page - Projects tab - List of projects
      case ExportCode.REPORT_PROJECT: {
        // Generate xlsx file buffer
        if (fileType === 'xlsx') {
          return await this.excelExportService.exportProjectsXLSX(user, status);
        }
        break;
      }
      // Report page - Projects tab - Internal Export [Print PDF]
      case ExportCode.REPORT_EFFORTS_INTERNAL: {
        // Generate xlsx file buffer
        if (fileType === 'xlsx') {
          return await this.excelExportService.exportExpenseXLSX(
            user,
            CodeEnum.XLSXTypeListEffortInternal,
            user.company_id.toString(),
            idInNumber,
            new Date(start),
            new Date(end),
          );
        }
        break;
      }
      // Report page - Projects tab - External Export [Print PDF]
      case ExportCode.REPORT_EFFORTS_EXTERNAL: {
        // Generate xlsx file buffer
        if (fileType === 'xlsx') {
          return await this.excelExportService.exportExpenseXLSX(
            user,
            CodeEnum.XLSXTypeListEffortExternal,
            user.company_id.toString(),
            idInNumber,
            new Date(start),
            new Date(end),
          );
        }
        break;
      }
      // Report page - Projects Summary tab
      case ExportCode.REPORT_PROJECT_ALL_INVOICES: {
        const xlsxBuffer = await this.excelExportService.exportProjectInvoicesXLSX(user, idInNumber);

        if (fileType === 'xlsx') {
          return xlsxBuffer;
        } else {
          return await this.reportService.exportProjectInvoicesWithTypePdf(xlsxBuffer);
        }
      }
      // Report page - Invoices tab
      case ExportCode.REPORT_INVOICES: {
        const customerId = idInNumber || 'all';

        if (fileType === 'xlsx') {
          // Generate xlsx file buffer
          return await this.excelExportService.exportInvoicesXLSX(
            user,
            new Date(start),
            new Date(end),
            status,
            customerId.toString(),
          );
        }
        break;
      }
      // Report page - Employees tab - List of current employees
      case ExportCode.REPORT_EMPLOYEE: {
        // Generate xlsx file buffer
        if (fileType === 'xlsx') {
          return await this.excelExportService.exportUserXLSX(user);
        }
        break;
      }
      // Report page - Employees tab - List of current employees with job and rate
      case ExportCode.REPORT_EMPLOYEE_WITH_RATE: {
        // Generate xlsx file buffer
        if (fileType === 'xlsx') {
          return await this.excelExportService.exportUsersWithRateXLSX(user);
        }
        break;
      }
      default:
        throw new BadRequestError('Export type is not supported!');
    }
  }
}
