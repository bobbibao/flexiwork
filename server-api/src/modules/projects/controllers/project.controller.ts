import { Response } from 'express';
import User from 'src/database/models/users.model';
import { BaseController } from 'src/shared/controllers/base.controller';
import { AuditModule, CurrentUser, AuditAction } from 'src/shared/decorators';
import { RoleEnum } from 'src/shared/enums';
import { AllowedRoleGuard } from 'src/shared/guards';
import { ApiResponse } from 'src/shared/utils/api-response';
import { Body, Controller, Delete, Get, Logger, Param, Post, Put, Query, Res, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse as ApiResponseDecorator,
  ApiTags,
} from '@nestjs/swagger';
import { CreateProjectDto } from '../dto/project-create.dto';
import { GenerateInvoiceDto } from '../dto/project-invoice-gen.dto';
import { CreateInvoiceHoursDto } from '../dto/project-invoice-hours.dto';
import { GenerateServiceInvoiceDto } from '../dto/project-invoice-services.dto';
import { ListProjectsRequestDto } from '../dto/project-query.dto';
import { UpdateProjectStatusDto } from '../dto/project-update-status.dto';
import { UpdateProjectDto } from '../dto/project-update.dto';
import { ProjectService } from '../services/project.service';
import { isArray, isNumberString } from 'class-validator';
import { BadRequestError } from 'src/shared/utils';
import { PullProjectsDto } from '../dto';
import { BulkDeleteOffersDto } from 'src/modules/offers/dto/bulk-delete-offers.dto';
import { CreateProjectCommentDto, ProjectGridRequestDto } from '../dto';
import { AuditModuleEnum, AuditActionEnum } from 'src/shared/constants/audit.constants';

@UseGuards(AllowedRoleGuard([RoleEnum.ADMIN, RoleEnum.MANAGER]))
@Controller('api')
@ApiTags('projects')
@AuditModule(AuditModuleEnum.PROJECT)
export class ProjectController extends BaseController {
  constructor(private readonly projectService: ProjectService) {
    super(new Logger(ProjectController.name));
  }

  @Get('/projects')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get List Projects', operationId: 'projects' })
  @ApiResponseDecorator({ status: 200, description: 'Return list of projects', type: ApiResponse, isArray: false })
  async projects(@Res() res: Response, @CurrentUser() user: User, @Query() filter: ListProjectsRequestDto) {
    try {
      const result = await this.projectService.listProjects(user.company_id, filter);

      return this.sendApiResponse(res, {
        count: result.total,
        error: false,
        payload: {
          items: result.items,
          total_items: result.total,
          page: result.page,
          page_size: result.pageSize,
          total_pages: Math.ceil(result.total / result.pageSize),
        },
      });
    } catch (error) {
      return this.throwError('Get List Projects', res, error);
    }
  }

  @Get('/projects/stats')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get summary amount Projects', operationId: 'projectsSummaryStats' })
  @ApiResponseDecorator({
    status: 200,
    description: 'Return total amounts of projects',
    type: ApiResponse,
    isArray: false,
  })
  async projectsSummaryStats(@Res() res: Response, @CurrentUser() user: User) {
    try {
      const result = await this.projectService.projectsSummaryStats(user.company_id);

      return this.sendApiResponse(res, { error: false, payload: result });
    } catch (error) {
      return this.throwError('Get Summary Amount Projects', res, error);
    }
  }

