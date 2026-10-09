import { defineComponent, Ref, ref } from "vue";
import { Project, Task } from "@/common/models";
import {
  SortIcon,
  Avatar,
  ConfirmModal,
  SeverityBadge,
  ButtonCustom,
  ChevronUpIcon,
  PlusIcon,
  ArrowReturnRight,
  TrashDetailedIcon,
  TimePlus,
  Toast
} from "@/components";
import { countWordsInText, truncateByWords, formatDate } from "@/common";
// @ts-ignore
import authModule from "@/core/services/store/auth.module";
import { TimesheetsService } from "../../services";
import { TimeSheetPeriods } from "@/common/models/timesheetPeriods.model";
import { FlexHours, Holidays } from "../../dtos/flexHours.dto";
import { WorkLogDto } from "../../dtos";
import EditableCell from "../EditableCell/EditableCell.vue";

const timesheetService = new TimesheetsService();

interface TaskHourWithComment {
  value: number;
  comment?: string;
}

// Define the summary key type for better type safety
const SUMMARY_KEYS = {
  MUST_WORK: "timesheet.mustWork",
  TOTAL_HOURS: "timesheet.totalHours",
  DIFFERENT: "timesheet.different",
  FLEXIBLE_HOURS: "timesheet.flexibleHours"
} as const;

