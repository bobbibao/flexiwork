export interface ProductResponse<T> {
  current_page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
  payload?: T[];
  payload_group?: any;
  group?: any;
  error: boolean;
  message?: string;
  count: number;
}
