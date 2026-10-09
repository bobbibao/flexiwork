import { Provider } from '@nestjs/common';
import Expense from 'src/database/models/expenses.model';

export const ExpenseProvider: Provider[] = [
  {
    provide: 'EXPENSE_REPOSITORY',
    useValue: Expense,
  },
];
