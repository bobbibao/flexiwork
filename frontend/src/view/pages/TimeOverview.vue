<template>
  <div>
    <div class="card card-custom bg-white card-stretch gutter-b">
      <div class="card-header p-6">
        <div class="col-md-6 p-0" style="display: flex; align-items: center">
          <h3 class="m-0">{{ $t("menu.timeOverview") }}</h3>
        </div>
      </div>
      <div class="card-body p-6 position-relative rounded-xl">
        <div class="row mb-10">
          <div class="col-md-2">
            <b-form-select
              v-model="company"
              :options="companies"
              text-field="name"
              value-field="id"
              @change="getFilteredProjects(company)"
            ></b-form-select>
          </div>
          <div class="col-md-2">
            <b-form-select v-model="project" :options="projects" text-field="name" value-field="id"></b-form-select>
          </div>
          <!-- Date range -->
          <div class="col-md-2">
            <b-input-group>
              <b-form-input v-model="startdate_formatted" type="text" autocomplete="off" readonly></b-form-input>
              <b-input-group-append>
                <b-form-datepicker
                  v-model="startdate"
                  :locale="locale"
                  :start-weekday="1"
                  button-only
                  right
                  @context="formatDate"
                ></b-form-datepicker>
              </b-input-group-append>
            </b-input-group>
          </div>
          <div class="col-md-2">
            <b-input-group>
              <b-form-input v-model="enddate_formatted" type="text" autocomplete="off" readonly></b-form-input>
              <b-input-group-append>
                <b-form-datepicker
                  v-model="enddate"
                  :locale="locale"
                  :start-weekday="1"
                  button-only
                  right
                  @context="formatDate"
                ></b-form-datepicker>
              </b-input-group-append>
            </b-input-group>
          </div>
          <div class="col-md-2" style="display: flex; align-items: flex-end">
            <b-button variant="primary" class="mr-2" @click="project === 0 ? getList() : getProjectDetail()">
              <i class="flaticon2-check-mark p-0"></i>
            </b-button>
          </div>
        </div>

        <!-- Filter -->
        <div class="row mb-10">
          <div class="col-md-4" style="display: flex; align-items: flex-end;">
            <b-badge
              class="filter-badge"
              :class="{ active: status === 'all' }"
              variant="primary"
              @click="filterStatus('all')"
            >
              <div class="text-capitalize">
                {{ $t("status.all") }}
              </div>
            </b-badge>
            <div v-for="(item, i) in statusOptions" :key="i" class="ml-2">
              <b-badge
                v-if="item.value === 'active'"
                class="filter-badge"
                :class="{ active: status === 'active' }"
                variant="success"
                @click="filterStatus(item.value)"
              >
                <div class="text-capitalize">
                  {{ item.label }}
                </div>
              </b-badge>
              <b-badge
                v-else-if="item.value === 'internal'"
                class="filter-badge"
                :class="{ active: status === 'internal' }"
                variant="info"
                @click="filterStatus(item.value)"
              >
                <div class="text-capitalize">
                  {{ item.label }}
                </div>
              </b-badge>
              <b-badge
                v-else
                class="filter-badge"
                :class="{ active: status === 'archive' }"
                @click="filterStatus(item.value)"
              >
                <div class="text-capitalize">
                  {{ item.label }}
                </div>
              </b-badge>
            </div>
          </div>
          <div
            class="col-md-8"
            style="
              display: flex;
              align-items: flex-end;
              justify-content: flex-end;
            "
          >
            <b-button variant="success" class="mr-2" @click="filterToday()">
              {{ $t("timeOverview.today") }}
            </b-button>
            <b-button variant="info" class="mr-2" @click="filterThisWeek()">
              {{ $t("timeOverview.thisWeek") }}
            </b-button>
            <b-button variant="warning" class="mr-2" @click="filterThisMonth()">
              {{ $t("timeOverview.thisMonth") }}
            </b-button>
            <b-button variant="warning" class="mr-2" @click="filterLastMonth()">
              {{ $t("timeOverview.lastMonth") }}
            </b-button>
            <b-button variant="danger" class="mr-2" @click="filterThisYear()">
              {{ $t("timeOverview.thisYear") }}
            </b-button>
            <b-button variant="primary" class="mr-2" @click="filterByYear('2024')">
              2024
            </b-button>
            <b-button variant="primary" class="mr-2" @click="filterByYear('2023')">
              2023
            </b-button>
            <b-button variant="primary" class="mr-2" @click="filterByYear('2022')">
              2022
            </b-button>
            <b-button variant="primary" class="mr-2" @click="filterByYear('2021')">
              2021
            </b-button>
            <b-button variant="primary" class="mr-2" @click="filterByYear('2020')">
              2020
            </b-button>
            <b-button variant="primary" class="mr-2" @click="filterByYear('start')">
              Start
            </b-button>
          </div>
        </div>

        <!-- Overview -->
        <div class="row mb-4">
          <div class="col bg-light-info px-6 py-8 rounded-xl left-block">
            <div class="text-info font-weight-bold font-size-h6">
              {{ $t("timeOverview.projectTime") }}
            </div>
            <div class="text-info font-weight-bold font-size-h1">
              {{ project_time.toFixed(2) + " h" }}
            </div>
          </div>
          <div class="col bg-light-secondary px-6 py-8 rounded-xl mid-block">
            <div class="text-secondary font-weight-bold font-size-h6">
              {{ $t("timeOverview.productive") }}
            </div>
            <div class="text-secondary font-weight-bold font-size-h1">
              {{ productive_time.toFixed(2) + " h" }}
            </div>
          </div>
          <div class="col bg-light-warning px-6 py-8 rounded-xl right-block">
            <div class="text-warning font-weight-bold font-size-h6">
              {{ $t("timeOverview.unproductive") }}
            </div>
            <div class="text-warning font-weight-bold font-size-h1">
              {{ unproductive_time.toFixed(2) + " h" }}
            </div>
          </div>
        </div>
        <div v-if="currentUser.role === 'admin'" class="row mb-10">
          <div class="col bg-light-primary px-6 py-8 rounded-xl left-block">
            <div class="text-primary font-weight-bold font-size-h6">
              {{ $t("timeOverview.revenue") }}
            </div>
            <div class="text-primary font-weight-bold font-size-h1">
              {{ formatMoney(revenue) + " " + currentCompany.currency }}
            </div>
          </div>
          <div class="col bg-light-success px-6 py-8 rounded-xl mid-block">
            <div class="text-success font-weight-bold font-size-h6">
              {{ $t("timeOverview.invoiced") }}
            </div>
            <div class="text-success font-weight-bold font-size-h1">
              {{ formatMoney(invoiced) + " " + currentCompany.currency }}
            </div>
          </div>
          <div class="col bg-light-danger px-6 py-8 rounded-xl right-block">
            <div class="text-danger font-weight-bold font-size-h6">
              {{ $t("timeOverview.uninvoiced") }}
            </div>
            <div class="text-danger font-weight-bold font-size-h1">
              {{ formatMoney(uninvoiced) + " " + currentCompany.currency }}
            </div>
          </div>
        </div>

        <div class="tabs" v-show="dataAvailable">
          <b-nav tabs fill>
            <b-nav-item to="#" :active="$route.hash === '#' || $route.hash === ''">
              {{ $t("timeOverview.project") }}
            </b-nav-item>
            <b-nav-item to="#employee" :active="$route.hash === '#employee'">
              {{ $t("timeOverview.employee") }}
            </b-nav-item>
            <b-nav-item to="#submitted" :active="$route.hash === '#submitted'">
              {{ $t("timeOverview.submitted") }}
            </b-nav-item>
          </b-nav>

          <div class="tab-content">
            <div :class="['tab-pane', { active: $route.hash === '#' || $route.hash === '' }]" class="p-2">
              <!-- Project list -->
              <div class="row mt-4">
                <div class="col-md-12">
                  <ListProjectTable v-if="view === 'all'" :projects="pr_stats" @toggle="getProject" />
                  <ProjectTable v-else :projects="currentProjectStats" />
                </div>
              </div>
            </div>
            <div :class="['tab-pane', { active: $route.hash === '#employee' }]" class="p-2">
              <!-- Employee list -->
              <div class="row mt-4">
                <div class="col-md-12">
                  <ListEmployeeTable v-if="view === 'all'" :employees="employees" />
                  <ProjectEmployeesTable v-else :employees="currentProjectEmployeesStats" />
                </div>
              </div>
            </div>
            <div :class="['tab-pane', { active: $route.hash === '#submitted' }]" class="p-2">
              <!-- Submitted list -->
              <div class="row mt-4">
                <div class="col-md-12">
                  <ListSubmittedTable :employees="timesheets" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { size } from "lodash";
