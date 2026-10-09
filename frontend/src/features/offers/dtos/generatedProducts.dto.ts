import { OfferQuoteItem } from "@/common/models/offerQuoteItem.model";

export interface IGeneratedProducts {
  error: boolean;
  quote_items?: OfferQuoteItem[];
  offer_desc?: string;
  p?: number;
  tm?: number;
  discount_percent?: number;
  message?: string;
}
