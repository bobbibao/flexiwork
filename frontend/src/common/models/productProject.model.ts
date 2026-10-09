import { WorkLogDto } from "@/features/timesheet/dtos";
import { Task } from "./task.model";

export class ProductOfProject {
  id: number;
  name: string;
  tasks: Task[];
  work_logs?: WorkLogDto[];
  work_item_id?: number;
}
