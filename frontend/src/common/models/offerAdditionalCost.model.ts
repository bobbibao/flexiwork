import { OfferDetail } from "./offerDetail.model";

export interface OfferAdditionalCost {
  id: number;
  offer_id: number;
  offerDetail?: OfferDetail;
  label: string | null;
  value: number | null;
  is_active: boolean;
}
