import { Injectable, Inject } from '@nestjs/common';
import Expense from 'src/database/models/expenses.model';
import DateFormatter from 'src/shared/utils/date-utils';
import { BadRequestError, NotFoundError, saveUploadFile } from 'src/shared/utils';
import { ConfigService } from '@nestjs/config';
import User from 'src/database/models/users.model';
import { CreateExpenseDto, UpdateExpenseDto } from '../dto';

@Injectable()
export class ExpenseService {
  private readonly UPLOADS_API_PATH: string;

  constructor(
    @Inject('EXPENSE_REPOSITORY')
    private readonly expenseRepository: typeof Expense,
    private readonly configService: ConfigService,
  ) {
    this.UPLOADS_API_PATH = this.configService.get<string>('UPLOADS_API_PATH', 'api/uploads');
  }

  async selectExpenses(companyId: number): Promise<Expense[]> {
    const expenses = await Expense.findAll({
      where: {
        company_id: companyId,
        deleted_at: null,
      },
      raw: true,
    });
    if (!expenses) {
      throw new NotFoundError(`Expenses not found for company_id: ${companyId}`);
    }

    const data = expenses.map((expense) => DateFormatter.formatDTO(expense));

    return data;
  }

  async selectExpense(companyId: number, userId: number, expenseId: number): Promise<Expense> {
    const expense = await Expense.findOne({
      where: {
        id: expenseId,
        user_id: userId,
        company_id: companyId,
        deleted_at: null,
      },
      raw: true,
    });
    if (!expense) {
      return null;
    }

    return DateFormatter.formatDTO(expense);
  }

  async createExpense(
    currentUser: User,
    createExpenseDto: CreateExpenseDto,
    attachment?: Express.Multer.File,
  ): Promise<Expense> {
    const { amount, ...metadata } = createExpenseDto;

    // Handle to save attachment
    let attachmentPath: string | null = null;
    if (attachment) {
      const dateTime = (new Date().getTime() / 1000).toFixed(0);
      const savedAttachment = saveUploadFile(
        attachment,
        `${currentUser.company_id}-expense-${currentUser.id}-${dateTime}-`,
      );
      attachmentPath = `${this.UPLOADS_API_PATH}/${savedAttachment}`;
    }

    // Create new expense
    const newExpense = await this.expenseRepository.create({
      company_id: currentUser.company_id,
      user_id: currentUser.id,
      metadata,
      amount,
      ref_url: attachmentPath,
      created_at: new Date(),
    });

    return newExpense;
  }

  async updateExpense(
    currentUser: User,
    expenseId: number,
    updateExpenseDto: UpdateExpenseDto,
    attachment?: Express.Multer.File,
  ): Promise<Expense> {
    const { amount, ...metadata } = updateExpenseDto;

    // Find existing expense
    const existingExpense = await this.expenseRepository.findOne({
      where: {
        id: expenseId,
        deleted_at: null,
      },
    });
    if (!existingExpense) {
      throw new NotFoundError('Expense not found');
    }

    // Handle to save attachment
    let attachmentPath: string | null = null;
    if (attachment) {
      const dateTime = (new Date().getTime() / 1000).toFixed(0);
      const savedAttachment = saveUploadFile(
        attachment,
        `${currentUser.company_id}-expense-${currentUser.id}-${dateTime}-`,
      );
      attachmentPath = `${this.UPLOADS_API_PATH}/${savedAttachment}`;
    }

    // Handle to update expense
    existingExpense.amount = amount;
    existingExpense.metadata = metadata;
    attachmentPath && (existingExpense.ref_url = attachmentPath);
    existingExpense.updated_at = new Date();

    return await existingExpense.save();
  }

  async deleteExpense(companyId: number, userId: number, expenseId: number): Promise<boolean> {
    const expense = await this.selectExpense(companyId, userId, expenseId);
    if (!expense) {
      throw new NotFoundError(`Expense not found for company_id: ${companyId} and expense_id: ${expenseId}`);
    }
    if (expense.deleted_at && expense.deleted_by) {
      throw new BadRequestError(`Expense already deleted for company_id: ${companyId} and expense_id: ${expenseId}`);
    }

    const [affectedCount] = await this.expenseRepository.update(
      { deleted_at: new Date(), deleted_by: userId },
      {
        where: { id: expenseId, company_id: companyId, user_id: userId },
      },
    );
    if (affectedCount === 0) {
      throw new BadRequestError(`Expense not deleted for company_id: ${companyId} and user_id: ${userId}`);
    }

    return true;
  }
}
