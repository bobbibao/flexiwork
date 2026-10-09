import Customer from 'src/database/models/customers.model';
import Invoice from 'src/database/models/invoices.model';
import { ProjectDetailDto } from 'src/modules/projects/dto';
import { DetailCost } from 'src/shared/dto/detail-cost.dto';

export class InvoiceDetailDto extends Invoice {
  detail_cost: DetailCost;
  total_amount: number = 0;
  invoiced: number = 0;
  is_connected: boolean = false;
  amount: number = 0;
  remaining: number;
  date: Date | '0001-01-01T00:00:00Z';
  customer: Customer;
  project: ProjectDetailDto;
}
