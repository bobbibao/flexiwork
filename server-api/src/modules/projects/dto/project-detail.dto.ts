import Company from 'src/database/models/companies.model';
import Customer from 'src/database/models/customers.model';
import NumberEntry from 'src/database/models/numbers.model';
import Offer from 'src/database/models/offers.model';
import Project from 'src/database/models/projects.model';
import { InvoiceDetailDto } from 'src/modules/invoices/dto';
import { ProjectDetailCost } from './project-detail-cost.dto';

export class ProjectDetailDto extends Project {
  detail_cost: ProjectDetailCost;
  endOn: Date;
  total_amount: number;
  total_amount_gross: number;
  invoiced: number;
  invoiced_gross: number;
  remaining: number;
  remaining_gross: number;
  total_hours: number;
  logged_hours: number;
  is_connected: boolean;
  amount: number;
  date: Date | '0001-01-01T00:00:00Z';
  invoice_type: string;
  invoices: InvoiceDetailDto[];
  number: NumberEntry;
  customer: Customer;
  offer: Offer;
  company: Company;
}
