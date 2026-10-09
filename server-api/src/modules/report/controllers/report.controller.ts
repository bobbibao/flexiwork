import { isDateString, isNumberString } from 'class-validator';
import { Response } from 'express';
import User from 'src/database/models/users.model';
import { BaseController } from 'src/shared/controllers/base.controller';
import { AuditModule, CurrentUser } from 'src/shared/decorators';
import { BadRequestError } from 'src/shared/utils';
import { Controller, DefaultValuePipe, Get, Logger, Param, Query, Res } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse as ApiResponseDecorator,
  ApiTags,
} from '@nestjs/swagger';
import { InvoiceReportDto, ProjectsWithLogsQueryDto } from '../dto';
import { ReportService } from '../services/report.service';
import { AuditModuleEnum } from 'src/shared/constants/audit.constants';

@Controller('api/report')
@ApiTags('Report')
@AuditModule(AuditModuleEnum.REPORT)
export class ReportController extends BaseController {
  constructor(private readonly reportService: ReportService) {
    super(new Logger(ReportController.name));
  }

  @Get('/users')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get users report', operationId: 'usersReport' })
  @ApiResponseDecorator({
    status: 200,
    description: 'Returns list user for report',
  })
  async usersReport(@Res() res: Response, @CurrentUser() user: User) {
    try {
      const result = await this.reportService.getUsersReport(user.company_id);
      return this.sendApiResponse(res, { count: result.length, error: false, payload: result });
    } catch (error) {
      return this.throwError('Get users report', res, error);
    }
  }

