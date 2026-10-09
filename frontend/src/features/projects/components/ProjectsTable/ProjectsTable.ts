import { formatDate, PaginatedResponse, truncateByWords, countWordsInText } from "@/common";
import { Offer } from "@/common/models/offers.model";
import {
  ButtonCustom,
  ITableDefaultFunctions,
  ITableField,
  ITablePagination,
  SeverityBadge,
  SortIcon,
  TrashDetailedIcon,
  CopyIcon,
  PrintIcon,
  ConfirmModal,
  PaperClip
} from "@/components";
import { computed, defineComponent, PropType, ref, Ref } from "vue";
import currency from "currency.js";
import i18nService from "@/core/services/i18n.service.js";
import ProjectTableLayout from "../ProjectTableLayout/ProjectTableLayout";
import { defaultStatuses } from "../../constants/statuses.constant";
import { Project } from "@/common/models";

export interface IProjectItem {
  id: number | string;
  companyName: string;
  projectNbr: string | number;
  title: string;
  sumNet: number;
  sumGross: number;
  invoicedNet: number;
  invoicedGross: number;
  remainingNet: number;
  remainingGross: number;
  hoursTotal: number;
  hoursWritten: {
    value: string;
    color: string;
  };
  status: {
    label: string;
    color: string;
  };
  createdOn: Date | null;
  endedOn: Date | null;
}

export default defineComponent({
  name: "ProjectsTable",
  components: {
    ButtonCustom,
    SortIcon,
    ConfirmModal,
    TrashDetailedIcon,
    SeverityBadge,
    CopyIcon,
    PrintIcon,
    ProjectTableLayout,
    PaperClip
  },
  props: {
    projectsData: {
      type: Array as PropType<Array<Project>>,
      default: () => [],
      required: true
    },
    totalItems: {
      type: Number,
      required: true
    },
    totalPages: {
      type: Number,
      required: true
    },
    currentPage: {
      type: Number,
      default: 1,
      required: true
    },
    selectedProjects: {
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
    onOpenDetail: (project: Project | null) => {},
    onSort: (order: string) => true,
    onChangePage: () => true,
    onSelectProject: (event: boolean, project: Project | null) => true,
    toggleSelectAllProjectsInTable: (event: boolean, listProjects: Project[]) => true,
    onDeleteProject: (payload: { projectId: number }) => true,
    onPrint: (id: number) => true,
    onCopy: (id: number) => true,
    onToggleSharing: (id: number) => true
  },
  setup() {
    const currentLanguage = computed(() => i18nService.getActiveLanguage());

    const fields: ITableField[] = [
      { key: "checkBox" },
      { key: "companyName", label: "Company/Name" },
      { key: "projectNbr", label: "Project Nr" },
      { key: "title", label: "Title" },
      { key: "sum", label: "Sum" },
      { key: "invoiced", label: "Invoiced" },
      { key: "remaining", label: "Remaining" },
      { key: "hoursTotal", label: "Hours Total" },
      { key: "hoursWritten", label: "Hours Written" },
      { key: "status", label: "Status" },
      { key: "createdOn", label: "Created on" },
      { key: "endedOn", label: "Ended on" },
      { key: "formCheckbox", label: "", thStyle: { width: "20px" } },
      { key: "actions", label: "", thStyle: { width: "50px" } }
    ];

    const tableDefault: Ref<ITableDefaultFunctions | null> = ref(null);
    const listProjects: Ref<IProjectItem[]> = ref<IProjectItem[]>([]);
    const pagination: Ref<ITablePagination | undefined> = ref<ITablePagination>();

    return {
      fields,
      tableDefault,
      listProjects,
      pagination,
      currentLanguage
    };
  },
  methods: {
    async toggleSharing(id: number) {
      this.$emit("onToggleSharing", id);
    },
    formatDate(date: Date, format: string) {
      return formatDate(date, format);
    },

    formatMoney(value: number) {
      return currency(value, {
        separator: "'",
        pattern: `#`,
        negativePattern: `-#`,
        increment: 0.05
      }).format();
    },

    handleChangePage() {
      this.$emit("onChangePage");
    },

    areAllProjectsInTableSelected() {
      return (
        this.projectsData &&
        this.projectsData.length > 0 &&
        this.selectedProjects.length > 0 &&
        this.selectedProjects.length === this.projectsData.length
      );
    },

    openDetail(projectItem: IProjectItem[]) {
      if (projectItem.length === 0) return;

      const selectedProject = this.projectsData.find(project => project.id === projectItem[0].id) || null;

      if (this.tableDefault && typeof this.tableDefault.clearSelected === "function") {
        this.tableDefault.clearSelected();
      }
      this.$emit("onOpenDetail", selectedProject);
    },

    handleSelectRow(event: boolean, projectId: number) {
      const project = this.projectsData.find(project => project.id === projectId) ?? null;
      this.$emit("onSelectProject", event, project);
    },

    handleAllRowSelected(event: boolean) {
      this.$emit("toggleSelectAllProjectsInTable", event, this.projectsData);
    },

    deleteProject(projectId: number) {
      this.$emit("onDeleteProject", { projectId });
    },

    handleSort(field: string) {
      if (!this.projectsData || this.projectsData.length === 0) return;

      const { sortOrder } = this.updateSortOrder(this.sortOrder, field);
      this.$emit("onSort", sortOrder);
    },

    handlePrint(id: number) {
      this.$emit("onPrint", id);
    },

    handleCopy(id: number) {
      this.$emit("onCopy", id);
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

    populateListProjects() {
      this.listProjects = this.projectsData.map(project => {
        const status = defaultStatuses.find(s => s.value === project.status);

        return {
          id: project.id,
          companyName: project.customer.company
            ? project.customer.company
            : `${project.customer.first_name}, ${project.customer.last_name}`,
          projectNbr: project.number?.custom_id ? project.number.custom_id : project.number.id,
          title: project.name + ", " + project.details.location || "",
          sumNet: project.detail_cost.total_net || 0,
          sumGross: project.total_amount_gross || 0,
          invoicedNet: project.invoiced || 0,
          invoicedGross: project.invoiced_gross || 0,
          remainingNet: project.remaining || 0,
          remainingGross: project.remaining_gross || 0,
          hoursTotal: project.total_hours || 0,
          hoursWritten: {
            value: (project.logged_hours || 0).toFixed(2) + "h",
            color: "#006BFF"
          },
          status: {
            label: status ? status.label.charAt(0).toUpperCase() + status.label.slice(1).toLowerCase() : "",
            value: status ? status.value : "",
            color: status ? status.color : ""
          },
          createdOn: project.created_at ? new Date(project.created_at) : null,
          endedOn: project.end_on ? new Date(project.end_on) : null
        };
      });
      this.pagination = {
        currentPage: this.currentPage,
        pageSize: 10,
        totalItems: this.totalItems,
        totalPages: this.totalPages
      };
    }
  },
  watch: {
    projectsData: {
      handler() {
        this.populateListProjects();
      },
      immediate: true
    }
  }
});
