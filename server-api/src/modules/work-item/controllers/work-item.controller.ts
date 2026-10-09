import User from 'src/database/models/users.model';
import { ProjectService } from 'src/modules/projects/services/project.service';
import { BaseController } from 'src/shared/controllers/base.controller';
import { AuditModule, AuditAction, CurrentUser } from 'src/shared/decorators';
import { QueryDate, QueryDateFilterUserId } from 'src/shared/dto';
import {
  ApiResponse,
  formatDuration,
  formatStringToDate,
  getFirstDateOfMonth,
  getLastDateOfMonth,
  parseDate,
  parseDuration,
  BadRequestError,
  ForbiddenError,
  InternalServerError,
  UnauthorizedError,
} from 'src/shared/utils';
import { Body, Controller, Delete, Get, Logger, Param, Post, Query, Res } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse as ApiResponseDecorator,
  ApiTags,
} from '@nestjs/swagger';
import {
  CreateUserHolidayDto,
  LockRequestDto,
  UnlockRequestDto,
  WorkItemInputDto,
  WorkItemShowRequestDto,
  WorkLogInputDto,
} from '../dto';
import { WorkItemService } from '../services/work-item.service';
import { WorkSubmitService } from '../services/work-submit.service';
import { Response } from 'express';
import { ProductService } from 'src/modules/product/services/product.service';
import { isDateString, isNumberString } from 'class-validator';
import { AuditModuleEnum, AuditActionEnum } from 'src/shared/constants/audit.constants';

@Controller('api')
@ApiBearerAuth()
@ApiTags('Work Item')
@AuditModule(AuditModuleEnum.WORK_ITEM)
export class WorkItemController extends BaseController {
  constructor(
    private readonly workItemService: WorkItemService,
    private readonly workSubmitService: WorkSubmitService,
    private readonly projectService: ProjectService,
    private readonly productService: ProductService,
  ) {
    super(new Logger(WorkItemController.name));
  }

  @Get('/timesheet/locks')
  @ApiOperation({ summary: 'Get list work submit', operationId: 'workSubmits' })
  @ApiResponseDecorator({
    status: 200,
    description: 'Returns of work item locks',
    type: ApiResponse,
    isArray: true,
  })
  async listWorkSubmit(@Res() res: Response, @CurrentUser() user: User, @Query() query: QueryDate) {
    try {
      const lst = await this.workSubmitService.getWorkSubmit(user.company_id, query.start, query.end);

      return this.sendApiResponse(res, { error: false, payload: lst, count: lst.length });
    } catch (error: unknown) {
      return this.throwError('listWorkSubmit', res, error);
    }
  }

  @Get('/timesheet/projects')
  @ApiOperation({ summary: 'Get list project for time sheet', operationId: 'project4TimeSheet' })
  @ApiResponseDecorator({
    status: 200,
    description: 'Returns of work item projects',
    type: ApiResponse,
    isArray: true,
  })
  async listProjectForTimesheet(@Res() res: Response, @CurrentUser() user: User) {
    try {
      if (!user?.company_id) {
        return new BadRequestError('Company ID not found');
      }

      const lst = await this.workItemService.selectProjectForTimeSheet(user.company_id);
      return this.sendApiResponse(res, { error: false, payload: lst, count: lst.length });
    } catch (error: unknown) {
      return this.throwError('listProjectForTimesheet', res, error);
    }
  }

  @Get('/timesheet/product/:id/tasks')
  @ApiOperation({ summary: 'Get list task by product id', operationId: 'taskByProduct' })
  @ApiResponseDecorator({
    status: 200,
    description: 'Returns of tasks',
    type: ApiResponse,
    isArray: true,
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the product',
    type: Number,
  })
  async listTaskByProductID(@Res() res: Response, @CurrentUser() user: User, @Param('id') productId: number) {
    try {
      const lst = await this.workItemService.getProductTasks(user.company_id, productId);
      return this.sendApiResponse(res, { error: false, payload: lst.length > 0 ? lst : null, count: lst.length });
    } catch (error: unknown) {
      return this.throwError('Get list task by product id', res, error);
    }
  }

