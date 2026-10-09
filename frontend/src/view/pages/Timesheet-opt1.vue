<template>
  <div>
    <div class="card card-custom bg-white card-stretch gutter-b">
      <div class="card-header p-6">
        <div class="col-md-6 p-0 action-start">
          <h3>{{ $t("menu.timesheet") }}</h3>
        </div>
        <!-- Actions -->
        <div class="col-md-6 p-0 action">
          <b-button variant="primary" size="lg" class="add-btn" @click="addWorkItem">
            <i class="menu-icon flaticon2-plus-1"></i>
            <span class="menu-text"> {{ $t("button.add") }} </span>
          </b-button>
        </div>
      </div>
      <div class="card-body p-6 position-relative rounded-xl">
        <!-- Date -->
        <div class="row">
          <div class="col-md-8">
            <div class="row">
              <!-- <div class="col-md-4">
                <div class="subtitle-1 font-weight-bolder mb-2">
                  {{ $t("timesheet.startDate") }}
                </div>
                <b-input-group>
                  <b-form-input
                    v-model="startdate_formatted"
                    type="text"
                    autocomplete="off"
                    readonly
                  ></b-form-input>
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
              <div class="col-md-4">
                <div class="subtitle-1 font-weight-bolder mb-2">
                  {{ $t("timesheet.endDate") }}
                </div>
                <b-input-group>
                  <b-form-input
                    v-model="enddate_formatted"
                    type="text"
                    autocomplete="off"
                    readonly
                  ></b-form-input>
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
              <div class="col-md-2" style="display:flex;align-items:flex-end">
                <b-button variant="primary" @click="setDisplayRange()">
                  <i class="flaticon2-check-mark p-0"></i>
                </b-button>
              </div> -->
              <div class="col-md-4">
                <b-form-select
                  id="month-select"
                  v-model="month"
                  :options="months"
                  value-field="code"
                  text-field="name"
                  @change="setDisplayRange"
                ></b-form-select>
              </div>
            </div>
          </div>
          <div
            class="col-md-4"
            style="
              display: flex;
              align-items: flex-end;
              justify-content: flex-end;
            "
          >
            <b-button variant="success" class="mr-2" @click="filterThisWeek()">
              {{ $t("timesheet.thisWeek") }}
            </b-button>
            <b-button variant="info" @click="filterThisMonth()">
              {{ $t("timesheet.thisMonth") }}
            </b-button>
          </div>
        </div>

        <!-- Timesheet -->
        <div class="row mt-8">
          <div class="col-md-12 timesheet-wrapper">
            <!-- Header -->
            <div class="col-md-12 sheet-header px-0">
              <div>
                <div class="font-weight-bolder head-cell" style="width: 250px">
                  {{ $t("timesheet.service") }}
                </div>
              </div>
              <div>
                <div class="font-weight-bolder head-cell" style="width: 250px">
                  {{ $t("timesheet.task") }}
                </div>
              </div>
              <div>
                <div v-if="currentUser.role === 'admin'" class="font-weight-bolder head-cell" style="width: 150px">
                  {{ $t("timesheet.assignee") }}
                </div>
              </div>
              <!-- Date Range -->
              <div v-for="(item, i) in date_range" :key="i">
                <div
                  :id="`date_header_${setModel(item.date)}`"
                  class="font-weight-bolder head-cell text-center"
                  :class="`${setCell(item.is_weekend, item.is_holiday)} ${item.is_today ? 'text-danger' : ''}`"
                  style="width: 75px"
                >
                  {{ setHeaderDate(item.date) }}
                </div>

                <!-- Holiday name -->
                <b-tooltip
                  v-if="item.is_holiday"
                  :target="`date_header_${setModel(item.date)}`"
                  triggers="hover"
                  variant="dark"
                >
                  <div class="text-left">
                    {{ getHoliday(item.date) }}
                  </div>
                </b-tooltip>
              </div>
              <div>
                <div class="font-weight-bolder head-cell sum text-center" style="width: 100px">
                  {{ $t("timesheet.total") }}
                </div>
              </div>
            </div>

            <!-- Work Item -->
            <div
              class="sheet-body mt-2"
              :style="
                currentUser.role === 'admin'
                  ? 'width:' + (650 + 100 + date_range.length * 75) + 'px'
                  : 'width:' + (500 + 100 + date_range.length * 75) + 'px'
              "
            >
              <b-card v-for="(item, i) in sheet" :key="i" no-body class="item-card mb-1">
                <!-- Project -->
                <b-card-header class="project-cell p-4" v-b-toggle="`collapse-${i}`">
                  <div>{{ item.name }}</div>
                </b-card-header>

                <!-- Collapse Tasks -->
                <b-collapse :id="`collapse-${i}`" visible>
                  <b-card-body class="p-0">
                    <div v-for="(service, j) in item.services" :key="j" class="sheet-sub">
                      <!-- service name -->
                      <div class="body-cell" style="width: 250px">
                        {{ service.name }}
                      </div>
                      <!-- task name -->
                      <div
                        class="body-cell text-underline"
                        style="width: 250px"
                        @click="editWorkItem(service.workitem_id)"
                      >
                        {{ service.task }}
                      </div>
                      <!-- user -->
                      <div v-if="currentUser.role === 'admin'" class="body-cell" style="width: 150px">
                        {{ service.user }}
                      </div>

                      <!-- Work Log -->
                      <div
                        v-for="(record, k) in service.work_logs"
                        :key="k"
                        class="body-cell"
                        :class="setCell(record.is_weekend, record.is_holiday)"
                        style="width: 75px"
                      >
                        <!-- Comment tag -->
                        <div
                          v-if="record.comment"
                          class="comment-tag"
                          :id="`comment_${i}_${j}_${setModel(record.date)}`"
                        >
                          <b-tooltip
                            :target="`comment_${i}_${j}_${setModel(record.date)}`"
                            triggers="hover"
                            variant="dark"
                            placement="topright"
                          >
                            <div class="text-left">
                              {{ record.comment }}
                            </div>
                          </b-tooltip>
                        </div>

                        <!-- Time input -->
                        <b-form-input
                          size="sm"
                          class="text-right"
                          :id="`time_input_${i}_${j}_${setModel(record.date)}`"
                          :class="
                            `time_input_${setModel(record.date)} sub_child_${i}_${j} ${setCellInput(
                              record.is_weekend,
                              record.is_holiday
                            )}`
                          "
                          :value="record.spent > 0 ? record.spent : null"
                          @dblclick="editComment(service.workitem_id, record.date, record.spent, record.comment)"
                          @change="setWorkTime(i, j, record.date, service.workitem_id, record.comment)"
                          @keyup="pressSubmitWorkLog"
                        ></b-form-input>
                      </div>

                      <!-- Sub Total -->
                      <div
                        class="font-weight-bolder body-cell sum text-center"
                        style="width: 100px"
                        :id="`sub_total_${i}_${j}`"
                      >
                        0.00h
                      </div>
                    </div>
                  </b-card-body>
                </b-collapse>
              </b-card>
            </div>

            <!-- Footer -->
            <!-- Must Work -->
            <div
              v-if="currentUser.role !== 'admin'"
              class="sheet-footer mt-2"
              :style="'width:' + (500 + 100 + date_range.length * 75) + 'px'"
            >
              <div class="font-weight-bolder foot-cell sum" style="width: 500px">
                {{ $t("timesheet.mustWork") }}
              </div>
              <!-- Date Range -->
              <div
                v-for="(record, i) in date_range"
                :key="i"
                class="font-weight-bolder foot-cell sum text-center"
                style="width: 75px"
              >
                {{
                  !record.is_weekend && !record.is_holiday
                    ? currentSettings.timesheet.must_working_hours.toFixed(2) + "h"
                    : "0.00h"
                }}
              </div>
              <!-- Total Must Work -->
              <div>
                <div class="font-weight-bolder foot-cell sum text-center" style="width: 100px">
                  {{ calculatedTotalMustWork + "h" }}
                </div>
              </div>
            </div>

            <!-- Actual Work -->
            <div
              class="sheet-footer"
              :style="
                currentUser.role === 'admin'
                  ? 'width:' + (650 + 100 + date_range.length * 75) + 'px'
                  : 'width:' + (500 + 100 + date_range.length * 75) + 'px'
              "
            >
              <div>
                <div
                  class="font-weight-bolder foot-cell sum"
                  :style="currentUser.role === 'admin' ? 'width:650px' : 'width:500px'"
                >
                  {{ $t("timesheet.dailyTotal") }}
                </div>
              </div>
              <!-- Date Range -->
              <div
                v-for="(record, i) in date_range"
                :key="i"
                class="font-weight-bolder foot-cell sum text-center daily_total"
                style="width: 75px"
                :id="`daily_total_${setModel(record.date)}`"
              ></div>
              <!-- Total Work -->
              <div>
                <div id="total_work" class="font-weight-bolder foot-cell sum text-center" style="width: 100px">
                  0.00h
                </div>
              </div>
            </div>

            <!-- Different -->
            <div
              v-if="currentUser.role !== 'admin'"
              class="sheet-footer"
              :style="'width:' + (500 + 100 + date_range.length * 75) + 'px'"
            >
              <div>
                <div class="font-weight-bolder foot-cell sum" style="width: 500px">
                  {{ $t("timesheet.diff") }}
                </div>
              </div>
              <!-- Date Range -->
              <div
                v-for="(record, i) in date_range"
                :key="i"
                class="
                  font-weight-bolder
                  foot-cell
                  sum
                  text-center text-danger
                  daily_diff
                "
                style="width: 75px"
                :id="`daily_diff_${setModel(record.date)}`"
              ></div>
              <!-- Total Different -->
              <div>
                <div
                  id="total_diff"
                  class="
                    font-weight-bolder
                    foot-cell
                    sum
                    text-center text-danger
                  "
                  style="width: 100px"
                >
                  0.00h
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Bottom Actions -->
        <div class="col-md-12 p-0 mt-6" style="display: flex; justify-content: flex-end">
          <b-button v-if="currentUser.role === 'admin'" variant="primary" class="mr-2" @click="unlockWork()">
            {{ $t("button.unlockWork") }}
          </b-button>
          <b-button variant="primary" @click="lockWork()">
            {{ $t("button.lockWork") }}
          </b-button>
        </div>
      </div>
    </div>

    <!-- Log Dialog -->
    <b-modal
      v-model="log_dialog"
      hide-footer
      no-close-on-backdrop
      :title="`${$t('timesheet.comment')}`"
      @close="resetLogForm"
    >
      <div class="col-md-12 p-0">
        <b-form-textarea v-model="selected_log.comment" rows="6" autofocus></b-form-textarea>
      </div>

      <div class="col-md-12 p-0 mt-4 action">
        <b-button variant="primary" class="save-btn" @click="submitWorkLog">
          {{ $t("button.confirm") }}
        </b-button>
      </div>
    </b-modal>

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
          {{ $t("timesheet.task") }}
        </div>
        <b-form-select
          v-model="selected_item.task"
          :options="tasks"
          value-field="name"
          text-field="name"
          :disabled="edit_item"
        ></b-form-select>
      </div>

      <div class="col-md-12 p-0 mt-4">
        <b-button v-if="edit_item" variant="danger" class="del-btn mr-2" @click="removeWorkItem">
          <i class="flaticon2-rubbish-bin p-0 mr-2"></i>
          <span>{{ $t("button.delete") }}</span>
        </b-button>
        <b-button variant="primary" class="save-btn" style="float: right" @click="submitWorkItem">
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
  </div>
