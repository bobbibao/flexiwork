import { Attachment, Comment, ProductOfProject, Project, Task, TaskState, User } from "@/common/models";
import { IQueryTask, TaskDto, CreateCommentDto } from "../dtos";
import { buildQueryString } from "@/common";
import { Response, PaginatedResponse } from "@/common/dtos";
import { PRODUCT_ENDPOINTS, PROJECT_ENDPOINTS, TASK_ENDPOINTS, USER_ENDPOINTS } from "@/api/endpoints";
import ApiService from "@/api/api.service";
import { AxiosRequestConfig } from "axios";

export class TasksService {
  constructor() {
    ApiService.init();
    ApiService.setHeader();
  }

  async getTask(taskId: number): Promise<Task | undefined> {
    try {
      const apiEndpoint = TASK_ENDPOINTS.GET_TASK(taskId);
      const response = await ApiService.get<Response<Task>>(apiEndpoint);

      if (response.data.error) {
        throw new Error(response.data.message);
      }

      return response.data.payload;
    } catch (error) {
      throw new Error(`[ERROR] GET_TASK: ${error}`);
    }
  }

  async getTasks(query: IQueryTask) {
    try {
      const { filters, page, page_size, search, sort, get_soft_deleted = false } = query;

      const queryString = buildQueryString({ page, page_size, search, sort, filters, get_soft_deleted });
      const apiEndpoint = TASK_ENDPOINTS.GET_TASKS(queryString);

      const response = await ApiService.get<PaginatedResponse<Task>>(apiEndpoint);

      if (response.data.error) {
        throw new Error(response.data.message);
      }

      return response.data.payload;
    } catch (error) {
      throw new Error(`[ERROR] GET_TASKS: ${error}`);
    }
  }

  async getTasksByProject(filters: string[] = [], search: string = "") {
    try {
      const queryString = buildQueryString({ filters, search });
      const apiEndpoint = TASK_ENDPOINTS.GET_TASKS_BY_PROJECT(queryString);

      const response = await ApiService.get<Response<Project[]>>(apiEndpoint);

      if (response.data.error) {
        throw new Error(response.data.message);
      }

      return response.data.payload ?? [];
    } catch (error) {
      throw new Error(`[ERROR] GET_TASKS_BY_PROJECT: ${error}`);
    }
  }

  async getProduct(projectId: number): Promise<ProductOfProject[]> {
    try {
      const apiEndpoint = PRODUCT_ENDPOINTS.GET_PRODUCTS_OF_PROJECT(projectId);

      const response = await ApiService.get<Response<ProductOfProject[]>>(apiEndpoint);

      if (response.data.error) {
        throw new Error(response.data.message);
      }

      return response.data.payload ?? [];
    } catch (error) {
      throw new Error(`[ERROR] GET_PRODUCT_OF_pROJECT: ${error}`);
    }
  }

  async getAssignees(): Promise<User[]> {
    try {
      const apiEndpoint = USER_ENDPOINTS.GET_USERS();

      const response = await ApiService.get<Response<User[]>>(apiEndpoint);

      if (response.data.error) {
        throw new Error(response.data.message);
      }

      return response.data.payload ?? [];
    } catch (error) {
      throw new Error(`[ERROR] GET_ASSIGNEES: ${error}`);
    }
  }

  async getProjects(): Promise<Project[]> {
    try {
      const apiEndpoint = PROJECT_ENDPOINTS.PROJECTS_FOR_CREATE();

      const response = await ApiService.get<PaginatedResponse<Project>>(apiEndpoint);

      if (response.data.error) {
        throw new Error(response.data.message);
      }

      return response.data.payload?.items ?? [];
    } catch (error) {
      throw new Error(`[ERROR] GET_PROJECTS: ${error}`);
    }
  }

  async getTaskStatuses(): Promise<TaskState[]> {
    try {
      const apiEndpoint = TASK_ENDPOINTS.GET_TASKS_STATUSES();

      const response = await ApiService.get<Response<TaskState[]>>(apiEndpoint);

      if (response.data.error) {
        throw new Error(response.data.message);
      }

      return response.data.payload ?? [];
    } catch (error) {
      throw new Error(`[ERROR] GET_TASK_STATUSES: ${error}`);
    }
  }

  async getTaskPriorities(): Promise<TaskState[]> {
    try {
      const apiEndpoint = TASK_ENDPOINTS.GET_TASKS_PRIORITIES();

      const response = await ApiService.get<Response<TaskState[]>>(apiEndpoint);

      if (response.data.error) {
        throw new Error(response.data.message);
      }

      return response.data.payload ?? [];
    } catch (error) {
      throw new Error(`[ERROR] GET_TASK_PRIORITIES: ${error}`);
    }
  }

  async getParentTasks(projectId: number, phaseId: string | number, userId?: number): Promise<Task[]> {
    try {
      const apiEndpoint = TASK_ENDPOINTS.GET_PARENT_TASKS(projectId, phaseId, userId);

      const response = await ApiService.get<Response<Task[]>>(apiEndpoint);

      if (response.data.error) {
        throw new Error(response.data.message);
      }

      return response.data.payload ?? [];
    } catch (error) {
      throw new Error(`[ERROR] GET_PARENT_TASKS: ${error}`);
    }
  }

