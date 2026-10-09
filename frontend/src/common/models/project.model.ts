import { ProductOfProject, Task, User, Number as NumberModel } from ".";
import { Customer } from "./customer.model";
import { DetailCost } from "./detailCost.model";

export interface Details {
  internal_desc_custom: string | null;
  location: string | null;
  only_my_company: boolean;
}
export class Project {
  id: number;
  name: string | null;
  title: string | null;
  status: string | null;
  company_id: number | null;
  //   company: Company;
  customer: Customer;
  assignee_id: number | null;
  assignee: User;
  offer_id: number | null;
  //   offer: Offer;
  number_id: number | null;
  number: NumberModel;
  end_on: Date | null;
  created_at: Date | null | "0001-01-01T00:00:00Z";
  updated_at: Date | null | "0001-01-01T00:00:00Z";
  deleted_at: Date | null;
  is_internal: boolean;
  deleted_by: number | null;
  remaining: number | null;
  remaining_gross: number | null;
  invoiced: number | null;
  invoiced_gross: number | null;
  detail_cost: DetailCost;
  details: Details;
  total_amount_gross: number | null;
  total_hours: number | null;
  logged_hours: number | null;
  tasks: Task[];
  products: ProductOfProject[];
}