</template>

<script>
import moment from "moment";
import i18nService from "@/core/services/i18n.service.js";
import { extendMoment } from "moment-range";
import { mapGetters, mapState } from "vuex";
import { GET_SETTINGS } from "@/core/services/store/settings";
import {
  SET_TIMESHEET_ERROR,
  GET_TIMESHEET,
  GET_TRACK_PROJECTS,
  GET_TRACK_SERVICES,
  GET_TRACK_TASKS,
  GET_WORK_ITEM,
  ADD_WORK_ITEM,
  UPDATE_WORK_ITEM,
  DELETE_WORK_ITEM,
  UPDATE_WORK_LOG,
  GET_SUBMITTED_USERS,
  LOCK_WORK_RECORD,
  UNLOCK_WORK_RECORD
} from "@/core/services/store/timesheet";
import { formatDate } from "@/common";

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
  data() {
    return {
      sheet: [],
      holidays: [],
      selected_item: {
        id: "",
        project: "",
        service: "",
        task: ""
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
      confirm_lock: false,
      confirm_unlock: false,
      edit_item: false,
      edit_comment: false,
      dialog: false,
      log_dialog: false,
      lock_dialog: false,
      unlock_dialog: false
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
      "currentSubmittedUsers"
    ]),
    ...mapState({
      error: state => state.timesheet.error
    }),
    currentLanguage() {
      return i18nService.getActiveLanguage();
    },
    calculatedTotalMustWork() {
      let total = 0.0;
      for (const item of this.date_range) {
        if (!item.is_weekend && !item.is_holiday) {
          total += parseFloat(this.currentSettings.timesheet.must_working_hours);
        }
      }
      return total.toFixed(2);
    }
  },
  async mounted() {
    await this.$store.dispatch(GET_SETTINGS);
    if (this.currentSettings.timesheet.holidays) {
      for (const item of this.currentSettings.timesheet.holidays) {
        this.holidays.push(item.date);
      }
    }
    await this.initDate();
    if (this.currentUser.role === "admin") {
      await this.renderRange(moment().startOf("month"), moment().endOf("month"));
    } else {
      await this.renderRange(moment(), moment().endOf("month"));
    }
    await this.renderSheet(this.startdate, this.enddate);
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
        this.sheet = unique;
      } else {
        this.sheet = [];
      }
    },
    initTotal() {
      for (let i = 0; i < this.sheet.length; i++) {
        const project = this.sheet[i];
        for (let j = 0; j < project.services.length; j++) {
          const service = project.services[j];
          //set work item total
          this.setSubTotal(i, j);
          for (const log of service.work_logs) {
            //set daily total and daily diff
            this.setDailyTime(log.date, log.is_weekend, log.is_holiday);
          }
        }
      }
      //set total work and total diff
      this.setTotalWork();
      if (this.currentUser.role !== "admin") {
        this.setTotalDiff();
      }
    },
    initDate() {
      this.month = moment().month();
      this.startdate = moment()
        .startOf("month")
        .format("YYYY-MM-DD");
      this.enddate = moment()
        .endOf("month")
        .format("YYYY-MM-DD");
      this.today = moment();

      let year = moment().year();
      this.years = [year - 1, year];
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
        let item = {
          date: date,
          date_formatted: date.format("DD.MM.YYYY"),
          spent: "",
          comment: "",
          is_weekend: this.checkWeekend(date),
          is_holiday: this.checkHoliday(date),
          is_today: this.checkToday(date)
        };
        this.date_range.push(item);
      }
    },
    async renderSheet(start, end) {
      await this.$store.dispatch(GET_TIMESHEET, {
        start_date: start,
        end_date: end
      });
      await this.initData();
      this.initTotal();
    },
    getDisplayRange() {
      const year = moment().year();
      let startDate = moment([year, this.month]);
      let endDate = moment(startDate).endOf("month");
      this.startdate = moment(startDate).format("YYYY-MM-DD");
      this.enddate = moment(endDate).format("YYYY-MM-DD");
    },
    async setDisplayRange() {
      this.date_range = [];
      this.getDisplayRange();
      await this.renderRange(moment(this.startdate), moment(this.enddate));
      await this.renderSheet(this.startdate, this.enddate);
    },
    async filterThisWeek() {
      this.date_range = [];
      this.startdate = moment()
        .startOf("isoWeek")
        .format("YYYY-MM-DD");
      this.enddate = moment()
        .endOf("isoWeek")
        .format("YYYY-MM-DD");
      await this.renderRange(moment(this.startdate), moment(this.enddate));
      await this.renderSheet(this.startdate, this.enddate);
    },
    async filterThisMonth() {
      this.date_range = [];
      this.startdate = moment()
        .startOf("month")
        .format("YYYY-MM-DD");
      this.enddate = moment()
        .endOf("month")
        .format("YYYY-MM-DD");
      await this.renderRange(moment(this.startdate), moment(this.enddate));
      await this.renderSheet(this.startdate, this.enddate);
    },
    setCell(is_weekend, is_holiday) {
      if (is_weekend && is_holiday) {
        return "holiday";
      } else if (is_weekend && !is_holiday) {
        return "weekend";
      } else if (!is_weekend && is_holiday) {
        return "holiday";
      } else {
        return "weekday";
      }
    },
    setCellInput(is_weekend, is_holiday) {
      if (is_weekend && is_holiday) {
        return "holiday-input";
      } else if (is_weekend && !is_holiday) {
        return "weekend-input";
      } else if (!is_weekend && is_holiday) {
        return "holiday-input";
      } else {
        return "weekday-input";
      }
    },
    setModel(date) {
      return moment(date).format("DDMMYYYY");
    },
    setHeaderDate(date) {
      return moment(date).format("DD.MM");
    },
    setWorkTime(project, service, date, work_item, comment) {
      const el = document.getElementById(`time_input_${project}_${service}_${this.setModel(date)}`);
      this.selected_log.id = work_item;
      this.selected_log.date = moment(date).format("YYYY-MM-DD");
      if (el.value) {
        this.selected_log.spent = el.value;
      } else {
        this.selected_log.spent = "0h";
      }
      this.selected_log.comment = comment;
    },
    setSubTotal(project, service) {
      let total = 0.0;
      const group = document.getElementsByClassName(`sub_child_${project}_${service}`);
      const subTotal = document.getElementById(`sub_total_${project}_${service}`);
      for (const item of group) {
        if (item.value) {
          total += parseFloat(item.value);
        }
      }
      subTotal.innerHTML = total.toFixed(2) + "h";
    },
    setDailyTime(date, weekend, holiday) {
      let total = 0.0;
      const model = this.setModel(date);
      const dailyTotal = document.getElementById(`daily_total_${model}`);

      const group = document.getElementsByClassName(`time_input_${model}`);
      for (const item of group) {
        if (item.value) {
          total += parseFloat(item.value);
        }
      }
      dailyTotal.innerHTML = total.toFixed(2) + "h";

      if (this.currentUser.role !== "admin") {
        const dailyDiff = document.getElementById(`daily_diff_${model}`);
        if (!weekend && !holiday) {
          dailyDiff.innerHTML =
            (parseFloat(total) - parseFloat(this.currentSettings.timesheet.must_working_hours)).toFixed(2) + "h";
        } else {
          dailyDiff.innerHTML = (parseFloat(total) - parseFloat(0)).toFixed(2) + "h";
        }
      }
    },
    setTotalWork() {
      let total = 0.0;
      const group = document.getElementsByClassName("daily_total");
      const totalWork = document.getElementById("total_work");
      for (const item of group) {
        if (parseFloat(item.innerHTML.replace("h", ""))) {
          total += parseFloat(item.innerHTML.replace("h", ""));
        }
      }
      totalWork.innerHTML = total.toFixed(2) + "h";
    },
    setTotalDiff() {
      let total = 0.0;
      const group = document.getElementsByClassName("daily_diff");
      const totalWork = document.getElementById("total_diff");
      for (const item of group) {
        if (parseFloat(item.innerHTML.replace("h", ""))) {
          total += parseFloat(item.innerHTML.replace("h", ""));
        }
      }
      totalWork.innerHTML = total.toFixed(2) + "h";
    },
    async getServiceList(project_id) {
      await this.$store.dispatch(GET_TRACK_SERVICES, { id: project_id });
      this.services = this.currentTrackServices;
    },
    async getTaskList(service_id) {
      await this.$store.dispatch(GET_TRACK_TASKS, { id: service_id });
      this.tasks = this.currentTrackTasks;
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
      this.edit_item = true;
      this.dialog = !this.dialog;
    },
    async removeWorkItem() {
      await this.$store.dispatch(DELETE_WORK_ITEM, {
        id: this.selected_item.id
      });
      if (this.error) {
        this.toastMsg("error", this.error);
      } else {
        this.toastMsg("success", this.$t("msg.delSuccess"));
        await this.renderSheet(this.startdate, this.enddate);
        this.edit_item = false;
        this.dialog = !this.dialog;
      }
    },
    async submitWorkItem() {
      if (this.edit_item) {
        await this.$store.dispatch(UPDATE_WORK_ITEM, {
          id: this.selected_item.id,
          data: {
            project_id: this.selected_item.project,
            product_id: this.selected_item.service,
            task: this.selected_item.task
          }
        });
        if (this.error) {
          this.toastMsg("error", this.error);
        } else {
          this.toastMsg("success", this.$t("msg.updateSuccess"));
          await this.renderSheet(this.startdate, this.enddate);
          this.edit_item = false;
          this.dialog = !this.dialog;
        }
      } else {
        await this.$store.dispatch(ADD_WORK_ITEM, {
          project_id: this.selected_item.project,
          product_id: this.selected_item.service,
          task: this.selected_item.task
        });
        if (this.error) {
          this.toastMsg("error", this.error);
        } else {
          this.toastMsg("success", this.$t("msg.addSuccess"));
          await this.renderSheet(this.startdate, this.enddate);
          this.dialog = !this.dialog;
        }
      }
    },
    resetLogForm() {
      this.selected_log.id = "";
      this.selected_log.spent = "";
      this.selected_log.comment = "";
      this.edit_comment = false;
    },
    editComment(work_item, date, spent, comment) {
      this.selected_log.id = work_item;
      this.selected_log.date = moment(date).format("YYYY-MM-DD");
      this.selected_log.spent = spent;
      this.selected_log.comment = comment;
      this.edit_comment = true;
      this.log_dialog = !this.log_dialog;
    },
    pressSubmitWorkLog(e) {
      if (e.key === "Tab" || e.key === "Enter") {
        if (this.selected_log.spent) {
          this.submitWorkLog();
        }
      }
    },
    async submitWorkLog() {
      await this.$store.dispatch(UPDATE_WORK_LOG, {
        work_item_id: this.selected_log.id,
        date: this.selected_log.date,
        spent: this.selected_log.spent,
        comment: this.selected_log.comment
      });
      if (this.error) {
        this.toastMsg("error", this.error);
      } else {
        this.toastMsg("success", this.$t("msg.updateSuccess"));
        await this.renderSheet(this.startdate, this.enddate);
        if (this.edit_comment) {
          this.edit_comment = false;
          this.log_dialog = !this.log_dialog;
        }
        this.resetLogForm();
      }
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
        confirmed: this.confirm_lock
      });
      if (this.error) {
        this.toastMsg("error", this.error);
      } else {
        this.toastMsg("success", this.$t("msg.updateSuccess"));
        await this.renderSheet(this.startdate, this.enddate);
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
        await this.renderSheet(this.startdate, this.enddate);
        this.unlock_dialog = !this.unlock_dialog;
      }
    },
    toastMsg(type, msg) {
      const h = this.$createElement;
      this.count++;
      const vNodesTitle = h("div", { class: ["d-flex", "flex-grow-1", "align-items-baseline", "mr-2"] }, [
        h("strong", { class: "mr-2" }, type === "error" ? "Error" : this.$t("title.notice"))
      ]);
      this.$bvToast.toast(msg, {
        title: vNodesTitle,
        variant: type === "error" ? "danger" : "success",
        autoHideDelay: 5000,
        solid: true
      });
      this.$store.commit(SET_TIMESHEET_ERROR, null);
    }
  }
};
</script>