  @Get('/timesheet/project/:id/products')
  @ApiOperation({ summary: 'Get list product by project id', operationId: 'productByProject' })
  @ApiResponseDecorator({
    status: 200,
    description: 'Returns of products',
    type: ApiResponse,
    isArray: true,
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the project',
    type: Number,
  })
  async listProductByProjectID(@Res() res: Response, @CurrentUser() user: User, @Param('id') projectId: number) {
    try {
      const lst = await this.productService.getProjectProducts(user.company_id, projectId);
      return this.sendApiResponse(res, { error: false, payload: lst.length > 0 ? lst : null, count: lst.length });
    } catch (error: unknown) {
      return this.throwError('Get list product by project id', res, error);
    }
  }

  @Get('/timesheet/workitems')
  @ApiOperation({ summary: 'Get list work items', operationId: 'workItems' })
  @ApiResponseDecorator({
    status: 200,
    description: 'Returns of work items',
    type: ApiResponse,
    isArray: true,
  })
  async listWorkItems(@Res() res: Response, @CurrentUser() user: User, @Query() query: QueryDateFilterUserId) {
    try {
      const lst = await this.workItemService.getListWorkItemsByCompanyId(user.company_id, user, query);

      return this.sendApiResponse(res, { error: false, payload: lst, count: lst.length });
    } catch (error: unknown) {
      return this.throwError('Get list work items', res, error);
    }
  }

  @Get('/timesheet/workitems/flexhours')
  @ApiOperation({ summary: 'Get list flex hours', operationId: 'flexHours' })
  @ApiResponseDecorator({
    status: 200,
    description: 'Returns of flex hours',
    type: ApiResponse,
    isArray: true,
  })
  async listFlexHours(@Res() res: Response, @Query() query: QueryDateFilterUserId, @CurrentUser() user: User) {
    try {
      const { results, appliedHolidays } = await this.workItemService.getFlexHours(user, query);
      return this.sendApiResponse(res, {
        error: false,
        payload: results,
        count: results.length,
        holidays: appliedHolidays,
      });
    } catch (error: unknown) {
      return this.throwError('Get list flex hours', res, error);
    }
  }

  @Get('/timesheet/workitems/list')
  @ApiOperation({ summary: 'Get list task', operationId: 'listTasks' })
  @ApiResponseDecorator({
    status: 200,
    description: 'Returns of list task',
    type: ApiResponse,
    isArray: true,
  })
  async listWorkItemsByDate(@Res() res: Response, @CurrentUser() user: User, @Query() query: QueryDateFilterUserId) {
    try {
      const lst = await this.workItemService.getListTask(user.company_id, user, query);

      return this.sendApiResponse(res, { error: false, payload: lst, count: lst.length });
    } catch (error: unknown) {
      return this.throwError('Get list task', res, error);
    }
  }

  @Get('/timesheet/user-locked-list')
  @ApiOperation({ summary: 'Get user locked list', operationId: 'userLockedList' })
  @ApiResponseDecorator({
    status: 200,
    description: 'Returns of user locked list',
    type: ApiResponse,
    isArray: true,
  })
  async userLockedListByDate(@Res() res: Response, @CurrentUser() user: User, @Query() query: { date: string }) {
    try {
      const isDateFormatted = formatStringToDate(query.date);

      if (!isDateFormatted) {
        throw new BadRequestError('invalid date format, must be YYYY-MM-DD');
      }

      const startDate = getFirstDateOfMonth(query.date);
      const endDate = getLastDateOfMonth(query.date);

      const lst = await this.workSubmitService.getUserLocked(user.company_id, startDate, endDate);
      return this.sendApiResponse(res, { error: false, payload: lst, count: lst.length });
    } catch (error: unknown) {
      return this.throwError('userLockedListByDate', res, error);
    }
  }