  @Get('/project/grid')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Projects Grid View with Comments', operationId: 'projectsGrid' })
  @ApiResponseDecorator({ status: 200, description: 'Return grid of projects', type: ApiResponse, isArray: false })
  async projectsGrid(@Res() res: Response, @CurrentUser() user: User, @Query() filter: ProjectGridRequestDto) {
    try {
      const result = await this.projectService.getProjectsGrid(user.company_id, filter);

      return this.sendApiResponse(res, {
        count: result.total,
        error: false,
        payload: {
          items: result.items,
          total_items: result.total,
          page: result.page,
          page_size: result.pageSize,
          total_pages: Math.ceil(result.total / result.pageSize),
        },
      });
    } catch (error) {
      return this.throwError('Get Projects Grid', res, error);
    }
  }
  @Get('/project/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get detail Project', operationId: 'detailProject' })
  @ApiResponseDecorator({ status: 200, description: 'Return detail of project', type: ApiResponse, isArray: false })
  @ApiParam({ name: 'id', description: 'ID of project', type: Number, required: true })
  async detailProject(@Res() res: Response, @CurrentUser() user: User, @Param('id') project_id: number) {
    try {
      const result = await this.projectService.detailProject(user.company_id, project_id);

      return this.sendApiResponse(res, { error: false, payload: result });
    } catch (error) {
      return this.throwError('Get Detail Project', res, error);
    }
  }

  @Put('projects/status')
  @AuditAction(AuditActionEnum.UPDATE)
  @ApiBearerAuth()
  @ApiOperation({ summary: `Update projects's status`, operationId: 'updateProjectStatus' })
  @ApiResponseDecorator({ status: 200, description: 'Return status updated', type: ApiResponse, isArray: false })
  @ApiBody({ type: UpdateProjectStatusDto })
  async updateProjectStatus(@Res() res: Response, @CurrentUser() user: User, @Body() dto: UpdateProjectStatusDto) {
    try {
      const result = await this.projectService.updateProjectStatus(user.company_id, dto);

      return this.sendApiResponse(res, { error: false, payload: result });
    } catch (error) {
      return this.throwError('Update Project Status', res, error);
    }
  }

  @Get('/project/:id/services')
  @ApiBearerAuth()
  @ApiOperation({ summary: `Get projects's services`, operationId: 'listServices' })
  @ApiResponseDecorator({ status: 200, description: 'Return Service Project', type: ApiResponse, isArray: false })
  async listServices(@Res() res: Response, @CurrentUser() user: User, @Param('id') projectId: number) {
    try {
      const result = await this.projectService.listServices(user.company_id, projectId);

      return this.sendApiResponse(res, { error: false, payload: result });
    } catch (error) {
      return this.throwError(`Get projects's services`, res, error);
    }
  }

  @Get('/project/:id/hours')
  @ApiBearerAuth()
  @ApiOperation({ summary: `Get projects's hours`, operationId: 'listHours' })
  @ApiResponseDecorator({ status: 200, description: 'Return Hours Project', type: ApiResponse, isArray: false })
  @ApiParam({ name: 'id', description: 'Id of the project', required: true, type: Number })
  @ApiQuery({ name: 'company_id', description: 'Company ID', required: false, type: Number })
  @ApiQuery({ name: 'start_date', description: 'Start Date', required: false, type: String })
  @ApiQuery({ name: 'end_date', description: 'End Date', required: false, type: String })
  async listHours(
    @Res() res: Response,
    @CurrentUser() user: User,
    @Param('id') projectId: number,
    @Query('company_id') companyId: number,
    @Query('start_date') startDate: string,
    @Query('end_date') endDate: string,
  ) {
    try {
      const result = await this.projectService.listHours(companyId, projectId, startDate, endDate, user);

      return this.sendApiResponse(res, { error: false, payload: result });
    } catch (error) {
      return this.throwError(`Get projects's hours`, res, error);
    }
  }

  @Get('/project/:id/shares')
  @ApiBearerAuth()
  @ApiOperation({ summary: `Get projects's shares`, operationId: 'getProjectShares' })
  @ApiResponseDecorator({
    status: 200,
    description: "Project's shares",
    type: ApiResponse,
    isArray: true,
  })
  async getProjectShares(@Res() res: Response, @CurrentUser() currentUser: User, @Param('id') projectId: string) {
    try {
      // Validate input
      if (!isNumberString(projectId)) {
        throw new BadRequestError('Invalid project id');
      }

      // Handle to get project shares
      const projectIdInNumber = parseInt(projectId);
      const shares = await this.projectService.getProjectShares(currentUser, projectIdInNumber);

      return this.sendApiResponse(res, {
        error: false,
        payload: shares,
        count: shares.length,
      });
    } catch (error) {
      return this.throwError("Get projects's shares", res, error);
    }
  }

  @Post('/project')
  @AuditAction(AuditActionEnum.CREATE)
  @ApiBearerAuth()
  @ApiBody({ type: CreateProjectDto })
  @ApiOperation({ summary: `Create an project`, operationId: 'createProject' })
  @ApiResponseDecorator({ status: 200, type: ApiResponse, isArray: false })
  async createProject(@Res() res: Response, @CurrentUser() user: User, @Body() createInvoiceDto: CreateProjectDto) {
    try {
      await this.projectService.createProject(createInvoiceDto, user.company_id);

      return this.sendApiResponse(res, { error: false });
    } catch (error) {
      return this.throwError('Create Project', res, error);
    }
  }

  @Put('/project/:id')
  @AuditAction(AuditActionEnum.UPDATE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a project' })
  @ApiResponseDecorator({ status: 200, type: ApiResponse, isArray: false })
  async updateProject(
    @Res() res: Response,
    @CurrentUser() user: User,
    @Param('id') projectId: number,
    @Body() updateProjectDto: UpdateProjectDto,
  ) {
    try {
      await this.projectService.updateProject(projectId, user.company_id, updateProjectDto);

      return this.sendApiResponse(res, { error: false });
    } catch (error) {
      return this.throwError('Update Project', res, error);
    }
  }

  @Delete('/project/:id')
  @AuditAction(AuditActionEnum.DELETE)
  @ApiOperation({ summary: 'Delete a project', operationId: 'deleteProject' })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'Id of project', required: true, type: Number })
  @ApiResponseDecorator({ status: 200, type: ApiResponse, isArray: false })
  async deleteProject(@Param('id') projectId: number, @Res() res: Response, @CurrentUser() user: User) {
    try {
      await this.projectService.deleteProject(projectId, user.company_id, user.id);
      return this.sendApiResponse(res, { error: false });
    } catch (error) {
      return this.throwError('Delete Project', res, error);
    }
  }

  @Delete('/projects/bulk')
  @AuditAction(AuditActionEnum.DELETE)
  @ApiOperation({ summary: 'Bulk Delete Projects', operationId: 'bulkDeleteProjects' })
  @ApiResponseDecorator({ status: 200, description: 'Bulk Delete Projects', type: ApiResponse, isArray: false })
  async bulkDeleteProjects(
    @Res() res: Response,
    @CurrentUser() currentUser: User,
    @Body() bulkDeleteProjectsDto: BulkDeleteOffersDto,
  ) {
    try {
      const { ids } = bulkDeleteProjectsDto;
      if (!isArray(ids)) {
        throw new BadRequestError('Task ids are invalid!');
      }

      await this.projectService.bulkDeleteProjects(currentUser, bulkDeleteProjectsDto);
      return this.sendApiResponse(res, { error: false });
    } catch (error) {
      return this.throwError('Bulk Delete Projects', res, error);
    }
  }

  @Get('/project/:id/begin')
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'Id of project', required: true, type: Number })
  @ApiResponseDecorator({ status: 200, type: ApiResponse, isArray: false })
  async fromBeginning(@Res() res: Response, @CurrentUser() user: User, @Param('id') projectId: number) {
    try {
      const result = await this.projectService.fromBeginning(projectId, user.company_id);

      return this.sendApiResponse(res, { error: false, payload: result });
    } catch (error) {
      return this.throwError('fromBeginning', res, error);
    }
  }

  @Post('/project/:id/copy')
  @AuditAction(AuditActionEnum.CREATE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Copy a project' })
  @ApiResponseDecorator({ status: 200, type: ApiResponse, isArray: false })
  async copyProject(@Res() res: Response, @CurrentUser() user: User, @Param('id') projectId: number) {
    try {
      await this.projectService.copyProject(projectId, user.company_id);

      return this.sendApiResponse(res, { error: false });
    } catch (error) {
      return this.throwError('Copy Project', res, error);
    }
  }

  @Post('/project/:id/copy-as-offer')
  @AuditAction(AuditActionEnum.CREATE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Copy a project as offer' })
  @ApiResponseDecorator({ status: 200, type: ApiResponse, isArray: false })
  async copyProjectAsOffer(@Res() res: Response, @CurrentUser() user: User, @Param('id') projectId: number) {
    try {
      await this.projectService.copyProjectAsOffer(projectId, user.company_id);

      return this.sendApiResponse(res, { error: false });
    } catch (error) {
      return this.throwError('Copy Project as Offer', res, error);
    }
  }

  @Post('/project/:id/invoice')
  @AuditAction(AuditActionEnum.CREATE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate Invoice From Project' })
  @ApiResponseDecorator({ status: 200, type: ApiResponse, isArray: false })
  async generateInvoiceFromProject(
    @Res() res: Response,
    @CurrentUser() user: User,
    @Param('id') projectId: number,
    @Body() dto: GenerateInvoiceDto,
  ) {
    try {
      const result = await this.projectService.generateInvoiceFromProject(projectId, user, dto);

      return this.sendApiResponse(res, { error: false, payload: result });
    } catch (error) {
      return this.throwError('Generate Invoice From Project', res, error);
    }
  }

  @Post('/project/:id/service-invoice')
  @AuditAction(AuditActionEnum.CREATE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate Service Invoice From Project' })
  @ApiResponseDecorator({ status: 200, type: ApiResponse, isArray: false })
  async generateServiceInvoiceFromProject(
    @Res() res: Response,
    @CurrentUser() user: User,
    @Param('id') projectId: number,
    @Body() dto: GenerateServiceInvoiceDto,
  ) {
    try {
      const result = await this.projectService.generateServiceInvoiceFromProject(projectId, user, dto);

      return this.sendApiResponse(res, { error: false, payload: result });
    } catch (error) {
      return this.throwError('Generate Service Invoice From Project', res, error);
    }
  }

  @Post('/project/:id/hour-invoice')
  @AuditAction(AuditActionEnum.CREATE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'generate Hour Invoice' })
  @ApiResponseDecorator({ status: 200, type: ApiResponse, isArray: false })
  async generateHourInvoice(
    @Res() res: Response,
    @CurrentUser() user: User,
    @Param('id') projectId: number,
    @Body() dto: CreateInvoiceHoursDto,
  ) {
    try {
      const result = await this.projectService.generateHourInvoice(projectId, user, dto);

      return this.sendApiResponse(res, { error: false, payload: result });
    } catch (error) {
      return this.throwError('Generate Hour Invoice', res, error);
    }
  }

  @Post('/project/:id/pull')
  @AuditAction(AuditActionEnum.UPDATE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Pull projects' })
  @ApiResponseDecorator({ status: 200, type: ApiResponse, isArray: false })
  async pullProjects(
    @Res() res: Response,
    @CurrentUser() currentUser: User,
    @Param('id') projectId: string,
    @Body() pullProjectsDto: PullProjectsDto,
  ) {
    try {
      const { project_ids: pullProjectIds } = pullProjectsDto;

      // Validate input
      if (!isNumberString(projectId)) {
        throw new BadRequestError('Invalid project id');
      }
      if (!pullProjectIds) {
        throw new BadRequestError('Please provide project ids for pulling');
      }
      const invalidProjectId = pullProjectIds.find((id) => id <= 0);
      if (invalidProjectId) {
        throw new BadRequestError('Invalid project id');
      }

      // Handle to pull project
      const projectIdInNumber = parseInt(projectId);

      await this.projectService.pullProjects(currentUser, projectIdInNumber, pullProjectIds);

      return this.sendApiResponse(res, { error: false });
    } catch (error) {
      return this.throwError('Pull Project', res, error);
    }
  }

  @Get('/project/:id/pull/list')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Project Connections', operationId: 'getProjectConnections' })
  @ApiResponseDecorator({ status: 200, type: ApiResponse, isArray: true })
  async projectConnections(@Res() res: Response, @CurrentUser() currentUser: User, @Param('id') projectId: string) {
    try {
      // Validate input
      if (!isNumberString(projectId)) {
        throw new BadRequestError('Project id is invalid!');
      }

      // Handle to get project connections
      const projectIdInNumber = parseInt(projectId);

      const projects = await this.projectService.getProjectConnections(projectIdInNumber, currentUser.company_id);

      return this.sendApiResponse(res, { error: false, payload: projects });
    } catch (error) {
      return this.throwError('Get Project Connections', res, error);
    }
  }

  @Get('/time-overview/projects')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'list Project For Overview', operationId: 'listProjectForOverview' })
  @ApiResponseDecorator({ status: 200, type: ApiResponse, isArray: false })
  @ApiQuery({ name: 'company_id', description: 'Id of Company', required: true, type: Number })
  async listProjectForOverview(@Res() res: Response, @Query('company_id') comId: number, @CurrentUser() user: User) {
    try {
      const result = await this.projectService.listProjectForOverview(user.company_id, comId);
      return this.sendApiResponse(res, { error: false, payload: result });
    } catch (error) {
      return this.throwError('list Project For Overview', res, error);
    }
  }

  @Get('/project/:id/comments')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Project Comments', operationId: 'getProjectComments' })
  @ApiParam({ name: 'id', description: 'ID of project', type: Number, required: true })
  @ApiResponseDecorator({
    status: 200,
    description: 'Return project comments',
    type: ApiResponse,
    isArray: false,
  })
  async getProjectComments(@Res() res: Response, @CurrentUser() user: User, @Param('id') projectId: number) {
    try {
      const comments = await this.projectService.getProjectComments(user.company_id, projectId);
      return this.sendApiResponse(res, {
        error: false,
        payload: comments,
        count: comments.length,
      });
    } catch (error) {
      return this.throwError('Get Project Comments', res, error);
    }
  }

  @Get('/project/:projectId/comment/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Single Project Comment', operationId: 'getProjectComment' })
  @ApiParam({ name: 'projectId', description: 'ID of project', type: Number, required: true })
  @ApiParam({ name: 'id', description: 'ID of comment', type: Number, required: true })
  @ApiResponseDecorator({ status: 200, description: 'Return project comment', type: ApiResponse, isArray: false })
  async getProjectComment(
    @Res() res: Response,
    @CurrentUser() user: User,
    @Param('projectId') projectId: number,
    @Param('id') commentId: number,
  ) {
    try {
      const comment = await this.projectService.getProjectComment(user.company_id, projectId, commentId);
      return this.sendApiResponse(res, {
        error: false,
        payload: comment,
      });
    } catch (error) {
      return this.throwError('Get Project Comment', res, error);
    }
  }

  @Post('/project/:id/comment')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create Project Comment', operationId: 'createProjectComment' })
  @ApiParam({ name: 'id', description: 'ID of project', type: Number, required: true })
  @ApiBody({ type: CreateProjectCommentDto })
  @ApiResponseDecorator({ status: 200, type: ApiResponse, isArray: false })
  async createProjectComment(
    @Res() res: Response,
    @CurrentUser() user: User,
    @Param('id') projectId: number,
    @Body() commentDto: CreateProjectCommentDto,
  ) {
    try {
      // Set the project ID from the URL parameter
      commentDto.project_id = projectId;
      const comment = await this.projectService.createProjectComment(commentDto, user);
      return this.sendApiResponse(res, {
        error: false,
        payload: comment,
      });
    } catch (error) {
      return this.throwError('Create Project Comment', res, error);
    }
  }

  @Delete('/project/:projectId/comment/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete Project Comment', operationId: 'deleteProjectComment' })
  @ApiParam({ name: 'projectId', description: 'ID of project', type: Number, required: true })
  @ApiParam({ name: 'id', description: 'ID of comment', type: Number, required: true })
  @ApiResponseDecorator({ status: 200, type: ApiResponse, isArray: false })
  async deleteProjectComment(
    @Res() res: Response,
    @CurrentUser() user: User,
    @Param('projectId') projectId: number,
    @Param('id') commentId: number,
  ) {
    try {
      await this.projectService.deleteProjectComment(commentId, user);
      return this.sendApiResponse(res, { error: false });
    } catch (error) {
      return this.throwError('Delete Project Comment', res, error);
    }
  }
}
