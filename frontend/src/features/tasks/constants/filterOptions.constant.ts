import { TaskState, User } from "@/common/models";
import { SelectOption } from "@/components";

export const defaultAssigneeFilterOption = { label: "Assignee", value: "", selected: true };
export function getAssigneeFilterOptions(
  assignees: User[],
  currentUser: User,
  defaultAssignee: SelectOption
): SelectOption[] {
  return [
    { ...defaultAssignee, selected: false },
    ...assignees.map(assignee => ({
      label: `${assignee.first_name ?? ""} ${assignee.last_name ?? ""}`,
      value: assignee.id.toString(),
      selected: Number(assignee.id) === Number(currentUser.id)
    }))
  ];
}

export const defaultStatusFilterOption = { label: "Status", value: "", selected: true };
export function getStatusFilterOptions(statuses: TaskState[]): SelectOption[] {
  return [
    defaultStatusFilterOption,
    ...statuses.map(status => ({
      label: status.label,
      value: status.id.toString()
    }))
  ];
}

export const defaultPriorityFilterOption = { label: "Priority", value: "", selected: true };
export function getPriorityFilterOptions(priorities: TaskState[], defaultPriority: SelectOption): SelectOption[] {
  return [
    defaultPriority,
    ...priorities.map(priority => ({
      label: priority.label,
      value: priority.id.toString()
    }))
  ];
}
