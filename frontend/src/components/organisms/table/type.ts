export interface ITableField {
  key: string;
  label?: string;
  headerTitle?: string;
  headerAbbr?: string;
  class?: string | string[];
  formatter?: string | Function;
  sortable?: boolean;
  sortKey?: string;
  sortDirection?: string;
  sortByFormatted?: boolean | Function;
  filterByFormatted?: boolean | Function;
  tdClass?: string | string[] | Function;
  thClass?: string | string[];
  thStyle?: object;
  variant?: string;
  tdAttr?: object | Function;
  thAttr?: object | Function;
  isRowHeader?: boolean;
  stickyColumn?: boolean;
}

export interface ITablePagination {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export interface ITableDefaultFunctions {
  clearSelected: () => void;
  selectAllRows: () => void;
}
