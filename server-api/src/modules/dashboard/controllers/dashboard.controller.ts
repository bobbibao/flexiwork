import { Response } from 'express';
import User from 'src/database/models/users.model';
import { BaseController } from 'src/shared/controllers/base.controller';
import { AuditModule, CurrentUser } from 'src/shared/decorators';
import { RoleEnum } from 'src/shared/enums';
import { AllowedRoleGuard } from 'src/shared/guards';
import { ApiResponse } from 'src/shared/utils/api-response';
import { Controller, DefaultValuePipe, Get, Logger, Param, Query, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse as ApiResponseDecorator, ApiTags } from '@nestjs/swagger';
import { EmployeeStatsQuery } from '../dto/employee-stats.dto';
import { DashboardService } from '../services/dashboard.service';
import { isDateString, isNumberString } from 'class-validator';
import { BadRequestError } from 'src/shared/utils';
import { AuditModuleEnum } from 'src/shared/constants/audit.constants';

@UseGuards(AllowedRoleGuard([RoleEnum.ADMIN, RoleEnum.MANAGER]))
@Controller('api/dashboard')
@ApiTags('Dashboard')
@AuditModule(AuditModuleEnum.DASHBOARD)
export class DashboardController extends BaseController {
  constructor(private readonly dashboardService: DashboardService) {
    super(new Logger(DashboardController.name));
  }

  @Get('/summary')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Summary', operationId: 'summary' })
  @ApiResponseDecorator({
    status: 200,
    description: 'Returns of projects, offers, invoices',
    type: ApiResponse,
    isArray: false,
  })
  @ApiParam({
    name: 'status',
    required: false,
    type: String,
    description: `Status of project. Possible values are 'all', 'active' and 'archive'. Default value is 'all'.`,
  })
  async summary(@Res() res: Response, @CurrentUser() user: User, @Query('status') status: string) {
    try {
      const summary = await this.dashboardService.getSummary(user.company_id, status ? status : 'all');
      return this.sendApiResponse(res, { error: false, payload: summary });
    } catch (error) {
      return this.throwError('Get Summary', res, error);
    }
  }

  @Get('/revenue')
  @ApiOperation({ summary: 'Get Revenue', operationId: 'revenue' })
  @ApiBearerAuth()
  @ApiResponseDecorator({
    status: 200,
    description: 'Returns revenue of each month in years',
    type: ApiResponse,
    isArray: false,
  })
  async revenue(@Res() res: Response, @CurrentUser() user: User) {
    try {
      const rev = await this.dashboardService.getRevenue(user.company_id);
      return this.sendApiResponse(res, { error: false, payload: rev });
    } catch (error) {
      return this.throwError('Get Revenue', res, error);
    }
  }

  @Get('/projects-stats')
  @ApiOperation({ summary: 'Get Projects Stats', operationId: 'projectsStats' })
  @ApiBearerAuth()
  @ApiResponseDecorator({
    status: 200,
    description: 'Returns all projects stats of company',
    type: ApiResponse,
    isArray: false,
  })
  async projectsStats(
    @Res() res: Response,
    @CurrentUser() currentUser: User,
    @Query('status', new DefaultValuePipe('')) status: string,
    @Query('project_id') projectId: string,
    @Query('company_id') companyId: string,
    @Query('start') startDate: string,
    @Query('end') endDate: string,
  ) {
    try {
      // Validate inputs
      if (!startDate || !isDateString(startDate)) {
        throw new BadRequestError('Missing start date or invalid start date');
      }
      if (!endDate || !isDateString(endDate)) {
        throw new BadRequestError('Missing end date or invalid end date');
      }

      // Handle get projects stats
      const handledCompanyId = parseInt(companyId) || 0;
      const handledProjectId = parseInt(projectId) || 0;
      const handledStartDate = new Date(startDate);
      const handledEndDate = new Date(endDate);

      const projectsStats = await this.dashboardService.projectsStats(
        handledCompanyId,
        handledStartDate,
        handledEndDate,
        status,
        handledProjectId,
        currentUser,
      );

      return this.sendApiResponse(res, {
        error: false,
        payload: projectsStats,
        count: projectsStats.length,
      });
    } catch (error) {
      return this.throwError('Get Projects Stats', res, error);
    }
  }

