<template>
  <div class="mt-8">
    <div class="row">
      <div class="col-md-12">
        <b-form-input
          v-model="begin"
          class="form-control-solid font-weight-bolder mb-2"
        ></b-form-input>
        <div class="editor">
          <TextEditor v-model="begin_desc" />
        </div>
      </div>
    </div>

    <div class="row">
      <div class="col-md-12">
        <b-form-input
          v-model="performance"
          class="form-control-solid font-weight-bolder mb-2"
        ></b-form-input>
        <div class="editor">
          <TextEditor v-model="performance_desc" />
        </div>
      </div>
    </div>

    <div class="row">
      <div class="col-md-12">
        <b-form-input
          v-model="estimate_cost"
          class="form-control-solid font-weight-bolder mb-2"
        ></b-form-input>

        <!-- Estimate setting -->
        <div class="row mt-6">
          <div class="col-md-4">
            <div class="subtitle-1 font-weight-bold mb-2">
              {{ $t("settings.form.offer.label") }}
            </div>
          </div>
        </div>
        <div v-for="(item, i) in estimate_setting" :key="i" class="row mb-2">
          <div class="col-md-4">
            <b-form-input
              :id="`estimate_${i}`"
              class="label-input"
              size="sm"
              v-model="estimate_setting[i].label"
            ></b-form-input>
          </div>
        </div>

        <!-- Generate setting -->
        <div class="row mt-10">
          <div class="col-md-4">
            <div class="subtitle-1 font-weight-bold mb-2">
              {{ $t("settings.form.offer.label") }}
            </div>
          </div>
          <div class="col-md-4">
            <div class="subtitle-1 font-weight-bold mb-2">
              {{ $t("settings.form.offer.value") }}
            </div>
          </div>
        </div>
        <div class="row mb-2">
          <div class="col-md-4">
            <b-form-input
              id="coefficients_z1_label"
              class="generate-input"
              size="sm"
              v-model="generate_setting.coefficients_z1.label"
            ></b-form-input>
          </div>
          <div class="col-md-2">
            <b-form-input
              id="coefficients_z1_value"
              class="generate-input"
              size="sm"
              style="text-align: right"
              v-model="generate_setting.coefficients_z1.value"
              @blur="
                generate_setting.coefficients_z1.value = parseFloat(
                  generate_setting.coefficients_z1.value
                )
              "
            ></b-form-input>
          </div>
        </div>

        <div class="row mb-2">
          <div class="col-md-4">
            <b-form-input
              id="coefficients_z2_label"
              class="generate-input"
              size="sm"
              v-model="generate_setting.coefficients_z2.label"
            ></b-form-input>
          </div>
          <div class="col-md-2">
            <b-form-input
              id="coefficients_z2_value"
              class="generate-input"
              size="sm"
              style="text-align: right"
              v-model="generate_setting.coefficients_z2.value"
              @blur="
                generate_setting.coefficients_z2.value = parseFloat(
                  generate_setting.coefficients_z2.value
                )
              "
            ></b-form-input>
          </div>
        </div>

        <div class="row mb-2">
          <div class="col-md-4">
            <b-form-input
              id="basic_factor_label"
              class="generate-input"
              size="sm"
              v-model="generate_setting.basic_factor.label"
            ></b-form-input>
          </div>
          <div class="col-md-2">
            <b-form-input
              id="basic_factor_value"
              class="generate-input"
              size="sm"
              style="text-align: right"
              v-model="generate_setting.basic_factor.value"
              @blur="
                generate_setting.basic_factor.value = parseFloat(
                  generate_setting.basic_factor.value
                )
              "
            ></b-form-input>
          </div>
        </div>

        <div class="row mb-2">
          <div class="col-md-4">
            <b-form-input
              id="construction_cost_label"
              class="generate-input"
              size="sm"
              v-model="generate_setting.construction_cost.label"
            ></b-form-input>
          </div>
          <div class="col-md-2">
            <b-form-input
              id="construction_cost_value"
              class="generate-input"
              size="sm"
              style="text-align: right"
              v-model="generate_setting.construction_cost.value"
              @blur="
                generate_setting.construction_cost.value = parseFloat(
                  generate_setting.construction_cost.value
                )
              "
            ></b-form-input>
          </div>
        </div>

        <div class="row mb-2">
          <div class="col-md-4">
            <b-form-input
              id="difficulty_lv_label"
              class="generate-input"
              size="sm"
              v-model="generate_setting.difficulty_lv.label"
            ></b-form-input>
          </div>
          <div class="col-md-2">
            <b-form-input
              id="difficulty_lv_value"
              class="generate-input"
              size="sm"
              style="text-align: right"
              v-model="generate_setting.difficulty_lv.value"
              @blur="
                generate_setting.difficulty_lv.value = parseFloat(
                  generate_setting.difficulty_lv.value
                )
              "
            ></b-form-input>
          </div>
        </div>

        <div class="row mb-2">
          <div class="col-md-4">
            <b-form-input
              id="special_service_factor_label"
              class="generate-input"
              size="sm"
              v-model="generate_setting.special_service_factor.label"
            ></b-form-input>
          </div>
          <div class="col-md-2">
            <b-form-input
              id="special_service_factor_value"
              class="generate-input"
              size="sm"
              style="text-align: right"
              v-model="generate_setting.special_service_factor.value"
              @blur="
                generate_setting.special_service_factor.value = parseFloat(
                  generate_setting.special_service_factor.value
                )
              "
            ></b-form-input>
          </div>
        </div>

        <div class="row mb-2">
          <div class="col-md-4">
            <b-form-input
              id="adjustment_factor_label"
              class="generate-input"
              size="sm"
              v-model="generate_setting.adjustment_factor.label"
            ></b-form-input>
          </div>
          <div class="col-md-2">
            <b-form-input
              id="adjustment_factor_value"
              class="generate-input"
              size="sm"
              style="text-align: right"
              v-model="generate_setting.adjustment_factor.value"
              @blur="
                generate_setting.adjustment_factor.value = parseFloat(
                  generate_setting.adjustment_factor.value
                )
              "
            ></b-form-input>
          </div>
        </div>

        <div class="row mb-2">
          <div class="col-md-4">
            <b-form-input
              id="team_factor_label"
              class="generate-input"
              size="sm"
              v-model="generate_setting.team_factor.label"
            ></b-form-input>
          </div>
          <div class="col-md-2">
            <b-form-input
              id="team_factor_value"
              class="generate-input"
              size="sm"
              style="text-align: right"
              v-model="generate_setting.team_factor.value"
              @blur="
                generate_setting.team_factor.value = parseFloat(
                  generate_setting.team_factor.value
                )
              "
            ></b-form-input>
          </div>
        </div>

        <div class="row mb-2">
          <div class="col-md-4">
            <b-form-input
              id="u_factor_label"
              class="generate-input"
              size="sm"
              v-model="generate_setting.u_factor.label"
            ></b-form-input>
          </div>
          <div class="col-md-2">
            <b-form-input
              id="u_factor_value"
              class="generate-input"
              size="sm"
              style="text-align: right"
              v-model="generate_setting.u_factor.value"
              @blur="
                generate_setting.u_factor.value = parseFloat(
                  generate_setting.u_factor.value
                )
              "
            ></b-form-input>
          </div>
        </div>

        <div class="row mb-2">
          <div class="col-md-4">
            <b-form-input
              id="time_label"
              class="generate-input"
              size="sm"
              v-model="generate_setting.time.label"
            ></b-form-input>
          </div>
          <div class="col-md-2">
            <b-form-input
              id="time_value"
              class="generate-input"
              size="sm"
              style="text-align: right"
              v-model="generate_setting.time.value"
              @blur="
                generate_setting.time.value = parseFloat(
                  generate_setting.time.value
                )
              "
            ></b-form-input>
          </div>
        </div>

        <div class="row mb-2">
          <div class="col-md-4">
            <b-form-input
              id="advertised_label"
              class="generate-input"
              size="sm"
              v-model="generate_setting.advertised.label"
            ></b-form-input>
          </div>
          <div class="col-md-2">
            <b-form-input
              id="advertised_value"
              class="generate-input"
              size="sm"
              style="text-align: right"
              v-model="generate_setting.advertised.value"
              @blur="
                generate_setting.advertised.value = parseFloat(
                  generate_setting.advertised.value
                )
              "
            ></b-form-input>
          </div>
        </div>
      </div>
    </div>

    <div class="row">
      <div class="col-md-12">
        <b-form-input
          v-model="parameter"
          class="form-control-solid font-weight-bolder mb-2"
        ></b-form-input>
        <div class="editor">
          <TextEditor v-model="parameter_desc" />
        </div>
      </div>
    </div>

    <div class="row">
      <div class="col-md-12">
        <b-form-input
          v-model="offer"
          class="form-control-solid font-weight-bolder mb-2"
        ></b-form-input>
        <div class="editor">
          <TextEditor v-model="offer_desc" />
        </div>
      </div>
    </div>

    <div class="row">
      <div class="col-md-12">
        <b-form-input
          v-model="additional"
          class="form-control-solid font-weight-bolder mb-2"
        ></b-form-input>
        <div class="editor">
          <TextEditor v-model="additional_desc" />
        </div>
      </div>
    </div>

    <!-- Event setting -->
    <div class="row">
      <div class="col-md-12">
        <b-form-input
          v-model="event"
          class="form-control-solid font-weight-bolder mb-2"
        ></b-form-input>
        <div v-for="(item, i) in event_setting" :key="i" class="row mb-2">
          <div class="col-md-6">
            <b-form-input
              :id="`event_${i}`"
              class="label-input"
              size="sm"
              v-model="event_setting[i].label"
            ></b-form-input>
          </div>
          <!-- Actions -->
          <div class="col-md-2">
            <b-button
              variant="primary"
              class="minus-btn mr-2"
              size="sm"
              @click="removeEvent(i)"
            >
              <i class="flaticon2-line p-0"></i>
            </b-button>
            <b-button
              variant="primary"
              class="plus-btn"
              size="sm"
              @click="addEvent(i)"
            >
              <i class="flaticon2-plus p-0"></i>
            </b-button>
          </div>
        </div>
      </div>
    </div>

    <div class="row mt-4">
      <div class="col-md-12">
        <b-form-input
          v-model="end"
          class="form-control-solid font-weight-bolder mb-2"
        ></b-form-input>
        <div class="editor">
          <TextEditor v-model="end_desc" />
        </div>
      </div>
    </div>

    <!-- Dropdown setting -->
    <div class="row">
      <div class="col-md-8">
        <div class="subtitle-1 font-weight-bolder mb-2">
          {{ $t("settings.form.offer.dropdownSetting") }}
        </div>
        <div class="row mt-4">
          <div class="col-md-8">
            <div class="subtitle-1 font-weight-bold mb-2">
              {{ $t("settings.form.offer.dropdownLabel") }}
            </div>
          </div>
          <div class="col-md-4">
            <div class="subtitle-1 font-weight-bold mb-2">
              {{ $t("settings.form.offer.value") + "(%)" }}
            </div>
          </div>
        </div>
        <div v-for="(item, i) in km_dropdown_setting" :key="i" class="row mb-2">
          <div class="col-md-8">
            <b-form-input
              :id="`dropdown_label_${i}`"
              class="label-input"
              size="sm"
              v-model="km_dropdown_setting[i].label"
            ></b-form-input>
          </div>
          <div class="col-md-2">
            <b-form-input
              :id="`dropdown_value_${i}`"
              class="value-input"
              size="sm"
              v-model="km_dropdown_setting[i].value"
            ></b-form-input>
          </div>
          <!-- Actions -->
          <div class="col-md-2 action">
            <b-button
              variant="primary"
              class="minus-btn mr-2"
              size="sm"
              @click="removeDropdown(i)"
            >
              <i class="flaticon2-line p-0"></i>
            </b-button>
            <b-button
              variant="primary"
              class="plus-btn"
              size="sm"
              @click="addDropdown(i)"
            >
              <i class="flaticon2-plus p-0"></i>
            </b-button>
          </div>
        </div>
      </div>
    </div>

    <!-- Km setting -->
    <div class="row mt-6">
      <div class="col-md-8">
        <div class="subtitle-1 font-weight-bolder mb-2">
          {{ $t("settings.form.offer.addcostSetting") }}
        </div>
        <div class="row mt-4">
          <div class="col-md-8">
            <div class="subtitle-1 font-weight-bold mb-2">
              {{ $t("settings.form.offer.percentLabel") }}
            </div>
          </div>
          <div class="col-md-4">
            <div class="subtitle-1 font-weight-bold mb-2">
              {{ $t("settings.form.offer.value") + "(%)" }}
            </div>
          </div>
        </div>
        <div v-for="(item, i) in add_cost_setting" :key="i" class="row mb-2">
          <div class="col-md-8">
            <b-form-input
              :id="`percent_label_${i}`"
              class="label-input"
              size="sm"
              v-model="add_cost_setting[i].label"
            ></b-form-input>
          </div>
          <div class="col-md-2">
            <b-form-input
              :id="`percent_value_${i}`"
              class="value-input"
              size="sm"
              v-model="add_cost_setting[i].value"
            ></b-form-input>
          </div>
          <!-- Actions -->
          <div class="col-md-2 action">
            <b-button
              variant="primary"
              class="minus-btn mr-2"
              size="sm"
              @click="removePercent(i)"
            >
              <i class="flaticon2-line p-0"></i>
            </b-button>
            <b-button
              variant="primary"
              class="plus-btn"
              size="sm"
              @click="addPercent(i)"
            >
              <i class="flaticon2-plus p-0"></i>
            </b-button>
          </div>
        </div>
      </div>
    </div>

    <!-- Subtitle setting -->
    <div class="row mt-4">
      <div class="col-md-12">
        <div class="subtitle-1 font-weight-bolder mb-2">
          {{ $t("settings.form.offer.subtitle") }}
        </div>

        <div class="row mt-2">
          <div
            v-for="(item, i) in subtitle_setting"
            :key="i"
            class="col-md-12 p-0 mb-2"
            style="display: flex"
          >
            <div class="col-md-4">
              <b-form-input
                v-model="item.label"
                :id="`sub_${i}`"
                class="label-input"
              ></b-form-input>
            </div>
            <div class="col-md-3">
              <b-button
                variant="primary"
                class="minus-btn mr-2"
                @click="removeSub(i)"
              >
                <i class="flaticon2-line p-0"></i>
              </b-button>
              <b-button variant="primary" class="plus-btn" @click="addSub(i)">
                <i class="flaticon2-plus p-0"></i>
              </b-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!--  Actions -->
    <div class="row">
      <div class="col-md-12 action">
        <b-button
          variant="primary"
          size="lg"
          class="update-btn"
          :disabled="isSaving"
          @click="update"
        >
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
import TextEditor from "@/view/content/TextEditor.vue";
import { mapGetters, mapState } from "vuex";
import {
  GET_SETTINGS,
  UPDATE_OFFER_SETTING,
  SET_SETTING_ERROR
} from "@/core/services/store/settings";