  @Get('/holidays')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get holidays', operationId: 'getHolidays' })
  @ApiResponseDecorator({
    status: 200,
    description: 'User Holidays',
    type: ApiResponse,
    isArray: true,
  })
  async getHolidays(@Res() res: Response, @CurrentUser() currentUser: User) {
    try {
      const userHolidays = await this.workItemService.getHolidays(currentUser);

      return this.sendApiResponse(res, {
        error: false,
        payload: userHolidays,
        count: userHolidays.length,
      });
    } catch (error) {
      return this.throwError('Get Holidays', res, error);
    }
  }

  @Post('/timesheet/workitems/show')
  @ApiOperation({ summary: 'Get show work item', operationId: 'workItemsShow' })
  @ApiResponseDecorator({
    status: 200,
    description: 'Returns of work items',
    type: ApiResponse,
    isArray: false,
  })
  @ApiBody({ type: WorkItemShowRequestDto })
  @AuditAction(AuditActionEnum.CREATE)
  async showWorkItem(@Res() res: Response, @Body() body: WorkItemShowRequestDto, @CurrentUser() user: User) {
    try {
      if (!body || Object.keys(body).length === 0) {
        throw new BadRequestError('EOF');
      }

      const uID = body.user_id && user.role === 'admin' ? body.user_id : user.id;
      await this.workItemService.resetValueIsHide(user.company_id, uID);
      await this.workItemService.updateValueIsHide(user.company_id, uID, body.ids);

      return this.sendApiResponse(res, { error: false });
    } catch (error: unknown) {
      return this.throwError('showWorkItem', res, error);
    }
  }

  @Get('/timesheet/workitem/:id')
  @ApiOperation({ summary: 'Get detail of work item', operationId: 'workItemDetail' })
  @ApiResponseDecorator({
    status: 200,
    description: 'Returns of work item',
    type: ApiResponse,
    isArray: false,
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the work item',
    type: Number,
  })
  async detailWorkItem(@Res() res: Response, @CurrentUser() user: User, @Param('id') id: number) {
    try {
      const item = await this.workItemService.getWorkItemById(user.company_id, id);

      return this.sendApiResponse(res, { error: false, payload: item });
    } catch (error: unknown) {
      return this.throwError('detailWorkItem', res, error);
    }
  }

  @Post('/timesheet/worklog')
  @ApiOperation({ summary: 'Create work log', operationId: 'createWorkLog' })
  @ApiResponseDecorator({
    status: 200,
    description: 'Returns of work log',
    type: ApiResponse,
    isArray: false,
  })
  @ApiBody({ type: WorkLogInputDto })
  @AuditAction(AuditActionEnum.CREATE)
  async addWorkLog(@Res() res: Response, @CurrentUser() user: User, @Body() body: WorkLogInputDto) {
    try {
      if (!body || Object.keys(body).length === 0) {
        throw new BadRequestError('EOF');
      }

      if (!body.date || body.date.toString().length <= 0) {
        throw new BadRequestError('Eingabedatum ist leer!');
      }

      const wi = await this.workItemService.getWorkItem(body.work_item_id);

      if (wi.user_id !== user.id && user.role !== 'admin') {
        throw new UnauthorizedError('Das Arbeitsprotokoll eines anderen Benutzers kann nicht bearbeitet werden');
      }

      const workDate = parseDate(body.date);
      if (!workDate) {
        throw new BadRequestError('Ungültiges Datum');
      }

      const startDate = getFirstDateOfMonth(body.date);
      const endDate = getLastDateOfMonth(body.date);
      const ws = await this.workSubmitService.getWorkSubmitByUser(user.company_id, user.id, startDate, endDate);

      if (ws.length > 0 && user.role !== 'admin') {
        throw new UnauthorizedError(
          'Der Stundenzettel dieses Monats ist gesperrt, bitte wenden Sie sich an den Administrator, wenn Sie ihn ändern müssen.',
        );
      }

      const prj = await this.projectService.selectProjectByID(wi.project_id);
      const now = new Date();
      const projectEndDate = new Date(prj.end_on);
      const isProjectLocked =
        now > new Date(projectEndDate.getTime() + 24 * 60 * 60 * 1000) || prj.status === 'archive';

      if (isProjectLocked) {
        throw new UnauthorizedError(
          'Es kann keine weitere Zeit eingegeben werden, da das Fertigstellungsdatum des Projekts erreicht ist.',
        );
      }

      let spendTime = '0s';
      let spentTimeInHour = 0;
      if (body.spent) {
        let timeStr = body.spent.toString().trim();

        if (/^\d+(\.\d+)?$/.test(timeStr)) {
          const hours = Math.floor(parseFloat(timeStr));
          const minutes = Math.round((parseFloat(timeStr) - hours) * 60);
          timeStr = `${hours > 0 ? hours + 'h' : ''}${minutes > 0 ? minutes + 'm' : ''}`;
        }

        let dur;
        try {
          dur = parseDuration(timeStr);
        } catch (error) {
          throw new InternalServerError(`Invalid spent time, valid time units are 's' 'm' 'h'`);
        }

        spendTime = formatDuration(dur);
        spentTimeInHour = Number(body.spent); // To avoid floating number rounding errors
      }

      await this.workSubmitService.addOrUpdateWorkLog(
        user.company_id,
        wi.user_id,
        workDate,
        spendTime,
        spentTimeInHour,
        body,
      );
      return this.sendApiResponse(res, { error: false });
    } catch (error: unknown) {
      return this.throwError('addWorkLog', res, error);
    }
  }

