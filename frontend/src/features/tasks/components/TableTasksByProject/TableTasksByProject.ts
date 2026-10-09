import { defineComponent, Ref, ref } from "vue";
import AssigneeAvatars from "../AssigneeAvatars/AssigneeAvatars.vue";
import { Project, Task, TaskState, User } from "@/common/models";
import { SortIcon, Avatar, ConfirmModal, SeverityBadge, ButtonCustom, ChevronUpIcon, PlusIcon, ArrowReturnRight, TrashDetailedIcon } from "@/components";
import { countWordsInText, truncateByWords, formatDate } from "@/common";
import {
  getAssigneeName,
  getTaskState,
  sortByCreatedByField,
  sortByDateField,
  sortByNumberField,
  sortByTextField
} from "../../services";

export default defineComponent({
  name: "TableTasksByProject",
  components: {
    AssigneeAvatars,
    SeverityBadge,
    SortIcon,
    Avatar,
    ConfirmModal,
    ButtonCustom,
    ChevronUpIcon,
    PlusIcon,
    ArrowReturnRight,
    TrashDetailedIcon
  },
  props: {
    project: {
      type: Object as () => Project,
      required: true
    },
    selectedTasks: {
      type: Array as () => number[],
      required: true
    },
    statuses: {
      type: Array as () => TaskState[],
      required: true
    },
    priorities: {
      type: Array as () => TaskState[],
      required: true
    }
  },
  emits: {
    onOpenDrawer: (task: Task | null) => {},
    onCreateTask: (project: Project) => {},
    onDeleteTask: (taskId: number) => {},
    onSelectTask: (event: boolean, task: Task) => {},
    toggleSelectAllTasksInProduct: (event: boolean, productId: number, project: Project) => {},
    toggleSelectAllTasksInTable: (event: boolean, project: Project) => {}
  },
  setup() {
    const order: Ref<string> = ref("name:asc");
    const listProjectExpanded: Ref<number[]> = ref([]);

    return {
      order,
      listProjectExpanded
    };
  },
  data() {
    return {
      isExpanded: true,
      isDrawerVisible: false,
      tableHeight: 0
    };
  },
  computed: {
    getTotalTasks() {
      return this.project.products.reduce((total, product) => {
        const totalSubTasks = product.tasks.reduce((total, task) => {
          return total + (task.sub_tasks?.length ?? 0);
        }, 0);

        return total + product.tasks.length + totalSubTasks;
      }, 0);
    },
    sortSubTasks() {
      const handledProducts = this.project.products.map(product => {
        return {
          ...product,
          tasks: product.tasks
            .map((task, index, originTasks) => {
              if (task.parent_task_id === null) {
                return {
                  ...task,
                  sub_tasks: [...(task.sub_tasks ?? []), ...originTasks.filter(t => t.parent_task_id === task.id)]
                };
              }

              return null;
            })
            .filter(task => task !== null)
        };
      });
      this.project.products = handledProducts;

      return this.project;
    }
  },
  watch: {
    project: {
      handler() {
        this.setMaxHeightTable();
      },
      deep: true
    }
  },
  methods: {
    getTaskState,
    setMaxHeightTable() {
      const tableTasks = this.$refs["tableTasks"] as HTMLElement;

      if (tableTasks) {
        this.tableHeight = tableTasks.scrollHeight + 100;
      }
    },
    toggleTable() {
      this.isExpanded = !this.isExpanded;
    },
    toggleProduct(productId: number) {
      if (this.listProjectExpanded.includes(productId)) {
        this.listProjectExpanded = this.listProjectExpanded.filter(id => id !== productId);
      } else {
        this.listProjectExpanded.push(productId);
      }
    },
    isExpandedProduct(productId: number) {
      return this.listProjectExpanded.includes(productId);
    },
    openDrawer(event: Event | null = null, task: Task | null = null) {
      if (event) {
        const target = event.target as HTMLElement;

        const isDeleteButton = target.closest("button");
        const isSelectButton = target.closest("div.custom-control.custom-checkbox");

        // If the clicked element or its parent is the delete button, stop the function
        if (isDeleteButton || isSelectButton) {
          return;
        }
      }

      this.$emit("onOpenDrawer", task);
    },
    createTask() {
      this.$emit("onCreateTask", this.project);
    },
    truncateByWords(text: string, limitWords: number) {
      return truncateByWords(text, limitWords);
    },
    countWordsInText(text: string) {
      return countWordsInText(text);
    },
    formatDate(date: Date, format: string) {
      return formatDate(date, format);
    },
    getAssigneeName(assignee: User) {
      return getAssigneeName(assignee);
    },
    handleSort(field: string) {
      let sortedData: Project | null = null;
      let newOrder: string = "";

      // Sort by text fields
      if (["name", "description", "input_data", "output_data"].includes(field)) {
        ({ currentOrder: newOrder, data: sortedData } = sortByTextField(this.order, field, this.project));
      }

      // Sort by date fields
      if (["created_at", "due_date"].includes(field)) {
        ({ currentOrder: newOrder, data: sortedData } = sortByDateField(this.order, field, this.project));
      }

      // Sort by number fields
      if (["status_id", "priority_id"].includes(field)) {
        ({ currentOrder: newOrder, data: sortedData } = sortByNumberField(this.order, field, this.project));
      }

      // Sort by created_by field
      if (["created_by"].includes(field)) {
        ({ currentOrder: newOrder, data: sortedData } = sortByCreatedByField(this.order, this.project));
      }
      // Apply the new order and sorted data
      if (newOrder && sortedData) {
        this.order = newOrder;
        this.project.products = sortedData.products;
      }
    },
    deleteTask(taskId: number) {
      this.$emit("onDeleteTask", taskId);
    },
    areAllTasksSelected(productId: number): boolean {
      const product = this.project.products.find(p => p.id === productId);
      if (!product) return false;

      if (product.tasks.length === 0) return false;

      // Check if every task ID in the product is included in selectedTasks
      return product.tasks.every(task => this.selectedTasks.includes(task.id));
    },
    areAllTasksInTableSelected(): boolean {
      // Return false if there are no products
      if (this.project.products.length === 0) return false;

      // Check if every product has tasks and all tasks are included in selectedTasks
      return this.project.products.every(
        product => product.tasks.length > 0 && product.tasks.every(task => this.selectedTasks.includes(task.id))
      );
    },
    onSelectTask(event: boolean, task: Task) {
      this.$emit("onSelectTask", event, task);
    },
    toggleSelectAllTasksInProduct(event: boolean, productId: number) {
      this.$emit("toggleSelectAllTasksInProduct", event, productId, this.project);
    },
    toggleSelectAllTasksInTable(event: boolean, project: Project) {
      this.$emit("toggleSelectAllTasksInTable", event, project);
    }
  }
});
