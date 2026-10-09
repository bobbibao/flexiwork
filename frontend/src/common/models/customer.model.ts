import { CustomerDetail } from "./customerDetail.model";

export class Customer {
  id: number;
  first_name: string;
  last_name: string;
  company: string;
  email: string;
  phone: string;
  details: CustomerDetail;
  created_at: Date;
  updated_at: Date;
}
