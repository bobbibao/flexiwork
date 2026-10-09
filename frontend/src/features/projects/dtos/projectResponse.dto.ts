export interface ProjectResponse<T> {
  error: boolean;
  payload?: {
    current_page: number;
    page_size: number;
    total_items: number;
    total_pages: number;
    total_sum_net: number;
    total_sum_gross: number;
    items?: T;
  };
  message?: string;
}
