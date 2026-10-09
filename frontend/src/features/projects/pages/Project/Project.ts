import { defineComponent, Ref, ref } from "vue";
import { ProjectService } from "../../services";
import { Project, TaskState } from "@/common/models";
import { PlusIcon, ButtonCustom, ButtonSwitch, SelectOption, Toast, getSelectedOption, ClockIcon } from "@/components";
import {
  BulkActionToolbar,
  ProjectsTable,
  SearchInput,
  StatusFilterDropdown,
  TotalSumProject,
  ShareDialog
} from "../../components";
// @ts-ignore
import authModule from "@/core/services/store/auth.module";
import { ERouteQueryParams, getQueryParameter, removeQueryParameter } from "@/common";
import { defaultStatusFilterOption } from "../../constants";
import { IProjectStats } from "../../dtos";
interface ConnectionProject {
  id: number;
  name: string;
}

interface ConnectionItem {
  name: string;
  connected: number;
  projects: ConnectionProject[];
}

const projectsService = new ProjectService();

export default defineComponent({
  name: "ProjectPage",
  components: {
    ButtonCustom,
    ButtonSwitch,
    PlusIcon,
    SearchInput,
    StatusFilterDropdown,
    TotalSumProject,
    ClockIcon,
    ProjectsTable,
    BulkActionToolbar,
    ShareDialog
  },
  metaInfo: {
    title: "Project"
  },
  mixins: [Toast],
  setup() {
    const defaultPageSize = 10;
    const projects = ref<Project[]>([]);
    const projectStats = ref<IProjectStats>({
      total_active_projects: 0,
      total_open_gross_amount: 0,
      total_open_net_amount: 0,
      total_project_amount: 0,
      total_remaining_amount: 0
    });
    const search = ref<string>("");
    const isCreate = ref<boolean>(false);
    const selectedStatus = ref<string | null>("active");
    const selectedProjects = ref<number[]>([]);
    const statusOptions: Ref<SelectOption[]> = ref<SelectOption[]>(defaultStatusFilterOption);
    const currentPage = Number(getQueryParameter(ERouteQueryParams.PAGE)) || 1;
    const totalItems = ref<number>(0);
    const totalPages = ref<number>(0);

    const fetchProjects = async () => {
      const fetchedProjects = await projectsService.getProjects({
        status: "active",
        page: currentPage ? +currentPage : 1,
        page_size: defaultPageSize
      });
      projects.value = fetchedProjects?.items || [];
      totalItems.value = fetchedProjects?.total_items || 0;
      totalPages.value = fetchedProjects?.total_pages || 0;
    };
    const fetchStats = async () => {
      const stats = await projectsService.getProjectStats();
      projectStats.value = stats || {
        total_active_projects: 0,
        total_open_gross_amount: 0,
        total_open_net_amount: 0,
        total_project_amount: 0,
        total_remaining_amount: 0
      };
    };

    return {
      projects,
      defaultPageSize,
      currentPage,
      search,
      statusOptions,
      isCreate,
      selectedStatus,
      selectedProjects,
      fetchProjects,
      fetchStats,
      projectStats,
      totalItems,
      totalPages
    };
  },
  data() {
    return {
      currentUser: authModule.state.user,
      isDrawerVisible: false,
      sortProjects: "",
      fetchingListProjects: false,
      loading: true, // Add loading state for initial page load
      statuses: [] as TaskState[],
      share_dialog: false,
      connections: [] as ConnectionItem[],
      selectedProjectConnectionId: null as number | null,
      loadingShareDialog: false,
      bulkStatusOptions: [
        { value: "active", label: this.$t("status.active") },
        { value: "archive", label: this.$t("status.archive") },
        { value: "internal", label: this.$t("status.internal") }
      ]
    };
  },
  async mounted() {
    try {
      this.loading = true; // Set loading to true when fetching data
      await this.fetchProjects();
      await this.fetchStats();
    } catch (error) {
      console.error("Error loading projects page:", error);
    } finally {
      this.loading = false; // Set loading to false when done
    }
  },
  methods: {
    getStatus() {
      return this.selectedStatus || "";
    },

    async fetchData(isResetPagination: boolean = false, action?: string) {
      if (isResetPagination) {
        removeQueryParameter(ERouteQueryParams.PAGE);
      }
      this.currentPage = Number(getQueryParameter(ERouteQueryParams.PAGE)) || 1;
      this.fetchingListProjects = true;
      const page = getQueryParameter(ERouteQueryParams.PAGE) || 1;

      try {
        const response = await projectsService.getProjects({
          status: this.getStatus(),
          search: this.search,
          page: page ? +page : 1,
          page_size: this.defaultPageSize,
          sort: this.sortProjects
        });
        this.projects = response?.items || [];

        //recalculate total pages
        this.totalItems = response?.total_pages || 0;
        this.totalPages = response?.total_pages || 0;
      } catch (error) {
        console.error("Error fetching projects:", error);
      } finally {
        this.fetchingListProjects = false;
      }
    },

    async handleOnSearch(value: string) {
      this.search = value;
      await this.fetchData(true);
    },

    async handleOnOpenDetail(project: Project | null) {
      if (project) {
        this.goTo(`/project/${project.id}`);
      }
    },

    async handleStatusFilterChanged(options: SelectOption[]) {
      const selectedOption = getSelectedOption(options);
      this.selectedStatus = selectedOption ? selectedOption.value : null;
      this.statusOptions = options;
      this.selectedProjects = [];
      await this.fetchData(true);
    },

    handleOnSortProjects(sortOrder: string) {
      this.sortProjects = sortOrder;
      this.fetchData();
    },

    updateSelectedProjects(projectId: number, add: boolean) {
      if (add) {
        if (!this.selectedProjects.includes(projectId)) {
          this.selectedProjects.push(projectId);
        }
      } else {
        const projectIndex = this.selectedProjects.indexOf(projectId);
        if (projectIndex > -1) {
          this.selectedProjects.splice(projectIndex, 1);
        }
      }
    },

    handleSelectProject(selected: boolean, project: Project | null) {
      if (!project) return;

      if (selected) {
        this.selectedProjects.push(project.id);
      } else {
        this.selectedProjects = this.selectedProjects.filter(id => id !== project.id);
      }
    },

    handleSelectAllProjects(event: boolean, listProjects: Project[]) {
      listProjects.forEach(project => {
        this.updateSelectedProjects(project.id, event);
      });
    },

    async handleOnDeleteProject({ projectId }: { projectId: number }) {
      try {
        await projectsService.deleteProject(projectId);

        await this.fetchStats();
        await this.fetchData(true);

        this.toast("Project has been deleted successfully!", "success");
      } catch (error) {
        this.toast("Unable to delete Projects!", "danger");
      }
    },

    async handleOnPrintProject(id: number) {
      await projectsService.printProject(id);
    },

    async handleOnCopyProject(id: number) {
      try {
        const result = await projectsService.copyProject(id);
        this.toast(this.$t("msg.copySuccess").toString(), "success");

        if (result.success) {
          await this.fetchStats();
          await this.fetchData(true, "copy");
        }
      } catch (error) {
        console.error("Error during copy offer:", error);
        this.toast("Unable to copy the item.", "danger");
      }
    },

    async handleDeleteBulk(listIds: number[]) {
      try {
        const result = await projectsService.bulkDeleteProject(listIds.map(id => Number(id)));
        if (result.error === false) {
          this.toast("Bulk delete items successful!", "success");

          await this.fetchData(true, "bulk");
          await this.fetchStats();

          this.selectedProjects.splice(0, this.selectedProjects.length);
        }
      } catch (error) {
        this.toast("Unable to delete Projects!", "danger");
      }
    },

    async handleCopyBulk(listIds: number[]) {
      try {
        const deletePromises = listIds.map(id => projectsService.copyProject(id));
        const results = await Promise.all(deletePromises);
        const allSuccessful = results.every(result => result.success === true);
        if (allSuccessful) {
          this.toast("Bulk copy items successful!", "success");
          await this.fetchStats();
          await this.fetchData(true, "copy");
          this.selectedProjects.splice(0, this.selectedProjects.length);
        } else {
          this.toast("Some items could not be copied.", "danger");
        }
      } catch (error) {
        console.error("Error during bulk copy:", error);
        this.toast("Unable to bulk copy Projects!", "danger");
      }
    },

    async handlePrintBulk(listIds: number[]) {
      try {
        await projectsService.bulkPrintProject(listIds);
        this.toast("Bulk print initiated!", "success");
      } catch (error) {
        console.error("Error during bulk print:", error);
        this.toast("Unable to print Projects!", "danger");
      }
    },
    async handleUpdateBulk(listIds: number[], status: string) {
      try {
        await projectsService.bulkUpdateProjectStatus(listIds, status);
        this.toast(this.$t("msg.updateSuccess").toString(), "success");
        await this.fetchData(true, "bulk");
        await this.fetchStats();
        this.selectedProjects.splice(0, this.selectedProjects.length);
      } catch (error) {
        this.toast("Unable to update status for Projects!", "danger");
      }
    },

    async handleOnToggleSharing(id: number) {
      this.selectedProjectConnectionId = id;
      // Show the sharing dialog
      this.share_dialog = !this.share_dialog;
    },

    async confirmConnect(projectIds: number[]) {
      try {
        await projectsService.connectProject(this.selectedProjectConnectionId as number, { project_ids: projectIds });
        await this.fetchData(true);
        await this.fetchStats();
        this.toast(this.$t("msg.updateSuccess").toString(), "success");
        this.share_dialog = false;
      } catch (error) {
        console.error("Error connecting projects:", error);
        this.toast("Unable to connect projects", "danger");
      }
    },

    async deleteConnect() {
      try {
        await projectsService.connectProject(this.selectedProjectConnectionId as number, { project_ids: [] });
        await this.fetchData(true);
        await this.fetchStats();
        this.toast(this.$t("msg.delSuccess").toString(), "success");
        this.share_dialog = false;
      } catch (error) {
        console.error("Error removing connections:", error);
        this.toast("Unable to remove connections", "danger");
      }
    },

    goTo(pathName: string) {
      this.$router.push(pathName);
    }
  }
});
