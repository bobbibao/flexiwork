import { formatDate, PaginatedResponse, truncateByWords, countWordsInText, truncateByLength } from "@/common";
import { Task, TaskAssignee, User } from "@/common/models";
import {
  Avatar,
  ButtonCustom,
  ConfirmModal,
  ITableDefaultFunctions,
  ITableField,
  ITablePagination,
  SeverityBadge,
  SortIcon,
  TableDefault
} from "@/components";
import { defineComponent, PropType, ref, Ref } from "vue";
import AssigneeAvatars from "../AssigneeAvatars/AssigneeAvatars";

export interface ITaskItem {
  id: number | string;
  project: string;
  taskName: string;
  status: {
    title: string;
    color: string;
  };
  description: string;
  product: string;
  dueDate: Date | null;
  priority: {
    title: string;
    color: string;
  };
  assignees: TaskAssignee[];
  inputData: string;
  outputData: string;
  createdBy: User;
  createdTime: Date | null;
  deletedBy: User | null;
  deletedTime: Date | null;
}

export default defineComponent({
  name: "TableTasksByDeletedAt",
  components: {
    Avatar,
    AssigneeAvatars,
    SeverityBadge,
    ConfirmModal,
    TableDefault,
    ButtonCustom,
    SortIcon
  },
  props: {
    tasksData: {
      type: Object as PropType<PaginatedResponse<Task>>,
      default: () => ({}),
      required: true
    },
    selectedTasks: {
      type: Array as PropType<number[]>,
      default: () => [],
      required: true
    },
    fetchingData: {
      type: Boolean,
      default: false
    },
    sortOrder: {
      type: String,
      default: ""
    }
  },
  emits: {
    onSort: (order: string) => {},
    onOpenDrawer: (task: Task | null) => {},
    onSelectTask: (event: boolean, task: Task | null) => {},
    toggleSelectAllTasksInTable: (event: boolean, listTasks: Task[]) => {},
    onTaskChangePage: () => {},
    onUndoTask: (taskIds: number[]) => {}
  },
  setup() {
    const fields: ITableField[] = [
      {
        key: "checkBox"
      },
      {
        key: "project",
        label: "Project"
      },
      { key: "taskName", label: "Task Name" },
      { key: "status", label: "Status" },
      { key: "description", label: "Description" },
      { key: "product", label: "Product" },
      { key: "dueDate", label: "Due Date" },
      { key: "priority", label: "Priority" },
      {
        key: "assignees",
        label: "Assign to",
        thStyle: { "min-width": "120px" }
      },
      // { key: "inputData", label: "Input Data" },
      // { key: "outputData", label: "Output Data" },
      { key: "deletedBy", label: "Deleted by USER" },
      { key: "deletedTime", label: "Deleted Time" },
      {
        key: "actions",
        label: "",
        thStyle: { width: "50px" }
      }
    ];

    const tableDefault: Ref<ITableDefaultFunctions | null> = ref(null);
    const listTasks: Ref<ITaskItem[]> = ref<ITaskItem[]>([]);
    const pagination: Ref<ITablePagination | undefined> = ref<ITablePagination>();
    const listSelectedTasks: Ref<number[]> = ref<number[]>([]);
    const isSelectAllRows: Ref<boolean> = ref<boolean>(false);
    const isDrawerVisible: Ref<boolean> = ref<boolean>(false);
    const selectedTaskId: Ref<number | undefined> = ref<number | undefined>(undefined);

    return {
      isSelectAllRows,
      isDrawerVisible,
      selectedTaskId,
      fields,
      listSelectedTasks,
      tableDefault,
      listTasks,
      pagination
    };
  },
  methods: {
    countWordsInText,
    truncateByLength,
    formatDate(date: Date, format: string) {
      return formatDate(date, format);
    },
    truncateByWords(text: string, limitWords: number) {
      return truncateByWords(text, limitWords);
    },
    handleChangePage() {
      this.$emit("onTaskChangePage");
    },
    openDrawer(taskItem: ITaskItem[]) {
      if (taskItem.length === 0) {
        return;
      }

      const selectedTask = this.tasksData.items.find(task => task.id === taskItem[0].id) || null;

      if (this.tableDefault && typeof this.tableDefault.clearSelected === "function") {
        this.tableDefault.clearSelected();
      }
      this.$emit("onOpenDrawer", selectedTask);
    },
    handleSelectRow(event: boolean, taskId: number) {
      const task = this.tasksData.items.find(task => task.id === taskId) ?? null;
      this.$emit("onSelectTask", event, task);
    },
    handleAllRowSelected(event: boolean) {
      this.$emit("toggleSelectAllTasksInTable", event, this.tasksData.items);
    },
    areAllTasksInTableSelected() {
      return (
        this.tasksData &&
        this.tasksData.items &&
        this.selectedTasks.length > 0 &&
        this.selectedTasks.length === this.tasksData.items.length
      );
    },
    handleSort(field: string) {
      if (!this.tasksData || this.tasksData.items.length === 0) {
        return;
      }
      const { sortOrder } = this.updateSortOrder(this.sortOrder, field);

      this.$emit("onSort", sortOrder);
    },
    updateSortOrder(currentOrder: string, field: string) {
      let [currentOrderField, currentFieldDirection] = currentOrder.split(":");
      if (currentOrderField === field) {
        currentFieldDirection = currentFieldDirection === "asc" ? "desc" : "asc";
      } else {
        currentFieldDirection = "asc";
      }

      return { sortOrder: `${field}:${currentFieldDirection}`, sortType: currentFieldDirection };
    },
    handleUndoTask(taskId: number) {
      this.$emit("onUndoTask", [taskId]);
    },
    handleBulkUndoTasks() {
      this.$emit("onUndoTask", this.listSelectedTasks);
    }
  },
  watch: {
    tasksData(newValue: PaginatedResponse<Task>) {
      if (!newValue) {
        return;
      }

      if (newValue.items.length > 0) {
        this.listTasks = this.tasksData.items.map(task => ({
          id: task.id,
          project:
            (task.project?.number && task.project.number.custom_id ? task.project.number.custom_id + " - " : "") +
              task.project.name || "",
          taskName: task.name,
          status: {
            title: task.task_status.label,
            color: task.task_status.color
          },
          description: task.description ?? "",
          product: task.product.name,
          dueDate: task.due_date,
          priority: {
            title: task.task_priority.label,
            color: task.task_priority.color
          },
          assignees: task.task_assignees,
          inputData: task.input_data ?? "",
          outputData: task.output_data ?? "",
          createdBy: task.creator,
          createdTime: task.created_at,
          deletedBy: task.eraser,
          deletedTime: task.deleted_at
        }));

        this.pagination = {
          currentPage: this.tasksData.current_page,
          pageSize: this.tasksData.page_size,
          totalItems: this.tasksData.total_items,
          totalPages: this.tasksData.total_pages
        };
      } else {
        this.listTasks = [];
        this.pagination = undefined;
      }
    }
  }
});