<style scoped>
.action-icon:hover,
.text-underline:hover {
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

.timesheet-wrapper {
  width: 100%;
  overflow-x: auto;
}

.item-card {
  border-radius: 0;
}

.sheet-header {
  display: inline-flex;
  align-items: center;
  border-right: 1px solid #ebedf3;
}

.sheet-sub,
.sheet-footer {
  display: table;
  width: 100%;
}

.sheet-body {
  height: 500px;
  overflow-y: scroll;
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.sheet-body::-webkit-scrollbar {
  display: none;
}

.sheet-body >>> .sheet-sub,
.timesheet-wrapper > .sheet-footer {
  border-top: 1px solid #ebedf3;
  border-bottom: 1px solid #ebedf3;
}

.sheet-body >>> .sheet-sub ~ .sheet-sub,
.timesheet-wrapper > .sheet-footer ~ .sheet-footer {
  border-top: none;
}

.head-cell {
  background-color: #f3f6f9;
  border-top: 1px solid #ebedf3;
  border-bottom: 1px solid #ebedf3;
  border-left: 1px solid #ebedf3;
  padding: 1rem;
}

.foot-cell {
  display: table-cell;
  vertical-align: middle;
  padding: 1rem;
  border-right: 1px solid #ebedf3;
}

.foot-cell:first-child {
  border-left: 1px solid #ebedf3;
}

.body-cell {
  display: table-cell;
  vertical-align: middle;
  position: relative;
  padding: 1rem;
  overflow: hidden;
  border-right: 1px solid #ebedf3;
}

.body-cell:last-child {
  border-right: none;
}

.project-cell {
  font-weight: bold;
  background-color: #f3f6f9;
}

td,
th {
  padding: 10px;
  border: 1px solid #e4e6ef;
  text-align: left;
}

.weekend {
  background-color: #c6c6c9;
}

.holiday {
  background-color: #c3e6cb;
}

.sum {
  background-color: #b8daff;
}

.weekend-input {
  background-color: #e3e4e6;
}

.holiday-input {
  background-color: #dfffe6;
}

.text-underline {
  text-decoration: underline;
  cursor: pointer;
}

.comment-tag {
  position: absolute;
  background-color: #e53935;
  height: 15px;
  width: 15px;
  right: -7px;
  top: -7px;
  transform: rotate(45deg);
}

.spacer {
  height: 1px;
  background-color: #999999;
  opacity: 30%;
  margin-top: 1rem;
  margin-bottom: 1rem;
}
</style>
