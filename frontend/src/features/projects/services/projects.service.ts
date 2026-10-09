import ApiService from "@/api/api.service";
import { PROJECT_ENDPOINTS, USER_ENDPOINTS } from "@/api/endpoints";
import { buildQueryString } from "@/common";
import { Response } from "@/common/dtos";
import { Project, User, Customer } from "@/common/models";
import { IProject, CreateProjectDto, IProjectStats, ProjectResponse, IQueryProject } from "../dtos";
import { InvoiceType } from "../constants";

export class ProjectService {
  constructor() {
    ApiService.init();
    ApiService.setHeader();
  }

  async getProjects(query: IQueryProject) {
    try {
      const { page, page_size, search, status, sort } = query;
      const queryString = buildQueryString({ status, page, page_size, search, sort });
      const apiEndpoint = PROJECT_ENDPOINTS.GET_PROJECTS(queryString);

      const response = await ApiService.get<ProjectResponse<Project[]>>(apiEndpoint);
      if (response.data.error) {
        throw new Error(response.data.message);
      }
      return response.data.payload;
    } catch (error) {
      throw new Error(`[ERROR] GET_OFFER: ${error}`);
    }
  }

  async getProjectStats() {
    try {
      const apiEndpoint = PROJECT_ENDPOINTS.GET_PROJECT_STATS();

      const response = await ApiService.get<Response<IProjectStats>>(apiEndpoint);
      if (response.data.error) {
        throw new Error(response.data.message);
      }
      return response.data.payload;
    } catch (error) {
      throw new Error(`[ERROR] GET_OFFER: ${error}`);
    }
  }

  async getProject(id: number): Promise<IProject | undefined> {
    try {
      const apiEndpoint = PROJECT_ENDPOINTS.GET_PROJECT(id);

      const response = await ApiService.get<Response<IProject>>(apiEndpoint);
      if (response.data.error) {
        throw new Error(response.data.message);
      }
      return response.data.payload;
    } catch (error) {
      throw new Error(`[ERROR] GET_PROJECT: ${error}`);
    }
  }

  async createProject(data: CreateProjectDto): Promise<IProject | undefined> {
    try {
      const apiEndpoint = PROJECT_ENDPOINTS.CREATE_PROJECT();

      const response = await ApiService.post<Response<IProject>>(apiEndpoint, data);
      if (response.data.error) {
        throw new Error(response.data.message);
      }
      return response.data.payload;
    } catch (error) {
      throw new Error(`[ERROR] CREATE_PROJECT: ${error}`);
    }
  }

  async updateProject(id: number, data: CreateProjectDto): Promise<IProject | undefined> {
    try {
      const apiEndpoint = PROJECT_ENDPOINTS.UPDATE_PROJECT(id);

      const response = await ApiService.put<Response<IProject>>(apiEndpoint, data);
      if (response.data.error) {
        throw new Error(response.data.message);
      }
      return response.data.payload;
    } catch (error) {
      throw new Error(`[ERROR] UPDATE_PROJECT: ${error}`);
    }
  }

  async deleteProject(id: number): Promise<{ success: boolean }> {
    try {
      const apiEndpoint = PROJECT_ENDPOINTS.DELETE_PROJECT(id);

      const response = await ApiService.delete<Response<any>>(apiEndpoint);
      if (response.data.error) {
        throw new Error(response.data.message);
      }
      return { success: true };
    } catch (error) {
      throw new Error(`[ERROR] DELETE_PROJECT: ${error}`);
    }
  }

  async bulkDeleteProject(projectIds: number[]): Promise<Response<void>> {
    try {
      const apiEndpoint = PROJECT_ENDPOINTS.BULK_DELETE_PROJECTS();

      const response = await ApiService.delete<Response<void>>(apiEndpoint, {
        data: {
          ids: projectIds
        }
      });
      if (response.data.error) {
        throw new Error(response.data.message);
      }
      return response.data;
    } catch (error) {
      throw new Error(`[ERROR] BULK_DELETE_PROJECTS: ${error}`);
    }
  }

  async getProjectsWithHour(id: number, date: string): Promise<any> {
    try {
      const apiEndpoint = PROJECT_ENDPOINTS.GET_PROJECTS_WITH_HOUR(id, date);

      const response = await ApiService.get<Response<any>>(apiEndpoint);
      if (response.data.error) {
        throw new Error(response.data.message);
      }
      return response.data.payload;
    } catch (error) {
      throw new Error(`[ERROR] GET_PROJECTS_WITH_HOUR: ${error}`);
    }
  }

