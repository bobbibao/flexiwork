import ApiService from "@/api/api.service";
import { PRODUCT_ENDPOINTS, TIMESHEET_ENDPOINTS, USER_ENDPOINTS } from "@/api/endpoints";
import { ProductOfProject, Project, User } from "@/common/models";
import { Response } from "@/common/dtos";
import { buildQueryString } from "@/common";
import { FlexHoursDto, IQueryFlexHours, ResponseTimeSheet, CreateWorkItemDto, WorkLogDto, WorkItemDto } from "../dtos";

export class TimesheetsService {
  constructor() {
    ApiService.init();
    ApiService.setHeader();
  }

  async getWorkItems(
    startDate: string = "",
    endDate: string = "",
    filter: string = "",
    search: string = "",
    userId: string = ""
  ) {
    try {
      const apiEndpoint = TIMESHEET_ENDPOINTS.GET_WORK_ITEMS(startDate, endDate, filter, search, userId);
      const response = await ApiService.get<Response<WorkItemDto[]>>(apiEndpoint);

      if (response.data.error) {
        throw new Error(response.data.message);
      }

      return response.data.payload ?? [];
    } catch (error) {
      throw new Error(`[ERROR] GET_TASKS_BY_PRODUCT: ${error}`);
    }
  }

  async getSimpleUsers() {
    try {
      const apiEndpoint = USER_ENDPOINTS.GET_SIMPLE_USERS();
      const response = await ApiService.get<Response<any[]>>(apiEndpoint);

      if (response.data.error) {
        throw new Error(response.data.message);
      }

      return response.data.payload ?? [];
    } catch (error) {
      throw new Error(`[ERROR] GET_SIMPLE_USERS: ${error}`);
    }
  }

  async getFlexHours(query: IQueryFlexHours) {
    try {
      const { user_id, start_date, end_date } = query;
      const queryString = buildQueryString({ user_id, start_date, end_date });
      const apiEndpoint = TIMESHEET_ENDPOINTS.GET_FLEX_HOURS(queryString);

      const response = await ApiService.get<ResponseTimeSheet<FlexHoursDto>>(apiEndpoint);
      if (response.data.error) {
        throw new Error(response.data.message);
      }
      return response.data;
    } catch (error) {
      throw new Error(`[ERROR] GET_FLEX_HOURS: ${error}`);
    }
  }

  async selectUser(id: number) {
    try {
      const apiEndpoint = TIMESHEET_ENDPOINTS.SELECT_USER(id);

      const response = await ApiService.get<Response<User>>(apiEndpoint);
      if (response.data.error) {
        throw new Error(response.data.message);
      }
      return response.data.payload;
    } catch (error) {
      throw new Error(`[ERROR] SELECT_USER: ${error}`);
    }
  }

  async getTimesheetProjects(): Promise<Project[]> {
    try {
      const apiEndpoint = TIMESHEET_ENDPOINTS.GET_TIMESHEET_PROJECTS();

      const response = await ApiService.get<Response<Project[]>>(apiEndpoint);

      if (response.data.error) {
        throw new Error(response.data.message);
      }

      return response.data.payload ?? [];
    } catch (error) {
      throw new Error(`[ERROR] GET_TIMESHEET_PROJECTS: ${error}`);
    }
  }

  async getUnlockUsers(date: string): Promise<User[]> {
    try {
      const queryString = buildQueryString({ date });

      const apiEndpoint = TIMESHEET_ENDPOINTS.GET_UNLOCK_USERS(queryString);

      const response = await ApiService.get<Response<User[]>>(apiEndpoint);

      if (response.data.error) {
        throw new Error(response.data.message);
      }

      return response.data.payload ?? [];
    } catch (error) {
      throw new Error(`[ERROR] GET_TIMESHEET_PROJECTS: ${error}`);
    }
  }

  async getTimesheetProducts(projectId: number): Promise<ProductOfProject[]> {
    try {
      const apiEndpoint = PRODUCT_ENDPOINTS.GET_PRODUCTS_OF_PROJECT(projectId);

      const response = await ApiService.get<Response<ProductOfProject[]>>(apiEndpoint);

      if (response.data.error) {
        throw new Error(response.data.message);
      }

      return response.data.payload ?? [];
    } catch (error) {
      throw new Error(`[ERROR] GET_TIMESHEET_PRODUCTS: ${error}`);
    }
  }

  async unlockReport(confirmed: boolean, date: string, user_ids: number[]) {
    try {
      const apiEndpoint = TIMESHEET_ENDPOINTS.UNLOCK_REPORT();

      const response = await ApiService.post<Response<void>>(apiEndpoint, { confirmed, date, user_ids });

      if (response.data.error) {
        throw new Error(response.data.message);
      }

      return response.data.payload ?? [];
    } catch (error) {
      throw new Error(`[ERROR] UNLOCK_REPORT: ${error}`);
    }
  }

  async lockReport(confirmed: boolean, date: string, user_id: number) {
    try {
      const apiEndpoint = TIMESHEET_ENDPOINTS.LOCK_REPORT();

      const response = await ApiService.post<Response<void>>(apiEndpoint, { confirmed, date, user_id });

      if (response.data.error) {
        throw new Error(response.data.message);
      }

      return response.data.payload ?? [];
    } catch (error) {
      throw new Error(`[ERROR] LOCK_REPORT: ${error}`);
    }
  }

  async addWorkItem(data: CreateWorkItemDto): Promise<void> {
    try {
      const apiEndpoint = TIMESHEET_ENDPOINTS.ADD_WORK_ITEM();

      // Ensure task_ids is always an array, even if empty
      const payload = {
        ...data,
        task_ids: data.task_ids || []
      };

      const response = await ApiService.post<Response<void>>(apiEndpoint, payload);

      if (response.data.error) {
        throw new Error(response.data.message);
      }

      return response.data.payload;
    } catch (error) {
      throw new Error(`[ERROR] ADD_WORK_ITEM: ${error}`);
    }
  }

  async updateWorkLog(data: WorkLogDto) {
    try {
      const apiEndpoint = TIMESHEET_ENDPOINTS.UPDATE_WORK_LOG();
      const response = await ApiService.post<Response<void>>(apiEndpoint, data);

      if (response.data.error) {
        throw new Error(response.data.message);
      }

      return response.data;
    } catch (error) {
      const errorResponse = error as { response?: { data?: { message: string } } };
      return {
        error: true,
        message: errorResponse.response?.data?.message
      };
    }
  }

  async getDisplayWorkItems(userId: number) {
    try {
      const apiEndpoint = TIMESHEET_ENDPOINTS.GET_DISPLAY_WORK_ITEMS(userId);
      const response = await ApiService.get<Response<WorkItemDto[]>>(apiEndpoint);

      if (response.data.error) {
        throw new Error(response.data.message);
      }

      return response.data.payload ?? [];
    } catch (error) {
      throw new Error(`[ERROR] GET_DISPLAY_WORK_ITEMS: ${error}`);
    }
  }

  async updateDisplayWorkItems(ids: number[], userId: number) {
    try {
      const apiEndpoint = TIMESHEET_ENDPOINTS.UPDATE_DISPLAY_WORK_ITEMS();
      const response = await ApiService.post<Response<void>>(apiEndpoint, { ids, user_id: userId });

      if (response.data.error) {
        throw new Error(response.data.message);
      }

      return response.data.payload;
    } catch (error) {
      throw new Error(`[ERROR] UPDATE_DISPLAY_WORK_ITEMS: ${error}`);
    }
  }
}