  @Post('/timesheet/workitem')
  @ApiOperation({ summary: 'Create work item', operationId: 'createWorkItems' })
  @ApiResponseDecorator({
    status: 200,
    description: 'Returns of work items',
    type: ApiResponse,
    isArray: false,
  })
  @ApiBody({ type: WorkItemInputDto })
  @AuditAction(AuditActionEnum.CREATE)
  async addWorkItem(@Res() res: Response, @CurrentUser() user: User, @Body() body: WorkItemInputDto) {
    try {
      if (!body || Object.keys(body).length === 0) {
        throw new BadRequestError('Ungültige Eingabe!');
      }

      // if ((body?.task == '' || body.task === undefined) && body.tasks.length === 0) {
      //   throw new BadRequestError('Ungültige Eingabe!');
      // }

      // if(!body.task_id && !body.task && !body.tasks) {
      //   throw new BadRequestError('Ungültige Eingabe!');
      // }

      // if (body?.task_id) {
      //   body.tasks = [body.task_id.toString()];
      // }

      // if (body?.task_ids?.length === 0) {
      //   throw new BadRequestError('Ungültige Eingabe!');
      // }

      await this.workItemService.createWorkItem(user, body);

      return this.sendApiResponse(res, { error: false });
    } catch (error: unknown) {
      return this.throwError('addWorkItem', res, error);
    }
  }

  @Post('/timesheet/lock')
  @ApiOperation({ summary: 'Unlock work item', operationId: 'unlockWorkItem' })
  @ApiResponseDecorator({
    status: 200,
    description: 'Returns of work items',
    type: ApiResponse,
    isArray: false,
  })
  @ApiBody({ type: LockRequestDto })
  @AuditAction(AuditActionEnum.CREATE)
  async lock(@Res() res: Response, @CurrentUser() user: User, @Body() body: LockRequestDto) {
    try {
      if (!body || Object.keys(body).length === 0) {
        throw new BadRequestError('EOF');
      }

      if (!body.confirmed) {
        throw new BadRequestError('please confirm timesheet unlock list');
      }

      const isDateFormatted = formatStringToDate(body.date);
      if (!isDateFormatted) {
        throw new BadRequestError('invalid date format, must be YYYY-MM-DD');
      }

      if (user.id !== body.user_id && user.role !== 'admin') {
        throw new UnauthorizedError('permission denied');
      }

      await this.workSubmitService.lockWorkItem(user.company_id, body);
      return this.sendApiResponse(res, { error: false });
    } catch (error: unknown) {
      return this.throwError('lockWorkItem', res, error);
    }
  }

