import { InvoiceType } from "@/features/projects/constants";

export const TASK_ENDPOINTS = {
  GET_TASK: (id: string | number) => `task/${id}`,
  GET_TASKS: (query: string) => `tasks${query}`,
  GET_TASKS_BY_PROJECT: (query: string) => `tasks/by-project${query}`,
  GET_TASKS_STATUSES: () => "tasks/statuses",
  GET_TASKS_PRIORITIES: () => "tasks/priorities",
  GET_PARENT_TASKS: (projectId: number, productId: string | number, userId?: number) =>
    `tasks/parent/${productId}?project_id=${projectId}${userId ? `&user_id=${userId}` : ""}`,
  GET_SUBTASKS: (taskId: string | number) => `tasks/subtasks/${taskId}`,
  CREATE_TASK: () => "task",
  CREATE_COMMENT: (taskId: string | number) => `task/${taskId}/comment`,
  UPDATE_TASK: (taskId: string | number) => `task/${taskId}`,
  DELETE_TASK: (taskId: string | number) => `task/${taskId}`,
  BULK_UPDATE_TASKS: () => "tasks/bulk",
  BULK_DELETE_TASKS: () => "tasks/bulk",
  UNDO_SOFT_DELETED_TASKS: () => "tasks/undo",
  DOWNLOAD_ATTACHMENT: (attachmentId: number) => `task/attachment/${attachmentId}`
};

export const OFFER_ENDPOINTS = {
  GET_OFFER: (offerId: number) => `offer/${offerId}`,
  GET_OFFERS: (query: string) => `offers${query}`,
  CREATE_OFFER: () => "offer",
  UPDATE_OFFER: (offerId: number) => `offer/${offerId}`,
  BULK_DELETE_OFFERS: () => "offers/bulk",
  DELETE_OFFER: (offerId: number) => `offer/${offerId}`,
  COPY_OFFER: (offerId: number) => `offer/${offerId}/copy`,
  GENERATE_PRODUCTS: (type: string) => `generate-products?type=${type}`,
  ACCEPT_OFFER: (offerId: number) => `offer/${offerId}/accept`,
  TOGGLE_OFFER_STATUS: (offerId: number) => `offer/${offerId}/toggle`
};

export const SETTING_ENDPOINTS = {
  GET_SETTING: (query?: string) => "setting"
};

export const PROJECT_ENDPOINTS = {
  PROJECTS_FOR_CREATE: () => `projects?status=active&for_selector=true`,
  GET_PROJECTS: (query: string = "") => `projects${query}`,
  GET_PROJECT: (id: number) => `project/${id}`,
  CREATE_PROJECT: () => `project`,
  UPDATE_PROJECT: (id: number) => `project/${id}`,
  COPY_PROJECT: (id: number) => `project/${id}/copy`,
  COPY_PROJECT_AS_OFFER: (id: number) => `project/${id}/copy-as-offer`,
  DELETE_PROJECT: (id: number) => `project/${id}`,
  GET_PROJECT_STATS: () => `projects/stats`,
  GENERATE_INVOICE: (id: number, type: InvoiceType) => {
    let slug: string = "";
    switch (type) {
      case InvoiceType.PERCENT:
        slug = "invoice";
        break;
      case InvoiceType.HOUR:
        slug = "hour-invoice";
        break;
      case InvoiceType.SERVICE:
        slug = "service-invoice";
        break;
      default:
        throw new Error("Invalid invoice type. Valid types are: 'percent', 'hour', 'service'!");
    }
    return `project/${id}/${slug}`;
  },
  BULK_DELETE_PROJECTS: () => `projects/bulk`,
  BULK_UPDATE_PROJECTS_STATUS: () => `projects/status`,
  GET_PROJECTS_WITH_HOUR: (id: number, date: string) => `report/project-with-hours/${id}?date=${date}`,
  GET_TRACK_PROJECTS: () => `timesheet/projects`,
  GET_CONNECTIONS: () => `company/shares`,
  GET_CONNECT_PROJECTS: (id: number) => `projects?company_id=${id}`,
  CONNECT_PROJECT: (id: number) => `project/${id}/pull`,
  FILTER_PROJECT: (query: string) => `projects${query}`,
  GET_PROJECT_SERVICES: (projectId: number) => `project/${projectId}/services`,
  GET_PROJECT_FROM_BEGINNING: (projectId: number) => `project/${projectId}/begin`,
  GET_PROJECT_CONNECTION_LIST: (projectId: number) => `project/${projectId}/pull/list`,
  GET_PROJECT_EFFORT: (projectId: number) => `project/${projectId}/hours`,
  GET_PROJECT_CONNECTION_SHARES: (projectId: number) => `project/${projectId}/shares`
};

export const PRODUCT_ENDPOINTS = {
  GET_PRODUCTS_OF_PROJECT: (projectId: number) => `products/project/${projectId}`,
  GET_PRODUCTS: (query: string) => `products${query}`,
  GET_PRODUCTS_GROUPS: (query: string) => `groups${query}`
};

export const USER_ENDPOINTS = {
  GET_USERS: () => `users`,
  GET_SIMPLE_USERS: () => `simple-users`
};

export const TIMESHEET_ENDPOINTS = {
  GET_WORK_ITEMS: (startDate: string, endDate: string, filter: string, search: string, user_id: string) =>
    `timesheet/workitems?start_date=${startDate}&end_date=${endDate}&filter=${filter}&search=${search}&user_id=${user_id}`,
  GET_DISPLAY_WORK_ITEMS: (userId: number) => `timesheet/workitems/list?user_id=${userId}`,
  GET_TIMESHEET_PROJECTS: () => `timesheet/projects`,
  GET_TIMESHEET_PRODUCTS: () => `timesheet/product`,
  GET_TIMESHEET_TASKS: (productId: number) => `timesheet/product/${productId}/tasks`,
  GET_FLEX_HOURS: (query: string) => `timesheet/workitems/flexhours${query}`,
  SELECT_USER: (id: number) => `user/${id}`,
  GET_UNLOCK_USERS: (query: string) => `timesheet/user-locked-list${query}`,
  UNLOCK_REPORT: () => `timesheet/unlock`,
  LOCK_REPORT: () => `timesheet/lock`,
  ADD_WORK_ITEM: () => `timesheet/workitem`,
  UPDATE_WORK_LOG: () => `timesheet/worklog`,
  UPDATE_DISPLAY_WORK_ITEMS: () => `timesheet/workitems/show`
};