import moment from "moment";
import currency from "currency.js";
import i18nService from "@/core/services/i18n.service.js";
import { mapGetters, mapState } from "vuex";
import {
  GET_DASHBOARD_PROJECTS_STATS,
  GET_EMPLOYEES_STATS,
  GET_PROJECT_STATS,
  GET_PROJECT_EMPLOYEES_STATS,
  GET_PROJECT_OVERVIEW_STATS,
  GET_FILTERED_PROJECTS
} from "@/core/services/store/dashboard";
import { GET_LOCKED_TIMESHEET } from "@/core/services/store/timesheet";
import { GET_COMPANY, GET_CONNECTIONS } from "@/core/services/store/settings";
import ListProjectTable from "@/view/content/timeOverview/ListProjectTable.vue";
import ListEmployeeTable from "@/view/content/timeOverview/ListEmployeeTable.vue";
import ProjectTable from "@/view/content/timeOverview/ProjectTable.vue";
import ProjectEmployeesTable from "@/view/content/timeOverview/ProjectEmployeesTable.vue";
import ListSubmittedTable from "@/view/content/timeOverview/ListSubmittedTable.vue";
import { formatDate } from "@/common";

export default {
  name: "timeOverview",
  metaInfo: {
    title: "Time Overview",
    meta: [
      {
        hid: "description",
        name: "description",
        content: "Time Overview Page"
      },
      {
        hid: "og:site_name",
        property: "og:site_name",
        content: "Archapp"
      },
      {
        hid: "og:title",
        property: "og:title",
        content: "Time Overview | Archapp"
      },
      {
        hid: "og:description",
        property: "og:description",
        content: "Time Overview | Archapp"
      },
      {
        hid: "og:image",
        property: "og:image",
        content: ""
      }
    ]
  },
  components: {
    ListProjectTable,
    ListEmployeeTable,
    ProjectTable,
    ProjectEmployeesTable,
    ListSubmittedTable
  },
  data() {
    return {
      items: [],
      startdate: "",
      enddate: "",
      startdate_formatted: "",
      enddate_formatted: "",
      locale: "de",
      project_time: 0.0,
      productive_time: 0.0,
      unproductive_time: 0.0,
      revenue: 0.0,
      invoiced: 0.0,
      uninvoiced: 0.0,
      activeTab: null,
      employees: [],
      company: "",
      companies: [],
      project: "",
      projects: [],
      view: "",
      timesheets: [],
      pr_stats: [],
      statusOptions: [
        { value: "active", label: this.$t("status.active") },
        { value: "archive", label: this.$t("status.archive") },
        { value: "internal", label: this.$t("status.internal") }
      ],
      status: "active"
    };
  },
  computed: {
    ...mapGetters([
      "currentCompany",
      "currentUser",
      "currentProjectsStats",
      "currentEmployeesStats",
      "currentProjectStats",
      "currentProjectEmployeesStats",
      "currentProjectOverviewStats",
      "currentConnections",
      "currentFilteredProjects",
      "currentLockedTimesheets"
    ]),
    ...mapState({
      error: state => state.dashboard.error
    }),
    currentLanguage() {
      return i18nService.getActiveLanguage();
    },
    dataAvailable() {
      return this.view === "all" ? size(this.currentProjectsStats) > 0 : size(this.currentProjectStats) > 0;
    }
  },
  async mounted() {
    await this.$store.dispatch(GET_COMPANY);
    await this.initDate();
    await this.initConnection();
    await this.getList();
    await this.getLockedTimesheets(
      moment()
        .startOf("year")
        .format("YYYY-MM-DD"),
      moment()
        .endOf("year")
        .format("YYYY-MM-DD")
    );
    if (this.currentLanguage === "de") {
      this.locale = "de";
    } else {
      this.locale = "en-US";
    }
  },
  methods: {
    initDate() {
      this.startdate = moment()
        .startOf("month")
        .format("YYYY-MM-DD");
      this.enddate = moment()
        .endOf("month")
        .format("YYYY-MM-DD");
      this.startdate_formatted = moment()
        .startOf("month")
        .format("DD.MM.YYYY");
      this.enddate_formatted = moment()
        .endOf("month")
        .format("DD.MM.YYYY");
    },
    async initConnection() {
      const arr = [];
      arr.push({
        id: 0,
        name: this.$t("status.all")
      });
      await this.$store.dispatch(GET_CONNECTIONS);
      arr.push({
        id: this.currentCompany.id,
        name: this.currentCompany.name
      });
      for (const connection of this.currentConnections) {
        const item = {
          id: connection.company.id,
          name: connection.company.name
        };
        arr.push(item);
      }
      this.companies = arr;
      this.company = this.currentCompany.id;
      this.getFilteredProjects(this.currentCompany.id);
    },
    async getList() {
      await this.$store.dispatch(GET_DASHBOARD_PROJECTS_STATS, {
        start: this.startdate,
        end: this.enddate,
        company: this.company,
        status: this.status
      });
      await this.$store.dispatch(GET_EMPLOYEES_STATS, {
        start: this.startdate,
        end: this.enddate,
        company: this.company
      });
      //calculate overview
      let pr_time = 0.0;
      let productive = 0.0;
      let unproductive = 0.0;
      let revenue = 0.0;
      let invoiced = 0.0;
      let uninvoiced = 0.0;
      for (const project of this.currentProjectsStats) {
        pr_time += parseFloat(project.project_time);
        productive += parseFloat(project.productive_hours);
        unproductive += parseFloat(project.unproductive_hours);
        revenue += parseFloat(project.revenue);
        invoiced += parseFloat(project.invoiced);
        uninvoiced += parseFloat(project.uninvoiced);
      }
      this.project_time = pr_time;
      this.productive_time = productive;
      this.unproductive_time = unproductive;
      this.revenue = revenue;
      this.invoiced = invoiced;
      this.uninvoiced = uninvoiced;
      //handle employee list
      let list = [];
      for (const employee of this.currentEmployeesStats) {
        let time_total = parseFloat(employee.billable_hours) + parseFloat(employee.unbillable_hours);
        let item = {
          name: employee.first_name + " " + employee.last_name,
          project_time: employee.billable_hours,
          unbillable_time: employee.unbillable_hours,
          total_hours: employee.total_hours,
          logged_hours: time_total,
          _rowVariant: this.setRowVariant(time_total, employee.total_hours)
        };
        list.push(item);
      }
      //handle project list
      let pr = [];
      for (const project of this.currentProjectsStats) {
        project.tasks = [];
        pr.push(project);
      }
      this.pr_stats = pr;
      this.employees = list;
      this.view = "all";
    },
    async getFilteredProjects(company) {
      await this.$store.dispatch(GET_FILTERED_PROJECTS, { id: company });
      this.projects = this.currentFilteredProjects;
      if (this.projects) {
        this.projects.unshift({
          id: 0,
          name: this.$t("timeOverview.all")
        });
      }
      this.project = 0;
    },
    async getProjectDetail() {
      await this.$store.dispatch(GET_PROJECT_STATS, {
        project_id: this.project,
        start: this.startdate,
        end: this.enddate,
        company: this.company
      });
      await this.$store.dispatch(GET_PROJECT_EMPLOYEES_STATS, {
        project_id: this.project,
        start: this.startdate,
        end: this.enddate,
        company: this.company
      });
      await this.$store.dispatch(GET_PROJECT_OVERVIEW_STATS, {
        project_id: this.project,
        start: this.startdate,
        end: this.enddate,
        company: this.company
      });
      // project overview
      this.project_time = this.currentProjectOverviewStats[0].project_time;
      this.productive_time = this.currentProjectOverviewStats[0].productive_hours;
      this.unproductive_time = this.currentProjectOverviewStats[0].unproductive_hours;
      this.revenue = this.currentProjectOverviewStats[0].revenue;
      this.invoiced = this.currentProjectOverviewStats[0].invoiced;
      this.uninvoiced = this.currentProjectOverviewStats[0].uninvoiced;
      this.view = "single";
    },
    async getLockedTimesheets(start, end) {
      await this.$store.dispatch(GET_LOCKED_TIMESHEET, {
        start: start,
        end: end
      });
      const arr = [];
      for (const item of this.currentLockedTimesheets) {
        let record = {
          id: item.id,
          name: item.first_name + " " + item.last_name,
          january: false,
          february: false,
          march: false,
          april: false,
          may: false,
          june: false,
          july: false,
          august: false,
          september: false,
          october: false,
          november: false,
          december: false,
          _cellVariants: {
            january: "danger",
            february: "danger",
            march: "danger",
            april: "danger",
            may: "danger",
            june: "danger",
            july: "danger",
            august: "danger",
            september: "danger",
            october: "danger",
            november: "danger",
            december: "danger"
          }
        };
        arr.push(record);
      }
      // filter unique user
      let unique = Array.from(new Set(arr.map(item => item.id))).map(id => {
        return arr.find(item => item.id === id);
      });
      // set submitted timesheet data
      for (const item of unique) {
        for (const record of this.currentLockedTimesheets) {
          if (record.id === item.id) {
            if (record.start_date) {
              let month = moment(record.start_date).month();
              switch (month) {
                case 0:
                  item.january = true;
                  item._cellVariants.january = "success";
                  break;
                case 1:
                  item.february = true;
                  item._cellVariants.february = "success";
                  break;
                case 2:
                  item.march = true;
                  item._cellVariants.march = "success";
                  break;
                case 3:
                  item.april = true;
                  item._cellVariants.april = "success";
                  break;
                case 4:
                  item.may = true;
                  item._cellVariants.may = "success";
                  break;
                case 5:
                  item.june = true;
                  item._cellVariants.june = "success";
                  break;
                case 6:
                  item.july = true;
                  item._cellVariants.july = "success";
                  break;
                case 7:
                  item.august = true;
                  item._cellVariants.august = "success";
                  break;
                case 8:
                  item.september = true;
                  item._cellVariants.september = "success";
                  break;
                case 9:
                  item.october = true;
                  item._cellVariants.october = "success";
                  break;
                case 10:
                  item.november = true;
                  item._cellVariants.november = "success";
                  break;
                case 11:
                  item.december = true;
                  item._cellVariants.december = "success";
                  break;
              }
            }
          }
        }
      }
      this.timesheets = unique;
    },
    async getProject(row) {
      await this.$store.dispatch(GET_PROJECT_STATS, {
        project_id: row.item.id,
        start: this.startdate,
        end: this.enddate,
        company: this.company
      });
      for (const project of this.pr_stats) {
        if (project.id === row.item.id) {
          project.tasks = [];
          for (const record of this.currentProjectStats) {
            const item = {
              company_name: record.company_name,
              company_hours_project: 0.0,
              company_hours_noted: 0.0,
              stats: record.stats
            };
            for (const stat of record.stats) {
              item.company_hours_project += stat.hours_project;
              item.company_hours_noted += stat.hours_noted;
            }
            project.tasks.push(item);
          }
        }
      }
      row.toggleDetails();
    },
    async filterToday() {
      const today = moment();
      this.startdate = today.format("YYYY-MM-DD");
      this.enddate = today.format("YYYY-MM-DD");
      this.startdate_formatted = today.format("DD.MM.YYYY");
      this.enddate_formatted = today.format("DD.MM.YYYY");
      await this.getList();
    },
    async filterThisWeek() {
      const start = moment().startOf("isoWeek");
      const end = moment().endOf("isoWeek");
      this.startdate = start.format("YYYY-MM-DD");
      this.enddate = end.format("YYYY-MM-DD");
      this.startdate_formatted = start.format("DD.MM.YYYY");
      this.enddate_formatted = end.format("DD.MM.YYYY");
      await this.getList();
    },
    async filterThisMonth() {
      const start = moment().startOf("month");
      const end = moment().endOf("month");
      this.startdate = start.format("YYYY-MM-DD");
      this.enddate = end.format("YYYY-MM-DD");
      this.startdate_formatted = start.format("DD.MM.YYYY");
      this.enddate_formatted = end.format("DD.MM.YYYY");
      await this.getList();
    },
    async filterLastMonth() {
      const start = moment()
        .subtract(1, "months")
        .startOf("month");
      const end = moment()
        .subtract(1, "months")
        .endOf("month");
      this.startdate = start.format("YYYY-MM-DD");
      this.enddate = end.format("YYYY-MM-DD");
      this.startdate_formatted = start.format("DD.MM.YYYY");
      this.enddate_formatted = end.format("DD.MM.YYYY");
      await this.getList();
    },
    async filterThisYear() {
      const start = moment().startOf("year");
      const end = moment().endOf("year");
      this.startdate = start.format("YYYY-MM-DD");
      this.enddate = end.format("YYYY-MM-DD");
      this.startdate_formatted = start.format("DD.MM.YYYY");
      this.enddate_formatted = end.format("DD.MM.YYYY");
      await this.getList();
      await this.getLockedTimesheets(this.startdate, this.enddate);
    },
    async filterByYear(year) {
      if (year === "start") {
        const today = moment();
        this.startdate = "2018-01-01";
        this.enddate = today.format("YYYY-MM-DD");
        this.startdate_formatted = "01.01.2018";
        this.enddate_formatted = today.format("DD.MM.YYYY");
      } else {
        this.startdate = year + "-01-01";
        this.enddate = year + "-12-31";
        this.startdate_formatted = "01.01." + year;
        this.enddate_formatted = "31.12." + year;
      }
      await this.getList();
      await this.getLockedTimesheets(this.startdate, this.enddate);
    },
    async filterStatus(status) {
      this.status = status;
      await this.getList();
    },
    setRowVariant(project_time, total_hours) {
      const check = parseFloat(project_time) / parseFloat(total_hours);
      if (check < 1) {
        return "danger";
      } else if (check > 1) {
        return "success";
      } else {
        return null;
      }
    },
    formatDate() {
      if (this.startdate) {
        this.startdate_formatted = formatDate(this.startdate);
      }
      if (this.enddate) {
        this.enddate_formatted = formatDate(this.enddate);
      }
    },
    formatMoney(val) {
      return currency(val, {
        separator: "'",
        pattern: `#`,
        negativePattern: `-#`,
        increment: 0.05
      }).format();
    }
  }
};
</script>

<style scoped>
.left-block {
  margin-left: 1rem;
  margin-right: 1.75rem;
}

.right-block {
  margin-left: 1.75rem;
  margin-right: 1rem;
}

.filter-badge {
  opacity: 0.5;
  cursor: pointer;
}

.active {
  opacity: 1;
}
</style>
