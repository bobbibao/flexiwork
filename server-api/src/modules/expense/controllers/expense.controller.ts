import { Response } from 'express';
import User from 'src/database/models/users.model';
import { BaseController } from 'src/shared/controllers/base.controller';
import { AuditModule, CurrentUser, AuditAction } from 'src/shared/decorators';
import { RoleEnum } from 'src/shared/enums';
import { AllowedRoleGuard } from 'src/shared/guards';
import { ApiResponse, BadRequestError } from 'src/shared/utils';
import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Post,
  Put,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse as ApiResponseDecorator, ApiTags } from '@nestjs/swagger';
import { ExpenseService } from '../services/expense.service';
import { CreateExpenseDto, UpdateExpenseDto } from '../dto';
import { isNumberString } from 'class-validator';
import { AuditModuleEnum, AuditActionEnum } from 'src/shared/constants/audit.constants';

@UseGuards(AllowedRoleGuard([RoleEnum.ADMIN, RoleEnum.MANAGER]))
@Controller('/api')
@ApiBearerAuth()
@ApiTags('Expense')
@AuditModule(AuditModuleEnum.EXPENSE)
export class ExpenseController extends BaseController {
  constructor(private readonly expenseService: ExpenseService) {
    super(new Logger(ExpenseController.name));
  }

  @Get('/expenses')
  @ApiOperation({ summary: 'Get Expenses', operationId: 'expenses' })
  @ApiResponseDecorator({
    status: 200,
    description: 'Returns of expenses',
    type: ApiResponse,
    isArray: true,
  })
  async listExpenses(@Res() res: Response, @CurrentUser() user: User) {
    try {
      const expenses = await this.expenseService.selectExpenses(user.company_id);
      const data = expenses.map((expense) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { company_id, user_id, ...rest } = expense;
        return rest;
      });

      return this.sendApiResponse(res, { error: false, payload: data, count: data.length });
    } catch (error) {
      return this.throwError('Get Expenses', res, error);
    }
  }

  @Get('/expense/:id')
  @ApiOperation({ summary: 'Get Expense', operationId: 'expense' })
  @ApiResponseDecorator({
    status: 200,
    description: 'Returns of expense',
    type: ApiResponse,
    isArray: false,
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the expense record',
    type: Number,
  })
  async detailExpense(@Res() res: Response, @CurrentUser() user: User, @Param('id') expenseId: number) {
    try {
      const expense = await this.expenseService.selectExpense(user.company_id, user.id, expenseId);

      return this.sendApiResponse(res, { error: false, payload: expense });
    } catch (error) {
      return this.throwError('Get Expense', res, new Error('pg: no rows in result set'));
    }
  }

  @Post('/expense')
  @AuditAction(AuditActionEnum.CREATE)
  @ApiOperation({ summary: 'Create Expense', operationId: 'createExpense' })
  @ApiResponseDecorator({
    status: 200,
    description: 'Returns of expense',
    type: ApiResponse,
    isArray: false,
  })
  @UseInterceptors(FileInterceptor('file'))
  async createExpense(
    @Res() res: Response,
    @CurrentUser() currentUser: User,
    @Body() createExpenseDto: CreateExpenseDto,
    @UploadedFile() attachment?: Express.Multer.File,
  ) {
    try {
      // Validate inputs
      if (!createExpenseDto.recipient) {
        throw new BadRequestError('Recipient is required');
      }
      if (!createExpenseDto.payment_ref) {
        throw new BadRequestError('Payment reference is required');
      }
      if (!createExpenseDto.date) {
        throw new BadRequestError('Date is required');
      }
      if (!createExpenseDto.amount) {
        throw new BadRequestError('Amount is required');
      }

      // Handle to create  expense
      await this.expenseService.createExpense(currentUser, createExpenseDto, attachment);

      return this.sendApiResponse(res, { error: false });
    } catch (error) {
      return this.throwError('Create Expense', res, error);
    }
  }

  @Put('/expense/:id')
  @AuditAction(AuditActionEnum.UPDATE)
  @ApiOperation({ summary: 'Update Expense', operationId: 'updateExpense' })
  @ApiResponseDecorator({
    status: 200,
    description: 'Returns of expense',
    type: ApiResponse,
    isArray: false,
  })
  @UseInterceptors(FileInterceptor('file'))
  @ApiParam({
    name: 'id',
    description: 'The ID of the expense record',
    type: Number,
  })
  async updateExpense(
    @Res() res: Response,
    @CurrentUser() currentUser: User,
    @Param('id') expenseId: string,
    @Body() updateExpenseDto: UpdateExpenseDto,
    @UploadedFile() attachment?: Express.Multer.File,
  ) {
    try {
      // Validate inputs
      if (!isNumberString(expenseId)) {
        throw new BadRequestError('Invalid expense id');
      }
      if (!updateExpenseDto.recipient) {
        throw new BadRequestError('Recipient is required');
      }
      if (!updateExpenseDto.payment_ref) {
        throw new BadRequestError('Payment reference is required');
      }
      if (!updateExpenseDto.date) {
        throw new BadRequestError('Date is required');
      }
      if (!updateExpenseDto.amount) {
        throw new BadRequestError('Amount is required');
      }

      // Handle to update expense
      const expenseIdInNumber = parseInt(expenseId);

      await this.expenseService.updateExpense(currentUser, expenseIdInNumber, updateExpenseDto, attachment);

      return this.sendApiResponse(res, { error: false });
    } catch (error) {
      return this.throwError('Update Expense', res, error);
    }
  }

  @Delete('/expense/:id')
  @AuditAction(AuditActionEnum.DELETE)
  @ApiOperation({ summary: 'Delete Expense', operationId: 'deleteExpense' })
  @ApiResponseDecorator({
    status: 200,
    description: 'Returns of expense',
    type: ApiResponse,
    isArray: false,
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the expense record',
    type: Number,
  })
  async deleteExpense(@Res() res: Response, @CurrentUser() user: User, @Param('id') expenseId: number) {
    try {
      await this.expenseService.deleteExpense(user.company_id, user.id, expenseId);

      return this.sendApiResponse(res, { error: false });
    } catch (error) {
      return this.throwError('Delete Expense', res, error);
    }
  }
}