  async createTask(taskDto: TaskDto): Promise<void> {
    try {
      const apiEndpoint = TASK_ENDPOINTS.CREATE_TASK();

      const response = await ApiService.post<Response<void>>(apiEndpoint, taskDto);

      if (response.data.error) {
        throw new Error(response.data.message);
      }
    } catch (error) {
      throw new Error(`[ERROR] CREATE_TASK: ${error}`);
    }
  }

  async createComment(taskId: string | number, createCommentDto: CreateCommentDto): Promise<Comment | undefined> {
    try {
      const apiEndpoint = TASK_ENDPOINTS.CREATE_COMMENT(taskId);

      const response = await ApiService.post<Response<Comment>>(apiEndpoint, createCommentDto);

      if (response.data.error) {
        throw new Error(response.data.message);
      }

      return response.data.payload;
    } catch (error) {
      throw new Error(`[ERROR] CREATE_COMMENT: ${error}`);
    }
  }

  async updateTask(taskId: string | number, taskDto: TaskDto): Promise<Task | undefined> {
    try {
      const apiEndpoint = TASK_ENDPOINTS.UPDATE_TASK(taskId);

      const response = await ApiService.put<Response<Task>>(apiEndpoint, taskDto);

      if (response.data.error) {
        throw new Error(response.data.message);
      }

      return response.data.payload;
    } catch (error) {
      throw new Error(`[ERROR] UPDATE_TASK: ${error}`);
    }
  }

  async undoTasks(taskIds: number[]): Promise<void> {
    try {
      const apiEndpoint = TASK_ENDPOINTS.UNDO_SOFT_DELETED_TASKS();

      const response = await ApiService.put<Response<void>>(apiEndpoint, { task_ids: taskIds });

      if (response.data.error) {
        throw new Error(response.data.message);
      }

      return response.data.payload;
    } catch (error) {
      throw new Error(`[ERROR] UNDO_TASKS: ${error}`);
    }
  }

  async deleteTask(taskId: string | number): Promise<void> {
    try {
      const apiEndpoint = TASK_ENDPOINTS.DELETE_TASK(taskId);

      const response = await ApiService.delete<Response<void>>(apiEndpoint);

      if (response.data.error) {
        throw new Error(response.data.message);
      }
    } catch (error) {
      throw new Error(`[ERROR] DELETE_TASK: ${error}`);
    }
  }

  async bulkUpdateTasks(taskIds: number[], statusId: number): Promise<Response<void>> {
    try {
      const apiEndpoint = TASK_ENDPOINTS.BULK_UPDATE_TASKS();

      const response = await ApiService.put<Response<void>>(apiEndpoint, {
        ids: taskIds,
        status_id: statusId
      });

      if (response.data.error) {
        throw new Error(response.data.message);
      }

      return response.data;
    } catch (error) {
      throw new Error(`[ERROR] BULK_UPDATE_TASKS: ${error}`);
    }
  }

  async bulkDeleteTasks(taskIds: number[]): Promise<Response<void>> {
    try {
      const apiEndpoint = TASK_ENDPOINTS.BULK_DELETE_TASKS();

      const response = await ApiService.delete<Response<void>>(apiEndpoint, {
        data: {
          ids: taskIds
        }
      });

      if (response.data.error) {
        throw new Error(response.data.message);
      }

      return response.data;
    } catch (error) {
      throw new Error(`[ERROR] BULK_DELETE_TASKS: ${error}`);
    }
  }

  async uploadMultipleFiles(files: File[]): Promise<Response<Attachment[]>> {
    if (files.length === 0) {
      throw new Error("No files to upload.");
    }

    const formData = new FormData();
    files.forEach(file => {
      formData.append("files", file); // 'files' should match the field name expected by your backend API
    });

    try {
      const response = await ApiService.post<Response<Attachment[]>>("files", formData);

      if (response.data.error) {
        throw new Error(response.data.message);
      }

      return response.data;
    } catch (error) {
      throw new Error(`[ERROR] UPLOAD_ATTACHMENTS: ${error}`);
    }
  }

  async downloadAttachment(attachmentId: number) {
    try {
      const config: AxiosRequestConfig = {
        responseType: "blob"
      };
      const apiEndpoint = TASK_ENDPOINTS.DOWNLOAD_ATTACHMENT(attachmentId);
      const response = await ApiService.get(apiEndpoint, config);

      // Create a blob from the response data
      // @ts-ignore
      const blob = new Blob([response.data], { type: response.headers["content-type"] });

      // Create a link element and trigger download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      const contentDisposition = response.headers["content-disposition"];
      const filename = contentDisposition
        ? contentDisposition.split("filename=")[1].replace(/"/g, "")
        : `attachment-${attachmentId}`;

      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();

      // Clean up by revoking the object URL and removing the link element
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch (error) {
      throw new Error(`[ERROR] DOWNLOAD_ATTACHMENT: ${error}`);
    }
  }

  async getSubtasks(taskId: number): Promise<Task[]> {
    try {
      const apiEndpoint = TASK_ENDPOINTS.GET_SUBTASKS(taskId);

      const response = await ApiService.get<Response<Task[]>>(apiEndpoint);

      if (response.data.error) {
        throw new Error(response.data.message);
      }

      return response.data.payload ?? [];
    } catch (error) {
      throw new Error(`[ERROR] GET_SUBTASKS: ${error}`);
    }
  }
}
