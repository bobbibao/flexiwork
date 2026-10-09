<template>
  <div>
    <div class="project-overview-wrapper">
      <div class="card card-custom bg-white card-stretch gutter-b p-10 project-overview-card">
        <div class="font-size-h6 overview-header">
          {{ $t("dashboard.sumActive") }}
        </div>
        <div class="font-size-h1 font-weight-bold">
          {{ projectsStats.total_active_projects }}
        </div>
      </div>
      <div class="card card-custom bg-white card-stretch gutter-b p-10 project-overview-card">
        <div class="font-size-h6 overview-header">
          {{ $t("dashboard.totalProjectAmount") }}
        </div>
        <div class="font-size-h1 font-weight-bold">
          {{ formatMoney(projectsStats.total_project_amount) }}
        </div>
      </div>
      <div class="card card-custom bg-white card-stretch gutter-b p-10 project-overview-card">
        <div class="font-size-h6 overview-header">
          {{ $t("dashboard.totalRemainingAmount") }}
        </div>
        <div class="font-size-h1 font-weight-bold">
          {{ formatMoney(projectsStats.total_remaining_amount) }}
        </div>
      </div>
      <div class="card card-custom bg-white card-stretch gutter-b p-10 project-overview-card">
        <div class="font-size-h6 overview-header">
          {{ $t("dashboard.totalOutstandingNetAmount") }}
        </div>
        <div class="font-size-h1 font-weight-bold">
          {{ formatMoney(projectsStats.total_open_net_amount) }}
        </div>
      </div>
      <div class="card card-custom bg-white card-stretch gutter-b p-10 project-overview-card">
        <div class="font-size-h6 overview-header">
          {{ $t("dashboard.totalOutstandingGrossAmount") }}
        </div>
        <div class="font-size-h1 font-weight-bold">
          {{ formatMoney(projectsStats.total_open_gross_amount) }}
        </div>
      </div>
    </div>
    <div class="card card-custom bg-white card-stretch gutter-b">
      <div class="card-header p-6">
        <div class="col-md-6 p-0 action-start">
          <h3 class="m-0 mr-4">{{ $t("menu.projects") }}</h3>
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
        <!-- Actions -->
        <div class="col-md-6 p-0 action">
          <b-button
            variant="success"
            size="lg"
            class="report-btn mr-2"
            @click="initEffortDialog"
            :disabled="loadingEffort"
          >
            <i class="menu-icon" :class="loadingEffort ? 'fas fa-spinner fa-spin' : 'flaticon2-chronometer'"></i>
            <span class="menu-text"> {{ $t("button.effortRecord") }} </span>
          </b-button>
          <b-button variant="primary" size="lg" class="add-btn" @click="goTo('/project/create')" :disabled="loading">
            <i class="menu-icon flaticon2-plus-1"></i>
            <span class="menu-text"> {{ $t("button.add") }} </span>
          </b-button>
        </div>
      </div>
      <div class="card-body p-6 position-relative overflow-hidden rounded-xl">
        <!-- Search -->
        <div class="row mb-4">
          <div class="col-md-3 action-start">
            <span class="mr-2">{{ $t("button.show") }}</span>
            <b-form-select v-model="perPage" id="perPageSelect" size="sm" :options="pageOptions"></b-form-select>
            <span class="ml-2">{{ $t("button.entries") }}</span>
          </div>
          <div class="col-md-9 action">
            <span class="mr-2">{{ $t("button.search") }}:</span>
            <b-form-input v-model="filter" type="search" id="filterInput"></b-form-input>
            <div v-b-tooltip.hover title="Bulk update status">
              <b-button class="ml-2" @click="toggleUpdate" :disabled="selectedProjects.length === 0">
                <i class="flaticon2-sheet"></i>
              </b-button>
            </div>
            <div v-b-tooltip.hover title="Clear selected projects">
              <b-button class="ml-2" @click="clearSelected" :disabled="selectedProjects.length === 0">
                <i class="flaticon2-refresh"></i>
              </b-button>
            </div>
          </div>
        </div>
        <!-- Data Table -->
        <b-table
          ref="selectableTable"
          bordered
          head-variant="light"
          :items="projects"
          :fields="fields"
          :filter-included-fields="filterIncludedFields"
          :current-page="currentPage"
          :per-page="perPage"
          :filter="filter"
          :busy="loading"
          :sort-compare="mySortCompare"
          selectable
          select-mode="multi"
          @filtered="onFiltered"
          @row-selected="onRowSelected"
        >
          <template #table-busy>
            <div class="text-center text-danger my-2">
              <b-spinner class="align-middle"></b-spinner>
            </div>
          </template>

          <template v-slot:cell(customer)="row">
            {{ renderName(row.item) }}
          </template>

          <template v-slot:cell(name)="row">
            <div class="badge-container">
              <div class="badge-group">
                <button
                  v-if="row.item.internal_desc_custom"
                  class="note-badge"
                  data-toggle="tooltip"
                  data-html="true"
                  :title="row.item.internal_desc_custom"
                ></button>
                <button
                  v-if="row.item.is_connected"
                  class="sharing-badge ml-2"
                  data-toggle="tooltip"
                  data-html="true"
                  :title="row.item.connected"
                ></button>
              </div>

              <div class="name-cell" @click.stop="goTo(`/project/${row.item.id}`)">
                {{ row.item.name + ", " + row.item.location }}
              </div>
            </div>
          </template>

          <template v-slot:cell(detail_cost)="row">
            <div>
              {{ $t("project.net") + ": " + formatMoney(row.item.detail_cost.total_net) }}
            </div>
            <div>
              {{
                $t("project.gross") +
                  ": " +
                  formatMoney(row.item.detail_cost.total_gross + row.item.detail_cost.total_grossnk)
              }}
            </div>
          </template>

          <template v-slot:cell(invoiced)="row">
            <div>
              {{ $t("project.net") + ": " + formatMoney(row.item.invoiced) }}
            </div>
            <div>
              {{ $t("project.gross") + ": " + formatMoney(row.item.invoiced_gross) }}
            </div>
          </template>

          <template v-slot:cell(remaining)="row">
            <div>
              {{ $t("project.net") + ": " + formatMoney(row.item.remaining) }}
            </div>
            <div>
              {{ $t("project.gross") + ": " + formatMoney(row.item.remaining_gross) }}
            </div>
          </template>

          <template v-slot:cell(total_hours)="row">
            {{ row.item.total_hours.toFixed(2) + "h" }}
          </template>

          <template v-slot:cell(logged_hours)="row">
            <b-badge :variant="renderLogTimeStyle(row.item.logged_hours, row.item.total_hours)">
              <div class="text-capitalize">
                {{ row.item.logged_hours.toFixed(2) + "h" }}
              </div>
            </b-badge>
          </template>

          <template v-slot:cell(number)="row">
            {{ row.item.number.custom_id ? row.item.number.custom_id : row.item.number.id }}
          </template>

          <template v-slot:cell(status)="row">
            <b-badge :variant="renderStatusStyle(row.item.status_render)">
              <div class="text-capitalize">
                {{ row.item.status_render }}
              </div>
            </b-badge>
          </template>

          <template v-slot:cell(actions)="row">
            <i
              :id="`print-${row.item.id}`"
              class="action-icon flaticon2-printer mr-2"
              @click.stop="print(row.item)"
              v-b-tooltip.hover
              title="Export to PDF"
            ></i>
            <i
              class="action-icon flaticon2-checking mr-2"
              @click.stop="duplicateProject(row.item)"
              v-b-tooltip.hover
              title="Duplicate"
            ></i>
            <i
              v-if="hadConnections"
              class="action-icon flaticon2-clip-symbol mr-2"
              @click.stop="toggleSharing(row.item.id)"
              v-b-tooltip.hover
              title="Connect to other projects"
            ></i>
            <i
              class="action-icon flaticon2-rubbish-bin"
              @click.stop="remove(row.item)"
              v-b-tooltip.hover
              title="Delete"
            ></i>
          </template>
        </b-table>
        <!-- Pagination -->
        <div class="row action">
          <div class="col-md-3">
            <b-pagination
              v-model="currentPage"
              :total-rows="totalRows"
              :current-page="currentPage"
              :per-page="perPage"
              align="fill"
              size="md"
              class="my-0"
            ></b-pagination>
          </div>
        </div>
      </div>
    </div>

    <!-- Remove Dialog -->
    <b-modal v-model="remove_dialog" hide-footer no-close-on-backdrop :title="`${$t('title.confirm')}`">
      <div>{{ $t("msg.delProject") }}</div>
      <div class="col-md-12 p-0 mt-4 action">
        <b-button variant="primary" class="save-btn" @click="confirmRemove" :disabled="loadingDelete">
          <i class="menu-icon" :class="loadingDelete ? 'fas fa-spinner fa-spin' : ''"></i>
          {{ $t("button.confirm") }}
        </b-button>
      </div>
    </b-modal>

    <!-- Effort Dialog -->
    <b-modal
      v-model="effort_dialog"
      hide-footer
      no-close-on-backdrop
      size="xl"
      :title="`${$t('title.effortRecord')}`"
      @close="resetEffortDialog"
    >
      <div class="row">
        <div class="col-md-4">
          <b-form-select
            v-model="report_project"
            :options="track_projects"
            value-field="id"
            text-field="name"
          ></b-form-select>
        </div>
        <div class="col-md-2">
          <b-form-select
            v-model="report_month"
            :options="months"
            value-field="code"
            text-field="name"
            @change="setReportDate"
          ></b-form-select>
        </div>
        <div class="col-md-2">
          <b-form-select v-model="report_year" :options="years" @change="setReportDate"></b-form-select>
        </div>
        <div class="col-md-3">
          <b-button variant="primary" class="submit-btn" @click="getEffort" :disabled="loadingEffortRecord">
            <i :class="loadingEffortRecord ? 'fas fa-spinner fa-spin' : 'flaticon2-check-mark'"></i>
          </b-button>
        </div>
      </div>

      <!-- Result -->
      <div v-if="effort_records.length > 0" class="mt-10">
        <div class="row">
          <div class="col-md-8 action-start">
            <span class="font-weight-bolder">{{ $t("project.sum") }}</span>
            <span>{{ ": " + total_effort.toFixed(2) + "h" }}</span>
          </div>
          <div class="col-md-4 action">
            <span class="mr-2">{{ $t("button.show") }}</span>
            <b-form-select
              v-model="perPage_effort"
              id="perPageSelect_effort"
              size="sm"
              :options="pageOptions"
            ></b-form-select>
            <span class="ml-2">{{ $t("button.entries") }}</span>
          </div>
        </div>
        <div class="row mt-4">
          <div class="col-md-12">
            <b-table
              bordered
              head-variant="light"
              :items="effort_records"
              :fields="fields_effort"
              :current-page="currentPage_effort"
              :per-page="perPage_effort"
              @filtered="onFilteredEffort"
            ></b-table>
          </div>
        </div>
        <div class="row action">
          <div class="col-md-3">
            <b-pagination
              v-model="currentPage_effort"
              :current-page="currentPage_effort"
              :total-rows="totalRows_effort"
              :per-page="perPage_effort"
              align="fill"
              size="md"
              class="my-0"
            ></b-pagination>
          </div>
        </div>
      </div>
      <div v-else class="mt-10">
        <div class="text-muted text-center">{{ $t("project.noRecord") }}</div>
      </div>
    </b-modal>

    <!-- Update Dialog -->
    <b-modal v-model="update_dialog" hide-footer no-close-on-backdrop :title="`${$t('title.updateStatus')}`">
      <div>
        {{ $t("msg.updateStatus") }}
      </div>
      <div class="mt-2">
        <b-form-select
          v-model="update_status"
          :options="statusOptions"
          text-field="label"
          value-field="value"
        ></b-form-select>
      </div>
      <div class="col-md-12 p-0 mt-4 action">
        <b-button variant="primary" class="save-btn" @click="confirmUpdate" :disabled="loadingUpdate">
          <i class="menu-icon" :class="loadingUpdate ? 'fas fa-spinner fa-spin' : ''"></i>
          {{ $t("button.confirm") }}
        </b-button>
      </div>
    </b-modal>

    <!-- Share Dialog -->
    <b-modal
      v-model="share_dialog"
      hide-footer
      no-close-on-backdrop
      size="lg"
      :title="`${$t('title.connectProject')}`"
      @close="resetSharing"
    >
      <div v-for="(item, i) in connections" :key="i" class="mb-4">
        <div class="font-weight-bold">
          {{ item.name }}
        </div>
        <div class="mt-2">
          <b-form-select
            v-model="item.connected"
            :options="item.projects"
            text-field="name"
            value-field="id"
          ></b-form-select>
        </div>
      </div>

      <div class="row mt-4">
        <div class="col-md-6">
          <b-button variant="danger" class="save-btn" @click="deleteConnect" :disabled="loadingConnect">
            <i class="menu-icon" :class="loadingConnect ? 'fas fa-spinner fa-spin' : ''"></i>
            {{ $t("button.delete") }}
          </b-button>
        </div>
        <div class="col-md-6 action">
          <b-button variant="primary" class="save-btn" @click="confirmConnect" :disabled="loadingConnect">
            <i class="menu-icon" :class="loadingConnect ? 'fas fa-spinner fa-spin' : ''"></i>
            {{ $t("button.confirm") }}
          </b-button>
        </div>
      </div>
    </b-modal>
  </div>