  @Post('/timesheet/unlock')
  @ApiOperation({ summary: 'Unlock work item', operationId: 'lockWorkItem' })
  @ApiResponseDecorator({
    status: 200,
    description: 'Returns of work items',
    type: ApiResponse,
    isArray: false,
  })
  @ApiBody({ type: UnlockRequestDto })
  @AuditAction(AuditActionEnum.CREATE)
  async unlock(@Res() res: Response, @CurrentUser() user: User, @Body() body: UnlockRequestDto) {
    try {
      if (user.role !== 'admin' && user.role !== 'manager') {
        throw new UnauthorizedError('not authorized');
      }

      if (!body || Object.keys(body).length === 0) {
        throw new BadRequestError('EOF');
      }

      if (!body.confirmed) {
        throw new BadRequestError('please confirm your timesheet lock');
      }

      const isDateFormatted = formatStringToDate(body.date);
      if (!isDateFormatted) {
        throw new BadRequestError('invalid date format, must be YYYY-MM-DD');
      }

      await this.workSubmitService.unlockWorkItem(user.company_id, body);

      return this.sendApiResponse(res, { error: false });
    } catch (error: unknown) {
      return this.throwError('unlockWorkItem', res, error);
    }
  }

  @Post('/holiday')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add user holiday', operationId: 'addUserHoliday' })
  @ApiResponseDecorator({
    status: 200,
    description: 'User holidays',
    type: ApiResponse,
    isArray: true,
  })
  @AuditAction(AuditActionEnum.CREATE)
  async addUserHoliday(
    @Res() res: Response,
    @CurrentUser() currentUser: User,
    @Body() createUserHolidayDto: CreateUserHolidayDto,
  ) {
    try {
      // Validate inputs
      if (!createUserHolidayDto.start_date || !isDateString(createUserHolidayDto.start_date)) {
        throw new BadRequestError('Invalid start date');
      }
      if (!createUserHolidayDto.end_date || !isDateString(createUserHolidayDto.end_date)) {
        throw new BadRequestError('Invalid end date');
      }

      // Handle to create user holiday
      const handledStartDate = new Date(createUserHolidayDto.start_date);
      const handledEndDate = new Date(createUserHolidayDto.end_date);

      const userHolidays = await this.workItemService.createHoliday(currentUser, handledStartDate, handledEndDate);

      return this.sendApiResponse(res, { error: false, dates: userHolidays });
    } catch (error) {
      return this.throwError('Add user holiday', res, error);
    }
  }

  @Delete('/timesheet/workitem/:id')
  @ApiOperation({ summary: 'Delete work item', operationId: 'deleteWorkItem' })
  @ApiResponseDecorator({
    status: 200,
    description: 'Returns of work items',
    type: ApiResponse,
    isArray: false,
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the work item',
    type: Number,
  })
  @AuditAction(AuditActionEnum.DELETE)
  async deleteWorkItem(@Res() res: Response, @CurrentUser() user: User, @Param('id') id: number) {
    try {
      throw new ForbiddenError('Das Arbeitsprotokoll kann derzeit nicht bearbeitet werden');

      await this.workItemService.deleteWorkItem(user.company_id, id);
      return this.sendApiResponse(res, { error: false });
    } catch (error: unknown) {
      return this.throwError('deleteWorkItem', res, error);
    }
  }

  @Delete('/holiday/:id')
  @ApiBearerAuth()
  @AuditAction(AuditActionEnum.DELETE)
  async removeUserHolidays(@Res() res: Response, @CurrentUser() currentUser: User, @Param('id') userHolidayId: string) {
    try {
      // Validate input
      if (!isNumberString(userHolidayId)) {
        throw new BadRequestError('User holiday id is invalid!');
      }

      // Handle to remove user holiday
      const userHolidayIdInNumber = parseInt(userHolidayId);

      await this.workItemService.removeUserHolidays(currentUser, userHolidayIdInNumber);

      return this.sendApiResponse(res, { error: false });
    } catch (error) {
      return this.throwError('Remove user holiday', res, error);
    }
  }
}
