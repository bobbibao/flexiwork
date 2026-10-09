import { SwitchOption } from "@/components/atoms/button/ButtonSwitch/ButtonSwitch";

export const viewSwitchOptions: SwitchOption[] = [
  {
    label: "By Project",
    value: "byProject",
    selected: true
  },
  {
    label: "List",
    value: "list",
    selected: false
  },
  {
    label: "Soft Deleted",
    value: "softDeleted",
    selected: false
  }
]

export const assigneeSwitchOptions: SwitchOption[] = [
  {
    label: "My Tasks",
    value: "myTasks",
    selected: true
  },
  {
    label: "All Tasks",
    value: "allTasks",
    selected: false
  }
];
