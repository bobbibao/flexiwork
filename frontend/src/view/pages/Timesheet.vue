<template>
  <div>
    <div class="card card-custom bg-white card-stretch gutter-b">
      <div class="card-header p-6">
        <div class="col-md-4 p-0 action-start">
          <h3>{{ $t("menu.timesheet") }}</h3>
        </div>
        <!-- Actions -->
        <div class="col-md-8 p-0 action">
          <b-button variant="primary" size="lg" class="mr-2" @click="reloadTimesheet">
            <i class="menu-icon flaticon2-reload"></i>
            {{ $t("button.reloadTimesheet") }}
          </b-button>
          <b-button
            v-if="currentUser.role === 'admin'"
            variant="primary"
            size="lg"
            class="mr-2"
            @click="filterPersonalSheet"
          >
            <i class="menu-icon flaticon2-user"></i>
            {{ $t("timesheet.personal") }}
          </b-button>
          <b-button variant="primary" size="lg" class="add-btn" @click="addWorkItem">
            <i class="menu-icon flaticon2-plus-1"></i>
            <span class="menu-text"> {{ $t("button.add") }} </span>
          </b-button>
        </div>
      </div>
      <div class="card-body p-6 position-relative rounded-xl">
        <div class="row">
          <div class="col-md-8">
            <div class="row">
              <!-- Year -->
              <div class="col-md-2">
                <b-form-select
                  id="year-select"
                  v-model="year"
                  :options="years"
                  @change="setDisplayRange"
                ></b-form-select>
              </div>
              <!-- Month -->
              <div class="col-md-2">
                <b-form-select
                  id="month-select"
                  v-model="month"
                  :options="months"
                  value-field="code"
                  text-field="name"
                  @change="setDisplayRange"
                ></b-form-select>
              </div>
              <!-- Scope -->
              <div class="col-md-3">
                <b-form-select
                  id="scope-select"
                  v-model="scope"
                  :options="scopes"
                  value-field="value"
                  text-field="name"
                  @change="setDisplayContent"
                ></b-form-select>
              </div>
              <!-- User -->
              <div v-if="currentUser.role === 'admin'" class="col-md-3">
                <b-form-select
                  id="user-select"
                  v-model="user"
                  :options="users"
                  value-field="id"
                  text-field="name"
                  @change="setDisplayContent"
                ></b-form-select>
              </div>
            </div>
          </div>
          <!-- Quick Filter -->
          <div
            class="col-md-4"
            style="
              display: flex;
              align-items: flex-end;
              justify-content: flex-end;
            "
          >
            <b-button variant="warning" class="mr-2" @click="toggleViewOption()">
              {{ $t("timesheet.viewOption") }}
            </b-button>
            <b-button variant="success" class="mr-2" @click="filterThisWeek()">
              {{ $t("timesheet.thisWeek") }}
            </b-button>
            <b-button variant="info" @click="filterThisMonth()">
              {{ $t("timesheet.thisMonth") }}
            </b-button>
          </div>
        </div>

        <!-- Timesheet -->
        <timesheet-table
          class="mt-6"
          :sheet="sheet"
          :dates="date_range"
          :target-user="selectedUser"
          :current-user="currentUser"
          :flexible-time="currentFlexibleTime"
          :loading="loading"
          @workitem-selected="params => editWorkItem(params.workitem_id)"
          @worklog-updated="onWorklogUpdated"
        />

        <!-- Bottom Actions -->
        <div class="col-md-12 p-0 mt-6" style="display: flex; justify-content: flex-end">
          <div>
            <b-button v-if="currentUser.role === 'admin'" variant="primary" class="mr-2" @click="unlockWork()">
              {{ $t("button.unlockWork") }}
            </b-button>
            <b-button variant="primary" @click="lockWork()">
              {{ $t("button.lockWork") }}
            </b-button>
          </div>
        </div>
      </div>
    </div>

    <!-- CRUD Dialog -->
    <b-modal v-model="dialog" hide-footer no-close-on-backdrop :title="`${$t('title.confirm')}`" @close="resetCrudForm">
      <div class="col-md-12 p-0">
        <div class="subtitle-1 font-weight-bolder mb-2">
          {{ $t("timesheet.project") }}
        </div>
        <b-form-select
          v-model="selected_item.project"
          :options="projects"
          value-field="id"
          text-field="name"
          :disabled="edit_item"
          @change="getServiceList(selected_item.project)"
        ></b-form-select>
      </div>

      <div class="col-md-12 p-0 mt-2">
        <div class="subtitle-1 font-weight-bolder mb-2">
          {{ $t("timesheet.service") }}
        </div>
        <b-form-select
          v-model="selected_item.service"
          :options="services"
          value-field="id"
          text-field="name"
          :disabled="edit_item"
          @change="getTaskList(selected_item.service)"
        ></b-form-select>
      </div>

      <div class="col-md-12 p-0 mt-2">
        <div class="subtitle-1 font-weight-bolder mb-2">
          {{ $t("timesheet.task") + " (At least 1 option)" }}
        </div>
        <b-form-select
          v-model="selected_item.task"
          :options="tasks"
          value-field="name"
          text-field="name"
          multiple
          :disabled="edit_item"
        ></b-form-select>
      </div>

      <div class="col-md-12 p-0 mt-4">
        <!--<b-button
          v-if="edit_item"
          variant="danger"
          class="del-btn mr-2"
          @click="removeWorkItem"
        >
          <i class="flaticon2-rubbish-bin p-0 mr-2"></i>
          <span>{{ $t("button.delete") }}</span>
        </b-button>-->
        <b-button v-if="!edit_item" variant="primary" class="save-btn" style="float: right" @click="submitWorkItem">
          <i class="flaticon2-check-mark p-0 mr-2"></i>
          {{ $t("button.confirm") }}
        </b-button>
      </div>
    </b-modal>

    <!-- Submit Report Dialog -->
    <b-modal
      v-model="lock_dialog"
      hide-footer
      no-close-on-backdrop
      :title="`${$t('title.submitReport')}`"
      @close="resetReportForm"
    >
      <div class="col-md-12 p-0">
        <div class="subtitle-1 font-weight-bolder mb-2">
          {{ $t("timesheet.month") }}
        </div>
        <b-form-select
          v-model="report_month"
          :options="months"
          value-field="code"
          text-field="name"
          @change="setReportDate"
        ></b-form-select>
      </div>

      <div class="col-md-12 p-0 mt-4">
        <div class="subtitle-1 font-weight-bolder mb-2">
          {{ $t("timesheet.year") }}
        </div>
        <b-form-select v-model="report_year" :options="years" @change="setReportDate"></b-form-select>
      </div>

      <div class="col-md-12 p-0 mt-4">
        <b-form-checkbox class="confirm-box" :checked="confirm_lock === true" @change="confirm_lock = !confirm_lock">{{
          $t("timesheet.confirmReport")
        }}</b-form-checkbox>
      </div>

      <div class="col-md-12 p-0 mt-4">
        <b-button variant="primary" class="save-btn" style="float: right" @click="submitLockWork">
          <i class="flaticon2-check-mark p-0 mr-2"></i>
          {{ $t("button.confirm") }}
        </b-button>
      </div>
    </b-modal>

    <!-- Unlock Report Dialog -->
    <b-modal
      v-model="unlock_dialog"
      hide-footer
      no-close-on-backdrop
      :title="`${$t('title.unlockReport')}`"
      @close="resetReportForm"
    >
      <div class="col-md-12 p-0">
        <div class="subtitle-1 font-weight-bolder mb-2">
          {{ $t("timesheet.month") }}
        </div>
        <b-form-select
          v-model="report_month"
          :options="months"
          value-field="code"
          text-field="name"
          @change="setUnlockReportDate"
        ></b-form-select>
      </div>

      <div class="col-md-12 p-0 mt-4">
        <div class="subtitle-1 font-weight-bolder mb-2">
          {{ $t("timesheet.year") }}
        </div>
        <b-form-select v-model="report_year" :options="years" @change="setUnlockReportDate"></b-form-select>
      </div>

      <div class="col-md-12 p-0 mt-4">
        <div class="subtitle-1 font-weight-bolder mb-2">
          {{ $t("timesheet.users") }}
        </div>
        <div v-if="unlock_users.length > 0">
          <div v-for="(item, i) in unlock_users" :key="i" class="mb-2">
            <b-form-checkbox class="confirm-box" :checked="item.selected === true" @change="setUnlockedUser(item.id)">{{
              item.email + " (" + item.name + ")"
            }}</b-form-checkbox>
          </div>
        </div>
        <div v-else>
          <div class="text-muted">{{ $t("timesheet.noUser") }}</div>
        </div>
      </div>

      <div class="col-md-12 p-0 mt-4">
        <b-form-checkbox
          class="confirm-box"
          :checked="confirm_unlock === true"
          @change="confirm_unlock = !confirm_unlock"
          >{{ $t("timesheet.confirmReport") }}</b-form-checkbox
        >
      </div>

      <div class="col-md-12 p-0 mt-4">
        <b-button variant="primary" class="save-btn" style="float: right" @click="submitUnlockWork">
          <i class="flaticon2-check-mark p-0 mr-2"></i>
          {{ $t("button.confirm") }}
        </b-button>
      </div>
    </b-modal>

    <!-- View option dialog -->
    <b-modal
      v-model="view_option_dialog"
      size="lg"
      hide-footer
      no-close-on-backdrop
      :title="`${$t('title.workItemList')}`"
      @close="resetViewOption"
    >
      <div class="col-md-12">
        <div v-for="(project, i) in view_option" :key="i" class="col-md-12 mb-3">
          <b-form-checkbox
            :id="`project_view_option_${project.id}`"
            class="viewoption-box"
            size="lg"
            :checked="initProjectViewOption(project.id)"
            @change="setProjectViewOption(project.id, project.services)"
          >
            <b>{{ project.name }}</b>
          </b-form-checkbox>

          <div v-for="(service, j) in project.services" :key="j" class="col-md-12 mt-1">
            <b-form-checkbox
              :id="`service_view_option_${project.id}_${service.workitem_id}`"
              class="viewoption-box ml-4"
              :checked="!service.is_hide"
              @change="setServiceViewOption(service.workitem_id)"
            >
              <div class="font-weight-bold">{{ service.name }}</div>
              <div class="text-muted">{{ service.task }}</div>
            </b-form-checkbox>
          </div>
        </div>
      </div>
      <div
        class="col-md-12 p-0 mt-4"
        style="
          display: flex;
          justify-content: space-between;
          align-items: center;
        "
      >
        <b-form-checkbox id="all_view_option" class="viewall-box" size="lg" @change="setAllViewOption">
          {{ $t("timesheet.showAll") }}
        </b-form-checkbox>
        <b-button variant="primary" class="save-btn" @click="submitViewOption">
          <i class="flaticon2-check-mark p-0 mr-2"></i>
          {{ $t("button.confirm") }}
        </b-button>
      </div>
    </b-modal>
  </div>
