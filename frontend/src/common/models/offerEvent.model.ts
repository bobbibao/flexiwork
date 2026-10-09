import { OfferDetail } from "./offerDetail.model";

export interface OfferEvent {
  id: number;
  offer_id: number;
  offerDetail?: OfferDetail;
  label: string | null;
  value: string | null;
}
