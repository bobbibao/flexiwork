<template>
  <div class="mt-8">
    <!-- Daily hours -->
    <div class="row">
      <div class="col-md-12">
        <div class="subtitle-1 font-weight-bolder mb-2">
          {{ $t("settings.form.timesheet.working") }}
        </div>
        <b-form-input v-model="work_hours"></b-form-input>
      </div>
    </div>

    <!-- Default task -->
    <div class="row mt-4">
      <div class="col-md-12">
        <div class="subtitle-1 font-weight-bolder mb-2">
          {{ $t("settings.form.timesheet.defaultHoliday") }}
        </div>

        <div class="row">
          <div class="col-md-4">
            <b-form-select
              id="product-select"
              name="product-select"
              v-model="default_product"
              :options="currentProducts"
              text-field="name"
              value-field="id"
              @change="getTrackTasks"
            ></b-form-select>
          </div>
          <div class="col-md-4">
            <b-form-select
              id="task-select"
              name="task-select"
              v-model="default_task"
              :options="currentTrackTasks"
              text-field="name"
              value-field="name"
            ></b-form-select>
          </div>
        </div>
      </div>
    </div>

    <!-- Holidays -->
    <div class="row mt-4">
      <div class="col-md-12">
        <div class="subtitle-1 font-weight-bolder mb-2">
          {{ $t("settings.form.timesheet.holidays") }}
        </div>

        <div class="row">
          <div class="col-md-4 font-weight-bold">
            {{ $t("settings.form.timesheet.desc") }}
          </div>
          <div class="col-md-3 font-weight-bold">
            {{ $t("settings.form.timesheet.date") }}
          </div>
        </div>

        <div class="row mt-2">
          <div v-for="(item, i) in holidays" :key="i" class="col-md-12 p-0 mb-2" style="display: flex">
            <div class="col-md-4">
              <b-form-input v-model="item.label" :id="`desc_${i}`" class="desc-input"></b-form-input>
            </div>
            <div class="col-md-3">
              <b-input-group>
                <b-form-input
                  :id="`date_${i}`"
                  :value="formatDate(item.date)"
                  type="text"
                  autocomplete="off"
                  placeholder="dd.mm.yyyy"
                  @blur="formatDateInvert(i)"
                ></b-form-input>
                <b-input-group-append>
                  <b-form-datepicker
                    v-model="item.date"
                    :locale="locale"
                    :start-weekday="1"
                    button-only
                    right
                  ></b-form-datepicker>
                </b-input-group-append>
              </b-input-group>
            </div>
            <div class="col-md-3">
              <b-button variant="primary" class="minus-btn mr-2" @click="removeHoliday(i)">
                <i class="flaticon2-line p-0"></i>
              </b-button>
              <b-button variant="primary" class="plus-btn" @click="addHoliday(i)">
                <i class="flaticon2-plus p-0"></i>
              </b-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Jobs -->
    <div class="row mt-4">
      <div class="col-md-12">
        <div class="subtitle-1 font-weight-bolder mb-2">
          {{ $t("settings.form.timesheet.jobs") }}
        </div>

        <div class="row">
          <div class="col-md-4 font-weight-bold">
            {{ $t("settings.form.timesheet.title") }}
          </div>
          <div class="col-md-3 font-weight-bold">
            {{ $t("settings.form.timesheet.rate") }}
          </div>
        </div>

        <div class="row mt-2">
          <div v-for="(item, i) in jobs" :key="i" class="col-md-12 p-0 mb-2" style="display: flex">
            <div class="col-md-4">
              <b-form-input v-model="item.label" :id="`job_${i}`" class="title-input"></b-form-input>
            </div>
            <div class="col-md-3">
              <b-form-input v-model="item.rate" :id="`rate_${i}`" class="rate-input"></b-form-input>
            </div>
            <div class="col-md-3">
              <b-button variant="primary" class="minus-btn mr-2" @click="removeJob(i)">
                <i class="flaticon2-line p-0"></i>
              </b-button>
              <b-button variant="primary" class="plus-btn" @click="addJob(i)">
                <i class="flaticon2-plus p-0"></i>
              </b-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Action -->
    <div class="row">
      <div class="col-md-12 action mt-4">
        <b-button variant="primary" size="lg" class="update-btn" :disabled="isSaving" @click="update">
          <span v-if="isSaving">
            <b-spinner small></b-spinner>
            {{ $t("button.saving") }}
          </span>
          <span v-else>{{ $t("button.update") }}</span>
        </b-button>
      </div>
    </div>
  </div>
