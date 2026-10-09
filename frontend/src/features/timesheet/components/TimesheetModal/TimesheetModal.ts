import { ProductOfProject, Project, Task } from "@/common/models";
import { defineComponent, ref } from "vue";
import { ConfirmModal, Toast, SearchableDropdown, ContentEditor, ButtonDropDown, ChevronDownIcon } from "@/components";
import { TimesheetsService } from "../../services/timesheet.service";
import { searchByNameOrId } from "@/common";
import { TasksService } from "@/features/tasks/services";
import { TimesheetForm } from "./type";

const timesheetService = new TimesheetsService();
const tasksService = new TasksService();

export default defineComponent({
  name: "TimesheetModal",
  mixins: [Toast],
  components: {
    ConfirmModal,
    SearchableDropdown,
    ContentEditor,
    ButtonDropDown,
    ChevronDownIcon
  },
  props: {
    isVisible: {
      type: Boolean,
      default: false
    },
    selectingUserId: {
      type: Number
    }
  },
  setup() {
    const projects = ref<Project[]>([]);
    const products = ref<ProductOfProject[]>([]);
    const tasks = ref<Task[]>([]);
    const selectedProject = ref<Project | null>(null);
    const selectedProduct = ref<ProductOfProject | null>(null);
    const selectedTasks = ref<Task[]>([]);
    const taskSearchQuery = ref<string>("");
    const formInitial = ref();
    const form = ref<TimesheetForm>({
      project_id: null,
      product_id: null,
      task_ids: []
    });

    return {
      projects,
      products,
      tasks,
      selectedProduct,
      selectedProject,
      selectedTasks,
      taskSearchQuery,
      form,
      formInitial
    };
  },
  async mounted() {
    this.formInitial = JSON.stringify(this.form);
    document.addEventListener("keydown", this.handleEscKey);
    await this.fetchProjects();
  },
  data() {
    return {
      loading: false
    };
  },
  unmounted() {
    document.removeEventListener("keydown", this.handleEscKey);
  },
  watch: {
    async selectedProject(project) {
      if (!project) return;
      this.products = await timesheetService.getTimesheetProducts(project.id);
    },
    async selectedProduct(product) {
      if (!product) {
        this.selectedTasks = [];
        return;
      }
      const projectId: number = this.selectedProject?.id as number;
      this.tasks = await tasksService.getParentTasks(projectId, product.id, this.selectingUserId);
      this.taskSearchQuery = "";
    },
    isVisible(value) {
      if (value) {
        // Only reset when changing from hidden to visible (not on initial render)
        this.resetForm();
      }
    }
  },
  computed: {
    isChangeForm() {
      return JSON.stringify(this.form) !== this.formInitial;
    },
    filteredTasks() {
      if (!this.taskSearchQuery) {
        return this.tasks;
      }
      return this.tasks.filter(task => task.name.toLowerCase().includes(this.taskSearchQuery.toLowerCase()));
    }
  },
  methods: {
    isTaskSelected(task: Task) {
      return this.selectedTasks.some(t => t.id === task.id);
    },
    // Search methods using the generic search function
    handleCloseModal() {
      this.$emit("closed", !this.isVisible);
    },
    // Used for the searchable dropdown component to show the name of the selected item
    showItemName(item: Project | ProductOfProject | Task) {
      return item.name?.trim() ?? "";
    },
    resetForm() {
      Object.assign(this, {
        products: [],
        tasks: [],
        selectedProject: null,
        selectedProduct: null,
        selectedTasks: [],
        form: {
          project_id: null,
          product_id: null,
          task_ids: []
        }
      });
      this.formInitial = JSON.stringify(this.form);
    },
    async submit() {
      // Validation checks
      const validationErrors = [];
      if (!this.form.project_id) {
        validationErrors.push("Project is required");
      }

      if (!this.form.product_id) {
        validationErrors.push("Product/Service is required");
      }

      // Remove task requirement - tasks are now optional
      // if (this.form.task_ids.length === 0) {
      //   validationErrors.push("At least one task must be selected");
      // }

      // If there are validation errors, show them and don't proceed
      if (validationErrors.length > 0) {
        validationErrors.forEach(error => {
          this.toast(error, "danger");
        });
        return;
      }

      if (this.loading) {
        return;
      }

      this.loading = true;

      const parentTaskIds = [...this.form.task_ids];
      const subtaskIds = new Set<number>();

      // Only fetch subtasks if there are parent tasks
      if (parentTaskIds.length > 0) {
        // Fetch all subtasks
        const subtaskPromises = parentTaskIds.map(task_id => tasksService.getSubtasks(task_id));

        const subtasksResults = await Promise.all(subtaskPromises);

        // Process all subtasks and add them to the Set to avoid duplicates
        subtasksResults.forEach(subtasks => {
          if (subtasks.length > 0) {
            subtasks.forEach(subtask => subtaskIds.add(subtask.id));
          }
        });

        // Add unique subtasks to the task_ids array
        this.form.task_ids = [...parentTaskIds, ...subtaskIds];
      }

      this.$emit("onSave", this.form);

      this.loading = false;
    },
    handleEscKey(event: KeyboardEvent) {
      if (event.key === "Escape" && this.isVisible) {
        this.isChangeForm ? this.$bvModal.show("drawer-close") : this.handleCloseModal();
      }
    },
    async fetchProjects() {
      this.projects = await timesheetService.getTimesheetProjects();
    },
    searchProject(projects: Project[], value: string) {
      return searchByNameOrId(projects, value);
    },
    searchProduct(products: ProductOfProject[], value: string) {
      return searchByNameOrId(products, value);
    },
    searchTask(tasks: Task[], value: string) {
      return searchByNameOrId(tasks, value);
    },
    async handleOnChangeProject(project: Project | null) {
      if (!project) return;

      this.selectedProject = project;
      this.selectedProduct = null;

      this.form.project_id = project.id;
      this.form.product_id = null;
      this.form.task_ids = [];
    },
    handleChangeProduct(product: ProductOfProject | null) {
      if (!product) return;

      this.selectedProduct = product;
      this.selectedTasks = [];
      this.form.product_id = product.id;
      this.form.task_ids = [];
    },
    handleChangeTasks(task: Task | null) {
      //  If task is null or has work items, do not allow selection
      if (!task || (task.work_items ?? []).length > 0) return;
      const index = this.selectedTasks.findIndex(t => t.id === task.id);

      if (index === -1) {
        this.selectedTasks.push(task);
      } else {
        this.selectedTasks.splice(index, 1);
      }

      this.form.task_ids = this.selectedTasks.map(t => t.id);
    },
    truncate(str: string, length: number) {
      return str.length > length ? str.substring(0, length) + "..." : str;
    },
    generateTooltipContent(text: string) {
      if (!text) return "";
      return `<div class="tooltip-content">${text.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>`;
    }
  }
});
