export type TaskDto = {
  project_id: number;

  name: string;

  status_id: number;

  product_id: number;

  priority_id: number;

  assignee_to: number[];

  due_date: string;

  input_data: string;

  output_data: string;

  description: string;

  parent_task_id: number | null;
}

export interface IQueryTask {
  page: number | string;
  page_size: number | string;
  sort?: string;
  filters?: string[];
  search?: string;
  get_soft_deleted?: boolean;
}

export interface ICommentCreate {
  id: number;
  content: string;
  reply_to?: number;
  attachments?: string[];
}
