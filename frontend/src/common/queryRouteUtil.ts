export enum ERouteQueryParams {
  PAGE = "page",
  PAGE_SIZE = "page_size",
  SORT = "sort",
  SEARCH = "search",
  ASSIGNEE_TASK = "assignee_task",
  STATUS = "status",
  PRIORITY = "priority",
  IS_FILTER = "f"
}

type QueryParamValue = string | number | boolean | null | undefined;
type QueryParams = { [key: string]: QueryParamValue | QueryParamValue[] };

export interface PaginatedResponse<T> {
  items: T[];
  total_items: number;
  total_pages: number;
  current_page: number;
  page_size: number;
}

export function buildQueryString(params: QueryParams): string {
  const query = Object.entries(params)
    .flatMap(([key, value]) => {
      if (Array.isArray(value)) {
        return value
          .filter(v => v !== undefined && v !== null && v !== "")
          .map(v => `${encodeURIComponent(key)}=${String(v)}`);
      } else if (value !== undefined && value !== null) {
        return `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`;
      }
      return [];
    })
    .join("&");

  return query ? `?${query}` : "";
}

export function updateQueryParameter(key: ERouteQueryParams, value: string | number): void {
  const url = new URL(window.location.href);
  const searchParams = new URLSearchParams(url.hash.split("?")[1]);

  // Set the new value
  searchParams.set(key, value.toString());

  // Construct the new URL
  const baseUrl = `${url.origin}${url.pathname}${url.hash.split("?")[0]}`;
  const queryString = searchParams.toString();
  const newUrl = `${baseUrl}?${queryString}`;

  // Update the browser's history
  window.history.pushState({}, "", newUrl);
}

export function removeQueryParameter(key: ERouteQueryParams): void {
  const url = new URL(window.location.href);
  const searchParams = new URLSearchParams(url.hash.split("?")[1]);

  // Remove the key
  searchParams.delete(key);

  // Construct the new URL
  const baseUrl = `${url.origin}${url.pathname}${url.hash.split("?")[0]}`;
  const queryString = searchParams.toString();

  const newUrl = queryString === "" ? baseUrl : `${baseUrl}?${queryString}`;

  // Update the browser's history
  window.history.pushState({}, "", newUrl);
}

export function getQueryParameter(key: ERouteQueryParams): string | null {
  const url = new URL(window.location.href);
  const searchParams = new URLSearchParams(url.hash.split("?")[1]);

  return searchParams.get(key);
}
