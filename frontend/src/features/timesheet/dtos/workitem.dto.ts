import { WorkLogDto } from "./worklog.dto";

export interface CreateWorkItemDto {
  project_id: number;
  product_id: number;
  task_ids: number[];
  user_id: number;
}

export interface WorkItemDto {
  id: number;
  product_id: number;
  task: string | null;
  is_hide: boolean;
  created_at: string;
  updated_at: string;
  product: {
    id: number;
    name: string;
  };
  project: {
    id: number;
    name: string;
    status: string;
  };
  tasks: {
    id: number;
    name: string;
    parent_task_id: number | null;
  };
  work_logs: WorkLogDto[];
}
