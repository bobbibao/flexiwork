import { defineComponent, Ref, ref } from "vue";
import { TasksService } from "../../services";
import { Attachment, Project, Task, TaskState, User } from "@/common/models";
import {
  PlusIcon,
  ButtonCustom,
  ButtonSwitch,
  getSelectedOption,
  SelectOption,
  setSelectedOption,
  Toast,
  getMultipleSelectedOption
} from "@/components";
import {
  ButtonFilterTasks,
  SearchInput,
  TableTasksByList,
  TableTasksByProject,
  BulkActionToolbar,
  BulkUndoToolbar
} from "../../components";
import DrawerTask from "../../components/DrawerTask/DrawerTask.vue";
import { TaskDto, CreateCommentDto } from "../../dtos";
import { ERouteQueryParams, getQueryParameter, PaginatedResponse, removeQueryParameter } from "@/common";
import {
  getSelectedSwitchOption,
  setSelectedSwitchOption,
  SwitchOption
} from "@/components/atoms/button/ButtonSwitch/ButtonSwitch";
import {
  defaultPriorityFilterOption,
  defaultStatusFilterOption,
  getAssigneeFilterOptions,
  getPriorityFilterOptions,
  getStatusFilterOptions
} from "../../constants";
// @ts-ignore
import authModule from "@/core/services/store/auth.module";
import TableTasksByDeletedAt from "../../components/TableTasksByDeletedAt/TableTasksByDeletedAt.vue";

const tasksService = new TasksService();

