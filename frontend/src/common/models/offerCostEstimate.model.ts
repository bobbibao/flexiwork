export interface OfferCostEstimate {
  id: number;
  offer_id: number;
  order: string | null;
  label: string | null;
  value: number | null;
}