export default {
  components: {
    TextEditor
  },
  data() {
    return {
      begin: "",
      begin_desc: "",
      end: "",
      end_desc: "",
      estimate_cost: "",
      event: "",
      additional: "",
      additional_desc: "",
      offer: "",
      offer_desc: "",
      parameter: "",
      parameter_desc: "",
      performance: "",
      performance_desc: "",
      km_dropdown_setting: [],
      add_cost_setting: [],
      event_setting: [],
      estimate_setting: [],
      generate_setting: {
        coefficients_z1: {},
        coefficients_z2: {},
        basic_factor: {},
        construction_cost: {},
        difficulty_lv: {},
        special_service_factor: {},
        adjustment_factor: {},
        team_factor: {},
        u_factor: {},
        time: {},
        advertised: {}
      },
      subtitle_setting: [],
      isSaving: false
    };
  },
  computed: {
    ...mapGetters(["currentSettings"]),
    ...mapState({
      error: state => state.settings.error
    })
  },
  async mounted() {
    await this.$store.dispatch(GET_SETTINGS);
    this.initData();
  },
  methods: {
    initData() {
      this.begin = this.currentSettings.offer.begin;
      this.begin_desc = this.currentSettings.offer.begin_desc;
      this.end = this.currentSettings.offer.end;
      this.end_desc = this.currentSettings.offer.end_desc;
      this.estimate_cost = this.currentSettings.offer.estimate_cost;
      this.event = this.currentSettings.offer.event;
      this.additional = this.currentSettings.offer.additional;
      this.additional_desc = this.currentSettings.offer.additional_desc;
      this.offer = this.currentSettings.offer.offer;
      this.offer_desc = this.currentSettings.offer.offer_desc;
      this.parameter = this.currentSettings.offer.parameter;
      this.parameter_desc = this.currentSettings.offer.parameter_desc;
      this.performance = this.currentSettings.offer.performance;
      this.performance_desc = this.currentSettings.offer.performance_desc;
      if (!this.currentSettings.offer.km_dropdown_setting) {
        this.addDropdown();
      } else {
        this.km_dropdown_setting = this.currentSettings.offer.km_dropdown_setting;
      }
      if (!this.currentSettings.offer.add_cost_setting) {
        this.addPercent();
      } else {
        this.add_cost_setting = this.currentSettings.offer.add_cost_setting;
      }
      if (!this.currentSettings.offer.event_setting) {
        this.addEvent();
      } else {
        this.event_setting = this.currentSettings.offer.event_setting;
      }
      if (!this.currentSettings.offer.subtitle_setting) {
        this.addSub();
      } else {
        this.subtitle_setting = this.currentSettings.offer.subtitle_setting;
      }
      this.estimate_setting = this.currentSettings.offer.estimate_setting;
      this.generate_setting = this.currentSettings.offer.generate_setting;
    },
    addDropdown(pos) {
      const item = { label: "", value: "" };
      this.km_dropdown_setting.splice(pos + 1, 0, item);
    },
    removeDropdown(index) {
      if (this.km_dropdown_setting.length > 1) {
        this.km_dropdown_setting.splice(index, 1);
      }
    },
    addPercent(pos) {
      const item = { label: "", value: "" };
      this.add_cost_setting.splice(pos + 1, 0, item);
    },
    removePercent(index) {
      if (this.add_cost_setting.length > 1) {
        this.add_cost_setting.splice(index, 1);
      }
    },
    addEvent(pos) {
      const item = { label: "", value: "" };
      this.event_setting.splice(pos + 1, 0, item);
    },
    removeEvent(index) {
      if (this.event_setting.length > 1) {
        this.event_setting.splice(index, 1);
      }
    },
    addSub(pos) {
      const item = { label: "" };
      this.subtitle_setting.splice(pos + 1, 0, item);
    },
    removeSub(index) {
      if (this.subtitle_setting.length > 1) {
        this.subtitle_setting.splice(index, 1);
      }
    },
    async update() {
      if (this.isSaving) {
        return;
      }

      this.isSaving = true;

      try {
        await this.$store.dispatch(UPDATE_OFFER_SETTING, {
          begin: this.begin,
          begin_desc: this.begin_desc,
          end: this.end,
          end_desc: this.end_desc,
          estimate_cost: this.estimate_cost,
          event: this.event,
          additional: this.additional,
          additional_desc: this.additional_desc,
          offer: this.offer,
          offer_desc: this.offer_desc,
          parameter: this.parameter,
          parameter_desc: this.parameter_desc,
          performance: this.performance,
          performance_desc: this.performance_desc,
          km_dropdown_setting: this.km_dropdown_setting,
          add_cost_setting: this.add_cost_setting,
          event_setting: this.event_setting,
          estimate_setting: this.estimate_setting,
          generate_setting: this.generate_setting,
          subtitle_setting: this.subtitle_setting
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
    toastMsg(type, msg) {
      const h = this.$createElement;
      this.count++;
      const vNodesTitle = h(
        "div",
        { class: ["d-flex", "flex-grow-1", "align-items-baseline", "mr-2"] },
        [
          h(
            "strong",
            { class: "mr-2" },
            type === "error" ? "Error" : this.$t("title.notice")
          )
        ]
      );
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
.editor {
  height: 15rem;
}

.editor > div {
  height: 10rem;
}

.action {
  display: flex;
  justify-content: flex-end;
}
</style>