export default defineComponent({
  name: "TaskPage",
  components: {
    ButtonCustom,
    ButtonFilterTasks,
    SearchInput,
    DrawerTask,
    TableTasksByList,
    TableTasksByProject,
    BulkActionToolbar,
    ButtonSwitch,
    TableTasksByDeletedAt,
    BulkUndoToolbar,
    PlusIcon
  },
  metaInfo: {
    title: "Task"
  },
  mixins: [Toast],
  setup() {
    const defaultPageSize = 10;

    const projects: Ref<Project[]> = ref<Project[]>([]); // Data for table tasks by projects
    const tasks = ref<PaginatedResponse<Task>>();
    const search = ref<string>("");
    const selectedTaskForDetails: Ref<Task | null> = ref<Task | null>(null);
    const selectedProject: Ref<Project | null> = ref<Project | null>(null);
    const selectedAssigneeId = ref<number | null>(null);
    const selectedStatusId = ref<number[] | null>(null);
    const selectedPriorityId = ref<number | null>(null);
    const selectedTasks = ref<number[]>([]);
    const isCreate = ref<boolean>(false);

    /** Options for select filters */
    const assigneeOptions: Ref<SelectOption[]> = ref<SelectOption[]>([]);
    const statusOptions: Ref<SelectOption[]> = ref<SelectOption[]>([defaultStatusFilterOption]);
    const priorityOptions: Ref<SelectOption[]> = ref<SelectOption[]>([defaultPriorityFilterOption]);

    return {
      defaultPageSize,
      projects,
      tasks,
      search,
      selectedTaskForDetails,
      selectedProject,
      assigneeOptions,
      statusOptions,
      priorityOptions,
      selectedAssigneeId,
      selectedStatusId,
      selectedPriorityId,
      selectedTasks,
      isCreate
    };
  },
  data() {
    const assignees: User[] = [];
    const statuses: TaskState[] = [];
    const priorities: TaskState[] = [];
    const allProjects: Project[] = [];
    const assigneeSwitchOptions = [
      {
        label: this.$t("task.myTasks"),
        value: "myTasks",
        selected: true
      },
      {
        label: this.$t("task.allTask"),
        value: "allTasks",
        selected: false
      }
    ] as SwitchOption[];
    const viewSwitchOptions = [
      {
        label: this.$t("task.byProject"),
        value: "byProject",
        selected: true
      },
      {
        label: this.$t("task.list"),
        value: "list",
        selected: false
      },
      {
        label: this.$t("task.softDeleted"),
        value: "softDeleted",
        selected: false
      }
    ] as SwitchOption[];

    return {
      currentUser: authModule.state.user,
      isDrawerVisible: false,
      sortListTasks: "",
      fetchingListTasks: false,
      /** Data */
      assignees,
      statuses,
      priorities,
      allProjects,
      /** Options for switches */
      assigneeSwitchOptions,
      viewSwitchOptions
    };
  },
  async mounted() {
    this.selectedAssigneeId = this.currentUser.id;
    await this.handleViewSwitchChanged();

    /** Fetch and assign data to select options */
    const [fetchedAssignees, fetchedStatuses, fetchedPriorities, fetchedProjects] = await Promise.all([
      tasksService.getAssignees(),
      tasksService.getTaskStatuses(),
      tasksService.getTaskPriorities(),
      tasksService.getProjects()
    ]);

    this.assignees = fetchedAssignees;
    this.statuses = fetchedStatuses;
    this.priorities = fetchedPriorities;
    this.allProjects = fetchedProjects;
    const defaultAssignee = { label: this.$t("task.assignee"), value: "", selected: true } as SelectOption;
    const defaultPriority = { label: this.$t("task.priority"), value: "", selected: true } as SelectOption;

    this.assigneeOptions = getAssigneeFilterOptions(this.assignees, this.currentUser, defaultAssignee);
    this.statusOptions = getStatusFilterOptions(this.statuses);
    this.priorityOptions = getPriorityFilterOptions(this.priorities, defaultPriority);
  },
  computed: {
    viewType() {
      return getSelectedSwitchOption(this.viewSwitchOptions).value;
    }
  },
  methods: {
    async handleViewSwitchChanged(options?: SwitchOption[]) {
      options && (this.viewSwitchOptions = options);
      this.selectedTasks.splice(0, this.selectedTasks.length); // remove all selected tasks after switch view
      await this.fetchData(true);
    },
    async handleAssigneeSwitchChanged(options: SwitchOption[]) {
      if (
        (getSelectedSwitchOption(this.assigneeSwitchOptions).value === getSelectedSwitchOption(options).value &&
          getSelectedSwitchOption(this.assigneeSwitchOptions).value === "allTasks" &&
          getSelectedOption(this.assigneeOptions).value === "") ||
        (getSelectedSwitchOption(this.assigneeSwitchOptions).value === getSelectedSwitchOption(options).value &&
          getSelectedSwitchOption(this.assigneeSwitchOptions).value !== "allTasks")
      ) {
        return;
      }

      // Update assignee switch and filter options
      this.assigneeSwitchOptions = options;

      if (getSelectedSwitchOption(this.assigneeSwitchOptions).value === "myTasks") {
        this.assigneeOptions = setSelectedOption(this.assigneeOptions, {
          label: "",
          value: this.currentUser.id
        });
      } else {
        this.assigneeOptions = setSelectedOption(this.assigneeOptions, this.assigneeOptions[0]);
      }

      this.handleAssigneeFilterChanged(this.assigneeOptions);
    },
    async handleOnSortListTasks(order: string) {
      this.sortListTasks = order;

      await this.fetchData(true);
    },
    async handleOnSearch(value: string) {
      this.search = value;

      await this.fetchData(true);
    },
    async handleAssigneeFilterChanged(options: SelectOption[]) {
      const selectedOption = getSelectedOption(options);
      this.selectedAssigneeId = selectedOption ? parseInt(selectedOption.value) : null;
      this.assigneeOptions = options;

      if (
        this.selectedAssigneeId !== this.currentUser.id &&
        getSelectedSwitchOption(this.assigneeSwitchOptions).value === "myTasks"
      ) {
        this.assigneeSwitchOptions = setSelectedSwitchOption(this.assigneeSwitchOptions, {
          label: "",
          value: "allTasks"
        });
      } else if (
        this.selectedAssigneeId === this.currentUser.id &&
        getSelectedSwitchOption(this.assigneeSwitchOptions).value === "allTasks"
      ) {
        this.assigneeSwitchOptions = setSelectedSwitchOption(this.assigneeSwitchOptions, {
          label: "",
          value: "myTasks"
        });
      }

      await this.fetchData(true);
    },
    async handleStatusFilterChanged(options: SelectOption[]) {
      const selectedOption = getMultipleSelectedOption(options);
      this.selectedStatusId =
        selectedOption && selectedOption.length ? selectedOption.filter(i => !!+i.value).map(v => +v.value) : null;
      this.selectedTasks = [];
      this.statusOptions = options;

      await this.fetchData(true);
    },
    async handlePriorityFilterChanged(options: SelectOption[]) {
      const selectedOption = getSelectedOption(options);
      this.selectedPriorityId = selectedOption ? parseInt(getSelectedOption(options).value) : null;
      this.priorityOptions = options;

      await this.fetchData(true);
    },
    async handleOnOpenDrawer(task: Task | null) {
      if (task) {
        const taskDetails = await tasksService.getTask(task.id);
        this.selectedTaskForDetails = taskDetails ? taskDetails : null;
      }
      this.toggleDrawer(true);
    },
    handleOnCreateTask(project: Project) {
      this.selectedProject = project;

      this.handleOnOpenDrawer(null);
    },
    getFilters() {
      const filters: string[] = [];
      if (this.selectedAssigneeId) {
        filters.push(`task_assignee:${this.selectedAssigneeId}`);
      }
      if (this.selectedStatusId && this.selectedStatusId.length) {
        filters.push(`status_id:${this.selectedStatusId}`);
      }
      if (this.selectedPriorityId) {
        filters.push(`priority_id:${this.selectedPriorityId}`);
      }
      return filters;
    },
    async fetchData(isResetPagination: boolean = false) {
      if (isResetPagination) {
        removeQueryParameter(ERouteQueryParams.PAGE);
      }

      if (this.viewType === "byProject") {
        this.projects = await tasksService.getTasksByProject(this.getFilters(), this.search);
      } else {
        this.fetchingListTasks = true;
        const getPage = getQueryParameter(ERouteQueryParams.PAGE);

        const response = await tasksService.getTasks({
          filters: this.getFilters(),
          page: getPage ? +getPage : 1,
          page_size: this.defaultPageSize,
          search: this.search,
          sort: this.sortListTasks,
          get_soft_deleted: this.viewType === "softDeleted"
        });

        if (response) {
          this.tasks = response;
        }
        this.fetchingListTasks = false;
      }
    },
    toggleDrawer(value: boolean) {
      this.isDrawerVisible = value;

      if (!this.isDrawerVisible) {
        this.selectedTaskForDetails = null;
        this.selectedProject = null;

        // @ts-ignore
        const drawerTask = this.$refs["drawerTask"] as DrawerTask;
        drawerTask.resetForm();
        this.isCreate = false;
      } else {
        this.isCreate = !this.selectedTaskForDetails;
      }
    },
    async handleOnDeleteTask(taskId: number) {
      try {
        await tasksService.deleteTask(taskId);
        await this.fetchData(true);
        this.toast(String(this.$t("task.toast.softDeleteSuccess")), "success");
      } catch (error) {
        this.toast(String(this.$t("task.toast.softDeleteError")), "danger");
      }
    },
    async handleOnUpsertTask(task: TaskDto) {
      try {
        if (this.selectedTaskForDetails && !this.isCreate) {
          // Update task
          await tasksService.updateTask(this.selectedTaskForDetails.id, task);
          this.toast(String(this.$t("task.toast.updateSuccess")), "success");
          await this.fetchData(true);
        } else {
          // Create new task
          await tasksService.createTask(task);
          this.toast(String(this.$t("task.toast.createSuccess")), "success");
          await this.fetchData();
        }

        this.toggleDrawer(false);
      } catch (error) {
        const action = this.isCreate ? "create" : "update";
        this.toast(String(this.$t(`task.toast.${action}Error`)), "danger");
      }
    },
    async handleOnUndoTasks(taskIds: number[]) {
      try {
        await tasksService.undoTasks(taskIds);
        await this.fetchData(true);
        this.toast(String(this.$t("task.toast.restoreSuccess")), "success");
      } catch (error) {
        this.toast(String(this.$t("task.toast.restoreError")), "danger");
      }
    },
    async handleOnCreateComments(content: string, replyTo?: Number, attachments?: Attachment[]) {
      if (this.selectedTaskForDetails) {
        const comment = {
          content: content,
          attachments: attachments ? attachments : [],
          reply_to: replyTo ? Number(replyTo) : null
        } as CreateCommentDto;

        const response = await tasksService.createComment(this.selectedTaskForDetails.id, comment);
        if (response) {
          await this.handleOnOpenDrawer(this.selectedTaskForDetails);
          // @ts-ignore
          const drawerTask = this.$refs["drawerTask"] as DrawerTask;
          drawerTask.selectTab("comments");
        }
      }
    },
    async handleDeleteBulk(listIds: number[]) {
      const result = await tasksService.bulkDeleteTasks(listIds.map(id => Number(id)));
      if (result.error === false) {
        await this.fetchData(true);
        this.selectedTasks.splice(0, this.selectedTasks.length); // remove all selected tasks after deleted
      }
    },
    async handleUpdateBulk(listIds: number[], statusId: number) {
      try {
        const result = await tasksService.bulkUpdateTasks(
          listIds.map(id => Number(id)),
          Number(statusId)
        );
        if (result.error === false) {
          await this.fetchData();
          this.selectedTasks.splice(0, this.selectedTasks.length); // remove all selected tasks after updated
          this.toast(String(this.$t("task.toast.bulkUpdateSuccess")), "success");
        } else {
          this.toast(String(this.$t("task.toast.bulkUpdateError")), "danger");
        }
      } catch (error) {
        console.error("Error in handleUpdateBulk:", error);
        this.toast(String(this.$t("task.toast.bulkUpdateError")), "danger");
      }
    },
    updateSelectedTasks(
      taskId: number,
      add: boolean,
      selectAs: "project" | "product" | "parentTask" | "task" = "task"
    ) {
      if (add) {
        // Add taskId if it's not already included
        if (!this.selectedTasks.includes(taskId) && selectAs === "task") {
          this.selectedTasks.push(taskId);
        }
      } else {
        // Remove taskId if it exists
        const taskIndex = this.selectedTasks.indexOf(taskId);
        if (taskIndex > -1) {
          this.selectedTasks.splice(taskIndex, 1);
        }
      }
    },
    handleSelectTask(
      event: boolean,
      task: Task | null,
      selectAs: "project" | "product" | "parentTask" | "task" = "task"
    ) {
      if (!task) return;

      if (task.sub_tasks && task.sub_tasks.length > 0) {
        const isChecked = event;
        task.sub_tasks.forEach(subTask => {
          this.updateSelectedTasks(subTask.id, isChecked, selectAs);
        });
      }

      this.updateSelectedTasks(task.id, event, selectAs);
    },
    handleSelectAllTasksInProduct(
      event: boolean,
      productId: number,
      project: Project,
      selectAs: "project" | "product" | "parentTask" | "task" = "task"
    ) {
      const product = project.products.find(p => p.id === productId);
      if (!product) return;

      product.tasks.forEach(task => {
        this.handleSelectTask(event, task, selectAs);
      });
    },
    handleSelectAllTasksInTable(
      event: boolean,
      project: Project,
      selectAs: "project" | "product" | "parentTask" | "task" = "task"
    ) {
      if (!project) return;

      project.products.forEach(prod => {
        this.handleSelectAllTasksInProduct(event, prod.id, project, selectAs);
      });
    },
    handleSelectAllTasks(event: boolean, listTask: Task[]) {
      listTask.forEach(task => {
        this.updateSelectedTasks(task.id, event);
      });
    },

    async handleOnDownloadAttachment(attachmentId: number) {
      await tasksService.downloadAttachment(attachmentId);
    },
    handleAddSubBtn(isCreate: boolean) {
      this.isCreate = isCreate;
    }
  }
});
