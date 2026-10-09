<template>
  <div class="mt-8">
    <!--  User table -->
    <b-table bordered head-variant="light" :items="currentUsers" :fields="fields">
      <template v-slot:cell(is_active)="row">
        <b-badge
          :variant="row.item.is_active === true ? 'success' : 'danger'"
          style="cursor: pointer"
          @click="toggleStatus(row.item)"
        >
          <div class="text-capitalize">
            {{ row.item.is_active ? $t("status.active") : $t("status.disabled") }}
          </div>
        </b-badge>
      </template>

      <template v-slot:cell(role)="row">
        {{ renderRole(row.item) }}
      </template>

      <template v-slot:cell(actions)="row">
        <i class="action-icon flaticon2-writing mr-2" @click="editUser(row.item)"></i>
        <!-- <i
          class="action-icon flaticon2-calendar mr-2"
          @click="editWorkload(row.item)"
        ></i> -->
        <i class="action-icon flaticon2-rubbish-bin mr-2" @click="removeUser(row.item)"></i>
      </template>
    </b-table>

    <!--  Actions -->
    <div class="row">
      <div class="col-md-12 action mt-4">
        <b-button variant="primary" size="lg" class="update-btn" @click="addUser(), resetForm()">{{
          $t("button.add")
        }}</b-button>
      </div>
    </div>

    <!-- CRUD Dialog -->
    <b-modal v-model="dialog" size="xl" hide-footer :title="`${$t('settings.user')}`" @close="resetForm">
      <b-form @submit.stop.prevent="onSubmit">
        <b-tabs>
          <b-tab :title="$t('title.overview')">
            <div class="row mt-5">
              <div class="col-md-6">
                <div class="subtitle-1 font-weight-bolder mb-2">
                  {{ $t("settings.form.user.firstName") }}
                </div>
                <b-form-input id="name-input" name="name-input" v-model="form.first_name"></b-form-input>
              </div>
              <div class="col-md-6">
                <div class="subtitle-1 font-weight-bolder mb-2">
                  {{ $t("settings.form.user.lastName") }}
                </div>
                <b-form-input id="nickname-input" name="nickname-input" v-model="form.last_name"></b-form-input>
              </div>
            </div>

            <div class="row mt-4">
              <div class="col-md-6">
                <div class="subtitle-1 font-weight-bolder mb-2">
                  {{ $t("settings.form.user.email") }}
                </div>
                <b-form-group label-for="mail-input">
                  <b-form-input
                    id="mail-input"
                    name="mail-input"
                    v-model="form.email"
                    :state="validateState('email')"
                    aria-describedby="mail-feedback"
                  ></b-form-input>

                  <b-form-invalid-feedback id="mail-feedback">
                    {{ $t("msg.required") }}
                  </b-form-invalid-feedback>
                </b-form-group>
              </div>
              <div class="col-md-6">
                <div class="subtitle-1 font-weight-bolder mb-2">
                  {{ $t("settings.form.user.address") }}
                </div>
                <b-form-input id="address-input" name="address-input" v-model="form.address"></b-form-input>
              </div>
            </div>

            <div class="row mt-n4">
              <div class="col-md-4">
                <div class="subtitle-1 font-weight-bolder mb-2">
                  {{ $t("settings.form.user.phone") }}
                </div>
                <b-form-input
                  id="phone-input"
                  name="phone-input"
                  v-model="form.phone"
                  @change="formatPhone"
                ></b-form-input>
              </div>
              <div class="col-md-4">
                <div class="subtitle-1 font-weight-bolder mb-2">
                  {{ $t("settings.form.user.postcode") }}
                </div>
                <b-form-input id="postcode-input" name="postcode-input" v-model="form.postcode"></b-form-input>
              </div>
              <div class="col-md-4">
                <div class="subtitle-1 font-weight-bolder mb-2">
                  {{ $t("settings.form.user.place") }}
                </div>
                <b-form-input id="place-input" name="place-input" v-model="form.place"></b-form-input>
              </div>
            </div>

            <div class="row mt-4">
              <div class="col-md-4">
                <div class="subtitle-1 font-weight-bolder mb-2">
                  {{ $t("settings.form.user.dob") }}
                </div>
                <b-input-group>
                  <b-form-input
                    v-model="form.dob_formatted"
                    type="text"
                    autocomplete="off"
                    @blur="formatDobInvert"
                  ></b-form-input>
                  <b-input-group-append>
                    <b-form-datepicker
                      v-model="form.dob"
                      :locale="locale"
                      :start-weekday="1"
                      button-only
                      right
                      @context="formatDob"
                    ></b-form-datepicker>
                  </b-input-group-append>
                </b-input-group>
              </div>
              <div class="col-md-4">
                <div class="subtitle-1 font-weight-bolder mb-2">
                  {{ $t("settings.form.user.startWork") }}
                </div>
                <b-input-group>
                  <b-form-input
                    v-model="form.start_work_date_formatted"
                    type="text"
                    autocomplete="off"
                    @blur="formatStartWorkInvert"
                  ></b-form-input>
                  <b-input-group-append>
                    <b-form-datepicker
                      v-model="form.start_work_date"
                      :locale="locale"
                      :start-weekday="1"
                      button-only
                      right
                      @context="formatStartWork"
                    ></b-form-datepicker>
                  </b-input-group-append>
                </b-input-group>
              </div>
              <div class="col-md-4">
                <div class="subtitle-1 font-weight-bolder mb-2">
                  {{ $t("settings.form.user.endWork") }}
                </div>
                <b-input-group>
                  <b-form-input
                    v-model="form.end_work_date_formatted"
                    type="text"
                    autocomplete="off"
                    @blur="formatEndWorkInvert"
                  ></b-form-input>
                  <b-input-group-append>
                    <b-form-datepicker
                      v-model="form.end_work_date"
                      :locale="locale"
                      :start-weekday="1"
                      button-only
                      right
                      @context="formatEndWork"
                    ></b-form-datepicker>
                  </b-input-group-append>
                </b-input-group>
              </div>
            </div>

            <!-- <div class="row mt-4">
          <div class="col-md-4">
            <div class="subtitle-1 font-weight-bolder mb-2">
              {{ $t("settings.form.user.holidays") }}
            </div>
            <b-form-input
              id="holidays-input"
              name="holidays-input"
              v-model="form.holidays"
            ></b-form-input>
          </div>
          <div class="col-md-4">
            <div class="subtitle-1 font-weight-bolder mb-2">
              {{ $t("settings.form.user.maxDaily") }}
            </div>
            <b-form-input
              id="daily-workload-input"
              name="workload-input"
              v-model="form.max_daily"
            ></b-form-input>
          </div>
          <div class="col-md-4">
            <div class="subtitle-1 font-weight-bolder mb-2">
              {{ $t("settings.form.user.maxWeekly") }}
            </div>
            <b-form-select
              id="weekly-workload-select"
              name="workload-select"
              v-model="form.max_weekly"
              :options="workload"
              value-field="value"
              text-field="percent"
            ></b-form-select>
          </div>
        </div> -->

            <div class="row mt-4">
              <div class="col-md-6">
                <div class="subtitle-1 font-weight-bolder mb-2">
                  {{ $t("settings.form.user.lvAuth") }}
                </div>
                <b-form-group label-for="level-select">
                  <b-form-select
                    id="level-select"
                    name="level-select"
                    v-model="form.role"
                    :options="roles"
                    value-field="code"
                    text-field="name"
                    :state="validateState('role')"
                    aria-describedby="level-feedback"
                  ></b-form-select>

                  <b-form-invalid-feedback id="level-feedback">
                    {{ $t("msg.required") }}
                  </b-form-invalid-feedback>
                </b-form-group>
              </div>
              <div class="col-md-6">
                <div class="subtitle-1 font-weight-bolder mb-2">
                  {{ $t("settings.form.user.job") }}
                </div>
                <b-form-group label-for="job-select">
                  <b-form-select
                    id="job-select"
                    name="job-select"
                    v-model="form.job"
                    :options="jobs"
                    value-field="label"
                    text-field="label"
                    :state="validateState('job')"
                    aria-describedby="job-feedback"
                  ></b-form-select>

                  <b-form-invalid-feedback id="job-feedback">
                    {{ $t("msg.required") }}
                  </b-form-invalid-feedback>
                </b-form-group>
              </div>
            </div>

            <div>
              {{ $t("settings.form.user.text1") }}
            </div>
            <div>{{ $t("settings.form.user.text2") }}</div>
            <div>{{ $t("settings.form.user.text3") }}</div>
            <div>{{ $t("settings.form.user.text4") }}</div>
          </b-tab>

          <!-- Workload -->
          <b-tab :title="$t('title.advancedWorkload')">
            <div class="mt-5">
              <div class="row mb-2">
                <div class="col-md-2 font-weight-bold">
                  {{ $t("settings.form.user.startDate") }}
                </div>
                <div class="col-md-2 font-weight-bold">
                  {{ $t("settings.form.user.endDate") }}
                </div>
                <div class="col-md-1 font-weight-bold">
                  {{ $t("settings.form.user.maxWeekly") }}
                </div>
                <div class="col-md-1 font-weight-bold">
                  {{ $t("settings.form.user.maxDaily") }}
                </div>
                <div class="col-md-2 font-weight-bold">
                  {{ $t("settings.form.user.latestFlex") }}
                </div>
                <!-- <div class="col-md-1 font-weight-bold">
                  {{ $t("settings.form.user.rsPlanning") }}
                </div>
                <div class="col-md-1 font-weight-bold">
                  {{ $t("settings.form.user.maxDaily") }}
                </div> -->
              </div>

              <draggable
                :list="periods"
                class="item-group"
                ghost-class="ghost"
                @start="draggingPeriod = true"
                @end="draggingPeriod = false"
                handle=".handle"
              >
                <div v-for="(item, i) in periods" :key="i">
                  <div class="row mb-2">
                    <div class="col-md-2">
                      <b-input-group>
                        <b-form-input
                          :id="`startdate_${i}`"
                          :value="formatDate(item.start_date)"
                          type="text"
                          autocomplete="off"
                          placeholder="dd.mm.yyyy"
                          @blur="formatWorkloadStartInvert(i)"
                        ></b-form-input>
                        <b-input-group-append>
                          <b-form-datepicker
                            v-model="item.start_date"
                            :locale="locale"
                            :start-weekday="1"
                            button-only
                            right
                          ></b-form-datepicker>
                        </b-input-group-append>
                      </b-input-group>
                    </div>
                    <div class="col-md-2">
                      <b-input-group>
                        <b-form-input
                          :id="`enddate_${i}`"
                          :value="formatDate(item.end_date)"
                          type="text"
                          autocomplete="off"
                          placeholder="dd.mm.yyyy"
                          @blur="formatWorkloadEndInvert(i)"
                        ></b-form-input>
                        <b-input-group-append>
                          <b-form-datepicker
                            v-model="item.end_date"
                            :locale="locale"
                            :start-weekday="1"
                            button-only
                            right
                          ></b-form-datepicker>
                        </b-input-group-append>
                      </b-input-group>
                    </div>
                    <div class="col-md-1">
                      <b-form-input
                        v-model="item.work_percent"
                        :id="`detail_weekly_${i}`"
                        class="weekly-input"
                        style="text-align: right"
                        @blur="calculateDailyWorkload(i, item.work_percent, item.planning_percent)"
                      ></b-form-input>
                    </div>
                    <div class="col-md-1">
                      <b-form-input
                        v-model="item.actual_hours_per_day"
                        :id="`detail_daily_${i}`"
                        class="daily-input"
                        style="text-align: right"
                      ></b-form-input>
                    </div>
                    <div class="col-md-2">
                      <b-form-input
                        v-model="item.latest_flex_hours"
                        :id="`latest_flex_${i}`"
                        class="flex-input"
                        style="text-align: right"
                      ></b-form-input>
                    </div>
                    <!-- <div class="col-md-1">
                      <b-form-input
                        v-model="item.planning_percent"
                        :id="`percent_planning_${i}`"
                        class="planning-percent-input"
                        style="text-align: right"
                        @blur="
                          calculateDailyWorkload(
                            i,
                            item.work_percent,
                            item.planning_percent
                          )
                        "
                      ></b-form-input>
                    </div>
                    <div class="col-md-1">
                      <b-form-input
                        v-model="item.actual_planning_per_day"
                        :id="`detail_planning_${i}`"
                        class="planning-hour-input"
                        style="text-align: right"
                      ></b-form-input>
                    </div> -->
                    <div class="col-md-2">
                      <b-button variant="primary" class="minus-btn mr-2" @click="removeWorkloadItem(i)">
                        <i class="flaticon2-line p-0"></i>
                      </b-button>
                      <b-button variant="primary" class="plus-btn mr-2" @click="addWorkloadItem(i)">
                        <i class="flaticon2-plus p-0"></i>
                      </b-button>
                      <b-button variant="primary">
                        <i class="flaticon2-sort handle p-0"></i>
                      </b-button>
                    </div>
                  </div>
                </div>
              </draggable>
            </div>
          </b-tab>

          <!-- Holiday History -->
          <b-tab :title="$t('title.holidayHistory')">
            <div class="mt-5">
              <!-- FIXME: Temporary comment out `Refresh` button -->
              <!-- <div v-if="edit && holidayPeriods.length > 0" class="action mb-2">
                <b-button
                  variant="primary"
                  class="refresh-btn"
                  @click="refreshHoliday"
                >
                  <i class="menu-icon flaticon-refresh"></i>
                  <span class="menu-text">
                    {{ $t("button.refresh") }}</span
                  ></b-button
                >
              </div> -->
              <div class="row mb-2">
                <div class="col-md-3 font-weight-bold">
                  {{ $t("settings.form.user.startDate") }}
                </div>
                <div class="col-md-3 font-weight-bold">
                  {{ $t("settings.form.user.endDate") }}
                </div>
                <div class="col-md-1 font-weight-bold">
                  {{ $t("settings.form.user.amount") }}
                </div>
                <div class="col-md-1 font-weight-bold">
                  {{ $t("settings.form.user.maxDaily") }}
                </div>
                <div class="col-md-2 font-weight-bold">
                  {{ $t("settings.form.user.latestHours") }}
                </div>
              </div>

              <draggable
                :list="holidayPeriods"
                class="item-group"
                ghost-class="ghost"
                @start="draggingHoliday = true"
                @end="draggingHoliday = false"
                handle=".handle"
              >
                <div v-for="(item, i) in holidayPeriods" :key="i">
                  <div class="row mb-2">
                    <div class="col-md-3">
                      <b-input-group>
                        <b-form-input
                          :id="`holiday_start_${i}`"
                          :value="formatDate(item.start_date)"
                          type="text"
                          autocomplete="off"
                          placeholder="dd.mm.yyyy"
                          @blur="formatHolidayStartInvert(i)"
                        ></b-form-input>
                        <b-input-group-append>
                          <b-form-datepicker
                            v-model="item.start_date"
                            :locale="locale"
                            :start-weekday="1"
                            button-only
                            right
                          ></b-form-datepicker>
                        </b-input-group-append>
                      </b-input-group>
                    </div>
                    <div class="col-md-3">
                      <b-input-group>
                        <b-form-input
                          :id="`holiday_end_${i}`"
                          :value="formatDate(item.end_date)"
                          type="text"
                          autocomplete="off"
                          placeholder="dd.mm.yyyy"
                          @blur="formatHolidayEndInvert(i)"
                        ></b-form-input>
                        <b-input-group-append>
                          <b-form-datepicker
                            v-model="item.end_date"
                            :locale="locale"
                            :start-weekday="1"
                            button-only
                            right
                          ></b-form-datepicker>
                        </b-input-group-append>
                      </b-input-group>
                    </div>
                    <div class="col-md-1">
                      <b-form-input
                        v-model="item.amount"
                        :id="`amount_flex_${i}`"
                        class="flex-input"
                        style="text-align: right"
                      ></b-form-input>
                    </div>
                    <div class="col-md-1">
                      <b-form-input
                        v-model="item.actual_hours_per_day"
                        :id="`daily_flex_${i}`"
                        class="flex-input"
                        style="text-align: right"
                      ></b-form-input>
                    </div>
                    <div class="col-md-2">
                      <b-form-input
                        v-model="item.latest"
                        :id="`latest_flex_${i}`"
                        class="flex-input"
                        style="text-align: right"
                      ></b-form-input>
                    </div>
                    <div class="col-md-2">
                      <b-button variant="primary" class="minus-btn mr-2" @click="removeHolidayItem(i)">
                        <i class="flaticon2-line p-0"></i>
                      </b-button>
                      <b-button variant="primary" class="plus-btn mr-2" @click="addHolidayItem(i)">
                        <i class="flaticon2-plus p-0"></i>
                      </b-button>
                      <b-button variant="primary">
                        <i class="flaticon2-sort handle p-0"></i>
                      </b-button>
                    </div>
                  </div>
                </div>
              </draggable>
            </div>
          </b-tab>
        </b-tabs>

        <div class="action mt-4">
          <b-button variant="primary" class="save-btn" type="submit" :disabled="isSaving">
            <span v-if="isSaving">
              <b-spinner small></b-spinner>
              {{ $t("button.saving") }}
            </span>
            <span v-else>{{ $t("button.save") }}</span>
          </b-button>
        </div>
      </b-form>
    </b-modal>

    <!-- Remove Dialog -->
    <b-modal v-model="remove_dialog" hide-footer no-close-on-backdrop :title="`${$t('title.confirm')}`">
      <div>{{ $t("msg.delUser") }}</div>
      <div class="col-md-12 p-0 mt-4 action">
        <b-button variant="primary" class="save-btn" @click="confirmRemove">
          {{ $t("button.confirm") }}
        </b-button>
      </div>
    </b-modal>

    <!-- Update Status Dialog -->
    <b-modal v-model="update_dialog" hide-footer no-close-on-backdrop :title="`${$t('title.updateStatus')}`">
      <div>
        {{ $t("msg.updateStatus") }}
        <span class="font-weight-bold">{{ update_name }}</span>
      </div>
      <div class="col-md-12 p-0 mt-4 action">
        <b-button variant="primary" class="save-btn" @click="confirmStatus">
          {{ $t("button.confirm") }}
        </b-button>
      </div>
    </b-modal>
  </div>
