export interface IQueryPaginate {
  page: number | string;
  page_size: number | string;
  sort?: string;
  search?: string;
  folder?: string;
}