</template>

<script>
import currency from "currency.js";
import moment from "moment";
import { mapGetters, mapState } from "vuex";
import i18nService from "@/core/services/i18n.service.js";
import {
  GET_PROJECTS,
  DELETE_PROJECT,
  COPY_PROJECT,
  SET_PROJECT_TOAST,
  FILTER_PROJECT,
  EXPORT_PROJECT_PDF,
  UPDATE_PROJECT_STATUS,
  GET_CONNECT_PROJECTS,
  CONNECT_PROJECT,
  GET_PROJECT_CONNECTION_LIST,
  CLEAR_CONNECTION_LIST,
  GET_PROJECTS_STATS
} from "@/core/services/store/project";
import { GET_TRACK_PROJECTS } from "@/core/services/store/timesheet";
import { GET_PROJECTS_WITH_HOUR } from "@/core/services/store/report";
import { GET_CONNECTIONS } from "@/core/services/store/settings";
import { formatDate } from "@/common";

export default {
  name: "project",
  metaInfo: {
    title: "Project",
    meta: [
      { hid: "description", name: "description", content: "Project Page" },
      {
        hid: "og:site_name",
        property: "og:site_name",
        content: "Archapp"
      },
      {
        hid: "og:title",
        property: "og:title",
        content: "Project | Archapp"
      },
      {
        hid: "og:description",
        property: "og:description",
        content: "Project | Archapp"
      },
      {
        hid: "og:image",
        property: "og:image",
        content: ""
      }
    ]
  },
  data() {
    return {
      fields: [
        {
          key: "customer",
          label: this.$t("project.name"),
          sortable: true,
          thStyle: { width: "10%" }
        },
        {
          key: "number",
          label: this.$t("project.number"),
          sortable: true,
          thStyle: { width: "10%" }
        },
        {
          key: "name",
          label: this.$t("project.title"),
          sortable: true,
          thStyle: { width: "15%" }
        },
        {
          key: "detail_cost",
          label: this.$t("project.sum"),
          thStyle: { width: "10%" }
        },
        {
          key: "invoiced",
          label: this.$t("project.invoiced"),
          thStyle: { width: "10%" },
          formatter: "formatMoney"
        },
        {
          key: "remaining",
          label: this.$t("project.remaining"),
          thStyle: { width: "10%" },
          formatter: "formatMoney"
        },
        {
          key: "total_hours",
          label: this.$t("project.allHour"),
          thStyle: { width: "5%" }
        },
        {
          key: "logged_hours",
          label: this.$t("project.loggedHour"),
          thStyle: { width: "5%" }
        },
        {
          key: "created_at",
          label: this.$t("project.created"),
          sortable: true,
          thStyle: { width: "10%" }
        },
        {
          key: "end_on",
          label: this.$t("project.ended"),
          sortable: true,
          thStyle: { width: "10%" }
        },
        {
          key: "status",
          label: "Status",
          sortable: true,
          thStyle: { width: "10%" }
        },
        {
          key: "actions",
          label: this.$t("project.actions"),
          thStyle: { width: "5%" }
        }
      ],
      fields_effort: [
        {
          key: "date",
          label: this.$t("project.date"),
          thStyle: { width: "20%" }
        },
        {
          key: "task",
          label: this.$t("project.task"),
          thStyle: { width: "40%" }
        },
        {
          key: "user",
          label: this.$t("project.assignee"),
          thStyle: { width: "20%" }
        },
        {
          key: "spent",
          label: this.$t("project.spent"),
          thStyle: { width: "20%" }
        }
      ],
      totalRows: 1,
      totalRows_effort: 1,
      currentPage: 1,
      currentPage_effort: 1,
      perPage: 20,
      perPage_effort: 20,
      pageOptions: [20, 40, 60],
      status: "active",
      statusOptions: [
        { value: "active", label: this.$t("status.active") },
        { value: "archive", label: this.$t("status.archive") },
        { value: "internal", label: this.$t("status.internal") }
      ],
      filter: null,
      remove_dialog: false,
      effort_dialog: false,
      update_dialog: false,
      share_dialog: false,
      loading: true,
      delete_id: 0,
      months: [
        { name: this.$t("months.janFull"), code: 0 },
        { name: this.$t("months.febFull"), code: 1 },
        { name: this.$t("months.marFull"), code: 2 },
        { name: this.$t("months.aprFull"), code: 3 },
        { name: this.$t("months.mayFull"), code: 4 },
        { name: this.$t("months.junFull"), code: 5 },
        { name: this.$t("months.julFull"), code: 6 },
        { name: this.$t("months.augFull"), code: 7 },
        { name: this.$t("months.sepFull"), code: 8 },
        { name: this.$t("months.octFull"), code: 9 },
        { name: this.$t("months.novFull"), code: 10 },
        { name: this.$t("months.decFull"), code: 11 }
      ],
      years: [],
      track_projects: [],
      report_month: "",
      report_year: "",
      report_date: "",
      report_project: "",
      effort_records: [],
      total_effort: 0.0,
      update_status: "",
      shared_project: "",
      connections: [],
      selectedProjectConnectionId: null,
      selectedProjects: [],
      filterIncludedFields: ["customer", "number", "name", "status", "created_at", "end_on"],
      loadingEffort: false,
      loadingEffortRecord: false,
      loadingDelete: false,
      loadingUpdate: false,
      loadingConnect: false
    };
  },
  computed: {
    ...mapGetters([
      "currentProjects",
      "currentTrackProjects",
      "currentProjectsWithHour",
      "currentConnections",
      "connectProjects",
      "projectConnectionList",
      "projectsStats"
    ]),
    ...mapState({
      error: state => state.project.error,
      toast: state => state.project.toast,
      pdf_code: state => state.project.pdf
    }),
    currentLanguage() {
      return i18nService.getActiveLanguage();
    },
    projects() {
      let arr = [];
      for (const item of this.currentProjects) {
        item.created_at = formatDate(item.created_at);
        item.end_on = formatDate(item.end_on);
        item.status_origin = item.status;
        item.status_render = this.renderStatus(item.status);
        arr.push(item);
      }
      return arr;
    },
    hadConnections() {
      return this.currentConnections && this.currentConnections.length > 0;
    }
  },
  async mounted() {
    await this.$store.dispatch(GET_CONNECTIONS);
    if (this.toast) {
      await this.toastMsg(this.toast.type, this.toast.msg);
      this.$store.commit(SET_PROJECT_TOAST, null);
    }
    await this.$store.dispatch(FILTER_PROJECT, { filter: this.status });
    this.totalRows = this.currentProjects.length;
    this.loading = !this.loading;
    await this.$store.dispatch(GET_PROJECTS_STATS);
  },
  methods: {
    formatDate,
    initDate() {
      let year = moment().year();
      this.years = [year - 1, year];

      let month = moment().month();
      if (month === 0) {
        this.report_month = 11;
        this.report_year = year - 1;
      } else {
        this.report_month = month - 1;
        this.report_year = year;
      }
    },
    setReportDate() {
      let date = moment([this.report_year, this.report_month]);
      this.report_date = moment(date).format("YYYY-MM-DD");
    },
    async initEffortDialog() {
      if (this.loadingEffort) return;
      this.loadingEffort = true;
      try {
        await this.$store.dispatch(GET_TRACK_PROJECTS);
        this.initDate();
        this.setReportDate();
        this.track_projects = this.currentTrackProjects;
        this.report_project = this.currentTrackProjects[0].id;
        this.effort_dialog = !this.effort_dialog;
      } finally {
        this.loadingEffort = false;
      }
    },
    async duplicateProject(item) {
      if (this.loading) return;
      this.loading = true;
      try {
        await this.$store.dispatch(COPY_PROJECT, { id: item.id });
        if (this.error) {
          this.toastMsg("error", this.error);
        } else {
          this.toastMsg("success", this.$t("msg.copySuccess"));
          await this.$store.dispatch(FILTER_PROJECT, { filter: this.status });
        }
      } finally {
        this.loading = false;
      }
    },
    renderName(item) {
      if (item.customer) {
        if (item.customer.type == "company") {
          return item.customer.company;
        } else {
          return item.customer.first_name + ", " + item.customer.last_name;
        }
      }
    },
    async print(item) {
      const button = document.getElementById(`print-${item.id}`);
      button.classList.remove("flaticon2-printer");
      button.classList.add("fas", "fa-spinner", "fa-spin");
      button.setAttribute("style", "pointer-events:none;color:#1BC5BD");

      await this.$store.dispatch(EXPORT_PROJECT_PDF, {
        id: item.id,
        lang: this.currentLanguage === "de" ? "de" : "en"
      });

      button.classList.remove("fas", "fa-spinner", "fa-spin");
      button.classList.add("flaticon2-printer");
      button.removeAttribute("style");

      const popUp = window.open(this.pdf_code, "_blank");
      if (popUp == null || typeof popUp == "undefined") {
        this.toastMsg("error", this.$t("msg.disablePopup"));
      } else {
        popUp.focus();
      }
    },
    remove(item) {
      this.delete_id = item.id;
      this.remove_dialog = true;
    },
    async confirmRemove() {
      if (this.loadingDelete) return;
      this.loadingDelete = true;
      try {
        await this.$store.dispatch(DELETE_PROJECT, { id: this.delete_id });
        this.remove_dialog = false;
        if (this.error) {
          this.toastMsg("error", this.error);
        } else {
          this.toastMsg("success", this.$t("msg.delSuccess"));
          this.loading = true;
          await this.$store.dispatch(FILTER_PROJECT, { filter: this.status });
          this.loading = false;
        }
      } finally {
        this.loadingDelete = false;
      }
    },
    renderStatus(item) {
      if (item === "active") {
        return this.$t("status.active");
      } else {
        return this.$t("status.archive");
      }
    },
    renderStatusStyle(item) {
      if (item === this.$t("status.active")) {
        return "success";
      } else {
        return null;
      }
    },
    renderLogTimeStyle(log, total) {
      if (log / total < 0.75) {
        return "success";
      } else if (log / total >= 0.75 && log / total <= 0.99) {
        return "warning";
      } else if (log / total > 0.99) {
        return "danger";
      }
    },
    goTo(name) {
      this.$router.push(name);
    },
    formatMoney(val) {
      return currency(val, {
        separator: "'",
        pattern: `#`,
        negativePattern: `-#`,
        increment: 0.05
      }).format();
    },
    toastMsg(type, msg) {
      const h = this.$createElement;
      this.count++;
      const vNodesTitle = h("div", { class: ["d-flex", "flex-grow-1", "align-items-baseline", "mr-2"] }, [
        h("strong", { class: "mr-2" }, type === "error" ? "Error" : this.$t("title.notice"))
      ]);
      const vNodesMsg = h("h5", { class: ["mb-0"] }, [h("strong", msg)]);
      this.$bvToast.toast([vNodesMsg], {
        title: vNodesTitle,
        variant: type === "error" ? "danger" : "success",
        toaster: "b-toaster-top-center",
        autoHideDelay: 5000,
        solid: true
      });
    },
    onFiltered(filteredItems) {
      // Trigger pagination to update the number of buttons/pages due to filtering
      this.totalRows = filteredItems.length;
      this.currentPage = 1;
    },
    onFilteredEffort(filteredItems) {
      // Trigger pagination to update the number of buttons/pages due to filtering
      this.totalRows_effort = filteredItems.length;
      this.currentPage_effort = 1;
    },
    async filterStatus(filter) {
      this.loading = !this.loading;
      this.status = filter;
      if (filter === "all") {
        await this.$store.dispatch(GET_PROJECTS);
      } else {
        await this.$store.dispatch(FILTER_PROJECT, { filter: filter });
      }
      // Update table pagination after filtered
      this.onFiltered(this.currentProjects);
      this.loading = !this.loading;
    },
    async getEffort() {
      if (this.loadingEffortRecord) return;
      this.loadingEffortRecord = true;
      try {
        this.resetEffortDialog();
        await this.$store.dispatch(GET_PROJECTS_WITH_HOUR, {
          id: this.report_project,
          date: this.report_date
        });
        if (this.error) {
          this.toastMsg("error", this.error);
        } else {
          let total = 0.0;
          for (const item of this.currentProjectsWithHour) {
            total += parseFloat(item.spent);
            let record = {
              date: formatDate(item.date),
              task: item.task,
              user: item.user.first_name,
              spent: item.spent.toFixed(2)
            };
            this.effort_records.push(record);
          }
          this.total_effort = total;
          this.totalRows_effort = this.currentProjectsWithHour.length;
        }
      } finally {
        this.loadingEffortRecord = false;
      }
    },
    resetEffortDialog() {
      this.total_effort = 0.0;
      this.effort_records = [];
      this.perPage_effort = 20;
      this.totalRows_effort = 1;
      this.currentPage_effort = 1;
    },
    toggleUpdate() {
      this.update_status = this.statusOptions[0].value;
      this.update_dialog = !this.update_dialog;
    },
    async confirmUpdate() {
      if (this.loadingUpdate) return;
      this.loadingUpdate = true;
      try {
        await this.$store.dispatch(UPDATE_PROJECT_STATUS, {
          data: {
            id: this.selectedProjects,
            status: this.update_status
          }
        });
        if (this.error) {
          this.toastMsg("error", this.error);
        } else {
          await this.$store.dispatch(FILTER_PROJECT, { filter: this.status });
          this.toastMsg("success", this.$t("msg.updateSuccess"));
          this.update_dialog = !this.update_dialog;
        }
      } finally {
        this.loadingUpdate = false;
      }
    },
    async toggleSharing(id) {
      // init selection
      let arr = [];
      await this.$store.dispatch(GET_CONNECTIONS);
      // get connected company list
      for (const connection of this.currentConnections) {
        const item = {
          name: connection.company.name,
          connected: 0,
          projects: []
        };
        // push project list
        await this.$store.dispatch(GET_CONNECT_PROJECTS, {
          id: connection.company.id
        });
        item.projects = this.connectProjects;
        // push no connection choice
        item.projects.unshift({
          id: 0,
          name: this.$t("project.noConnection")
        });
        // set selected connections
        await this.$store.dispatch(GET_PROJECT_CONNECTION_LIST, { id: id });
        for (const pr of item.projects) {
          for (const connected of this.projectConnectionList) {
            if (pr.id === connected.id) {
              item.connected = pr.id;
              break;
            }
          }
        }
        arr.push(item);
      }
      this.connections = arr;
      this.selectedProjectConnectionId = id;
      this.share_dialog = !this.share_dialog;
    },
    resetSharing() {
      this.$store.commit(CLEAR_CONNECTION_LIST);
      this.shared_project = "";
      this.share_dialog = false;
    },
    async confirmConnect() {
      if (this.loadingConnect) return;
      this.loadingConnect = true;
      try {
        let arr = [];
        for (const item of this.connections) {
          if (item.connected !== 0) {
            arr.push(item.connected);
          }
        }
        await this.$store.dispatch(CONNECT_PROJECT, {
          id: this.selectedProjectConnectionId,
          data: {
            project_ids: arr
          }
        });
        if (this.error) {
          this.toastMsg("error", this.error);
        } else {
          await this.$store.dispatch(FILTER_PROJECT, { filter: this.status });
          this.toastMsg("success", this.$t("msg.updateSuccess"));
          this.share_dialog = !this.share_dialog;
          this.selectedProjectTargetId = null;
        }
      } finally {
        this.loadingConnect = false;
      }
    },
    async deleteConnect() {
      if (this.loadingConnect) return;
      this.loadingConnect = true;
      try {
        await this.$store.dispatch(CONNECT_PROJECT, {
          id: this.selectedProjectConnectionId,
          data: {
            project_ids: []
          }
        });
        if (this.error) {
          this.toastMsg("error", this.error);
        } else {
          await this.$store.dispatch(FILTER_PROJECT, { filter: this.status });
          this.toastMsg("success", this.$t("msg.delSuccess"));
          this.share_dialog = !this.share_dialog;
          this.selectedProjectTargetId = null;
        }
      } finally {
        this.loadingConnect = false;
      }
    },
    onRowSelected(items) {
      this.selectedProjects = items;
    },
    clearSelected() {
      this.$refs.selectableTable.clearSelected();
    },
    mySortCompare(a, b, key) {
      if (key === "created_at" || key === "end_on") {
        const aDate = moment(a[key], "DD/MM/YYYY");
        const bDate = moment(b[key], "DD/MM/YYYY");
        return aDate - bDate;
      } else {
        return false;
      }
    }
  }
};
</script>