</template>

<script>
import moment from "moment";
import i18nService from "@/core/services/i18n.service.js";
import { extendMoment } from "moment-range";
import { mapGetters, mapState } from "vuex";
import { GET_SETTINGS, GET_SIMPLE_USERS, GET_COMPANY } from "@/core/services/store/settings";
import {
  SET_TIMESHEET_ERROR,
  GET_TIMESHEET,
  GET_TRACK_PROJECTS,
  GET_TRACK_SERVICES,
  GET_TRACK_TASKS,
  GET_WORK_ITEM,
  ADD_WORK_ITEM,
  DELETE_WORK_ITEM,
  UPDATE_WORK_LOG,
  GET_SUBMITTED_USERS,
  LOCK_WORK_RECORD,
  UNLOCK_WORK_RECORD,
  GET_FLEXIBLE_TIME,
  GET_DISPLAY_WORK_ITEMS,
  UPDATE_DISPLAY_WORK_ITEMS,
  SET_DISPLAY_PROJECT,
  SET_DISPLAY_SERVICE,
  SET_DISPLAY_ALL,
  SELECT_USER
} from "@/core/services/store/timesheet";
import { formatDate } from "@/common";

import TimesheetTable from "../content/timesheet/TimesheetTable.vue";

const Moment = extendMoment(moment);