export default defineComponent({
  name: "TimesheetTable",
  components: {
    SeverityBadge,
    SortIcon,
    Avatar,
    ConfirmModal,
    ButtonCustom,
    ChevronUpIcon,
    PlusIcon,
    ArrowReturnRight,
    TrashDetailedIcon,
    TimePlus,
    EditableCell
  },
  mixins: [Toast],
  props: {
    projects: {
      type: Array as () => Project[],
      required: true
    },
    projectsForSummary: {
      type: Array as () => Project[],
      required: true
    },
    viewMode: {
      type: String,
      default: "week",
      validator: (value: string) => ["week", "month"].includes(value)
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    daysCount: {
      type: Number,
      default: 7
    },
    isLoading: {
      type: Boolean,
      default: false
    },
    selectedUser: {
      type: Number,
      default: null
    }
  },
  emits: {
    onSelectTask: (event: boolean, task: Task) => {},
    updateWorkLog: (workLog: WorkLogDto, isCommentOnlyUpdate: boolean = false) => {}
  },
  setup(props) {
    const order: Ref<string> = ref("name:asc");
    const listProjectExpanded: Ref<number[]> = ref([]);
    const expandedProjects: Ref<number[]> = ref([]);

    return {
      order,
      currentUser: authModule.state.user,
      listProjectExpanded,
      expandedProjects,
      SUMMARY_KEYS // Add SUMMARY_KEYS to setup return value
    };
  },
  async mounted() {
    // Expand all projects by default
    this.expandedProjects = this.projects.map(project => project.id);
    // Populate taskHours object with work logs
    this.populateTaskHours();
    this.populateTaskHoursForSummary();
    this.initializeCaches();
  },
  data() {
    return {
      isDrawerVisible: false,
      editingCell: {
        projectId: null as number | null | undefined,
        productId: null as number | null | undefined,
        taskId: null as number | string | null,
        date: null as string | null
      },
      editValue: "" as string,
      taskHours: {} as Record<string, TaskHourWithComment>,
      taskHoursForSummary: {} as Record<string, TaskHourWithComment>,
      maxWorkHoursPerDay: 0,
      timesheetPeriods: [] as TimeSheetPeriods[],
      flexHoursData: [] as FlexHours[],
      holidays: [] as Holidays[],
      // Cache objects for performance optimization
      cachedProjectTotals: {} as Record<number, Record<string, number>>,
      cachedProductTotals: {} as Record<number, Record<string, number>>,
      cachedTaskTotals: {} as Record<number | string, number>,
      cachedDayTotals: {} as Record<string, number>,
      cachedSummaryValues: {} as Record<string, Record<string, number>>,
      cachedSummaryTotals: {} as Record<string, number>
    };
  },
  computed: {
    getMaxHourPerDay() {
      return this.maxWorkHoursPerDay;
    },
    sortSubTasks() {
      let sortedProjects = [...this.projects]; // Create a copy to avoid mutating props

      // Apply sorting based on current order
      const [field, direction] = this.order.split(":");
      const isAsc = direction === "asc";

      if (field === "name") {
        sortedProjects.sort((a, b) => {
          return isAsc ? (a.name || "").localeCompare(b.name || "") : (b.name || "").localeCompare(a.name || "");
        });
      } else if (field === "output_data") {
        sortedProjects.sort((a, b) => {
          const totalA = this.getProjectTotalHours(a.id);
          const totalB = this.getProjectTotalHours(b.id);
          return isAsc ? totalA - totalB : totalB - totalA;
        });
      }

      return sortedProjects.map(project => ({
        ...project,
        products: project.products.map(product => ({
          ...product,
          tasks: product.tasks
            .map((task, index, originTasks) => {
              if (task.parent_task_id === null) {
                const taskWithNames = {
                  ...task,
                  project_name: project.name,
                  product_name: product.name,
                  sub_tasks: [
                    ...(task.sub_tasks ?? []),
                    ...originTasks
                      .filter(t => t.parent_task_id === task.id)
                      .map(subtask => ({
                        ...subtask,
                        project_name: project.name,
                        product_name: product.name
                      }))
                  ]
                };
                return taskWithNames;
              }
              return null;
            })
            .filter(task => task !== null)
        }))
      }));
    },
    summaryRowCount(): number {
      return this.projects.length || 4;
    },
    taskRowCount(): number {
      return this.projects.reduce((total, project) => {
        return (
          total +
          project.products.reduce((prodTotal, product) => {
            // Count product row
            let count = 1;

            // Count tasks and their subtasks
            count += product.tasks.reduce((taskTotal, task) => {
              // Count task row
              let taskCount = 1;
              // Count subtask rows
              taskCount += task.sub_tasks?.length || 0;
              return taskTotal + taskCount;
            }, 0);

            return prodTotal + count;
          }, 0)
        );
      }, 0);
    },
    dateHeaders() {
      const dates = [];
      const currentDate = new Date(this.startDate);
      const daysToShow = this.daysCount;
      for (let i = 0; i < daysToShow; i++) {
        const date = new Date(currentDate);
        date.setUTCDate(currentDate.getUTCDate() + i);
        dates.push({
          date: date,
          label:
            date
              .getDate()
              .toString()
              .padStart(2, "0") +
            "." +
            (date.getMonth() + 1).toString().padStart(2, "0")
        });
      }

      return dates;
    },
    getProductTotals() {
      return (productId: number) => {
        return this.getCachedProductTotals(productId);
      };
    },
    getProjectTotals() {
      return (projectId: number) => {
        return this.getCachedProjectTotals(projectId);
      };
    },
    getMustWorkHours() {
      return (date: Date): number => {
        const dayOfWeek = date.getDay();
        // Return 0 for Saturday (6) and Sunday (0)
        if (dayOfWeek === 0 || dayOfWeek === 6 || this.isHoliday(date)) {
          return 0;
        }

        // Get actual hours based on timesheet periods or fallback to max work hours
        return this.getActualHoursForDate(date);
      };
    },
    getTotalMustWorkHours(): number {
      return this.dateHeaders.reduce((total, header) => {
        return total + this.getMustWorkHours(header.date);
      }, 0);
    },
    summaryData() {
      return [SUMMARY_KEYS.MUST_WORK, SUMMARY_KEYS.TOTAL_HOURS, SUMMARY_KEYS.DIFFERENT, SUMMARY_KEYS.FLEXIBLE_HOURS];
    }
  },
  watch: {
    projects: {
      handler(newProjects) {
        this.expandedProjects = newProjects.map((project: Project) => project.id);
        this.populateTaskHours();
      },
      immediate: true,
      deep: true
    },
    projectsForSummary: {
      handler() {
        this.populateTaskHoursForSummary();

        // Only invalidate caches that depend on summary project data
        this.cachedDayTotals = {};

        // Invalidate summary caches that depend on project data, but preserve flex hours
        if (this.cachedSummaryValues[SUMMARY_KEYS.TOTAL_HOURS]) {
          delete this.cachedSummaryValues[SUMMARY_KEYS.TOTAL_HOURS];
        }
        if (this.cachedSummaryTotals[SUMMARY_KEYS.TOTAL_HOURS] !== undefined) {
          delete this.cachedSummaryTotals[SUMMARY_KEYS.TOTAL_HOURS];
        }
        if (this.cachedSummaryValues[SUMMARY_KEYS.DIFFERENT]) {
          delete this.cachedSummaryValues[SUMMARY_KEYS.DIFFERENT];
        }
        if (this.cachedSummaryTotals[SUMMARY_KEYS.DIFFERENT] !== undefined) {
          delete this.cachedSummaryTotals[SUMMARY_KEYS.DIFFERENT];
        }
      },
      immediate: true,
      deep: true
    },
    startDate: {
      async handler(newStartDate) {
        if (newStartDate && this.endDate) {
          await this.getFlexHours();
          await this.selectUser(Number(this.selectedUser));

          // Invalidate summary caches since date range affects must work and flex hours calculations
          this.invalidateAllSummaryCaches();
        }
      },
      immediate: true
    },

    // Watch for changes in timesheetPeriods to invalidate must work calculations
    timesheetPeriods: {
      handler() {
        // Clear must work related caches
        if (this.cachedSummaryValues[SUMMARY_KEYS.MUST_WORK]) {
          delete this.cachedSummaryValues[SUMMARY_KEYS.MUST_WORK];
        }
        if (this.cachedSummaryTotals[SUMMARY_KEYS.MUST_WORK] !== undefined) {
          delete this.cachedSummaryTotals[SUMMARY_KEYS.MUST_WORK];
        }
        // Also clear different calculations since they depend on must work
        if (this.cachedSummaryValues[SUMMARY_KEYS.DIFFERENT]) {
          delete this.cachedSummaryValues[SUMMARY_KEYS.DIFFERENT];
        }
        if (this.cachedSummaryTotals[SUMMARY_KEYS.DIFFERENT] !== undefined) {
          delete this.cachedSummaryTotals[SUMMARY_KEYS.DIFFERENT];
        }
      },
      deep: true
    }
  },
  methods: {
    async getFlexHours() {
      // This method should only be called internally by TimesheetTable
      // Parent component should use updateFlexHours() instead
      const query = {
        user_id: this.selectedUser,
        start_date: formatDate(this.startDate, "YYYY-MM-DD"),
        end_date: formatDate(this.endDate, "YYYY-MM-DD")
      };
      const response = await timesheetService.getFlexHours(query);
      if (response?.holidays && Array.isArray(response.holidays)) {
        this.holidays = response.holidays.map(holiday => ({
          date: new Date(holiday.date),
          label: holiday.label
        }));
      }
      if (response && Array.isArray(response.payload)) {
        this.flexHoursData = response.payload.map(item => ({
          date: new Date(item.date),
          actual_hours: item.actual_hours,
          flex_hours: item.flex_hours
        }));

        // Force invalidate summary caches after flex hours data is updated
        this.$nextTick(() => {
          this.invalidateSummaryCaches();
        });
      }
    },

    isHoliday(date: Date) {
      return this.holidays.find(
        h =>
          h.date.getUTCFullYear() === date.getFullYear() &&
          h.date.getUTCMonth() === date.getMonth() &&
          h.date.getUTCDate() === date.getDate()
      );
    },

    getFlexHoursForDate(date: Date): number {
      const formattedDate = formatDate(date, "YYYY-MM-DD");
      const flexHoursEntry = this.flexHoursData.find(entry => {
        const entryDate = new Date(entry.date);
        return formatDate(entryDate, "YYYY-MM-DD") === formattedDate;
      });
      return flexHoursEntry?.flex_hours || 0;
    },

    getSummaryValue(summaryType: string, date: Date | null = null): number {
      const dateStr = date ? formatDate(date, "YYYY-MM-DD") : undefined;
      return this.getCachedSummaryValue(summaryType, dateStr);
    },

    getTotalFlexHours(): number {
      if (!this.flexHoursData || !this.flexHoursData.length) return 0;

      // Sum all flex hours for the date range (each entry represents daily flex hours)
      return this.flexHoursData.reduce((total, entry) => {
        return total + (entry.flex_hours || 0);
      }, 0);
    },

    async selectUser(id: number) {
      try {
        const response = await timesheetService.selectUser(id);
        if (response) {
          this.maxWorkHoursPerDay = response.max_work_hours_per_day || 0;
          this.timesheetPeriods = response.timesheet_periods || [];

          // Invalidate must work related caches since user settings changed
          this.$nextTick(() => {
            this.invalidateAllSummaryCaches();
          });
        }
      } catch (error) {
        console.error("Error fetching user max hours:", error);
      }
    },

    isDateWithinTimesheetPeriods(date: Date): boolean {
      return this.timesheetPeriods.some(period => {
        const startDate = new Date(period.start_date);
        const endDate = new Date(period.end_date);
        return date >= startDate && date <= endDate;
      });
    },

    getActualHoursForDate(date: Date): number {
      if (!this.timesheetPeriods?.length) {
        return this.maxWorkHoursPerDay;
      }

      const period = this.timesheetPeriods.find(period => {
        const startDate = new Date(period.start_date);
        const endDate = new Date(period.end_date);
        return date >= startDate && date <= endDate;
      });
      return period ? period.actual_hours_per_day : 0;
    },
    toggleTable(projectId: number) {
      if (this.expandedProjects.includes(projectId)) {
        this.expandedProjects = this.expandedProjects.filter(id => id !== projectId);
      } else {
        this.expandedProjects.push(projectId);
      }
    },
    isProjectExpanded(projectId: number) {
      return this.expandedProjects.includes(projectId);
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
    truncateByWords(text: string, limitWords: number) {
      return truncateByWords(text, limitWords);
    },
    countWordsInText(text: string) {
      return countWordsInText(text);
    },
    formatDate(date: Date, format: string) {
      return formatDate(date, format);
    },
    getProjectTotalHours(projectId: number): number {
      let total = 0;
      const project = this.projects.find(p => p.id === projectId);
      if (project) {
        project.products.forEach(product => {
          // Add product-level hours directly (not product totals)
          this.dateHeaders.forEach(header => {
            const dateKey = formatDate(header.date, "YYYY-MM-DD");
            total += this.getTaskHours(`product-${product.id}`, dateKey);
          });

          // Add task hours
          product.tasks.forEach(task => {
            total += this.getTaskTotal(task.id);

            // Include subtask hours
            task.sub_tasks?.forEach(subtask => {
              total += this.getTaskTotal(subtask.id);
            });
          });
        });
      }
      return total;
    },
    handleSort(field: string) {
      // Toggle sort direction if clicking the same field
      if (this.order.startsWith(field)) {
        this.order = field + (this.order.endsWith(":asc") ? ":desc" : ":asc");
      } else {
        // Default to ascending for new field
        this.order = field + ":asc";
      }

      // The sorting itself is handled in the sortSubTasks computed property
      // which will automatically update when this.order changes
    },
    onSelectTask(event: boolean, task: Task) {
      this.$emit("onSelectTask", event, task);
    },
    getTotalTasks(project: Project) {
      return project.products.reduce((total, product) => {
        const totalSubTasks = product.tasks.reduce((taskTotal, task) => {
          return taskTotal + (task.sub_tasks?.length ?? 0);
        }, 0);
        return total + product.tasks.length + totalSubTasks;
      }, 0);
    },
    getDaysInMonth(date: Date) {
      return new Date(date.getUTCFullYear(), date.getUTCMonth() + 1, 0).getUTCDate();
    },
    getSummaryColor(summaryType: string): string {
      const colors: Record<string, string> = {
        [SUMMARY_KEYS.MUST_WORK]: "#F04438",
        [SUMMARY_KEYS.TOTAL_HOURS]: "#006BFF",
        [SUMMARY_KEYS.DIFFERENT]: "#FB6514",
        [SUMMARY_KEYS.FLEXIBLE_HOURS]: "#12B76A"
      };
      return colors[summaryType] || "#000000";
    },
    generateRowKey(projectId: number, productId?: number | null, taskId?: number | string): string {
      return [projectId, productId ? `Prd-${productId}` : "", taskId ? `Tsk-${taskId}` : ""].filter(Boolean).join("-");
    },
    // Helper method to generate consistent key format
    generateTaskKey(taskId: number | string, date: string, projectId?: number, productId?: number): string {
      // Handle product-level entries
      if (String(taskId).startsWith("product-")) {
        const actualProductId = String(taskId).replace("product-", "");

        // Find the project ID for this product
        let projectId: number | undefined;

        this.projects.forEach(project => {
          project.products.forEach(product => {
            if (String(product.id) === actualProductId) {
              projectId = project.id;
            }
          });
        });

        if (projectId) {
          return `${projectId}-${actualProductId}-product-${date}`;
        }

        // Fallback if project not found
        return `product-${actualProductId}-${date}`;
      }

      // For tasks, find the project and product IDs
      let foundProjectId: number | undefined;
      let foundProductId: number | undefined;

      this.projects.forEach(project => {
        if (projectId && project.id !== projectId) return; // Skip if project ID doesn't match
        project.products.forEach(product => {
          if (productId && product.id !== productId) return; // Skip if product ID doesn't match
          const taskFound = product.tasks.some(
            task =>
              String(task.id) === String(taskId) ||
              task.sub_tasks?.some(subtask => String(subtask.id) === String(taskId))
          );
          if (taskFound) {
            foundProjectId = project.id;
            foundProductId = product.id;
          }
        });
      });

      if (foundProjectId && foundProductId) {
        return `${foundProjectId}-${foundProductId}-${taskId}-${date}`;
      }

      // Fallback for old format
      return `${taskId}-${date}`;
    },
    generateTaskKeyForSummary(taskId: number | string, date: string, projectId?: number, productId?: number): string {
      // Handle product-level entries
      if (String(taskId).startsWith("product-")) {
        const actualProductId = String(taskId).replace("product-", "");

        // Find the project ID for this product
        let projectId: number | undefined;

        this.projectsForSummary.forEach(project => {
          project.products.forEach(product => {
            if (String(product.id) === actualProductId) {
              projectId = project.id;
            }
          });
        });

        if (projectId) {
          return `${projectId}-${actualProductId}-product-${date}`;
        }

        // Fallback if project not found
        return `product-${actualProductId}-${date}`;
      }

      // For tasks, find the project and product IDs
      let foundProjectId: number | undefined;
      let foundProductId: number | undefined;

      this.projectsForSummary.forEach(project => {
        if (projectId && project.id !== projectId) return; // Skip if project ID doesn't match
        project.products.forEach(product => {
          if (productId && product.id !== productId) return; // Skip if product ID doesn't match
          const taskFound = product.tasks.some(
            task =>
              String(task.id) === String(taskId) ||
              task.sub_tasks?.some(subtask => String(subtask.id) === String(taskId))
          );
          if (taskFound) {
            foundProjectId = project.id;
            foundProductId = product.id;
          }
        });
      });

      if (foundProjectId && foundProductId) {
        return `${foundProjectId}-${foundProductId}-${taskId}-${date}`;
      }

      // Fallback for old format
      return `${taskId}-${date}`;
    },
    getTaskHours(taskId: number | string, date: string, projectId?: number, productId?: number): number {
      const key = this.generateTaskKey(taskId, date, projectId, productId);
      return Number(this.taskHours[key]?.value) || 0;
    },
    getTaskHoursForSummary(taskId: number | string, date: string, projectId?: number, productId?: number): number {
      const key = this.generateTaskKeyForSummary(taskId, date, projectId, productId);
      return Number(this.taskHoursForSummary[key]?.value) || 0;
    },
    getTaskComment(taskId: number | string, date: string, projectId?: number, productId?: number): string | undefined {
      const key = this.generateTaskKey(taskId, date, projectId, productId);
      return this.taskHours[key]?.comment;
    },
    hasComment(taskId: number | string, date: string, projectId?: number, productId?: number): boolean {
      return !!this.getTaskComment(taskId, date, projectId, productId);
    },
    getTaskTotalForDate(task: Task, date: string): number {
      if (!task.sub_tasks?.length) {
        return this.getTaskHours(task.id, date);
      }

      // Sum up all subtask hours for this dates
      return task.sub_tasks.reduce((total, subtask) => {
        return total + this.getTaskHours(subtask.id, date);
      }, 0);
    },
    getTaskTotal(taskId: number | string): number {
      const task = this.findTask(taskId);
      if (!task) return 0;

      if (!task.sub_tasks?.length) {
        return this.dateHeaders.reduce((total, header) => {
          const dateKey = formatDate(header.date, "YYYY-MM-DD");
          return total + (this.getTaskHours(taskId, dateKey) || 0);
        }, 0);
      }

      // Sum up all subtask totals
      return task.sub_tasks.reduce((total, subtask) => {
        return total + this.getTaskTotal(subtask.id);
      }, 0);
    },
    findTask(taskId: number | string, projectId?: number, productId?: number): Task | null {
      // Handle product-level virtual tasks
      if (String(taskId).startsWith("product-")) {
        const productId = String(taskId).replace("product-", "");

        // Find the product and create a virtual task
        let foundProduct: Task | null = null;
        this.projects.forEach(project => {
          if (projectId && String(project.id) != String(projectId)) return; // Skip if project ID doesn't match
          project.products.forEach(product => {
            if (String(product.id) === productId) {
              foundProduct = ({
                id: `product-${product.id}`,
                name: product.name,
                project_id: project.id,
                product_id: product.id,
                work_item_id: product.work_item_id,
                sub_tasks: [],
                work_logs: product.work_logs || []
              } as unknown) as Task;
            }
          });
        });

        return foundProduct;
      }

      let foundTask: Task | null = null;

      this.projects.forEach(project => {
        if (projectId && project.id != projectId) return; // Skip if project ID doesn't match
        project.products.forEach(product => {
          if (productId && product.id != productId) return; // Skip if product ID doesn't match
          product.tasks.forEach(task => {
            // Handle both numeric IDs and string IDs (for virtual tasks)
            if (String(task.id) === String(taskId)) {
              foundTask = task;
            }
            task.sub_tasks?.forEach(subtask => {
              if (String(subtask.id) === String(taskId)) {
                foundTask = subtask;
              }
            });
          });
        });
      });

      return foundTask;
    },
    getDayTotal(date: string): number {
      return this.getCachedDayTotal(date);
    },
    getAllDaysTotal(): number {
      return this.dateHeaders.reduce((total, header) => {
        const dateKey = formatDate(header.date, "YYYY-MM-DD");
        return total + this.getCachedDayTotal(dateKey);
      }, 0);
    },
    getDifferentColor(value: number): string {
      if (value === 0) return "";
      return value < 0 ? "#F04438" : "#12B76A";
    },
    isToday(date: Date): boolean {
      const today = new Date();
      return (
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
      );
    },
    populateTaskHours() {
      this.projects.forEach(project => {
        project.products.forEach(product => {
          // Handle product-level work logs
          if (product.work_logs) {
            product.work_logs.forEach(log => {
              const dateObj = new Date(log.date);
              const formattedDate = `${dateObj.getUTCFullYear()}-${String(dateObj.getUTCMonth() + 1).padStart(
                2,
                "0"
              )}-${String(dateObj.getUTCDate()).padStart(2, "0")}`;

              // Use same key format as generateTaskKey for product-level entries
              const key = `${project.id}-${product.id}-product-${formattedDate}`;
              this.taskHours[key] = {
                value: Number(log.spent_in_hour), // Convert string to number
                comment: log.comment
              };
            });
          }

          product.tasks.forEach(task => {
            task.work_logs?.forEach(log => {
              const dateObj = new Date(log.date);
              const formattedDate = `${dateObj.getUTCFullYear()}-${String(dateObj.getUTCMonth() + 1).padStart(
                2,
                "0"
              )}-${String(dateObj.getUTCDate()).padStart(2, "0")}`;

              // Use consistent key format: projectId-productId-taskId-date
              const key = `${project.id}-${product.id}-${task.id}-${formattedDate}`;
              const hourValue = Number(log.spent_in_hour);
              this.taskHours[key] = {
                value: hourValue, // Convert string to number
                comment: log.comment
              };
            });

            task.sub_tasks?.forEach(subtask => {
              subtask.work_logs?.forEach(log => {
                const dateObj = new Date(log.date);
                const formattedDate = `${dateObj.getUTCFullYear()}-${String(dateObj.getUTCMonth() + 1).padStart(
                  2,
                  "0"
                )}-${String(dateObj.getUTCDate()).padStart(2, "0")}`;

                // Use consistent key format: projectId-productId-subtaskId-date
                const key = `${project.id}-${product.id}-${subtask.id}-${formattedDate}`;
                this.taskHours[key] = {
                  value: Number(log.spent_in_hour), // Convert string to number
                  comment: log.comment
                };
              });
            });
          });
        });
      });
    },
    populateTaskHoursForSummary() {
      this.projectsForSummary.forEach(project => {
        project.products.forEach(product => {
          // Handle product-level work logs
          if (product.work_logs) {
            product.work_logs.forEach(log => {
              const dateObj = new Date(log.date);
              const formattedDate = `${dateObj.getUTCFullYear()}-${String(dateObj.getUTCMonth() + 1).padStart(
                2,
                "0"
              )}-${String(dateObj.getUTCDate()).padStart(2, "0")}`;

              // Use same key format as generateTaskKey for product-level entries
              const key = `${project.id}-${product.id}-product-${formattedDate}`;
              this.taskHoursForSummary[key] = {
                value: Number(log.spent_in_hour) // Convert string to number
              };
            });
          }

          product.tasks.forEach(task => {
            task.work_logs?.forEach(log => {
              const dateObj = new Date(log.date);
              const formattedDate = `${dateObj.getUTCFullYear()}-${String(dateObj.getUTCMonth() + 1).padStart(
                2,
                "0"
              )}-${String(dateObj.getUTCDate()).padStart(2, "0")}`;

              // Use consistent key format: projectId-productId-taskId-date
              const key = `${project.id}-${product.id}-${task.id}-${formattedDate}`;
              const hourValue = Number(log.spent_in_hour);
              this.taskHoursForSummary[key] = {
                value: hourValue // Convert string to number
              };
            });

            task.sub_tasks?.forEach(subtask => {
              subtask.work_logs?.forEach(log => {
                const dateObj = new Date(log.date);
                const formattedDate = `${dateObj.getUTCFullYear()}-${String(dateObj.getUTCMonth() + 1).padStart(
                  2,
                  "0"
                )}-${String(dateObj.getUTCDate()).padStart(2, "0")}`;

                // Use consistent key format: projectId-productId-subtaskId-date
                const key = `${project.id}-${product.id}-${subtask.id}-${formattedDate}`;
                this.taskHoursForSummary[key] = {
                  value: Number(log.spent_in_hour) // Convert string to number
                };
              });
            });
          });
        });
      });
    },
    // Add to your component's methods in TimesheetTable.ts
    openCommentDialog(taskId: number | string, date: string, projectId?: number, productId?: number): void {
      const currentComment = this.getTaskComment(taskId, date, projectId, productId) || "";
      // Use prompt for simplicity, but in production you might want a nicer modal
      const newComment = prompt("Edit comment:", currentComment);

      if (newComment !== null) {
        // Check if user didn't cancel
        this.saveTaskComment(taskId, date, newComment, projectId, productId);
      }
    },
    async saveTaskComment(
      taskId: number | string,
      date: string,
      comment: string,
      projectId?: number,
      productId?: number
    ) {
      // Get current value using the key
      const key = this.generateTaskKey(taskId, date, projectId, productId);
      const currentValue = this.taskHours[key]?.value || 0;

      // Save both the current value and the new comment
      await this.saveOrCreateTaskHour(taskId, date, currentValue, comment, projectId, productId);
    },
    async saveOrCreateTaskHour(
      taskId: number | string,
      date: string,
      value: number,
      comment?: string,
      projectId?: number,
      productId?: number
    ) {
      // Generate consistent key
      const key = this.generateTaskKey(taskId, date, projectId, productId);

      const oldValue = this.taskHours[key]?.value || 0;
      const oldComment = this.taskHours[key]?.comment;

      // Check if value actually changed to avoid unnecessary work
      if (oldValue === value && oldComment === comment) {
        return Promise.resolve();
      }

      // Determine if this is a comment-only update
      const isCommentOnlyUpdate = oldValue === value && oldComment !== comment;

      // Find task first to validate before updating data
      const task = this.findTask(taskId, projectId, productId);
      if (!task) {
        console.error("Task not found:", taskId);
        return Promise.reject(new Error("Task not found"));
      }

      // Optimistically update the data with Vue reactivity
      const newTaskHourData = { value, comment };

      // Use $set to ensure Vue detects the change
      this.$set(this.taskHours, key, newTaskHourData);

      const summaryKey = this.generateTaskKeyForSummary(taskId, date, projectId, productId);
      this.$set(this.taskHoursForSummary, summaryKey, newTaskHourData);

      // Force component update for immediate feedback
      this.$forceUpdate();

      try {
        const workLog: WorkLogDto = {
          date,
          spent: value,
          spent_in_hour: value,
          comment,
          work_item_id: task.work_item_id
        };

        this.$emit("updateWorkLog", workLog, isCommentOnlyUpdate);
        return Promise.resolve();
      } catch (error) {
        console.error("Error saving work log:", error);

        // Rollback changes on error using $set for reactivity
        if (oldValue !== undefined) {
          this.$set(this.taskHours, key, { value: oldValue, comment: oldComment });
          this.$set(this.taskHoursForSummary, summaryKey, { value: oldValue, comment: oldComment });
        } else {
          this.$delete(this.taskHours, key);
          this.$delete(this.taskHoursForSummary, summaryKey);
        }
        this.$forceUpdate();
        return Promise.reject(error);
      }
    },
    invalidateFlexHoursCaches() {
      // Clear summary caches that depend on flex hours
      if (this.cachedSummaryValues[SUMMARY_KEYS.FLEXIBLE_HOURS]) {
        delete this.cachedSummaryValues[SUMMARY_KEYS.FLEXIBLE_HOURS];
      }
      if (this.cachedSummaryTotals[SUMMARY_KEYS.FLEXIBLE_HOURS] !== undefined) {
        delete this.cachedSummaryTotals[SUMMARY_KEYS.FLEXIBLE_HOURS];
      }
    },
    // Method to invalidate summary-related caches
    invalidateSummaryCaches() {
      // ONLY clear summary caches that DON'T include flexible hours
      if (this.cachedSummaryValues[SUMMARY_KEYS.MUST_WORK]) {
        delete this.cachedSummaryValues[SUMMARY_KEYS.MUST_WORK];
      }
      if (this.cachedSummaryTotals[SUMMARY_KEYS.MUST_WORK] !== undefined) {
        delete this.cachedSummaryTotals[SUMMARY_KEYS.MUST_WORK];
      }
      if (this.cachedSummaryValues[SUMMARY_KEYS.TOTAL_HOURS]) {
        delete this.cachedSummaryValues[SUMMARY_KEYS.TOTAL_HOURS];
      }
      if (this.cachedSummaryTotals[SUMMARY_KEYS.TOTAL_HOURS] !== undefined) {
        delete this.cachedSummaryTotals[SUMMARY_KEYS.TOTAL_HOURS];
      }
      if (this.cachedSummaryValues[SUMMARY_KEYS.DIFFERENT]) {
        delete this.cachedSummaryValues[SUMMARY_KEYS.DIFFERENT];
      }
      if (this.cachedSummaryTotals[SUMMARY_KEYS.DIFFERENT] !== undefined) {
        delete this.cachedSummaryTotals[SUMMARY_KEYS.DIFFERENT];
      }

      // Force re-calculation of summary values EXCEPT flexible hours
      this.$nextTick(() => {
        [SUMMARY_KEYS.MUST_WORK, SUMMARY_KEYS.TOTAL_HOURS, SUMMARY_KEYS.DIFFERENT].forEach(summaryType => {
          this.getCachedSummaryTotal(summaryType);
          this.dateHeaders.forEach(header => {
            const dateKey = formatDate(header.date, "YYYY-MM-DD");
            this.getCachedSummaryValue(summaryType, dateKey);
          });
        });
      });
    },

    // Method to invalidate ALL summary caches including flexible hours (for user/date changes)
    invalidateAllSummaryCaches() {
      this.cachedSummaryValues = {};
      this.cachedSummaryTotals = {};

      // Force re-calculation of ALL summary values
      this.$nextTick(() => {
        Object.values(SUMMARY_KEYS).forEach(summaryType => {
          this.getCachedSummaryTotal(summaryType);
          this.dateHeaders.forEach(header => {
            const dateKey = formatDate(header.date, "YYYY-MM-DD");
            this.getCachedSummaryValue(summaryType, dateKey);
          });
        });
      });
    },

    initializeCaches() {
      // Pre-populate some frequently accessed caches
      this.projects.forEach(project => {
        this.getCachedProjectTotals(project.id);
        project.products.forEach(product => {
          this.getCachedProductTotals(product.id);
          product.tasks.forEach(task => {
            this.getCachedTaskTotal(task.id);
            task.sub_tasks?.forEach(subtask => {
              this.getCachedTaskTotal(subtask.id);
            });
          });
        });
      });

      // Pre-populate summary caches
      Object.values(SUMMARY_KEYS).forEach(summaryType => {
        this.getCachedSummaryTotal(summaryType);
        this.dateHeaders.forEach(header => {
          const dateKey = formatDate(header.date, "YYYY-MM-DD");
          this.getCachedSummaryValue(summaryType, dateKey);
        });
      });
    },

    // Selective cache initialization that preserves flex hours
    initializeCachesSelective(preserveFlexHours: boolean = false) {
      // Pre-populate some frequently accessed caches
      this.projects.forEach(project => {
        this.getCachedProjectTotals(project.id);
        project.products.forEach(product => {
          this.getCachedProductTotals(product.id);
          product.tasks.forEach(task => {
            this.getCachedTaskTotal(task.id);
            task.sub_tasks?.forEach(subtask => {
              this.getCachedTaskTotal(subtask.id);
            });
          });
        });
      });

      // Pre-populate summary caches
      Object.values(SUMMARY_KEYS).forEach(summaryType => {
        // Skip flex hours if preserving them
        if (preserveFlexHours && summaryType === SUMMARY_KEYS.FLEXIBLE_HOURS) {
          return;
        }

        this.getCachedSummaryTotal(summaryType);
        this.dateHeaders.forEach(header => {
          const dateKey = formatDate(header.date, "YYYY-MM-DD");
          this.getCachedSummaryValue(summaryType, dateKey);
        });
      });
    },

    invalidateAllCaches() {
      this.cachedProjectTotals = {};
      this.cachedProductTotals = {};
      this.cachedTaskTotals = {};
      this.cachedDayTotals = {};
      this.cachedSummaryValues = {};
      this.cachedSummaryTotals = {};
    },

    getCachedProjectTotals(projectId: number): Record<string, number> {
      if (!this.cachedProjectTotals[projectId]) {
        this.cachedProjectTotals[projectId] = this.calculateProjectTotals(projectId);
      }
      return this.cachedProjectTotals[projectId];
    },

    getCachedProductTotals(productId: number): Record<string, number> {
      if (!this.cachedProductTotals[productId]) {
        this.cachedProductTotals[productId] = this.calculateProductTotals(productId);
      }
      return this.cachedProductTotals[productId];
    },

    getCachedTaskTotal(taskId: number | string): number {
      if (this.cachedTaskTotals[taskId] === undefined) {
        this.cachedTaskTotals[taskId] = this.calculateTaskTotal(taskId);
      }
      return this.cachedTaskTotals[taskId];
    },

    getCachedDayTotal(date: string): number {
      if (this.cachedDayTotals[date] === undefined) {
        this.cachedDayTotals[date] = this.calculateDayTotal(date);
      }
      return this.cachedDayTotals[date];
    },

    getCachedSummaryValue(summaryType: string, date?: string): number {
      const key = date || "total";
      if (!this.cachedSummaryValues[summaryType]) {
        this.cachedSummaryValues[summaryType] = {};
      }
      if (this.cachedSummaryValues[summaryType][key] === undefined) {
        this.cachedSummaryValues[summaryType][key] = this.calculateSummaryValue(summaryType, date);
      }
      return this.cachedSummaryValues[summaryType][key];
    },

    getCachedSummaryTotal(summaryType: string): number {
      if (this.cachedSummaryTotals[summaryType] === undefined) {
        this.cachedSummaryTotals[summaryType] = this.calculateSummaryValue(summaryType);
      }
      return this.cachedSummaryTotals[summaryType];
    },

    // ============ CALCULATION METHODS ============
    calculateProjectTotals(projectId: number): Record<string, number> {
      const totals: Record<string, number> = {};
      this.dateHeaders.forEach(header => {
        totals[header.date.toISOString()] = 0;
      });
      totals.total = 0;

      const project = this.projects.find(p => p.id === projectId);
      if (project) {
        project.products.forEach(product => {
          // Add product-level hours directly
          this.dateHeaders.forEach(header => {
            const dateKey = formatDate(header.date, "YYYY-MM-DD");
            const productHours = this.getTaskHours(`product-${product.id}`, dateKey, project.id, product.id);
            totals[header.date.toISOString()] += productHours;
            totals.total += productHours;
          });

          // Add task hours (but not product totals to avoid double counting)
          product.tasks.forEach(task => {
            this.dateHeaders.forEach(header => {
              const dateKey = formatDate(header.date, "YYYY-MM-DD");
              const taskHours = this.getTaskHours(task.id, dateKey, project.id, product.id);
              totals[header.date.toISOString()] += taskHours;
              totals.total += taskHours;

              // Add subtask hours
              task.sub_tasks?.forEach(subtask => {
                const subtaskHours = this.getTaskHours(subtask.id, dateKey, project.id, product.id);
                totals[header.date.toISOString()] += subtaskHours;
                totals.total += subtaskHours;
              });
            });
          });
        });
      }
      return totals;
    },

    calculateProductTotals(productId: number): Record<string, number> {
      const totals: Record<string, number> = {};
      this.dateHeaders.forEach(header => {
        totals[header.date.toISOString()] = 0;
      });
      totals.total = 0;

      // Find the project and product to get the correct context
      let foundProject: any = null;
      let foundProduct: any = null;

      this.projects.forEach(project => {
        project.products.forEach(product => {
          if (product.id === productId) {
            foundProject = project;
            foundProduct = product;
          }
        });
      });

      if (foundProject && foundProduct) {
        // For product-level entries, get direct hours
        this.dateHeaders.forEach(header => {
          const dateKey = formatDate(header.date, "YYYY-MM-DD");
          const hours = this.getTaskHours(`product-${productId}`, dateKey, foundProject.id, foundProduct.id);
          totals[header.date.toISOString()] += hours;
          totals.total += hours;
        });
      }

      return totals;
    },

    calculateTaskTotal(taskId: number | string): number {
      let total = 0;

      // Find the project and product context for this task
      let foundProject: any = null;
      let foundProduct: any = null;

      this.projects.forEach(project => {
        project.products.forEach(product => {
          // Check if it's a product-level task
          if (String(taskId).startsWith("product-")) {
            const productIdFromTask = String(taskId).replace("product-", "");
            if (product.id === parseInt(productIdFromTask)) {
              foundProject = project;
              foundProduct = product;
            }
          } else {
            // Check regular tasks and subtasks
            product.tasks.forEach(task => {
              if (String(task.id) === String(taskId)) {
                foundProject = project;
                foundProduct = product;
              }
              task.sub_tasks?.forEach(subtask => {
                if (String(subtask.id) === String(taskId)) {
                  foundProject = project;
                  foundProduct = product;
                }
              });
            });
          }
        });
      });

      if (foundProject && foundProduct) {
        this.dateHeaders.forEach(header => {
          const dateKey = formatDate(header.date, "YYYY-MM-DD");
          total += this.getTaskHours(taskId, dateKey, foundProject.id, foundProduct.id);
        });
      }

      return total;
    },

    calculateDayTotal(date: string): number {
      let total = 0;
      this.projectsForSummary.forEach(project => {
        project.products.forEach(product => {
          // Add product-level hours
          total += this.getTaskHoursForSummary(`product-${product.id}`, date, project.id, product.id);

          product.tasks.forEach(task => {
            // Add main task hours
            total += this.getTaskHoursForSummary(task.id, date, project.id, product.id);
            // Add subtask hours
            task.sub_tasks?.forEach(subtask => {
              total += this.getTaskHoursForSummary(subtask.id, date, project.id, product.id);
            });
          });
        });
      });
      return total;
    },

    calculateSummaryValue(summaryType: string, date?: string): number {
      const dateObj = date ? new Date(date) : null;

      switch (summaryType) {
        case SUMMARY_KEYS.MUST_WORK:
          return dateObj ? this.getMustWorkHours(dateObj) : this.getTotalMustWorkHours;
        case SUMMARY_KEYS.TOTAL_HOURS:
          return dateObj ? this.getCachedDayTotal(formatDate(dateObj, "YYYY-MM-DD")) : this.getAllDaysTotal();
        case SUMMARY_KEYS.DIFFERENT:
          if (dateObj) {
            const dayTotal = this.getCachedDayTotal(formatDate(dateObj, "YYYY-MM-DD"));
            const mustWork = this.getMustWorkHours(dateObj);
            return dayTotal - mustWork;
          } else {
            return this.getAllDaysTotal() - this.getTotalMustWorkHours;
          }
        case SUMMARY_KEYS.FLEXIBLE_HOURS:
          if (dateObj) {
            return this.getFlexHoursForDate(dateObj);
          } else {
            // For total flex hours, don't show anything (return 0 but template will show empty)
            return 0;
          }
        default:
          return 0;
      }
    }
  }
});