  @Get('/user/:id')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get user detail on holidays and flex hours',
    operationId: 'getUserDetailOnHolidaysAndFlexHours',
  })
  @ApiResponseDecorator({
    status: 200,
    description: 'Returns user detail on holidays and flex hours',
  })
  async getUserReport(
    @Res() res: Response,
    @Param('id') userId: string,
    @CurrentUser() currentUser: User,
    @Query('start') startDate?: string,
    @Query('end') endDate?: string,
  ) {
    try {
      // Check missing inputs
      if (!startDate || !isDateString(startDate)) {
        throw new BadRequestError('Missing start date or invalid start date');
      }
      if (!endDate || !isDateString(endDate)) {
        throw new BadRequestError('Missing end date or invalid end date');
      }

      // Handle get user report
      const handledStartDate = new Date(startDate);
      const handledEndDate = new Date(endDate);

      const result = await this.reportService.getUserReport(
        userId,
        currentUser.company_id,
        handledStartDate,
        handledEndDate,
      );

      return this.sendApiResponse(res, { error: false, payload: result });
    } catch (error) {
      return this.throwError('Get user detail on holidays and flex hours', res, error);
    }
  }

  @Get('/projects')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get project overview', operationId: 'projectOverview' })
  @ApiResponseDecorator({
    status: 200,
    description: 'Returns of Project overview',
  })
  @ApiQuery({ name: 'status', description: 'The status of the project', required: false, type: String })
  async projectOverview(
    @Res() res: Response,
    @CurrentUser() user: User,
    @Query('status', new DefaultValuePipe('all')) status: string,
  ) {
    try {
      const result = await this.reportService.projectOverview(user.company_id, status);
      return this.sendApiResponse(res, { count: result.length, error: false, payload: result });
    } catch (error) {
      return this.throwError('Get project overview', res, error);
    }
  }

  @Get('/offers')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get offers report', operationId: 'listOffer' })
  @ApiResponseDecorator({
    status: 200,
    description: 'Returns of list offers report',
  })
  @ApiQuery({ name: 'status', description: 'The status of the offer', required: false, type: String })
  async listOffer(
    @Res() res: Response,
    @CurrentUser() currentUser: User,
    @Query('status', new DefaultValuePipe('all')) status: string,
  ) {
    try {
      const result = await this.reportService.listOffer(currentUser, status);

      return this.sendApiResponse(res, {
        error: false,
        payload: result,
        count: result.length,
      });
    } catch (error) {
      return this.throwError('Get offers report', res, error);
    }
  }

  @Get('/invoices')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get invoices report', operationId: 'listInvoice' })
  @ApiResponseDecorator({
    status: 200,
    description: 'Returns of list invoices report',
  })
  async listInvoice(@Res() res: Response, @CurrentUser() user: User, @Query() invoiceReportDto: InvoiceReportDto) {
    try {
      // Validate query
      if (!Array.isArray(invoiceReportDto.status)) {
        invoiceReportDto.status = [invoiceReportDto.status ?? 'all'];
      }
      if (!Array.isArray(invoiceReportDto.customer)) {
        invoiceReportDto.customer = [invoiceReportDto.customer ?? 'all'];
      }
      if (invoiceReportDto.start && !isDateString(invoiceReportDto.start)) {
        throw new BadRequestError('Missing start date or invalid start date');
      }
      if (invoiceReportDto.end && !isDateString(invoiceReportDto.end)) {
        throw new BadRequestError('Missing end date or invalid end date');
      }

      // Get invoices
      const invoices = await this.reportService.listInvoiceReport(user.company_id, invoiceReportDto);

      return this.sendApiResponse(res, {
        error: false,
        count: invoices.length,
        payload: invoices,
      });
    } catch (error) {
      return this.throwError('Get invoices report', res, error);
    }
  }

  @Get('/project-with-hours/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get project with hours report', operationId: 'projectsWithHours' })
  @ApiParam({ name: 'id', description: 'id of project', required: true })
  @ApiQuery({ name: 'date', description: 'date', required: true })
  @ApiResponseDecorator({
    status: 200,
    description: 'Returns of list invoices report',
  })
  async projectsWithHours(
    @Res() res: Response,
    @CurrentUser() user: User,
    @Query('date') date: string,
    @Param('id') projectId: number,
  ) {
    try {
      const result = await this.reportService.projectsWithHours(user.company_id, projectId, date);
      return this.sendApiResponse(res, { count: result.length, error: false, payload: result });
    } catch (error) {
      return this.throwError('Get project with hours report', res, error);
    }
  }

  @Get('/projects-with-logs')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get projects with logs' })
  @ApiResponseDecorator({
    status: 200,
    description: 'Get projects with logs',
  })
  async getProjectsWithLogs(@Res() res: Response, @CurrentUser() user: User, @Query() query: ProjectsWithLogsQueryDto) {
    try {
      const data = await this.reportService.projectsWithLogs(user.company_id, query);
      return this.sendApiResponse(res, data);
    } catch (error) {
      return this.throwError('Get projects with logs', res, error);
    }
  }

  @Get('/project-with-rate/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get projects with rate' })
  @ApiParam({ name: 'id', description: 'Id of the project', required: true })
  @ApiResponseDecorator({
    status: 200,
    description: 'Get projects with rate',
  })
  async projectWithRateReport(
    @Res() res: Response,
    @CurrentUser() currentUser: User,
    @Param('id') projectId: number,
    @Query('start') startDate: string,
    @Query('end') endDate: string,
    @Query('filter', new DefaultValuePipe('')) filter: string,
    @Query('company_id', new DefaultValuePipe('')) companyIds: string,
  ) {
    try {
      // Validate inputs
      if (!startDate || !isDateString(startDate)) {
        throw new BadRequestError('Invalid start date');
      }
      if (!endDate || !isDateString(endDate)) {
        throw new BadRequestError('Invalid end date');
      }

      // Handle to get project with rate report
      const handledStartDate = new Date(startDate);
      const handledEndDate = new Date(endDate);

      const result = await this.reportService.projectWithRateReport(
        currentUser.company_id,
        projectId,
        handledStartDate,
        handledEndDate,
        filter,
        companyIds,
      );
      return this.sendApiResponse(res, { error: false, payload: result });
    } catch (error) {
      return this.throwError('Get projects with rate', res, error);
    }
  }

  @Get('project-with-invoices/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Project Invoice Report', operationId: 'projectWithInvoiceReport' })
  @ApiParam({ name: 'id', description: 'Id of the project', required: true })
  @ApiResponseDecorator({
    status: 200,
    description: 'Returns the project invoice report',
  })
  async projectWithInvoiceReport(@Res() res: Response, @CurrentUser() user: User, @Param('id') projectId: number) {
    try {
      const result = await this.reportService.projectWithInvoiceReport(projectId, user.company_id);
      return this.sendApiResponse(res, { error: false, payload: result });
    } catch (error) {
      return this.throwError('Get project invoice report', res, error);
    }
  }

  @Get('effort-employee-project')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get effort employee project Report', operationId: 'effortEmployeeProjects' })
  @ApiQuery({ name: 'start', description: 'Start date', required: true })
  @ApiQuery({ name: 'end', description: 'End Date', required: true })
  @ApiResponseDecorator({
    status: 200,
    description: 'Returns the effortEmployeeProjects report',
  })
  async effortEmployeeProjects(
    @Res() res: Response,
    @CurrentUser() currentUser: User,
    @Query('user_id') userId: string,
    @Query('start') startDate?: string,
    @Query('end') endDate?: string,
  ) {
    try {
      // Validate inputs
      if (!isNumberString(userId)) {
        throw new BadRequestError('User id is invalid!');
      }
      if (!startDate || !isDateString(startDate)) {
        throw new BadRequestError('Missing start date or invalid start date');
      }
      if (!endDate || !isDateString(endDate)) {
        throw new BadRequestError('Missing end date or invalid end date');
      }

      // Handle get effort employee projects
      const userIdInNumber = parseInt(userId);
      const handledStartDate = new Date(startDate);
      const handledEndDate = new Date(endDate);

      const result = await this.reportService.effortEmployeeProjects(
        currentUser,
        userIdInNumber,
        handledStartDate,
        handledEndDate,
      );
      return this.sendApiResponse(res, result);
    } catch (error) {
      return this.throwError('Get effort employee project report', res, error);
    }
  }
}
