import { Task } from "./task.model";
import { User } from "./user.model";

export class TaskAssignee {
  task_id: number;
  user_id: number;
  created_at: Date;
  task: Task;
  user: User;
}