  async getTrackProjects(): Promise<any[]> {
    try {
      const apiEndpoint = PROJECT_ENDPOINTS.GET_TRACK_PROJECTS();

      const response = await ApiService.get<Response<any[]>>(apiEndpoint);
      if (response.data.error) {
        throw new Error(response.data.message);
      }
      return response.data.payload || [];
    } catch (error) {
      throw new Error(`[ERROR] GET_TRACK_PROJECTS: ${error}`);
    }
  }
  async copyProject(id: number): Promise<{ success: boolean }> {
    try {
      const apiEndpoint = PROJECT_ENDPOINTS.COPY_PROJECT(id);

      const response = await ApiService.post<Response<any>>(apiEndpoint);
      if (response.data.error) {
        throw new Error(response.data.message);
      }
      return { success: true };
    } catch (error) {
      throw new Error(`[ERROR] COPY_PROJECT: ${error}`);
    }
  }

  async bulkPrintProject(projectIds: number[]) {
    try {
      const ID_TOKEN_KEY = "access_token";
      const getToken = localStorage.getItem(ID_TOKEN_KEY);
      projectIds.forEach(projectId => {
        window.open(`/api/export/preview?id=${projectId}&type=project&code=${getToken}`);
      });
    } catch (error) {
      throw new Error(`[ERROR] PRINT_PROJECT: ${error}`);
    }
  }

  async copyProjectAsOffer(id: number): Promise<{ success: boolean }> {
    try {
      const apiEndpoint = PROJECT_ENDPOINTS.COPY_PROJECT_AS_OFFER(id);

      const response = await ApiService.post<Response<any>>(apiEndpoint);
      if (response.data.error) {
        throw new Error(response.data.message);
      }
      return { success: true };
    } catch (error) {
      throw new Error(`[ERROR] COPY_PROJECT_AS_OFFER: ${error}`);
    }
  }

  async printProject(id: number, type: string = "pdf", preview: boolean = false): Promise<void> {
    try {
      const ID_TOKEN_KEY = "access_token";
      const getToken = localStorage.getItem(ID_TOKEN_KEY);
      const url = `/api/export/preview?id=${id}&type=project&file_type=${type}&code=${getToken}&preview=${preview}`;
      window.open(url, "_blank");
    } catch (error) {
      throw new Error(`[ERROR] PRINT_PROJECT: ${error}`);
    }
  }

  async getCompany(): Promise<any> {
    try {
      const response = await ApiService.get<Response<any>>("company");
      if (response.data.error) {
        throw new Error(response.data.message);
      }
      return response.data.payload || {};
    } catch (error) {
      throw new Error(`[ERROR] GET_COMPANY: ${error}`);
    }
  }

  async getCustomers(): Promise<Customer[]> {
    try {
      const response = await ApiService.get<Response<Customer[]>>("customers");
      if (response.data.error) {
        throw new Error(response.data.message);
      }
      return response.data.payload || [];
    } catch (error) {
      throw new Error(`[ERROR] GET_CUSTOMERS: ${error}`);
    }
  }

  async getUsers(): Promise<any[]> {
    try {
      const apiEndpoint = USER_ENDPOINTS.GET_USERS();

      const response = await ApiService.get<Response<User[]>>(apiEndpoint);
      if (response.data.error) {
        throw new Error(response.data.message);
      }
      return response.data.payload || [];
    } catch (error) {
      throw new Error(`[ERROR] GET_USERS: ${error}`);
    }
  }

  async getSettings(): Promise<any> {
    try {
      const response = await ApiService.get<Response<any>>("setting");
      if (response.data.error) {
        throw new Error(response.data.message);
      }
      return response.data.payload || {};
    } catch (error) {
      throw new Error(`[ERROR] GET_SETTINGS: ${error}`);
    }
  }

  async getConnections(): Promise<any[]> {
    try {
      const apiEndpoint = PROJECT_ENDPOINTS.GET_CONNECTIONS();

      const response = await ApiService.get<Response<any[]>>(apiEndpoint);
      if (response.data.error) {
        throw new Error(response.data.message);
      }
      return response.data.payload || [];
    } catch (error) {
      throw new Error(`[ERROR] GET_CONNECTIONS: ${error}`);
    }
  }

  async getConnectProjects(id: number): Promise<any[]> {
    try {
      const apiEndpoint = PROJECT_ENDPOINTS.GET_CONNECT_PROJECTS(id);

      const response = await ApiService.get<ProjectResponse<any[]>>(apiEndpoint);
      if (response.data.error) {
        throw new Error(response.data.message);
      }
      return response.data.payload?.items || [];
    } catch (error) {
      throw new Error(`[ERROR] GET_CONNECT_PROJECTS: ${error}`);
    }
  }

  async getProjectConnectionList(id: number): Promise<any[]> {
    try {
      const apiEndpoint = PROJECT_ENDPOINTS.GET_PROJECT_CONNECTION_LIST(id);
      const response = await ApiService.get<Response<any[]>>(apiEndpoint);
      if (response.data.error) {
        throw new Error(response.data.message);
      }
      return response.data.payload || [];
    } catch (error) {
      throw new Error(`[ERROR] GET_PROJECT_CONNECTION_LIST: ${error}`);
    }
  }

