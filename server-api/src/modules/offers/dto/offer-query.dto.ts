export interface QueryPaginateDto {
  page?: number;
  pageSize?: number;
  applyPagination?: boolean;
  sort?: string;
  search?: string;
}
