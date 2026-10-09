import { WorkItemDto, WorkLogDto } from "@/features/timesheet/dtos";
import { Project, TaskAssignee, TaskState, User, Comment, ProductOfProject } from ".";

export class Task {
  id: number;
  parent_task_id: number | null;
  project_id: number;
  name: string;
  description: string | null;
  status_id: number;
  priority_id: number;
  product_id: number | null;
  due_date: Date | null;
  input_data: string | null;
  output_data: string | null;
  created_by: number;
  created_at: Date;
  updated_by: number | null;
  updated_at: Date | null;
  deleted_at: Date | null;
  deleted_by: number | null;
  task_assignees: TaskAssignee[];
  comments: Comment[];
  creator: User;
  eraser: User | null;
  task_status: TaskState;
  task_priority: TaskState;
  product: ProductOfProject;
  project: Project;
  sub_tasks: Task[];
  work_logs: WorkLogDto[];
  work_item_id?: number;
  work_items?: WorkItemDto[];
}
