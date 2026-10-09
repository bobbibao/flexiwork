import { TaskDto } from "../dtos";

export function validateForm(form: TaskDto, toastMsg: any, 
  isSubTask: boolean = false): boolean {
  if (!form.project_id || form.project_id === 0) {
    toastMsg("Please select a project", "error");
    return false;
  }
  if (!form.product_id || form.product_id === 0) {
    toastMsg("Please select a Product / service", "error");
    return false;
  }
  if(isSubTask && (!form.parent_task_id)) {
    toastMsg("Please select a parent task", "error");
    return false;
  }
  if (!form.name || form.name.trim() === "") {
    toastMsg("Please enter a task name.", "error");
    return false;
  } else if (form.name.trim().length > 255) {
    toastMsg("Task name is too long", "error");
    return false;
  }
  if (!form.status_id || form.status_id === 0) {
    toastMsg("Please select a status.", "error");
    return false;
  }
  if (!form.priority_id || form.priority_id === 0) {
    toastMsg("Please select a priority.", "error");
    return false;
  }
  if (form.assignee_to.length === 0) {
    toastMsg("Please select at least one assignee.", "error");
    return false;
  }
  if (!form.due_date || form.due_date.trim() === "") {
    toastMsg("Please select a due date.", "error");
    return false;
  }
  if (!form.description || form.description.trim() === "") {
    toastMsg("Please enter a description.", "error");
    return false;
  } else if (form.description.trim().length > 255) {
    toastMsg("Description is too long", "error");
    return false;
  }
  return true;
}
