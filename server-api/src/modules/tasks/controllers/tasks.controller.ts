import { BaseController } from 'src/shared/controllers/base.controller';
import { Body, Controller, Delete, Get, Logger, Param, Post, Put, Query, Res } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiResponse as ApiResponseDecorator,
  ApiBody,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { TasksService } from '../services/tasks.service';
import User from 'src/database/models/users.model';
import { AuditModule, CurrentUser, AuditAction } from 'src/shared/decorators';
import { Response } from 'express';
import { isArray, isNumber, isNumberString } from 'class-validator';
import { ApiResponse, BadRequestError } from 'src/shared/utils';
import { PaginatedResponse } from 'src/shared/interfaces';
import Task from 'src/database/models/task.model';
import { CreateTaskDto } from '../dtos/task-create.dto';
import { BulkDeleteTasksDto, BulkUpdateTasksDto, CreateCommentDto, UndoTasksDto, UpdateTaskDto } from '../dtos';
import { SettingService } from 'src/modules/setting/services/setting.service';
import TaskState from 'src/database/models/task-assignee.model';
import { AuditModuleEnum, AuditActionEnum } from 'src/shared/constants/audit.constants';

@Controller('api')
@ApiTags('Tasks')
@ApiBearerAuth()
@AuditModule(AuditModuleEnum.TASK)
export class TasksController extends BaseController {
  constructor(
    private readonly tasksService: TasksService,
    private readonly settingService: SettingService,
  ) {
    super(new Logger(TasksController.name));
  }

