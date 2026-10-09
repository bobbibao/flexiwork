import { OfferDetail } from "./offerDetail.model";
import { Number } from "./number.model";
import { DetailCost } from "./detailCost.model";
import { Customer } from "./customer.model";

export interface Offer {
  id: number;
  name: string;
  status: string | null;
  created_at: Date | null | "0001-01-01T00:00:00Z";
  updated_at: Date | null | "0001-01-01T00:00:00Z";
  number: Number;
  currency: string;
  detail_cost: DetailCost;
  details?: OfferDetail | null;
  customer: Customer;
}