</template>

<script>
import moment from "moment";
import draggable from "vuedraggable";
import i18nService from "@/core/services/i18n.service.js";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { validationMixin } from "vuelidate";
import { required, email } from "vuelidate/lib/validators";
import { mapGetters, mapState } from "vuex";
import {
  GET_SETTINGS,
  GET_USERS,
  GET_USER,
  ADD_USER,
  UPDATE_USER,
  DELETE_USER,
  UPDATE_USER_STATUS,
  UPDATE_USER_WORKLOAD,
  REFRESH_USER_HOLIDAY,
  SET_SETTING_ERROR
} from "@/core/services/store/settings";
import { formatDate } from "@/common";

export default {
  mixins: [validationMixin],
  components: {
    draggable
  },
  data() {
    return {
      fields: [
        {
          key: "email",
          label: this.$t("settings.form.user.email"),
          sortable: true
        },
        {
          key: "role",
          label: this.$t("settings.form.user.level"),
          sortable: false
        },
        {
          key: "is_active",
          label: "Status",
          sortable: true
        },
        { key: "actions", label: this.$t("settings.form.user.actions") }
      ],
      form: {
        email: "",
        role: "employee",
        first_name: "",
        last_name: "",
        address: "",
        postcode: "",
        phone: "",
        place: "",
        dob: "",
        dob_formatted: "",
        start_work_date: "",
        start_work_date_formatted: "",
        end_work_date: "",
        end_work_date_formatted: "",
        job: "",
        max_weekly: 0.0,
        max_daily: 0.0,
        holidays: 0.0,
        resource_planning: 0.0,
        is_active: false
      },
      workload: [
        {
          percent: "100% - 5 " + this.$t("settings.form.user.workload"),
          value: 100
        },
        {
          percent: "80% - 4 " + this.$t("settings.form.user.workload"),
          value: 80
        },
        {
          percent: "60% - 3 " + this.$t("settings.form.user.workload"),
          value: 60
        },
        {
          percent: "50% - 2.5 " + this.$t("settings.form.user.workload"),
          value: 50
        }
      ],
      roles: [
        { name: this.$t("settings.form.user.lvAdmin"), code: "admin" },
        { name: this.$t("settings.form.user.lvPM"), code: "manager" },
        { name: this.$t("settings.form.user.lvEmployee"), code: "employee" }
      ],
      jobs: [],
      periods: [],
      holidayPeriods: [],
      dialog: false,
      remove_dialog: false,
      update_dialog: false,
      update_name: "",
      update_status: "",
      edit: false,
      edit_id: 0,
      delete_id: 0,
      locale: "de",
      darggingPeriod: false,
      draggingHoliday: false,
      isSaving: false
    };
  },
  validations: {
    form: {
      email: {
        required,
        email
      },
      role: {
        required
      },
      job: {
        required
      }
    }
  },
  computed: {
    ...mapGetters(["currentUsers", "currentUserSetting", "currentSettings"]),
    ...mapState({
      error: state => state.settings.error
    }),
    currentLanguage() {
      return i18nService.getActiveLanguage();
    }
  },
  async mounted() {
    await this.$store.dispatch(GET_USERS);
    if (this.currentLanguage === "de") {
      this.locale = "de";
    } else {
      this.locale = "en-US";
    }
    this.loading = !this.loading;
  },
  methods: {
    formatDate,
    validateState(name) {
      const { $dirty, $error } = this.$v.form[name];
      return $dirty ? !$error : null;
    },
    async onSubmit() {
      this.$v.form.$touch();
      if (this.$v.form.$anyError) {
        return;
      }

      if (this.isSaving) {
        return;
      }

      this.isSaving = true;

      try {
        let missing = false;
        for (const item of this.periods) {
          if (!item.start_date) {
            missing = true;
            break;
          }
        }

        if (missing) {
          this.toastMsg("error", this.$t("msg.missingStartdate"));
        } else {
          if (this.edit) {
            //handle holiday
            for (const item of this.holidayPeriods) {
              item.amount = parseFloat(item.amount);
              item.actual_hours_per_day = parseFloat(item.actual_hours_per_day);
            }
            await this.$store.dispatch(UPDATE_USER, {
              id: this.edit_id,
              data: {
                email: this.form.email,
                role: this.form.role,
                first_name: this.form.first_name,
                last_name: this.form.last_name,
                address: this.form.address,
                postcode: this.form.postcode,
                phone: this.form.phone,
                place: this.form.place,
                dob: this.form.dob,
                start_work_date: this.form.start_work_date,
                end_work_date: this.form.end_work_date,
                job: this.form.job,
                holidays: parseFloat(this.form.holidays),
                max_work_hours_per_day: parseFloat(this.form.max_daily),
                work_percent_per_week: parseFloat(this.form.max_weekly),
                resource_planning_percent: parseFloat(this.form.resource_planning),
                holiday_periods: JSON.stringify(this.holidayPeriods),
                is_active: this.form.is_active
              }
            });
            // handle advance workload
            for (const item of this.periods) {
              item.work_percent = parseFloat(item.work_percent);
              item.actual_hours_per_day = parseFloat(item.actual_hours_per_day);
              item.latest_flex_hours = item.latest_flex_hours ? parseFloat(item.latest_flex_hours) : 0.0;
            }
            await this.$store.dispatch(UPDATE_USER_WORKLOAD, {
              id: this.edit_id,
              data: this.periods
            });

            if (this.error) {
              this.toastMsg("error", this.error);
              return;
            } else {
              this.toastMsg("success", this.$t("msg.updateSuccess"));
            }
          } else {
            //handle holiday
            for (const item of this.holidayPeriods) {
              item.amount = parseFloat(item.amount);
              item.actual_hours_per_day = parseFloat(item.actual_hours_per_day);
              item.latest = parseFloat(item.latest);
            }
            await this.$store.dispatch(ADD_USER, {
              email: this.form.email,
              role: this.form.role,
              first_name: this.form.first_name,
              last_name: this.form.last_name,
              address: this.form.address,
              postcode: this.form.postcode,
              phone: this.form.phone,
              place: this.form.place,
              dob: this.form.dob,
              start_work_date: this.form.start_work_date,
              end_work_date: this.form.end_work_date,
              job: this.form.job,
              holidays: parseFloat(this.form.holidays),
              max_work_hours_per_day: parseFloat(this.form.max_daily),
              work_percent_per_week: parseFloat(this.form.max_weekly),
              resource_planning_percent: parseFloat(this.form.resource_planning),
              holiday_periods: this.holidayPeriods,
              timesheet_periods: this.periods,
              is_active: false
            });
            // handle advance workload
            for (const item of this.periods) {
              item.work_percent = parseFloat(item.work_percent);
              item.actual_hours_per_day = parseFloat(item.actual_hours_per_day);
              item.latest_flex_hours = item.latest_flex_hours ? parseFloat(item.latest_flex_hours) : 0.0;
            }
            // FIXME: Old code didn't update edit_id after adding new user
            // await this.$store.dispatch(UPDATE_USER_WORKLOAD, {
            //   id: this.edit_id,
            //   data: this.periods
            // });

            if (this.error) {
              this.toastMsg("error", this.error);
              return;
            } else {
              this.toastMsg("success", this.$t("msg.addSuccess"));
            }
          }

          await this.$store.dispatch(GET_USERS);
          this.resetForm();
          this.edit = false;
          this.dialog = false;
        }
      } finally {
        this.isSaving = false;
      }
    },
    resetForm() {
      this.form = {
        email: "",
        role: "employee",
        first_name: "",
        last_name: "",
        address: "",
        postcode: "",
        phone: "",
        place: "",
        dob: "",
        dob_formatted: "",
        start_work_date: "",
        start_work_date_formatted: "",
        end_work_date: "",
        end_work_date_formatted: "",
        job: "",
        holidays: 0.0,
        max_daily: this.currentSettings.timesheet.must_working_hours,
        max_weekly: 100,
        is_active: false
      };
      this.periods = [];
      this.holidayPeriods = [];
      this.edit = false;
      this.$nextTick(() => {
        this.$v.$reset();
      });
    },
    async addUser() {
      await this.$store.dispatch(GET_SETTINGS);
      this.form.max_weekly = 100;
      this.form.resource_planning = 100;
      this.form.max_daily = this.currentSettings.timesheet.must_working_hours;
      this.jobs = this.currentSettings.timesheet.jobs;
      this.addWorkloadItem();
      this.addHolidayItem();
      this.dialog = true;
    },
    async editUser(item) {
      this.edit = true;
      this.edit_id = item.id;
      await this.$store.dispatch(GET_SETTINGS);
      await this.$store.dispatch(GET_USER, { id: item.id });
      this.jobs = this.currentSettings.timesheet.jobs;
      this.form.email = this.currentUserSetting.email;
      this.form.role = this.currentUserSetting.role;
      this.form.first_name = this.currentUserSetting.first_name;
      this.form.last_name = this.currentUserSetting.last_name;
      this.form.address = this.currentUserSetting.address;
      this.form.postcode = this.currentUserSetting.postcode;
      this.form.place = this.currentUserSetting.place;
      this.form.phone = this.currentUserSetting.phone;
      this.form.job = this.currentUserSetting.job;
      this.form.holidays = this.currentUserSetting.holidays;
      this.form.max_daily = this.currentUserSetting.max_work_hours_per_day;
      this.form.max_weekly = this.currentUserSetting.work_percent_per_week;
      this.form.resource_planning = this.currentUserSetting.resource_planning_percent;
      this.form.is_active = this.currentUserSetting.is_active;
      if (this.currentUserSetting.dob) {
        this.form.dob = this.currentUserSetting.dob;
        this.form.dob_formatted = formatDate(this.currentUserSetting.dob);
      }
      if (this.currentUserSetting.start_work_date) {
        this.form.start_work_date = this.currentUserSetting.start_work_date;
        this.form.dob_formatted = formatDate(this.currentUserSetting.start_work_date);
      }
      if (this.currentUserSetting.end_work_date) {
        this.form.end_work_date = this.currentUserSetting.end_work_date;
        this.form.dob_formatted = formatDate(this.currentUserSetting.end_work_date);
      }
      if (this.currentUserSetting.timesheet_periods) {
        this.periods = this.currentUserSetting.timesheet_periods;
      }
      if (this.currentUserSetting.holiday_periods) {
        this.holidayPeriods = this.currentUserSetting.holiday_periods;
      }
      if (this.periods.length < 1) {
        this.addWorkloadItem();
      }
      if (this.holidayPeriods.length < 1) {
        this.addHolidayItem();
      }
      this.dialog = true;
    },
    // async editWorkload(item) {
    //   this.edit_id = item.id;
    //   await this.$store.dispatch(GET_SETTINGS);
    //   await this.$store.dispatch(GET_USER, { id: item.id });
    //   if (this.currentUserSetting.timesheet_periods) {
    //     this.periods = this.currentUserSetting.timesheet_periods;
    //   }
    //   if (this.periods.length < 1) {
    //     this.addWorkloadItem();
    //   }
    //   this.workload_dialog = true;
    // },
    // resetWorkload() {
    //   this.periods = [];
    // },
    // async submitWorkload() {
    //   let missing = false;
    //   for (const item of this.periods) {
    //     if (!item.start_date) {
    //       missing = true;
    //       break;
    //     }
    //   }

    //   if (missing) {
    //     this.toastMsg("error", this.$t("msg.missingStartdate"));
    //   } else {
    //     for (const item of this.periods) {
    //       item.work_percent = parseFloat(item.work_percent);
    //       item.actual_hours_per_day = parseFloat(item.actual_hours_per_day);
    //     }
    //     await this.$store.dispatch(UPDATE_USER_WORKLOAD, {
    //       id: this.edit_id,
    //       data: this.periods
    //     });
    //     if (this.error) {
    //       this.toastMsg("error", this.error);
    //     } else {
    //       this.toastMsg("success", this.$t("msg.updateSuccess"));
    //     }
    //     this.workload_dialog = false;
    //   }
    // },
    addWorkloadItem(pos) {
      let item = {
        start_date: "",
        end_date: "",
        work_percent: 100,
        actual_hours_per_day: this.currentSettings.timesheet.must_working_hours,
        latest_flex_hours: 0,
        planning_percent: 0,
        actual_planning_per_day: 0
      };
      this.periods.splice(pos + 1, 0, item);
    },
    removeWorkloadItem(index) {
      if (this.periods.length > 1) {
        this.periods.splice(index, 1);
      }
    },
    calculateDailyWorkload(index, percent, planningPercent) {
      const result = parseFloat(this.currentSettings.timesheet.must_working_hours) * (parseFloat(percent) / 100);
      const planning = parseFloat(planningPercent) > 0 ? result * (parseFloat(planningPercent) / 100) : 0;
      for (let i = 0; i < this.periods.length; i++) {
        const el = this.periods[i];
        if (i === index) {
          el.actual_hours_per_day = +(Math.round(result + "e+2") + "e-2");
          el.actual_planning_per_day = +(Math.round(planning + "e+2") + "e-2");
          break;
        }
      }
    },
    addHolidayItem(pos) {
      let item = {
        start_date: "",
        end_date: "",
        amount: "",
        actual_hours_per_day: "",
        latest: ""
      };
      this.holidayPeriods.splice(pos + 1, 0, item);
    },
    removeHolidayItem(index) {
      if (this.holidayPeriods.length > 1) {
        this.holidayPeriods.splice(index, 1);
      }
    },
    removeUser(item) {
      this.delete_id = item.id;
      this.remove_dialog = true;
    },
    async confirmRemove() {
      await this.$store.dispatch(DELETE_USER, { id: this.delete_id });
      await this.$store.dispatch(GET_USERS);
      if (this.error) {
        this.toastMsg("error", this.error);
      } else {
        this.remove_dialog = false;
        this.toastMsg("success", this.$t("msg.delSuccess"));
      }
    },
    renderRole(item) {
      if (item.role === "admin") {
        return this.$t("settings.form.user.lvAdmin");
      } else if (item.role === "employee") {
        return this.$t("settings.form.user.lvEmployee");
      } else {
        return this.$t("settings.form.user.lvPM");
      }
    },
    formatDob() {
      if (this.form.dob) {
        this.form.dob_formatted = formatDate(this.form.dob);
      }
    },
    formatDobInvert() {
      if (this.form.dob_formatted) {
        const split = this.form.dob_formatted.split(".");
        const join = split[2] + "-" + split[1] + "-" + split[0];
        this.form.dob = join;
      }
    },
    formatStartWork() {
      if (this.form.start_work_date) {
        this.form.start_work_date_formatted = formatDate(this.form.start_work_date);
      }
    },
    formatStartWorkInvert() {
      if (this.form.start_work_date_formatted) {
        const split = this.form.start_work_date_formatted.split(".");
        const join = split[2] + "-" + split[1] + "-" + split[0];
        this.form.start_work_date = join;
      }
    },
    formatEndWork() {
      if (this.form.end_work_date) {
        this.form.end_work_date_formatted = formatDate(this.form.end_work_date);
      }
    },
    formatEndWorkInvert() {
      if (this.form.end_work_date_formatted) {
        const split = this.form.end_work_date_formatted.split(".");
        const join = split[2] + "-" + split[1] + "-" + split[0];
        this.form.end_work_date = join;
      }
    },
    formatPhone() {
      if (this.form.phone && !this.form.phone.includes("+")) {
        const phoneNumber = parsePhoneNumberFromString(`+${this.form.phone}`);
        if (phoneNumber) {
          this.form.phone = phoneNumber.formatInternational();
        }
      }
    },
    formatWorkloadStartInvert(index) {
      let el = document.getElementById(`startdate_${index}`);
      if (el.value) {
        const split = el.value.split(".");
        const join = split[2] + "-" + split[1] + "-" + split[0];
        for (let i = 0; i < this.periods.length; i++) {
          const element = this.periods[i];
          if (i === index) {
            element.start_date = join;
            break;
          }
        }
      }
    },
    formatWorkloadEndInvert(index) {
      let el = document.getElementById(`enddate_${index}`);
      if (el.value) {
        const split = el.value.split(".");
        const join = split[2] + "-" + split[1] + "-" + split[0];
        for (let i = 0; i < this.periods.length; i++) {
          const element = this.periods[i];
          if (i === index) {
            element.end_date = join;
            break;
          }
        }
      }
    },
    formatHolidayStartInvert(index) {
      let el = document.getElementById(`holiday_start_${index}`);
      if (el.value) {
        const split = el.value.split(".");
        const join = split[2] + "-" + split[1] + "-" + split[0];
        for (let i = 0; i < this.holidayPeriods.length; i++) {
          const element = this.holidayPeriods[i];
          if (i === index) {
            element.start_date = join;
            break;
          }
        }
      }
    },
    formatHolidayEndInvert(index) {
      let el = document.getElementById(`holiday_end_${index}`);
      if (el.value) {
        const split = el.value.split(".");
        const join = split[2] + "-" + split[1] + "-" + split[0];
        for (let i = 0; i < this.holidayPeriods.length; i++) {
          const element = this.holidayPeriods[i];
          if (i === index) {
            element.end_date = join;
            break;
          }
        }
        return;
      }

      this.holidayPeriods[index].end_date = "";
    },
    toggleStatus(item) {
      this.update_id = item.id;
      this.update_name = item.email;
      this.update_status = !item.is_active;
      this.update_dialog = !this.update_dialog;
    },
    async confirmStatus() {
      await this.$store.dispatch(UPDATE_USER_STATUS, {
        id: this.update_id,
        data: {
          is_active: this.update_status
        }
      });
      if (this.error) {
        this.toastMsg("error", this.error);
      } else {
        await this.$store.dispatch(GET_USERS);
        this.toastMsg("success", this.$t("msg.updateSuccess"));
        this.update_dialog = !this.update_dialog;
      }
    },
    // FIXME: Need to clarify the purpose of the `Refresh` button and `refreshHoliday` function before proceeding with the update.
    // async refreshHoliday() {
    //   await this.$store.dispatch(REFRESH_USER_HOLIDAY, {
    //     id: this.edit_id
    //   });
    //   if (this.error) {
    //     this.toastMsg("error", this.error);
    //   } else {
    //     await this.$store.dispatch(GET_USER, { id: this.edit_id });
    //     if (this.currentUserSetting.holiday_periods) {
    //       this.holidayPeriods = this.currentUserSetting.holiday_periods;
    //     }
    //     this.toastMsg("success", this.$t("msg.updateSuccess"));
    //   }
    // },
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
      this.$store.commit(SET_SETTING_ERROR, null);
    }
  }
};
</script>

<style scoped>
.action-icon:hover {
  color: #3699ff;
}

.action {
  display: flex;
  justify-content: flex-end;
}
</style>