  async connectProject(id: number, data: any): Promise<any> {
    try {
      const apiEndpoint = PROJECT_ENDPOINTS.CONNECT_PROJECT(id);
      const response = await ApiService.post<Response<any>>(apiEndpoint, data);
      if (response.data.error) {
        throw new Error(response.data.message);
      }
      return response.data.payload || {};
    } catch (error) {
      throw new Error(`[ERROR] CONNECT_PROJECT: ${error}`);
    }
  }

  async filterProject(query: string): Promise<any[]> {
    try {
      const apiEndpoint = PROJECT_ENDPOINTS.FILTER_PROJECT(query);
      const response = await ApiService.get<Response<any[]>>(apiEndpoint);
      if (response.data.error) {
        throw new Error(response.data.message);
      }
      return response.data.payload || [];
    } catch (error) {
      throw new Error(`[ERROR] FILTER_PROJECT: ${error}`);
    }
  }
  async getProjectServices(projectId: number) {
    try {
      const response = await ApiService.get<any>(PROJECT_ENDPOINTS.GET_PROJECT_SERVICES(projectId));

      if (response.data.error) {
        throw new Error(response.data.message);
      }

      return response.data.payload;
    } catch (error) {
      throw new Error(`[ERROR] GET_PROJECT_SERVICES: ${error}`);
    }
  }

  async getProjectBegin(projectId: number) {
    try {
      const response = await ApiService.get<any>(PROJECT_ENDPOINTS.GET_PROJECT_FROM_BEGINNING(projectId));

      if (response.data.error) {
        throw new Error(response.data.message);
      }

      return response.data.payload;
    } catch (error) {
      throw new Error(`[ERROR] GET_PROJECT_BEGIN: ${error}`);
    }
  }

  async getProjectEffortByCompany(
    projectId: number,
    startDate: string,
    endDate: string,
    companyId: number,
    allEffort: boolean
  ) {
    try {
      const filter: Record<string, string | number> = {
        company_id: companyId
      };
      if (!allEffort) {
        filter.start_date = startDate;
        filter.end_date = endDate;
      }
      const queryString = Object.entries(filter)
        .map(([key, value]) => `${key}=${value}`)
        .join("&");
      const apiEndpoint = PROJECT_ENDPOINTS.GET_PROJECT_EFFORT(projectId);
      const response = await ApiService.get<any>(apiEndpoint + (queryString ? `?${queryString}` : ""));

      if (response.data.error) {
        throw new Error(response.data.message);
      }

      return response.data.payload;
    } catch (error) {
      throw new Error(`[ERROR] GET_PROJECT_EFFORT_BY_COMPANY: ${error}`);
    }
  }

  async getProjectEffort(projectId: number, startDate: string, endDate: string, allEffort: boolean) {
    try {
      const filter: Record<string, string | number> = {};
      if (!allEffort) {
        filter.start_date = startDate;
        filter.end_date = endDate;
      }
      const queryString: string = Object.entries(filter)
        .map(([key, value]) => `${key}=${value}`)
        .join("&");
      const apiEndpoint = PROJECT_ENDPOINTS.GET_PROJECT_EFFORT(projectId);
      const response = await ApiService.get<any>(apiEndpoint + (queryString ? `?${queryString}` : ""));

      if (response.data.error) {
        throw new Error(response.data.message);
      }

      return response.data.payload;
    } catch (error) {
      throw new Error(`[ERROR] GET_PROJECT_EFFORT: ${error}`);
    }
  }

  async getProjectConnectionShares(projectId: number) {
    try {
      const response = await ApiService.get<any>(PROJECT_ENDPOINTS.GET_PROJECT_CONNECTION_SHARES(projectId));

      if (response.data.error) {
        throw new Error(response.data.message);
      }

      return response.data.payload;
    } catch (error) {
      throw new Error(`[ERROR] GET_PROJECT_CONNECTION_SHARES: ${error}`);
    }
  }

  async generateInvoice(projectId: number, type: InvoiceType, invoiceData: any) {
    try {
      const apiEndpoint = PROJECT_ENDPOINTS.GENERATE_INVOICE(projectId, type);
      const response = await ApiService.post<Response<any>>(apiEndpoint, invoiceData);

      if (response.data.error) {
        throw new Error(response.data.message);
      }

      return {
        invoice_id: response.data.payload.invoice_id,
        success: true
      };
    } catch (error) {
      throw new Error(`[ERROR] GENERATE_INVOICE: ${error}`);
    }
  }

  async bulkUpdateProjectStatus(projectIds: number[], statusId: string): Promise<void> {
    try {
      const apiEndpoint = PROJECT_ENDPOINTS.BULK_UPDATE_PROJECTS_STATUS();
      const response = await ApiService.put<Response<any>>(apiEndpoint, {
        ids: projectIds,
        status: statusId
      });
      if (response.data.error) {
        throw new Error(response.data.message);
      }
    } catch (error) {
      throw new Error(`[ERROR] BULK_UPDATE_PROJECTS_STATUS: ${error}`);
    }
  }
}