  @Get('tasks')
  @ApiOperation({ summary: 'Get paginated tasks', operationId: 'getTasks' })
  @ApiResponseDecorator({
    status: 200,
    description: 'Get paginated tasks',
  })
  async getTasks(
    @CurrentUser() currentUser: User,
    @Query('page') page: string,
    @Query('page_size') pageSize: string,
    @Query('sort') sort: string,
    @Query('filters') filters: string[],
    @Query('search') search: string,
    @Query('get_soft_deleted') getSoftDeleted: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      // Validate input
      if (!isNumberString(page)) {
        throw new BadRequestError('Page must be numbers!');
      }
      if (!isNumberString(pageSize)) {
        throw new BadRequestError('Page size must be numbers!');
      }
      if (!filters) {
        filters = [];
      }

      if (typeof filters === 'string') {
        filters = [filters];
      }

      const onlyGetSoftDeleted: boolean = getSoftDeleted === 'true';

      // Handle to get paginated tasks
      const pageInNumber = parseInt(page) < 1 ? 1 : parseInt(page);
      const pageSizeInNumber = parseInt(pageSize) < 5 ? 5 : parseInt(pageSize);
      const paginatedResponse: PaginatedResponse<Task> = await this.tasksService.getTasks(
        currentUser,
        pageInNumber,
        pageSizeInNumber,
        sort,
        Array.isArray(filters) ? filters : [filters],
        search,
        onlyGetSoftDeleted,
      );

      return this.sendApiResponse(res, { error: false, payload: paginatedResponse });
    } catch (error) {
      return this.throwError('Get paginated tasks', res, error, true);
    }
  }

  @Get('tasks/by-project')
  @ApiOperation({ summary: 'Get all tasks by project', operationId: 'listAllTasksByProject' })
  @ApiResponseDecorator({
    status: 200,
    description: 'Get all tasks by project',
    type: ApiResponse,
  })
  async listAllTasksByProject(
    @CurrentUser() currentUser: User,
    @Query('filters') filters: string[],
    @Query('search') search: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      // Validate inputs
      if (!filters) {
        filters = [];
      }

      if (typeof filters === 'string') {
        filters = [filters];
      }

      // Handle get all task by project
      const result = await this.tasksService.listAllTasksByProject(currentUser, filters, search);

      return this.sendApiResponse(res, { error: false, count: result.length, payload: result });
    } catch (error) {
      return this.throwError('Get all tasks by project', res, error, true);
    }
  }

  @Get('tasks/statuses')
  @ApiOperation({ summary: 'Get all status of task', operationId: 'listStatus' })
  @ApiResponseDecorator({
    status: 200,
    description: 'Get all status of task',
    type: ApiResponse,
  })
  async listStatuses(@Res({ passthrough: true }) res: Response, @CurrentUser() user: User) {
    try {
      // Handle get all status of project
      const result = await this.settingService.getSettingValue<TaskState[]>(user.company_id, 'task', 'statuses');

      return this.sendApiResponse(res, {
        error: false,
        count: result.length,
        payload: result,
      });
    } catch (error) {
      return this.throwError('Get all status of task', res, error, true);
    }
  }

  @Get('tasks/parent/:phaseId')
  @ApiOperation({ summary: 'Get all Task', operationId: 'taskWithoutPagination' })
  @ApiResponseDecorator({
    status: 200,
    description: 'Get all status of task',
    type: ApiResponse,
  })
  @ApiParam({ name: 'phaseId', description: 'Id of Phase' })
  @ApiQuery({ name: 'project_id', required: true, description: 'Id of Project', type: Number })
  async taskWithoutPagination(
    @Param('phaseId') phaseId: number,
    @Res() res: Response,
    @Query('project_id') projectId: number,
    @Query('user_id') userId: number | undefined = undefined,
  ) {
    try {
      // Handle get all status of project
      const result = await this.tasksService.getParentTasks(projectId, phaseId, userId);

      return this.sendApiResponse(res, { error: false, payload: result });
    } catch (error) {
      return this.throwError('Get all status of task', res, error);
    }
  }

  @Get('tasks/priorities')
  @ApiOperation({ summary: 'Get all Priority', operationId: 'priority' })
  @ApiResponseDecorator({
    status: 200,
    description: 'Get all Priority',
    type: ApiResponse,
  })
  async listPriorities(@Res() res: Response, @CurrentUser() user: User) {
    try {
      // Handle get all status of project
      const priorities = await this.settingService.getSettingValue<TaskState[]>(user.company_id, 'task', 'priorities');

      return this.sendApiResponse(res, {
        error: false,
        count: priorities.length,
        payload: priorities,
      });
    } catch (error) {
      return this.throwError('Get all priority', res, error);
    }
  }

  @Get('task/:id')
  @ApiOperation({ summary: 'Get Task', operationId: 'getTask' })
  @ApiResponseDecorator({
    status: 200,
    description: 'Details of Task',
    type: ApiResponse,
  })
  async getTask(@Param('id') id: string, @Res({ passthrough: true }) res: Response) {
    try {
      // Validate input
      if (!isNumberString(id)) {
        throw new BadRequestError('Task id is invalid!');
      }

      // Handle get task
      const taskIdInNumber = parseInt(id);
      const task = await this.tasksService.getTaskById(taskIdInNumber);

      return this.sendApiResponse(res, { error: false, payload: task });
    } catch (error) {
      return this.throwError('Get task', res, error, true);
    }
  }

  @Post('/task')
  @AuditAction(AuditActionEnum.CREATE)
  @ApiOperation({ summary: 'Create Task', operationId: 'createTask' })
  @ApiBody({ type: CreateTaskDto })
  @ApiResponseDecorator({
    status: 200,
    description: 'Task Created successfully',
    type: ApiResponse,
    isArray: false,
  })
  async createTask(@Res() res: Response, @CurrentUser() user: User, @Body() data: CreateTaskDto) {
    try {
      await this.tasksService.createTask(data, user.id, user.company_id);
      return this.sendApiResponse(res, { error: false });
    } catch (error) {
      return this.throwError('Create Task', res, error);
    }
  }

  @Post('/task/:id/comment')
  @AuditAction(AuditActionEnum.CREATE)
  @ApiOperation({ summary: 'Create Comment', operationId: 'createComment' })
  @ApiParam({ name: 'id', required: true, description: 'Task ID', type: Number })
  @ApiBody({ type: CreateCommentDto })
  async createComment(
    @Res() res: Response,
    @CurrentUser() user: User,
    @Param('id') task_id: number,
    @Body() data: CreateCommentDto,
  ) {
    try {
      const result = await this.tasksService.createComment(task_id, user.id, data);
      return this.sendApiResponse(res, { error: false, payload: result });
    } catch (error) {
      return this.throwError('Create Comment', res, error);
    }
  }

  @Put('/task/:id')
  @AuditAction(AuditActionEnum.UPDATE)
  @ApiOperation({ summary: 'Update Task', operationId: 'updateTask' })
  @ApiParam({ name: 'id', required: true, description: 'Task ID', type: Number })
  @ApiBody({ type: UpdateTaskDto })
  @ApiResponseDecorator({
    status: 200,
    description: 'Task Updated successfully',
    type: ApiResponse,
    isArray: false,
  })
  async updateTask(
    @Res() res: Response,
    @CurrentUser() user: User,
    @Param('id') task_id: number,
    @Body() data: UpdateTaskDto,
  ) {
    try {
      const result = await this.tasksService.updateTask(task_id, user.company_id, data);
      return this.sendApiResponse(res, { error: false, payload: result });
    } catch (error) {
      return this.throwError('Update Task', res, error);
    }
  }

  @Put('/tasks/bulk')
  @AuditAction(AuditActionEnum.UPDATE)
  @ApiOperation({ summary: 'Bulk Update Tasks', operationId: 'bulkUpdateTasks' })
  @ApiResponseDecorator({
    status: 200,
    description: 'Bulk Update Tasks',
    type: ApiResponse,
    isArray: false,
  })
  async bulkUpdateTasks(
    @CurrentUser() currentUser: User,
    @Body() bulkUpdateTasksDto: BulkUpdateTasksDto,
    @Res() res: Response,
  ) {
    try {
      const { ids, status_id: statusId } = bulkUpdateTasksDto;
      if (!isNumber(statusId)) {
        throw new BadRequestError('Status id is invalid!');
      }
      if (!isArray(ids)) {
        throw new BadRequestError('Task ids are invalid!');
      }

      await this.tasksService.bulkUpdateTasks(currentUser, bulkUpdateTasksDto);

      return this.sendApiResponse(res, { error: false });
    } catch (error) {
      return this.throwError('Bulk Update Tasks', res, error);
    }
  }

  @Put('/tasks/undo')
  @AuditAction(AuditActionEnum.UPDATE)
  @ApiOperation({ summary: 'Undo Tasks', operationId: 'undoTasks' })
  @ApiResponseDecorator({
    status: 200,
    description: 'Undo Tasks',
    type: ApiResponse,
    isArray: false,
  })
  async undoTasks(@CurrentUser() currentUser: User, @Body() undoTasksDto: UndoTasksDto, @Res() res: Response) {
    try {
      const { task_ids } = undoTasksDto;
      if (!isArray(task_ids)) {
        throw new BadRequestError('Task ids are invalid!');
      }

      await this.tasksService.bulkUndoTasks(currentUser, undoTasksDto);

      return this.sendApiResponse(res, { error: false });
    } catch (error) {
      return this.throwError('Undo Tasks', res, error);
    }
  }

  @Delete('/task/:id')
  @AuditAction(AuditActionEnum.DELETE)
  @ApiOperation({ summary: 'Delete Task', operationId: 'deleteTask' })
  @ApiParam({ name: 'id', required: true, description: 'Task ID', type: Number })
  @ApiResponseDecorator({
    status: 200,
    description: 'Task Deleted successfully',
    type: ApiResponse,
    isArray: false,
  })
  async deleteTask(@Res() res: Response, @CurrentUser() currentUser: User, @Param('id') taskId: number) {
    try {
      await this.tasksService.deleteTask(currentUser, taskId);
      return this.sendApiResponse(res, { error: false });
    } catch (error) {
      return this.throwError('Delete Task', res, error);
    }
  }

  @Delete('/tasks/bulk')
  @AuditAction(AuditActionEnum.DELETE)
  @ApiOperation({ summary: 'Bulk Delete Tasks', operationId: 'bulkDeleteTasks' })
  @ApiResponseDecorator({
    status: 200,
    description: 'Bulk Delete Tasks',
    type: ApiResponse,
    isArray: false,
  })
  async bulkDeleteTasks(
    @Res() res: Response,
    @CurrentUser() currentUser: User,
    @Body() bulkDeleteTasksDto: BulkDeleteTasksDto,
  ) {
    try {
      const { ids } = bulkDeleteTasksDto;
      if (!isArray(ids)) {
        throw new BadRequestError('Task ids are invalid!');
      }

      await this.tasksService.bulkDeleteTasks(currentUser, bulkDeleteTasksDto);
      return this.sendApiResponse(res, { error: false });
    } catch (error) {
      return this.throwError('Bulk Delete Tasks', res, error);
    }
  }

  @Get('/task/attachment/:id')
  @ApiParam({ name: 'id', required: true, description: 'attachment ID', type: Number })
  @ApiOperation({ summary: 'Download attachments', operationId: 'downloadAttachment' })
  @ApiResponseDecorator({
    status: 200,
    description: 'Download attachments',
    type: ApiResponse,
    isArray: false,
  })
  async downloadAttachment(@Param('id') id: number, @Res() res: Response) {
    const { fileName, filePath } = await this.tasksService.getAttachment(id);

    // Attach header and send file
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    return res.sendFile(filePath);
  }

  @Get('tasks/subtasks/:taskId')
  @ApiOperation({ summary: 'Get all subtasks by task', operationId: 'listAllSubtasksByTask' })
  @ApiResponseDecorator({
    status: 200,
    description: 'Get all subtasks by task',
    type: ApiResponse,
  })
  async listAllSubtasksByTask(
    @CurrentUser() currentUser: User,
    @Param('taskId') taskId: number,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      taskId = parseInt(taskId.toString());
      // Validate inputs
      if (!isNumber(taskId)) {
        throw new BadRequestError('Task id is invalid!');
      }

      // Handle get all subtask by task
      const result = await this.tasksService.getSubtasks(taskId);

      return this.sendApiResponse(res, { error: false, count: result.length, payload: result });
    } catch (error) {
      return this.throwError('Get all subtasks by task', res, error, true);
    }
  }
}