export default {
  name: "timesheet",
  metaInfo: {
    title: "Timesheet",
    meta: [
      { hid: "description", name: "description", content: "Timesheet Page" },
      {
        hid: "og:site_name",
        property: "og:site_name",
        content: "Archapp"
      },
      {
        hid: "og:title",
        property: "og:title",
        content: "Timesheet | Archapp"
      },
      {
        hid: "og:description",
        property: "og:description",
        content: "Timesheet | Archapp"
      },
      {
        hid: "og:image",
        property: "og:image",
        content: ""
      }
    ]
  },
  components: {
    TimesheetTable
  },
  data() {
    return {
      sheet: [],
      holidays: [],
      selected_item: {
        id: "",
        project: "",
        service: "",
        task: []
      },
      selected_log: {
        id: "",
        date: "",
        comment: "",
        spent: ""
      },
      report_date: "",
      month: "",
      report_month: "",
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
      year: "",
      report_year: "",
      years: [],
      projects: [],
      services: [],
      tasks: [],
      date_range: [],
      unlock_users: [],
      startdate: "",
      enddate: "",
      today: "",
      locale: "de",
      scopes: [
        { name: this.$t("timesheet.billable"), value: "billable" },
        { name: this.$t("timesheet.internal"), value: "internal" },
        { name: this.$t("timesheet.all"), value: "all" }
      ],
      scope: "all",
      users: [],
      user: "",
      view_option: [],
      confirm_lock: false,
      confirm_unlock: false,
      edit_item: false,
      edit_comment: false,
      dialog: false,
      log_dialog: false,
      lock_dialog: false,
      unlock_dialog: false,
      view_option_dialog: false,
      loading: true
    };
  },
  computed: {
    ...mapGetters([
      "currentUser",
      "currentSettings",
      "currentSheet",
      "currentTrackProjects",
      "currentTrackServices",
      "currentTrackTasks",
      "currentWorkItem",
      "currentSubmittedUsers",
      "currentFlexibleTime",
      "currentSimpleUsers",
      "currentDisplayWorkItems",
      "selectedUser"
    ]),
    ...mapState({
      error: state => state.timesheet.error
    }),
    currentLanguage() {
      return i18nService.getActiveLanguage();
    }
  },
  async mounted() {
    await this.$store.dispatch(GET_COMPANY);
    await this.$store.dispatch(GET_SETTINGS);
    this.initUsers();
    if (this.currentSettings.timesheet.holidays) {
      for (const item of this.currentSettings.timesheet.holidays) {
        this.holidays.push(item.date);
      }
    }
    await this.initDate();
    await this.initSheet();
    if (this.currentLanguage === "de") {
      this.locale = "de";
    } else {
      this.locale = "en-US";
    }
  },
  methods: {
    formatDate,
    initData() {
      if (this.currentSheet.length > 0) {
        // group project
        let group = [];
        for (const item of this.currentSheet) {
          if (item.project) {
            let project = {
              id: item.project.id,
              name: item.project.name,
              services: []
            };
            group.push(project);
          }
        }
        // filter unique project
        let unique = Array.from(new Set(group.map(item => item.id))).map(id => {
          return group.find(item => item.id === id);
        });
        // group service and task
        for (const item of unique) {
          for (const row of this.currentSheet) {
            if (row.project) {
              if (item.id === row.project.id) {
                if (row.product) {
                  let service = {
                    is_hidden: row.is_hide || false,
                    workitem_id: row.id,
                    id: row.product.id,
                    name: row.product.name,
                    task: row.task,
                    user: row.user ? row.user.first_name : null,
                    work_logs: this.date_range.map(i => Object.assign({}, i))
                  };
                  //fill work log
                  for (const record of service.work_logs) {
                    if (row.work_logs) {
                      for (const log of row.work_logs) {
                        if (formatDate(log.date) === record.date_formatted) {
                          record.spent = log.spent;
                          if (log.comment) {
                            record.comment = log.comment;
                          }
                        }
                      }
                    }
                  }
                  item.services.push(service);
                }
              }
            }
          }
        }
        this.sheet = unique.sort((a, b) => a.name.localeCompare(b.name));
      } else {
        this.sheet = [];
      }

      this.sheet.key = moment().unix();
    },
    async initUsers() {
      let result = [];
      await this.$store.dispatch(GET_SIMPLE_USERS);
      for (const user of this.currentSimpleUsers) {
        //set default selected
        if (user.id === this.currentUser.id) {
          this.user = user.id;
        }
        //handle list user
        let item = {
          id: user.id,
          name: ""
        };
        if (user.first_name) {
          item.name = user.first_name + " " + user.last_name + " (" + user.email + ")";
        } else {
          item.name = user.email;
        }
        result.push(item);
      }
      this.users = result;
    },
    initDate() {
      let year = moment().year();
      this.years = [year - 2, year - 1, year, year + 1];
      this.month = moment().month();
      this.year = moment().year();
      this.today = moment();
    },
    async initSheet() {
      this.startdate = moment()
        .startOf("isoWeek")
        .format("YYYY-MM-DD");
      this.enddate = moment()
        .endOf("isoWeek")
        .format("YYYY-MM-DD");
      await this.renderRange(moment(this.startdate), moment(this.enddate));
      await this.setFlexible(this.currentUser.id, this.startdate, this.enddate);
      await this.renderSheet(this.startdate, this.enddate, this.scope, this.user);
      this.loading = false;
    },
    checkToday(date) {
      const weekday = moment(date).format("YYYY-MM-DD");
      if (weekday === this.today.format("YYYY-MM-DD")) {
        return true;
      } else {
        return false;
      }
    },
    checkWeekend(date) {
      const weekday = moment(date).day();
      if (weekday === 0 || weekday === 6) {
        return true;
      } else {
        return false;
      }
    },
    checkHoliday(date) {
      const weekday = moment(date).format("YYYY-MM-DD");
      if (this.holidays.includes(weekday)) {
        return true;
      } else {
        return false;
      }
    },
    getHoliday(date) {
      const weekday = moment(date).format("YYYY-MM-DD");
      for (const item of this.currentSettings.timesheet.holidays) {
        if (weekday === item.date) {
          return item.label;
        }
      }
    },
    renderRange(start, end) {
      const range = Moment.range(start, end);
      for (let date of range.by("days")) {
        const isHoliday = this.checkHoliday(date);
        const holidayName = isHoliday ? this.getHoliday(date) : null;
        let item = {
          date: date,
          date_formatted: date.format("DD.MM.YYYY"),
          spent: "",
          comment: "",
          is_weekend: this.checkWeekend(date),
          is_today: this.checkToday(date),
          is_holiday: isHoliday,
          holiday_name: holidayName
        };
        this.date_range.push(item);
      }

      this.date_range.key = moment().unix();
    },
    async renderSheet(start, end, scope, user) {
      let payload = {
        start_date: start,
        end_date: end
      };
      if (scope !== "all") {
        payload.filter = scope;
      }
      if (user) {
        payload.user = user;
      }

      //init new data
      await this.$store.dispatch(SELECT_USER, { id: user });
      await this.$store.dispatch(GET_TIMESHEET, payload);
      await this.initData();
    },
    getDisplayRange() {
      let startDate = moment([this.year, this.month]);
      let endDate = moment(startDate).endOf("month");
      this.startdate = moment(startDate).format("YYYY-MM-DD");
      this.enddate = moment(endDate).format("YYYY-MM-DD");
    },
    async setDisplayRange() {
      this.loading = true;
      this.date_range = [];
      this.getDisplayRange();
      await this.renderRange(moment(this.startdate), moment(this.enddate));
      await this.setFlexible(this.user, this.startdate, this.enddate);
      await this.renderSheet(this.startdate, this.enddate, this.scope, this.user);
      this.loading = false;
    },
    async filterThisWeek() {
      this.loading = true;
      this.date_range = [];
      this.startdate = moment()
        .startOf("isoWeek")
        .format("YYYY-MM-DD");
      this.enddate = moment()
        .endOf("isoWeek")
        .format("YYYY-MM-DD");
      await this.renderRange(moment(this.startdate), moment(this.enddate));
      await this.setFlexible(this.user, this.startdate, this.enddate);
      await this.renderSheet(this.startdate, this.enddate, this.scope, this.user);
      this.loading = false;
    },
    async filterThisMonth() {
      this.loading = true;
      this.date_range = [];
      this.startdate = moment()
        .startOf("month")
        .format("YYYY-MM-DD");
      this.enddate = moment()
        .endOf("month")
        .format("YYYY-MM-DD");
      await this.renderRange(moment(this.startdate), moment(this.enddate));
      await this.setFlexible(this.user, this.startdate, this.enddate);
      await this.renderSheet(this.startdate, this.enddate, this.scope, this.user);
      this.loading = false;
    },
    async filterPersonalSheet() {
      this.loading = true;
      await this.setFlexible(this.currentUser.id, this.startdate, this.enddate);
      await this.renderSheet(this.startdate, this.enddate, this.scope, this.currentUser.id);
      this.user = this.currentUser.id;
      this.loading = false;
    },
    async setDisplayContent() {
      this.loading = true;
      await this.setFlexible(this.user, this.startdate, this.enddate);
      await this.renderSheet(this.startdate, this.enddate, this.scope, this.user);
      this.loading = false;
    },
    setScrollWidth() {
      let resolution = screen.width;
      if (this.currentUser.role === "admin") {
        if (resolution >= 1600) {
          return 700;
        } else if (resolution >= 1440 && resolution < 1600) {
          return 530;
        } else {
          return 370;
        }
      } else {
        if (resolution >= 1600) {
          return 850;
        } else if (resolution >= 1440 && resolution < 1600) {
          return 680;
        } else {
          return 520;
        }
      }
    },
    setBodyHeight() {
      let height = 0;
      let services = 0;
      for (const item of this.sheet) {
        services += item.services.length;
      }
      height = this.sheet.length * 45 + services * 45;
      if (height > 500) {
        return height;
      } else {
        return 500;
      }
    },
    setModel(date) {
      return moment(date).format("DDMMYYYY");
    },
    async setFlexible(user, start, end) {
      await this.$store.dispatch(GET_FLEXIBLE_TIME, {
        user_id: user,
        start_date: start,
        end_date: end
      });
    },
    async getServiceList(project_id) {
      await this.$store.dispatch(GET_TRACK_SERVICES, { id: project_id });
      this.services = this.currentTrackServices;
    },
    async getTaskList(service_id) {
      await this.$store.dispatch(GET_TRACK_TASKS, { id: service_id });
      this.tasks = this.currentTrackTasks;
      if (this.tasks.length === 1) {
        const arr = [];
        arr.push(this.tasks[0].name);
        this.selected_item.task = arr;
      }
    },
    resetCrudForm() {
      this.selected_item.project = "";
      this.selected_item.service = "";
      this.selected_item.task = "";
      this.projects = [];
      this.services = [];
      this.tasks = [];
      this.edit_item = false;
    },
    async addWorkItem() {
      this.resetCrudForm();
      await this.$store.dispatch(GET_TRACK_PROJECTS);
      this.projects = this.currentTrackProjects;
      this.dialog = !this.dialog;
    },
    async editWorkItem(id) {
      this.dialog = !this.dialog;
      this.edit_item = true;
      await this.$store.dispatch(GET_WORK_ITEM, { id: id });
      await this.$store.dispatch(GET_TRACK_PROJECTS);
      await this.$store.dispatch(GET_TRACK_SERVICES, {
        id: this.currentWorkItem.project.id
      });
      await this.$store.dispatch(GET_TRACK_TASKS, {
        id: this.currentWorkItem.product.id
      });
      this.projects = this.currentTrackProjects;
      this.services = this.currentTrackServices;
      this.tasks = this.currentTrackTasks;
      this.selected_item.id = id;
      this.selected_item.project = this.currentWorkItem.project.id;
      this.selected_item.service = this.currentWorkItem.product.id;
      this.selected_item.task = this.currentWorkItem.task;
    },
    async removeWorkItem() {
      await this.$store.dispatch(DELETE_WORK_ITEM, {
        id: this.selected_item.id
      });
      if (this.error) {
        this.toastMsg("error", this.error);
      } else {
        this.toastMsg("success", this.$t("msg.delSuccess"));
        this.loading = true;
        await this.setFlexible(this.user, this.startdate, this.enddate);
        await this.renderSheet(this.startdate, this.enddate, this.scope, this.user);
        this.loading = false;
        this.edit_item = false;
        this.dialog = !this.dialog;
      }
    },
    async submitWorkItem() {
      if (this.currentUser.role === "admin") {
        await this.$store.dispatch(ADD_WORK_ITEM, {
          project_id: this.selected_item.project,
          product_id: this.selected_item.service,
          tasks: this.selected_item.task,
          user_id: this.user
        });
      } else {
        await this.$store.dispatch(ADD_WORK_ITEM, {
          project_id: this.selected_item.project,
          product_id: this.selected_item.service,
          tasks: this.selected_item.task
        });
      }

      if (this.error) {
        this.toastMsg("error", this.error);
      } else {
        this.toastMsg("success", this.$t("msg.addSuccess"));
        this.loading = true;
        await this.renderSheet(this.startdate, this.enddate, this.scope, this.user);
        this.loading = false;
        this.dialog = !this.dialog;
      }
    },
    async reloadTimesheet() {
      this.loading = true;
      await this.setFlexible(this.user, this.startdate, this.enddate);
      await this.renderSheet(this.startdate, this.enddate, this.scope, this.user);
      this.loading = false;
    },
    resetReportForm() {
      this.report_year = "";
      this.report_month = "";
      this.report_date = "";
      this.unlock_users = [];
      this.confirm_lock = false;
      this.confirm_unlock = false;
    },
    setReportDate() {
      let date = moment([this.report_year, this.report_month]);
      this.report_date = moment(date).format("YYYY-MM-DD");
    },
    async setUnlockReportDate() {
      this.unlock_users = [];
      this.setReportDate();
      await this.getSubmittedUsers();
    },
    async getSubmittedUsers() {
      await this.$store.dispatch(GET_SUBMITTED_USERS, {
        date: this.report_date
      });
      for (const user of this.currentSubmittedUsers) {
        let item = {
          id: user.id,
          name: user.name ? user.name : "",
          email: user.email,
          selected: false
        };
        this.unlock_users.push(item);
      }
    },
    setUnlockedUser(id) {
      for (const user of this.unlock_users) {
        if (user.id === id) {
          user.selected = !user.selected;
          break;
        }
      }
    },
    lockWork() {
      let month = moment().month();
      let year = moment().year();
      if (month === 0) {
        this.report_month = 11;
        this.report_year = year - 1;
      } else {
        this.report_month = month - 1;
        this.report_year = year;
      }
      this.setReportDate();
      this.lock_dialog = true;
    },
    async unlockWork() {
      this.unlock_users = [];
      let month = moment().month();
      let year = moment().year();
      if (month === 0) {
        this.report_month = 11;
        this.report_year = year - 1;
      } else {
        this.report_month = month - 1;
        this.report_year = year;
      }
      await this.setReportDate();
      await this.getSubmittedUsers();
      this.unlock_dialog = true;
    },
    async submitLockWork() {
      await this.$store.dispatch(LOCK_WORK_RECORD, {
        date: this.report_date,
        confirmed: this.confirm_lock,
        user_id: this.user
      });
      if (this.error) {
        this.toastMsg("error", this.error);
      } else {
        this.toastMsg("success", this.$t("msg.updateSuccess"));
        this.loading = true;
        await this.renderSheet(this.startdate, this.enddate, this.scope, this.user);
        this.loading = false;
        this.lock_dialog = !this.lock_dialog;
      }
    },
    async submitUnlockWork() {
      let arr = [];
      for (const user of this.unlock_users) {
        if (user.selected) {
          arr.push(user.id);
        }
      }

      await this.$store.dispatch(UNLOCK_WORK_RECORD, {
        date: this.report_date,
        user_ids: arr,
        confirmed: this.confirm_unlock
      });
      if (this.error) {
        this.toastMsg("error", this.error);
      } else {
        this.toastMsg("success", this.$t("msg.updateSuccess"));
        this.loading = true;
        await this.renderSheet(this.startdate, this.enddate, this.scope, this.user);
        this.loading = false;
        this.unlock_dialog = !this.unlock_dialog;
      }
    },
    async toggleViewOption() {
      await this.$store.dispatch(GET_DISPLAY_WORK_ITEMS, { id: this.user });
      if (this.currentDisplayWorkItems.length > 0) {
        // group project
        let group = [];
        for (const item of this.currentDisplayWorkItems) {
          if (item.project) {
            let project = {
              id: item.project.id,
              name: item.project.name,
              services: []
            };
            group.push(project);
          }
        }
        // filter unique project
        let unique = Array.from(new Set(group.map(item => item.id))).map(id => {
          return group.find(item => item.id === id);
        });
        // group service and task
        for (const item of unique) {
          for (const row of this.currentDisplayWorkItems) {
            if (row.project) {
              if (item.id === row.project.id) {
                if (row.product) {
                  let service = {
                    workitem_id: row.id,
                    id: row.product.id,
                    name: row.product.name,
                    task: row.task,
                    is_hide: row.is_hide
                  };
                  item.services.push(service);
                }
              }
            }
          }
        }
        this.view_option = unique;
      }
      this.view_option_dialog = !this.view_option_dialog;
    },
    resetViewOption() {
      this.view_option = [];
    },
    initProjectViewOption(id) {
      let checked = true;
      let counter = 0;
      for (const item of this.currentDisplayWorkItems) {
        if (item.project.id === id) {
          if (item.is_hide) {
            counter++;
          }
        }
      }
      for (const item of this.view_option) {
        if (item.id === id) {
          if (counter === item.services.length) {
            checked = false;
          }
        }
      }
      return checked;
    },
    setProjectViewOption(id, services) {
      const el = document.getElementById(`project_view_option_${id}`);
      for (const item of services) {
        const sv = document.getElementById(`service_view_option_${id}_${item.workitem_id}`);
        if (el.checked) {
          sv.checked = true;
        } else {
          sv.checked = false;
        }
      }

      this.$store.commit(SET_DISPLAY_PROJECT, {
        id: id,
        status: el.checked ? false : true
      });
    },
    setServiceViewOption(id) {
      this.$store.commit(SET_DISPLAY_SERVICE, id);
    },
    setAllViewOption() {
      const el = document.getElementById("all_view_option");
      for (const project of this.view_option) {
        const pr = document.getElementById(`project_view_option_${project.id}`);
        pr.checked = el.checked ? true : false;
        for (const service of project.services) {
          const se = document.getElementById(`service_view_option_${project.id}_${service.workitem_id}`);
          se.checked = el.checked ? true : false;
        }
      }
      this.$store.commit(SET_DISPLAY_ALL, el.checked ? false : true);
    },
    async submitViewOption() {
      let active = [];
      for (const item of this.currentDisplayWorkItems) {
        if (!item.is_hide) {
          active.push(item.id);
        }
      }

      await this.$store.dispatch(UPDATE_DISPLAY_WORK_ITEMS, {
        ids: active,
        user_id: this.user
      });
      if (this.error) {
        this.toastMsg("error", this.error);
      } else {
        this.toastMsg("success", this.$t("msg.updateSuccess"));
        this.loading = true;
        await this.renderSheet(this.startdate, this.enddate, this.scope, this.user);
        this.loading = false;
        this.resetViewOption();
        this.view_option_dialog = !this.view_option_dialog;
      }
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
      this.$store.commit(SET_TIMESHEET_ERROR, null);
    },

    onWorklogUpdated(payload) {
      this.$store
        .dispatch(UPDATE_WORK_LOG, {
          work_item_id: payload.workitem_id,
          date: payload.date_formatted,
          spent: (payload.data.value || 0).toString(),
          comment: payload.data.comment || ""
        })
        .then(res => {
          if (res.error) {
            this.toastMsg("error", res.message);
          } else {
            this.toastMsg("success", this.$t("msg.changeSuccess"));
          }
        });
    }
  }
};
</script>

<style scoped>
.action-icon:hover,
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
</style>
