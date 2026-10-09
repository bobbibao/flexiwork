import TaskAssignee from "src/database/models/task-assignee.model";
import Task from "src/database/models/task.model";

export class TaskDetailDto extends Task {
    task_assignees: TaskAssignee[];
}