</template>

<script>
import moment from "moment";
import i18nService from "@/core/services/i18n.service.js";
import { mapGetters, mapState } from "vuex";
import { GET_SETTINGS, UPDATE_TIMESHEET_SETTING, SET_SETTING_ERROR } from "@/core/services/store/settings";
import { GET_PRODUCTS } from "@/core/services/store/product";
import { GET_TRACK_TASKS } from "@/core/services/store/timesheet";
import { formatDate } from "@/common";

export default {
  data() {
    return {
      locale: "de",
      work_hours: 0.0,
      holidays: [],
      jobs: [],
      default_product: "",
      default_task: "",
      isSaving: false
    };
  },
  computed: {
    ...mapGetters(["currentSettings", "currentProducts", "currentTrackTasks"]),
    ...mapState({
      error: state => state.settings.error
    }),
    currentLanguage() {
      return i18nService.getActiveLanguage();
    }
  },
  async mounted() {
    await this.$store.dispatch(GET_SETTINGS);
    await this.$store.dispatch(GET_PRODUCTS);
    this.default_product = this.currentSettings.timesheet.default_holiday_product
      ? this.currentSettings.timesheet.default_holiday_product
      : this.currentProducts[0].id;
    await this.getTrackTasks();
    this.default_task = this.currentSettings.timesheet.default_holiday_task
      ? this.currentSettings.timesheet.default_holiday_task
      : this.currentTrackTasks[0].name;
    this.work_hours = this.currentSettings.timesheet.must_working_hours;
    if (this.currentSettings.timesheet.holidays) {
      this.holidays = this.currentSettings.timesheet.holidays;
    } else {
      this.addHoliday(0);
    }
    if (this.currentSettings.timesheet.jobs) {
      this.jobs = this.currentSettings.timesheet.jobs;
    } else {
      this.addJob(0);
    }
    if (this.currentLanguage === "de") {
      this.locale = "de";
    } else {
      this.locale = "en-US";
    }
  },
  methods: {
    formatDate,
    addHoliday(pos) {
      let item = {
        label: "",
        date: ""
      };
      this.holidays.splice(pos + 1, 0, item);
    },
    removeHoliday(id) {
      if (this.holidays.length > 1) {
        this.holidays.splice(id, 1);
      }
    },
    addJob(pos) {
      let item = {
        label: "",
        rate: ""
      };
      this.jobs.splice(pos + 1, 0, item);
    },
    removeJob(id) {
      if (this.jobs.length > 1) {
        this.jobs.splice(id, 1);
      }
    },
    async update() {
      if (this.isSaving) {
        return;
      }

      this.isSaving = true;

      try {
        await this.$store.dispatch(UPDATE_TIMESHEET_SETTING, {
          must_working_hours: parseFloat(this.work_hours),
          holidays: this.holidays,
          jobs: this.jobs,
          default_holiday_product: this.default_product,
          default_holiday_task: this.default_task
        });

        if (this.error) {
          this.toastMsg("error", this.error);
        } else {
          this.toastMsg("success", this.$t("msg.updateSuccess"));
        }
      } finally {
        this.isSaving = false;
      }
    },
    async getTrackTasks() {
      await this.$store.dispatch(GET_TRACK_TASKS, { id: this.default_product });
    },

    formatDateInvert(index) {
      const el = document.getElementById(`date_${index}`);
      if (el.value) {
        const split = el.value.split(".");
        const join = split[2] + "-" + split[1] + "-" + split[0];
        for (let i = 0; i < this.holidays.length; i++) {
          const element = this.holidays[i];
          if (i === index) {
            element.date = join;
            break;
          }
        }
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
      this.$store.commit(SET_SETTING_ERROR, null);
    }
  }
};
</script>

<style scoped>
.action {
  display: flex;
  justify-content: flex-end;
}
</style>
