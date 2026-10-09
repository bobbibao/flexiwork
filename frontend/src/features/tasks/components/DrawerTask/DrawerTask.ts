import { Attachment, ProductOfProject, Project, Task, TaskState, User } from "@/common/models";
import { defineComponent, PropType, ref, Ref } from "vue";
import { getAssigneeName, TasksService, loadCommentsAndReplies, validateForm } from "../../services";
import { TaskDto } from "../../dtos/task.dto";
import { timeAgo, truncateByWords } from "@/common";
import {
  Avatar,
  ButtonDropDown,
  SeverityBadge,
  FileUpload,
  ConfirmModal,
  Toast,
  SearchableDropdown,
  ContentEditor,
  PlusIcon,
  TrashIcon,
  TagIcon,
  UserIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  CheckIcon,
  SendIcon
} from "@/components";
import { BvModal } from "bootstrap-vue";

const tasksService = new TasksService();

export default defineComponent({
  name: "DrawerTask",
  mixins: [Toast],
  components: {
    ButtonDropDown,
    SeverityBadge,
    Avatar,
    ConfirmModal,
    FileUpload,
    SearchableDropdown,
    ContentEditor,
    PlusIcon,
    TrashIcon,
    TagIcon,
    UserIcon,
    ChevronUpIcon,
    ChevronDownIcon,
    CheckIcon,
    SendIcon
  },
  props: {
    task: {
      type: Object as PropType<Task>,
      default: null
    },
    isVisible: {
      type: Boolean,
      default: false
    },
    projects: {
      type: Array as PropType<Project[]>,
      default: []
    },
    selectedProjectForTask: {
      type: Object as PropType<Project>,
      default: null
    },
    assignees: {
      type: Array as PropType<User[]>,
      default: []
    },
    statuses: {
      type: Array as PropType<TaskState[]>,
      default: []
    },
    priorities: {
      type: Array as PropType<TaskState[]>,
      default: []
    }
  },
  emits: {
    closed: (isVisible: boolean) => {},
    onDeleteTask: (taskId: number) => {},
    onSubmit: (taskDto: TaskDto) => {},
    onCreateComment: (comment: string, reply_to: number | null, attachments: Attachment[]) => {},
    onReplyComment: (comment: string, reply_to: number, attachments: Attachment[]) => {},
    onDownloadAttachment: (attachmentId: number) => {},
    onCheckIsCreate: (isCreate: boolean) => {}
  },
  setup() {
    const products: Ref<ProductOfProject[]> = ref([]);
    const parentTasks = ref<Task[]>([]);

    const selectedProject: Ref<Project | null> = ref(null);
    const selectedProduct: Ref<ProductOfProject | null> = ref(null);
    const selectedParentTask = ref<Task | null>(null);
    const selectedStatus: Ref<TaskState | null> = ref(null);
    const selectedPriority: Ref<TaskState | null> = ref(null);
    const selectedAssignees: Ref<User[]> = ref([]);

    const selectedCommentIdToReply: Ref<number | null> = ref(null);

    const files: Ref<File[]> = ref([]);
    const replyFiles: Ref<{ [key: number]: File[] }> = ref({});
    const attachments = ref<Attachment[]>([]);
    // create an object to store all attachments for each reply, for example:
    // {
    //   1: { // commentId
    //     101: [/* files for reply 101 */], // replyId
    //     102: [/* files for reply 102 */], // replyId
    //   },
    //   2: { // another commentId
    //     201: [/* files for reply 201 */],
    //   }
    // }
    const replyAttachments = ref<{ [key: number]: Attachment[] }>({});

    return {
      selectedProject,
      products,
      parentTasks,
      selectedProduct,
      selectedParentTask,
      selectedStatus,
      selectedPriority,
      selectedAssignees,
      selectedCommentIdToReply,
      files,
      replyFiles,
      attachments,
      replyAttachments
    };
  },
  data(): {
    form: TaskDto;
    formInitial: string;
    isSubTask: boolean;
    activeTab: "description" | "comments";
    newComment: string;
    replyComment: string;
    $bvModal: BvModal;
    searchQuery: string;
    isSaving: boolean; // Add this line
  } {
    return {
      form: {
        project_id: 0,
        product_id: 0,
        name: "",
        status_id: 0,
        priority_id: 0,
        assignee_to: [],
        due_date: "",
        input_data: "",
        output_data: "",
        parent_task_id: null,
        description: ""
      },
      formInitial: "",
      isSubTask: false,
      activeTab: "description",
      replyComment: "",
      newComment: "",
      $bvModal: {} as BvModal,
      searchQuery: "",
      isSaving: false // Add this line
    };
  },
  mounted() {
    this.formInitial = JSON.stringify(this.form);
    document.addEventListener("keydown", this.handleEscKey);
  },
  beforeDestroy() {
    document.removeEventListener("keydown", this.handleEscKey);
  },
  watch: {
    task() {
      if (this.task) {
        /** View task details */
        this.setTaskDetails();
      } else {
        /** Reset form for create new task */
        this.resetForm();
      }
    },
    async selectedProject() {
      if (!this.selectedProject) {
        return;
      }
      this.products = await tasksService.getProduct(this.selectedProject.id);
      if (this.task) {
        this.selectedProduct = this.products.find(product => product.id === this.task?.product_id) ?? null;
      }
    },
    async selectedProduct() {
      if (!this.selectedProduct) {
        return;
      }
      const projectId: number = this.selectedProject!.id as number;
      this.parentTasks = await tasksService.getParentTasks(projectId, this.selectedProduct!.id);
      if (this.isSubTask) {
        this.selectedParentTask = this.parentTasks.find(task => task.id === this.task?.parent_task_id) ?? null;
      }
    },
    isSubTask() {
      if (this.isSubTask && this.task) {
        this.form.parent_task_id = this.form.parent_task_id ? this.task.parent_task_id : this.task.id;
        this.selectedParentTask = this.task;
      } else {
        this.form.parent_task_id = null;
        this.selectedParentTask = null;
      }
      this.formInitial = JSON.stringify(this.form);
    },
    isVisible(value: boolean) {
      const project = this.selectedProjectForTask;
      if (value && project) {
        this.form.project_id = project.id;
        this.selectedProject = project;
        this.formInitial = JSON.stringify(this.form);
      }
    }
  },
  computed: {
    selectedProjectTitle() {
      return this.selectedProject ? this.selectedProject.name : "Select";
    },
    selectedProductTitle() {
      return this.selectedProduct ? this.selectedProduct.name : "Select";
    },
    selectedParentTaskTitle() {
      if (this.selectedParentTask) {
        return this.selectedParentTask.name;
      }
      this.form.parent_task_id = null;
      return "Select";
    },
    filteredAssignees() {
      return this.assignees.filter(assignee =>
        this.getAssigneeName(assignee)
          .toLowerCase()
          .includes(this.searchQuery.toLowerCase())
      );
    },
    newCommentHasContent() {
      return this.newComment.trim() || this.attachments.length > 0;
    }
  },
  methods: {
    truncateByWords(sentence: string, limit: number, ellipsis: string = "..."): string {
      return truncateByWords(sentence, limit, ellipsis);
    },
    getAssigneeName,
    timeAgo,
    validateForm,
    searchProject(projects: Project[], value: string) {
      if (!value) return projects;

      return projects.filter(project =>
        this.showSelectedProject(project)
          .toLowerCase()
          .includes(value.toLowerCase())
      );
    },
    searchProduct(products: ProductOfProject[], value: string) {
      if (!value) return products;

      const lowerCaseValue = value.toLowerCase();
      return products.filter(
        product =>
          product.name?.toLowerCase().includes(lowerCaseValue) ||
          product.id
            ?.toString()
            .toLowerCase()
            .includes(lowerCaseValue)
      );
    },
    showSelectedProject(project: Project) {
      // Return an empty string if the project is falsy or empty
      if (!project || JSON.stringify(project) === "{}") return "";

      // Return the project number and name, or just the project number if the name is not available
      return [project?.number?.custom_id || String(project?.number?.id) || "", project.name || ""]
        .filter(Boolean)
        .join(" - ");
    },
    showSelectedProduct(product: ProductOfProject) {
      return product.name;
    },
    handleAddSubtaskBtn() {
      this.isSubTask = !this.isSubTask;

      // Check if the user is creating a subtask or not
      let isCreatingSubtask = true;
      if (!this.isSubTask && this.task) {
        isCreatingSubtask = false;
      }

      this.$emit("onCheckIsCreate", isCreatingSubtask);
    },
    getFileIconClass(filename: string): string {
      const extension = filename
        .split(".")
        .pop()
        ?.toLowerCase();
      if (!extension) return "fas fa-file";
      switch (extension) {
        case "jpg":
        case "jpeg":
        case "png":
          return "fas fa-file-image";
        case "doc":
        case "docx":
          return "fas fa-file-word";
        case "pdf":
          return "fas fa-file-pdf";
        case "xls":
        case "xlsx":
          return "fas fa-file-excel";
        default:
          return "fas fa-file";
      }
    },
    getFileIconColor(filename: string): { color: string } {
      const extension = filename
        .split(".")
        .pop()
        ?.toLowerCase();
      switch (extension) {
        case "jpg":
        case "jpeg":
        case "png":
          return { color: "lightblue" };
        case "doc":
        case "docx":
          return { color: "#185abd" };
        case "pdf":
          return { color: "#b32436" };
        case "xls":
        case "xlsx":
          return { color: "#107a40" };
        default:
          return { color: "lightgray" };
      }
    },
    async updateFiles(newFiles: File[]) {
      // Update files and generate new URLs
      const result = await tasksService.uploadMultipleFiles(newFiles);
      if (result.payload) {
        this.attachments = result.payload;
      }
    },
    async updateReplyFiles(commentId: number, newFiles: File[]) {
      const result = await tasksService.uploadMultipleFiles(newFiles);
      if (result.payload) {
        this.$set(this.replyAttachments, commentId, result.payload);
      }
    },
    removeFile(index: number, isReply: boolean, commentId?: number) {
      // Revoke the object URL of the file being removed
      // Remove the file at the given index and handle attachments for the specified comment
      if (isReply && commentId !== undefined) {
        if (this.replyAttachments[commentId]) {
          if (this.replyAttachments[commentId]) {
            this.replyAttachments[commentId].splice(index, 1);
          }
        }
      } else {
        this.attachments.splice(index, 1);
      }
    },
    handleCloseModal() {
      this.resetForm();
      this.$emit("closed", !this.isVisible);
      this.$emit("onCheckIsCreate", false);
    },
    selectTab(value: "description" | "comments") {
      this.activeTab = value;
    },
    isAssigneeSelected(assignee: User) {
      return this.selectedAssignees.some(a => a.id === assignee.id);
    },
    isChangeForm() {
      return JSON.stringify(this.form) !== this.formInitial;
    },
    async handleOnChangeProject(project: Project) {
      this.selectedProject = project;
      this.form.project_id = project.id;
      this.selectedProduct = null;
      this.form.product_id = 0;
      if (this.task) {
        this.task.product_id = 0;
      }
    },
    handleChangeProduct(product: ProductOfProject) {
      this.selectedProduct = product;
      this.form.product_id = product.id;
      this.form.parent_task_id = null;
    },
    handleChangeParentTask(parentTask: Task) {
      this.selectedParentTask = parentTask;
      this.form.parent_task_id = parentTask.id;
    },
    handleChangeStatus(status: TaskState) {
      this.selectedStatus = status;
      this.form.status_id = status.id;
    },
    handleChangePriority(priority: TaskState) {
      this.selectedPriority = priority;
      this.form.priority_id = priority.id;
    },
    handleChangeAssignees(event: Event, assignee: User) {
      event.preventDefault(); // Prevent the dropdown from closing
      const selectedAssignee = this.selectedAssignees.find(a => a.id === assignee.id);
      if (selectedAssignee) {
        this.selectedAssignees = this.selectedAssignees.filter(a => a.id !== assignee.id);
      } else {
        this.selectedAssignees.push(assignee);
      }

      this.form.assignee_to = this.selectedAssignees.map(a => a.id);
      this.searchQuery = "";
    },

    async setTaskDetails() {
      this.selectedProject = this.projects.find(project => project.id === this.task?.project_id) ?? null;

      this.form = {
        project_id: this.task.project_id,
        product_id: this.task.product_id as number,
        name: this.task.name,
        status_id: this.task.status_id,
        priority_id: this.task.priority_id,
        assignee_to: this.task.task_assignees.map(assignee => assignee.user_id),
        due_date: this.task.due_date ? this.task.due_date.toString() : "",
        input_data: this.task.input_data ?? "",
        output_data: this.task.output_data ?? "",
        parent_task_id: this.task.parent_task_id ? Number(this.task.parent_task_id) : null,
        description: this.task.description ?? ""
      };
      this.formInitial = JSON.stringify(this.form);

      this.isSubTask = this.task.parent_task_id !== null;

      this.selectedStatus = this.statuses.find(status => status.id === this.task?.status_id) ?? null;
      this.selectedPriority = this.priorities.find(priority => priority.id === this.task?.priority_id) ?? null;
      this.selectedAssignees = this.task.task_assignees.map(assignee => assignee.user);
      this.newComment = "";
      this.activeTab = "description";

      this.task.comments = await loadCommentsAndReplies(this.task.comments);
    },
    resetForm() {
      this.selectedProject = null;
      this.products = [];
      this.parentTasks = [];
      this.isSubTask = false;
      this.selectedProduct = null;
      this.selectedParentTask = null;
      this.selectedStatus = null;
      this.selectedPriority = null;
      this.selectedAssignees = [];
      this.activeTab = "description";
      this.form = {
        project_id: 0,
        product_id: 0,
        name: "",
        status_id: 0,
        priority_id: 0,
        assignee_to: [],
        due_date: "",
        input_data: "",
        output_data: "",
        parent_task_id: null,
        description: ""
      };
      this.formInitial = JSON.stringify(this.form);
    },
    handleClickReplyButton(commentId: number) {
      // Toggle the reply form for the selected comment
      this.selectedCommentIdToReply = this.selectedCommentIdToReply === commentId ? null : commentId;
    },
    deleteTask() {
      if (this.task) {
        this.$emit("onDeleteTask", this.task.id);
        this.handleCloseModal();
      }
    },
    async submit() {
      if (this.isSaving) return; // Prevent multiple submissions

      const isFormValid = validateForm(this.form, this.toast, this.isSubTask);
      if (!isFormValid) return;

      if (!this.form.parent_task_id && this.isSubTask && this.task) {
        this.form.parent_task_id = this.task.id;
      }

      try {
        this.isSaving = true;
        await this.$emit("onSubmit", this.form); // Add await here
        this.handleCloseModal(); // Only close if successful
      } catch (error) {
        console.error("Error submitting form:", error);
      } finally {
        this.isSaving = false;
      }
    },
    createComment() {
      if (!this.newCommentHasContent) {
        return;
      }

      this.$emit("onCreateComment", this.newComment, null, this.attachments);
      this.newComment = "";
      this.files = [];
      this.attachments = [];
    },
    handleReplyComment(commentId: number) {
      if (!this.replyCommentHasContent(commentId)) {
        return;
      }

      this.$emit("onReplyComment", this.replyComment, commentId, this.replyAttachments[commentId] || []);
      this.replyComment = ""; // Clear the input after submission
      this.replyFiles[commentId] = []; // Clear the file inputs
      this.replyAttachments[commentId] = []; // Clear the attachments
      this.selectedCommentIdToReply = 0;
    },
    replyCommentHasContent(commentId: number) {
      return this.replyComment.trim() || (this.replyAttachments[commentId] || []).length > 0;
    },
    async handleDownload(attachmentId: number) {
      this.$emit("onDownloadAttachment", attachmentId);
    },
    handleEscKey(event: KeyboardEvent) {
      if (event.key === "Escape" && this.isVisible) {
        this.isChangeForm() ? this.$bvModal.show("drawer-close") : this.handleCloseModal();
      }
    }
  }
});
