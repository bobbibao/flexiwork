export interface Response<T> {
  error: boolean;
  payload?: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  error: boolean;
  payload?: {
    current_page: number;
    items: T[];
    page_size: number;
    total_items: number;
    total_pages: number;
  };
  message?: string;
}
