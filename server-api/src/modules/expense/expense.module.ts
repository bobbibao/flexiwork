import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { ExpenseController } from './controllers/expense.controller';
import { ExpenseService } from './services/expense.service';
import { ExpenseProvider } from './expense.provider';

@Module({
  imports: [DatabaseModule],
  controllers: [ExpenseController],
  providers: [ExpenseService, ...ExpenseProvider],
})
export class ExpenseModule {}