  @Get('/projects-stats/:id')
  @ApiOperation({ summary: 'Get Project Detail Stats', operationId: 'projectDetailStats' })
  @ApiBearerAuth()
  @ApiResponseDecorator({
    status: 200,
    description: 'Return Project Detail Stats',
    type: ApiResponse,
    isArray: false,
  })
  async projectDetailStats(
    @Res() res: Response,
    @CurrentUser() currentUser: User,
    @Param('id') projectId: string,
    @Query('company_id') companyId: string,
    @Query('start') startDate: string,
    @Query('end') endDate: string,
  ) {
    let selCompanyId = currentUser.company_id;
    try {
      // Validate inputs
      if (!startDate || !isDateString(startDate)) {
        throw new BadRequestError('Missing start date or invalid start date');
      }
      if (!endDate || !isDateString(endDate)) {
        throw new BadRequestError('Missing end date or invalid end date');
      }
      if (!isNumberString(projectId)) {
        throw new BadRequestError('Project id is invalid!');
      }
      if (!isNumberString(companyId)) {
        throw new BadRequestError('Company id is invalid!');
      }
      const companyIdInNumber = parseInt(companyId);
      if (companyIdInNumber > 0 && companyIdInNumber !== currentUser.company_id) {
        selCompanyId = companyIdInNumber;
      }
      // Handle get project detail stats
      const handledStartDate = new Date(startDate);
      const handledEndDate = new Date(endDate);
      const projectIdInNumber = parseInt(projectId);

      const result = await this.dashboardService.projectDetailStats(
        currentUser.company_id,
        selCompanyId,
        projectIdInNumber,
        handledStartDate,
        handledEndDate,
        parseInt(companyId),
      );

      return this.sendApiResponse(res, {
        error: false,
        payload: result,
        count: result.length,
      });
    } catch (error) {
      return this.throwError('Get Project Detail Stats', res, error);
    }
  }

  @Get('/employees-stats')
  @ApiOperation({ summary: 'Get Employees Stats', operationId: 'employeesStats' })
  @ApiBearerAuth()
  @ApiResponseDecorator({
    status: 200,
    description: 'Returns all employee stats of company',
    type: ApiResponse,
    isArray: false,
  })
  async employeesStats(@Query() query: EmployeeStatsQuery, @Res() res: Response, @CurrentUser() user: User) {
    try {
      const es = await this.dashboardService.employeesStats(query.company_id, query.start, query.end, user);

      return this.sendApiResponse(res, {
        error: false,
        payload: es.payload,
        count: es.payload.length,
        holidays: es.holidays,
      });
    } catch (error) {
      return this.throwError('Get Employees Stats', res, error);
    }
  }

  @Get('/employees-stats/:id')
  @ApiOperation({ summary: 'Get Employee Project Detail Stats', operationId: 'employeeProjectDetailStats' })
  @ApiBearerAuth()
  @ApiResponseDecorator({
    status: 200,
    description: 'Return Employee Project Detail Stats',
    type: ApiResponse,
    isArray: false,
  })
  @ApiParam({
    name: 'id',
    description: 'ID of project',
    type: Number,
  })
  async employeeProjectDetailStats(
    @Res() res: Response,
    @Param('id') id: number,
    @Query('start') start: string,
    @Query('end') end: string,
  ) {
    try {
      const result = await this.dashboardService.getEmployeeProjectDetailStats(id, start, end);

      return this.sendApiResponse(res, { error: false, payload: result, count: result.length });
    } catch (error) {
      return this.throwError('Get Employee Project Detail Stats', res, error);
    }
  }
}
