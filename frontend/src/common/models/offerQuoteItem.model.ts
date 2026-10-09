import { OfferDetail } from "./offerDetail.model";
import { Product } from "./product.model";

export interface OfferQuoteItem {
  id?: number;
  offer_id: number;
  offerDetail?: OfferDetail;
  product_id: number | null;
  product?: Product;
  name: string | null;
  cost: number;
  type: string | null;
  unit: string | null;
  uuid: string | null;
  price: number | null;
  year: number | null;
  description: string | null;
  amount: number | null;
  quarter: number | null;
  optional: boolean;
  vat_rate: number;
  break_page: boolean;
  is_nk: boolean;
  apply_discount: boolean;
}
