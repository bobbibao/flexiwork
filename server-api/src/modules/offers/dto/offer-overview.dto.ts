import { OfferDetailDto } from '.';

export interface OfferOverViewResponseDto {
  total_items: number;
  total_pages: number;
  current_page: number;
  total_sum_net: number;
  total_sum_gross: number;
  detailedOffers: OfferDetailDto[];
}
