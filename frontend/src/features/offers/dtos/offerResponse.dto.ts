export interface OfferResponse<T> {
  error: boolean;
  payload?: {
    current_page: number;
    page_size: number;
    total_items: number;
    total_pages: number;
    total_sum_net: number;
    total_sum_gross: number;
    detailedOffers?: T;
  };
  message?: string;
}
