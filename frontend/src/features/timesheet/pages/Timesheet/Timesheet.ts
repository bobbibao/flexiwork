import { defineComponent, Ref, ref } from "vue";
import {
  ButtonCustom,
  GroupDropdown,
  ChevronLeft,
  ChevronRight,
  PlusIcon,
  SelectOption,
  Toast,
  UserIcon,
  Dropdown,
  ChevronDownIcon,
  getSelectedOption
} from "@/components";
import { TimesheetsService } from "../../services";
// @ts-ignore
import authModule from "@/core/services/store/auth.module";
import { DateRangePicker, ReportModal, SearchInput, TimesheetModal, TimesheetTable } from "../../components";
import { Project, Task } from "@/common/models";
import { GroupOption } from "@/components/molecules/GroupDropdown/GroupDropdown";
import { CreateWorkItemDto, WorkItemDto, WorkLogDto } from "../../dtos";
import { TimesheetForm } from "../../components/TimesheetModal/type";

const timesheetService = new TimesheetsService();

export default defineComponent({
  name: "TimesheetPage",
  components: {
    DateRangePicker,
    SearchInput,
    ButtonCustom,
    PlusIcon,
    UserIcon,
    Dropdown,
    ChevronLeft,
    ChevronRight,
    TimesheetTable,
    GroupDropdown,
    ReportModal,
    TimesheetModal,
    ChevronDownIcon
  },
  metaInfo: {
    title: "Timesheet"
  },
  mixins: [Toast],
  setup() {
    const projects: Ref<Project[]> = ref<Project[]>([]);
    const projectsForSummary: Ref<Project[]> = ref<Project[]>([]);
    const selectedDate = ref<string | null>("week");
    const selectedScope = ref<string | null>("all");
    const selectedUser = ref<string | null>(null);
    const startDate = ref<Date | null>(null);
    const endDate = ref<Date | null>(null);
    const reportDate = ref<Date | null>(null);
    const searchInput = ref<string>("");
    return {
      reportDate,
      projects,
      projectsForSummary,
      selectedDate,
      selectedScope,
      selectedUser,
      searchInput,
      startDate,
      endDate
    };
  },
  data() {
    const users: Ref<SelectOption[]> = ref<SelectOption[]>([]);
    const projectOptions: Ref<SelectOption[]> = ref<SelectOption[]>([
      { label: this.$t("report.singleProject"), value: "projects", selected: true }
    ]);
    const scopeOptions: Ref<SelectOption[]> = ref<SelectOption[]>([
      { label: this.$t("timesheet.all"), value: "all", selected: true },
      { label: this.$t("timesheet.billable"), value: "billable" },
      { label: this.$t("timesheet.internal"), value: "internal" }
    ]);
    const viewOptions: Ref<GroupOption[]> = ref<GroupOption[]>([]);

    return {
      users,
      projectOptions,
      scopeOptions,
      viewOptions,
      currentUser: authModule.state.user,
      isDrawerVisible: false,
      sortOffers: "",
      fetchingListOffers: false,
      reportVisible: false,
      addTimeSheetVisible: false,
      isLockMode: false,
      loading: false,
      isFetchingData: false,
      selectedViewOptions: [] as string[],
      cachedDisplayWorkItems: [] as WorkItemDto[], // Cache display work items
      cachedProjectsData: null as { cacheKey: string; projects: Project[]; timestamp: number } | null, // Cache projects data
      cachedProjectsForSummaryData: null as { cacheKey: string; projects: Project[]; timestamp: number } | null // Cache projects for summary data
    };
  },
  computed: {
    isAdmin() {
      return authModule.state.user.role === "admin";
    },
    daysCount() {
      return this.startDate && this.endDate
        ? Math.ceil(Math.abs(this.endDate.getTime() - this.startDate.getTime()) / (1000 * 60 * 60 * 24))
        : 0;
    }
  },
  async mounted() {
    this.selectedUser = this.currentUser.id;
    await Promise.all([this.fetchUsers(), this.fetchProjectsForSummary()]);
  },
  methods: {
    async fetchData() {
      if (this.loading) {
        return; // Prevent multiple fetches
      }
      try {
        this.loading = true;

        // Fetch projects and cache them for later filtering
        this.projects = await this.fetchProjects();
      } catch (error) {
        console.error("Error fetching projects:", error);
        this.toast("Failed to fetch projects!", "danger");
      } finally {
        this.loading = false;
      }
    },
    getSelectingUserId(): number {
      return this.selectedUser ? Number(this.selectedUser) : Number(this.currentUser.id as string);
    },
    async handleSaveTimesheet(formData: TimesheetForm) {
      if (!formData.project_id || !formData.product_id) {
        return;
      }
      if (!this.selectedUser) {
        return;
      }
      const workItem: CreateWorkItemDto = {
        project_id: formData.project_id,
        product_id: formData.product_id,
        task_ids: formData.task_ids || [],
        user_id: Number(this.selectedUser)
      };
      await timesheetService.addWorkItem(workItem);
      this.toast(String(this.$t("msg.changeSuccess")), "success");
      this.addTimeSheetVisible = false;
      await this.fetchData();
    },

    async handleUpdateWorkLog(workItem: WorkLogDto, isCommentOnlyUpdate: boolean = false) {
      try {
        const res = await timesheetService.updateWorkLog(workItem);
        if (res.error) {
          this.toast(res.message || "Failed to update timesheet", "danger");
          return;
        }

        // Comment changes don't affect totals or flex hours calculations
        if (!isCommentOnlyUpdate) {
          // Update flex hours first, then update summary data
          await this.updateFlexHours();

          // Force refresh of TimesheetTable summary caches
          this.invalidateTimesheetTableCaches();
        }

        this.toast(String(this.$t("msg.changeSuccess")), "success");
      } catch (error) {
        this.toast("Failed to update timesheet", "danger");
      }
    },
    // Method to force refresh TimesheetTable caches when flex hours are updated
    invalidateTimesheetTableCaches(preserveFlexHours: boolean = false) {
      const timesheetTableRef = this.$refs.timesheetTable as any;
      if (timesheetTableRef) {
        if (preserveFlexHours) {
          // Use selective cache invalidation that preserves flex hours
          timesheetTableRef.cachedProjectTotals = {};
          timesheetTableRef.cachedProductTotals = {};
          timesheetTableRef.cachedTaskTotals = {};
          timesheetTableRef.cachedDayTotals = {};

          // Only invalidate non-flex-hours summary caches
          const SUMMARY_KEYS = timesheetTableRef.SUMMARY_KEYS;
          if (timesheetTableRef.cachedSummaryValues[SUMMARY_KEYS.TOTAL_HOURS]) {
            delete timesheetTableRef.cachedSummaryValues[SUMMARY_KEYS.TOTAL_HOURS];
          }
          if (timesheetTableRef.cachedSummaryTotals[SUMMARY_KEYS.TOTAL_HOURS] !== undefined) {
            delete timesheetTableRef.cachedSummaryTotals[SUMMARY_KEYS.TOTAL_HOURS];
          }
          if (timesheetTableRef.cachedSummaryValues[SUMMARY_KEYS.DIFFERENT]) {
            delete timesheetTableRef.cachedSummaryValues[SUMMARY_KEYS.DIFFERENT];
          }
          if (timesheetTableRef.cachedSummaryTotals[SUMMARY_KEYS.DIFFERENT] !== undefined) {
            delete timesheetTableRef.cachedSummaryTotals[SUMMARY_KEYS.DIFFERENT];
          }

          // Force re-initialization with flex hours preservation
          this.$nextTick(() => {
            timesheetTableRef.initializeCachesSelective(true);
          });
        } else {
          // Invalidate all caches in TimesheetTable
          timesheetTableRef.invalidateAllCaches();
          // Force re-initialization of caches
          this.$nextTick(() => {
            timesheetTableRef.initializeCaches();
          });
        }
      }
    },
    async updateFlexHours() {
      try {
        const query = {
          user_id: Number(this.selectedUser || String(this.currentUser.id)), // Use current selected user or fallback to currentUser if not selected
          start_date: this.startDate ? this.startDate.toISOString() : "",
          end_date: this.endDate ? this.endDate.toISOString() : ""
        };

        const response = await timesheetService.getFlexHours(query);

        // Get reference to TimesheetTable component
        const flexHoursComponent = this.$refs.timesheetTable as any;

        if (response?.payload && Array.isArray(response.payload)) {
          // Update flexHours data based on the response payload
          if (flexHoursComponent) {
            flexHoursComponent.flexHoursData = response.payload.map(item => ({
              date: new Date(item.date),
              actual_hours: item.actual_hours,
              flex_hours: item.flex_hours
            }));

            // Force invalidate flex hours caches and recalculate
            flexHoursComponent.invalidateFlexHoursCaches();

            // Force recalculation immediately
            this.$nextTick(() => {
              flexHoursComponent.dateHeaders.forEach((header: any) => {
                const dateKey = this.formatDate(header.date, "YYYY-MM-DD");
                flexHoursComponent.getCachedSummaryValue(flexHoursComponent.SUMMARY_KEYS.FLEXIBLE_HOURS, dateKey);
              });
              flexHoursComponent.getCachedSummaryTotal(flexHoursComponent.SUMMARY_KEYS.FLEXIBLE_HOURS);

              // Force UI update to ensure changes are visible
              flexHoursComponent.$forceUpdate();
            });
          }
        }

        if (response?.holidays && Array.isArray(response.holidays)) {
          if (flexHoursComponent) {
            flexHoursComponent.holidays = response.holidays.map(holiday => ({
              date: new Date(holiday.date),
              label: holiday.label
            }));
          }
        }
      } catch (error) {
        console.error("Error updating flex hours:", error);
      }
    },

    // Helper method to format dates consistently
    formatDate(date: Date, format: string): string {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");

      if (format === "YYYY-MM-DD") {
        return `${year}-${month}-${day}`;
      }
      return date.toISOString();
    },
    async handleOnSearch(value: string) {
      this.searchInput = value;
      await this.fetchData();
    },
    async handleOptionChanges(options: SelectOption[], type: string) {
      const selectedOption = getSelectedOption(options);
      if (type === "user") {
        const newUserId = selectedOption ? selectedOption.value : null;
        // Only proceed if user actually changed
        if (newUserId === this.selectedUser) {
          return;
        }

        // Reset filters and data when changing users
        this.selectedScope = "all";
        this.scopeOptions = this.scopeOptions.map(option => ({
          ...option,
          selected: option.value === "all"
        }));
        this.viewOptions = [];
        this.projects = [];
        this.projectsForSummary = []; // Reset summary to force refresh

        // Clear all caches when user changes
        this.cachedProjectsData = null;
        this.cachedProjectsForSummaryData = null;

        // Reset GroupDropdown initialization flag
        if (this.$refs.groupDropdown) {
          (this.$refs.groupDropdown as any).isInitialized = false;
        }

        // First, invalidate all TimesheetTable caches before changing user
        this.invalidateTimesheetTableCaches();

        // Set the user after cache invalidation
        this.selectedUser = newUserId;

        // Wait for user watcher to complete before proceeding
        await this.$nextTick();

        // Fetch data and flex hours sequentially to avoid race conditions
        await this.fetchData();
        await this.fetchProjectsForSummary();

        // Force final update to ensure flex hours are visible
        this.$nextTick(() => {
          const timesheetTableRef = this.$refs.timesheetTable as any;
          if (timesheetTableRef && timesheetTableRef.flexHoursData?.length > 0) {
            timesheetTableRef.$forceUpdate();
          }
        });
      } else if (type === "scope") {
        const newScope = selectedOption ? selectedOption.value : null;

        // Only proceed if scope actually changed
        if (newScope === this.selectedScope) {
          return;
        }

        this.selectedScope = newScope;
        // Clear cache when scope changes
        this.cachedProjectsData = null;
        // Only fetch main data for scope changes
        await this.fetchData();

        // Use selective cache invalidation to preserve flex hours for scope changes
        this.invalidateTimesheetTableCaches(true);
      }
    },
    async handleDateRangeSelected(dateRange: { startDate: Date; endDate: Date }) {
      this.startDate = dateRange.startDate;
      this.endDate = dateRange.endDate;
      // Clear caches when date range changes
      this.cachedProjectsData = null;
      this.cachedProjectsForSummaryData = null;

      // Invalidate TimesheetTable caches since date range affects all calculations
      this.invalidateTimesheetTableCaches();

      // Fetch data with new date range and update flex hours
      await Promise.all([this.fetchData(), this.fetchProjectsForSummary()]);

      // Force refresh summary after all data is loaded
      this.$nextTick(() => {
        const timesheetTableRef = this.$refs.timesheetTable as any;
        if (timesheetTableRef) {
          timesheetTableRef.invalidateSummaryCaches();
        }
      });
    },
    openReportModal(isLock = false) {
      this.isLockMode = isLock;
      this.reportVisible = true;
    },
    cancelReport() {
      this.reportVisible = false;
    },
    async confirmReport($event: string) {
      try {
        if (!this.isLockMode) {
          await timesheetService.unlockReport(true, $event, []);
          this.toast(String(this.$t("msg.updateSuccess")), "success");
        } else {
          await timesheetService.lockReport(true, $event, this.currentUser.id);
          this.toast(String(this.$t("msg.updateSuccess")), "success");
        }
      } catch (error) {
        //if error code == 400 printout you already submitted this month
        this.toast("Failed to update report!", "danger");
        console.error("Error updating report:", error);
      } finally {
        await this.fetchData();
        this.reportVisible = false;
      }
    },
    openAddTimeSheet() {
      this.addTimeSheetVisible = true;
    },
    cancelAddTimeSheet() {
      this.addTimeSheetVisible = false;
    },
    async handleMyTimesheet() {
      // Reset filters and data when switching to personal timesheet
      this.selectedScope = "all";
      this.scopeOptions = this.scopeOptions.map(option => ({
        ...option,
        selected: option.value === "all"
      }));
      this.viewOptions = [];
      this.projects = [];

      // Clear all caches when switching to personal timesheet
      this.cachedProjectsData = null;
      this.cachedProjectsForSummaryData = null;

      this.users = this.users.map(user => {
        user.selected = user.value === this.currentUser.id;
        return user;
      });

      // Reset GroupDropdown initialization flag
      if (this.$refs.groupDropdown) {
        (this.$refs.groupDropdown as any).isInitialized = false;
      }

      // First, invalidate all TimesheetTable caches before changing user
      this.invalidateTimesheetTableCaches();

      // Set the user after cache invalidation
      this.selectedUser = this.currentUser.id;

      // Wait for user watcher to complete before proceeding
      await this.$nextTick();

      // Fetch data and flex hours sequentially to avoid race conditions
      await this.fetchData();
      await this.fetchProjectsForSummary();

      // Force final update to ensure flex hours are visible
      this.$nextTick(() => {
        const timesheetTableRef = this.$refs.timesheetTable as any;
        if (timesheetTableRef && timesheetTableRef.flexHoursData?.length > 0) {
          timesheetTableRef.$forceUpdate();
        }
      });
    },

    // This method will be called when dropdown is opened
    async initializeViewOptions() {
      try {
        // Get display work items to populate the dropdown options
        const userId = Number(this.selectedUser || this.currentUser.id);
        const displayWorkItems = await timesheetService.getDisplayWorkItems(userId);

        // Cache display work items to avoid re-fetching
        this.cachedDisplayWorkItems = displayWorkItems;

        // Create view options directly from display work items
        this.populateViewOptionsFromDisplayWorkItems(displayWorkItems);

        // Set view options based on is_hide field from display work items
        this.updateViewOptionsFromWorkItems(displayWorkItems);

        // Set selectedViewOptions based on visible work items
        this.selectedViewOptions = [];
        this.viewOptions.forEach(group => {
          group.options.forEach(option => {
            if (option.selected) {
              this.selectedViewOptions.push(option.value);
            }
          });
        });
      } catch (error) {
        console.error("Error initializing view options:", error);
        this.toast("Failed to load view options!", "danger");
      }
    },
    populateViewOptionsFromDisplayWorkItems(workItems: WorkItemDto[]) {
      // Group work items by project
      const projectsMap = new Map<number, any>();
      const processedOptions = new Set<string>(); // Track processed options to avoid duplicates

      workItems.forEach(workItem => {
        const { project, product, tasks } = workItem;

        // Get or create project entry
        if (!projectsMap.has(project.id)) {
          projectsMap.set(project.id, {
            label: project.name || "",
            selected: true,
            options: []
          });
        }

        const projectEntry = projectsMap.get(project.id);

        // Create option based on whether it's a task or product work item
        let optionValue: string;
        let optionLabel: string;
        let optionDesc: string = "";

        if (tasks) {
          // Task-based work item
          optionValue = `project-${project.id}-product-${product.id}-task-${tasks.id}`;
          optionLabel = product.name || "";
          optionDesc = tasks.name || "";
        } else {
          // Product-based work item - use a more efficient check
          optionValue = `project-${project.id}-product-${product.id}`;
          optionLabel = product.name || "";
        }

        // Use Set for faster duplicate checking
        if (processedOptions.has(optionValue)) {
          return; // Skip if already processed
        }
        processedOptions.add(optionValue);

        // For product-only entries, check if there are tasks for this product
        if (!tasks) {
          const hasTasksForProduct = workItems.some(
            item => item.project.id === project.id && item.product.id === product.id && item.tasks
          );

          // Skip product-only entries if there are tasks for this product
          if (hasTasksForProduct) {
            return;
          }
        }

        // Use is_hide to determine selected state (inverted because is_hide means not selected)
        const isSelected = !workItem.is_hide;

        projectEntry.options.push({
          label: optionLabel,
          value: optionValue,
          desc: optionDesc,
          selected: isSelected
        });
      });

      // Convert map to array and update group selected states
      this.viewOptions = Array.from(projectsMap.values()).map(group => {
        const selectedCount = group.options.filter((opt: { selected: any }) => opt.selected).length;
        const allSelected = selectedCount === group.options.length;
        const someSelected = selectedCount > 0;

        return {
          ...group,
          selected: allSelected,
          indeterminate: someSelected && !allSelected
        };
      });
    },

    async fetchUsers() {
      const users = await timesheetService.getSimpleUsers();
      this.users = users.map(user => ({
        label:
          user.first_name || user.last_name
            ? `${user.first_name || ""} ${user.last_name || ""} (${user.email})`.trim()
            : user.email,
        value: user.id,
        selected: user.id === this.currentUser.id
      }));
    },
    async handleViewOptionsChange(selectedValues: string[]) {
      // Store selected values for later use when saving
      this.selectedViewOptions = selectedValues;
    },

    // Method to save view options - called by GroupDropdown when needed
    async applyViewOptions() {
      try {
        // Save current selections
        await this.saveViewOptions();
        // Clear cache since view options changed
        this.cachedProjectsData = null;
        this.projects = await this.fetchProjects();
      } catch (error) {
        this.toast("Failed to apply view options!", "danger");
      }
    },
    updateViewOptionsFromWorkItems(workItems: WorkItemDto[]) {
      // Update viewOptions based on the is_hide field from work items
      this.viewOptions = this.viewOptions.map(group => {
        const updatedOptions = group.options.map(option => {
          // Extract work item info from option value
          const parts = option.value.split("-");
          const workItemId = parts.length > 5 ? Number(parts[5]) : null;

          // Find corresponding work item by ID
          const workItem = workItems.find(item => item.id === workItemId);

          return {
            ...option,
            selected: workItem ? !workItem.is_hide : option.selected
          };
        });

        // Update group selected state based on its options
        const selectedCount = updatedOptions.filter(opt => opt.selected).length;
        const allSelected = selectedCount === updatedOptions.length;
        const someSelected = selectedCount > 0;

        return {
          ...group,
          options: updatedOptions,
          selected: allSelected,
          indeterminate: someSelected && !allSelected
        };
      });
    },
    async saveViewOptions() {
      try {
        const userId = Number(this.selectedUser || this.currentUser.id);

        // Use cached display work items instead of calling API again
        const displayWorkItems = this.cachedDisplayWorkItems;

        // Create arrays for visible and hidden work item IDs
        const visibleWorkItemIds: number[] = [];
        const hiddenWorkItemIds: number[] = [];

        // Process each work item to determine if it should be visible or hidden
        displayWorkItems.forEach(workItem => {
          const projectId = workItem.project.id;
          const productId = workItem.product.id;
          const taskId = workItem.tasks ? workItem.tasks.id : null;

          // Build the expected value based on whether it's a task or product work item
          let expectedValue: string;
          if (taskId) {
            expectedValue = `project-${projectId}-product-${productId}-task-${taskId}`;
          } else {
            expectedValue = `project-${projectId}-product-${productId}`;
          }

          // Check if this work item should be visible
          if (this.selectedViewOptions && this.selectedViewOptions.includes(expectedValue)) {
            visibleWorkItemIds.push(workItem.id);
          } else {
            hiddenWorkItemIds.push(workItem.id);
          }
        });

        // Update display work items - send only visible IDs to show, others will be hidden
        await timesheetService.updateDisplayWorkItems(visibleWorkItemIds, userId);

        this.toast(String(this.$t("msg.updateSuccess")), "success");
      } catch (error) {
        console.error("Error saving view options:", error);
        this.toast("Failed to save view options!", "danger");
      }
    },

    async fetchProjects() {
      try {
        const queryParams = this.getWorkItemsQueryParams();
        const cacheKey = this.generateCacheKey(queryParams);

        // Check if we have cached data for the same parameters
        if (this.cachedProjectsData && this.cachedProjectsData.cacheKey === cacheKey) {
          return this.cachedProjectsData.projects;
        }

        const allWorkItems = (await timesheetService.getWorkItems(
          queryParams.startDate,
          queryParams.endDate,
          queryParams.filter,
          queryParams.searchInput,
          queryParams.userId
        )) as WorkItemDto[];

        // Filter out hidden work items using is_hide field
        const visibleWorkItems = allWorkItems.filter(item => !item.is_hide);

        const projects = this.mapWorkItemsToProjects(visibleWorkItems);

        // Cache the results
        this.cachedProjectsData = {
          cacheKey,
          projects,
          timestamp: Date.now()
        };

        return projects;
      } catch (error) {
        console.error("Error in fetchTimesheets:", error);
        throw error;
      }
    },

    generateCacheKey(queryParams: any): string {
      return `${queryParams.startDate}-${queryParams.endDate}-${queryParams.filter}-${queryParams.searchInput}-${queryParams.userId}`;
    },

    generateFlexHoursCacheKey(queryParams: any): string {
      // Flex hours cache key only depends on user, start date, and end date
      return `flexhours-${queryParams.userId}-${queryParams.startDate}-${queryParams.endDate}`;
    },

    generateSummaryCacheKey(queryParams: any): string {
      // Summary cache key doesn't include filter or search since it always uses "all" filter and no search
      return `summary-${queryParams.userId}-${queryParams.startDate}-${queryParams.endDate}`;
    },

    async fetchProjectsForSummary() {
      try {
        const queryParams = this.getWorkItemsQueryParams();

        // Generate cache key for summary (always use "all" filter and no search)
        const summaryCacheKey = this.generateSummaryCacheKey(queryParams);

        // Check if we have cached summary data
        if (this.cachedProjectsForSummaryData && this.cachedProjectsForSummaryData.cacheKey === summaryCacheKey) {
          this.projectsForSummary = this.cachedProjectsForSummaryData.projects;
          return;
        }

        const workItems = (await timesheetService.getWorkItems(
          queryParams.startDate,
          queryParams.endDate,
          "all",
          "",
          queryParams.userId
        )) as WorkItemDto[];
        const projects = this.mapWorkItemsToProjects(workItems);
        this.projectsForSummary = projects;

        // Cache the summary results
        this.cachedProjectsForSummaryData = {
          cacheKey: summaryCacheKey,
          projects,
          timestamp: Date.now()
        };
      } catch (error) {
        this.toast("Failed to fetch summary projects!", "danger");
      }
    },

    getWorkItemsQueryParams() {
      return {
        startDate: this.startDate ? this.startDate.toISOString() : "",
        endDate: this.endDate ? this.endDate.toISOString() : "",
        filter: this.selectedScope !== "all" ? (this.selectedScope as string) : "",
        searchInput: this.searchInput,
        userId: this.selectedUser || this.currentUser.id
      };
    },

    mapWorkItemsToProjects(workItems: WorkItemDto[]): Project[] {
      const projectsMap = new Map<number, Project>();

      // Group work items by project, product, and task to create a nested structure
      workItems.forEach(workItem => {
        const {
          id: workItemId,
          project: { id: projectId, name: projectName, status: projectStatus },
          product: { id: productId, name: productName },
          tasks,
          work_logs
        } = workItem;

        // Get or create project
        let project = projectsMap.get(projectId);
        if (!project) {
          project = ({
            id: projectId,
            name: projectName,
            status: projectStatus,
            products: []
          } as unknown) as Project;
          projectsMap.set(projectId, project);
        }

        // Find or create product using find for better readability
        let product = project.products.find(p => p.id === productId);
        if (!product) {
          product = {
            id: productId,
            name: productName,
            tasks: [],
            work_logs: [], // Initialize work_logs for product
            work_item_id: undefined // Don't set work_item_id initially
          };
          project.products.push(product);
        }

        // Check if this is a product-level work item (no tasks)
        if (!tasks) {
          // This is a product-level work item, add work_logs to product
          if (work_logs && work_logs.length > 0) {
            product.work_logs = product.work_logs || [];
            product.work_logs.push(...work_logs);
          }
          // Set work_item_id only for product-level entries (when no tasks)
          product.work_item_id = workItemId;
        } else {
          // This is a task-level work item
          const { id: taskId, name: taskName, parent_task_id } = tasks;
          const existingTaskIndex = product.tasks.findIndex(t => t.id === taskId);
          if (existingTaskIndex === -1) {
            const task: Task = ({
              id: taskId,
              name: taskName,
              parent_task_id: parent_task_id ?? null,
              work_logs,
              work_item_id: workItemId,
              project_id: projectId,
              product_id: productId,
              sub_tasks: []
            } as unknown) as Task;
            product.tasks.push(task);
          }
        }
      });

      return Array.from(projectsMap.values());
    }
  }
});