<style scoped>
.action-icon:hover,
.name-cell:hover {
  color: #3699ff;
}

.action {
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.action-start {
  display: flex;
  justify-content: flex-start;
  align-items: center;
}

#perPageSelect,
#perPageSelect_effort {
  width: 25%;
}

#filterInput {
  width: 35%;
}

.spacer {
  height: 1px;
  background-color: #999999;
  opacity: 30%;
  margin-top: 1rem;
  margin-bottom: 1rem;
}

.filter-badge {
  opacity: 0.5;
  cursor: pointer;
}

.active {
  opacity: 1;
}

.name-cell {
  width: 200px;
  text-align: left;
  cursor: pointer;
  text-decoration: underline;
}
.badge-container {
  position: relative;
  padding-right: 30px;
}

.badge-group {
  position: absolute;
  right: 0;
  top: 0;
  transform: translateY(-50%);
}

.note-badge {
  margin-top: 1rem;
  height: 10px;
  width: 10px;
  background-color: #f64e60;
  border-radius: 50%;
}

.sharing-badge {
  margin-top: 1rem;
  height: 10px;
  width: 10px;
  background-color: #3699ff;
  border-radius: 50%;
}

.project-overview-wrapper {
  width: 100%;
  display: inline-flex;
  justify-content: space-evenly;
}

.project-overview-card {
  width: 100%;
  height: 150px !important;
  margin-right: 2rem;
}

.project-overview-card:last-child {
  margin-right: 0;
}

.overview-header {
  color: #929292;
}
</style>
