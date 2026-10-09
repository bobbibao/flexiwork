<template>
  <div>
    <div class="row">
      <div class="col-md-12 mt-4 pl-6">
        <div class="font-weight-bolder">{{ $t("offer.messerliCal") }}</div>
      </div>
      <div class="col-md-12 mt-4 pl-6">
        <div class="row mb-2 estimate-item">
          <div class="col-md-6">
            <div>{{ currentGenerator.coefficients_z1.label }}</div>
          </div>
          <div class="col-md-4">
            <b-form-input
              id="coefficients_z1"
              class="estimate-input"
              size="sm"
              style="text-align: right"
              :value="currentGenerator.coefficients_z1.value"
              disabled
            ></b-form-input>
          </div>
        </div>

        <div class="row mb-2 estimate-item">
          <div class="col-md-6">
            <div>{{ currentGenerator.coefficients_z2.label }}</div>
          </div>
          <div class="col-md-4">
            <b-form-input
              id="coefficients_z2"
              class="estimate-input"
              size="sm"
              style="text-align: right"
              :value="formatMoney(currentGenerator.coefficients_z2.value)"
              disabled
            ></b-form-input>
          </div>
        </div>

        <div class="row mb-2 estimate-item">
          <div class="col-md-6">
            <div>{{ currentGenerator.basic_factor.label }}</div>
          </div>
          <div class="col-md-4">
            <b-form-input
              id="basic_factor"
              class="estimate-input"
              size="sm"
              style="text-align: right"
              :value="formatMoney(currentGenerator.basic_factor.value)"
              disabled
            ></b-form-input>
          </div>
        </div>

        <div class="row mb-2 estimate-item">
          <div class="col-md-6">
            <div>{{ currentGenerator.construction_cost.label }}</div>
          </div>
          <div class="col-md-4">
            <b-form-input
              id="construction_cost"
              class="estimate-input"
              size="sm"
              style="text-align: right"
              :value="formatMoney(currentGenerator.construction_cost.value)"
              :disabled="disabled"
              @blur="setValue('construction_cost'), setEdited()"
            ></b-form-input>
          </div>
        </div>

        <div class="row mb-2 estimate-item">
          <div class="col-md-6">
            <div>{{ currentGenerator.difficulty_lv.label }}</div>
          </div>
          <div class="col-md-4">
            <b-form-input
              id="difficulty_lv"
              class="estimate-input"
              size="sm"
              style="text-align: right"
              :value="formatMoney(currentGenerator.difficulty_lv.value)"
              :disabled="disabled"
              @blur="setValue('difficulty_lv'), setEdited()"
            ></b-form-input>
          </div>
        </div>

        <div class="row mb-2 estimate-item">
          <div class="col-md-6">
            <div>
              {{ currentGenerator.special_service_factor.label }}
            </div>
          </div>
          <div class="col-md-4">
            <b-form-input
              id="special_service_factor"
              class="estimate-input"
              size="sm"
              style="text-align: right"
              :value="formatMoney(currentGenerator.special_service_factor.value)"
              :disabled="disabled"
              @blur="setValue('special_service_factor'), setEdited()"
            ></b-form-input>
          </div>
        </div>

        <div class="row mb-2 estimate-item">
          <div class="col-md-6">
            <div>{{ currentGenerator.adjustment_factor.label }}</div>
          </div>
          <div class="col-md-4">
            <b-form-input
              id="adjustment_factor"
              class="estimate-input"
              size="sm"
              style="text-align: right"
              :value="formatMoney(currentGenerator.adjustment_factor.value)"
              :disabled="disabled"
              @blur="setValue('adjustment_factor'), setEdited()"
            ></b-form-input>
          </div>
        </div>

        <div class="row mb-2 estimate-item">
          <div class="col-md-6">
            <div>{{ currentGenerator.team_factor.label }}</div>
          </div>
          <div class="col-md-4">
            <b-form-input
              id="team_factor"
              class="estimate-input"
              size="sm"
              style="text-align: right"
              :value="formatMoney(currentGenerator.team_factor.value)"
              :disabled="disabled"
              @blur="setValue('team_factor'), setEdited()"
            ></b-form-input>
          </div>
        </div>

        <div class="row mb-2 estimate-item">
          <div class="col-md-6">
            <div>{{ currentGenerator.u_factor.label }}</div>
          </div>
          <div class="col-md-4">
            <b-form-input
              id="u_factor"
              class="estimate-input"
              size="sm"
              style="text-align: right"
              :value="formatMoney(currentGenerator.u_factor.value)"
              :disabled="disabled"
              @blur="setValue('u_factor'), setEdited()"
            ></b-form-input>
          </div>
        </div>

        <div class="row mb-2 estimate-item">
          <div class="col-md-6">
            <div>{{ currentGenerator.time.label }}</div>
          </div>
          <div class="col-md-4">
            <b-form-input
              id="time"
              class="estimate-input"
              size="sm"
              style="text-align: right"
              :value="formatMoney(currentGenerator.time.value)"
              :disabled="disabled"
              @blur="setValue('time'), setEdited()"
            ></b-form-input>
          </div>
        </div>

        <div class="row mb-2 estimate-item">
          <div class="col-md-6">
            <div>{{ currentGenerator.advertised.label }}</div>
          </div>
          <div class="col-md-4">
            <b-form-input
              id="advertised"
              class="estimate-input"
              size="sm"
              style="text-align: right"
              :value="formatMoney(currentGenerator.advertised.value)"
              :disabled="disabled"
              @blur="setValue('advertised'), setEdited()"
            ></b-form-input>
          </div>
          <div class="col-md-2">
            <b-form-checkbox v-model="check">{{ $t("offer.genType") }}</b-form-checkbox>
          </div>
        </div>

        <!-- Action -->
        <div v-if="!disabled" class="row estimate-item">
          <div class="col-md-6 action">
            <b-button variant="primary" class="generate-btn" ref="kt_generate" @click="generateProducts">
              <span> {{ $t("button.generate") }}</span>
            </b-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import currency from "currency.js";
import { mapGetters } from "vuex";
import { SET_GENERATE_INPUT, RESET_GENERATOR, SET_GENERATE_EDITED } from "@/core/services/store/offer";

export default {
  props: {
    currency: {
      type: String,
      default: ""
    },
    disabled: {
      type: Boolean,
      default: false
    },
    generate: {
      type: Function,
      default: null
    }
  },
  data() {
    return {
      check: false
    };
  },
  computed: {
    ...mapGetters(["currentGenerator"])
  },
  destroyed() {
    this.$store.commit(RESET_GENERATOR);
    this.$store.commit(SET_GENERATE_EDITED, false);
  },
  methods: {
    setValue(key) {
      const el = document.getElementById(key);
      if (el) {
        // Reformat before call mutations
        const reformattedValue = currency(el.value, {
          separator: "",
          pattern: `#`,
          negativePattern: `-#`,
          increment: 0.05
        }).format();
        this.$store.commit(SET_GENERATE_INPUT, {
          key: key,
          value: parseFloat(reformattedValue)
        });
      }
    },
    setEdited() {
      this.$store.commit(SET_GENERATE_EDITED, true);
    },
    formatMoney(val) {
      if (val <= 0) return "0.00";
      return currency(val, {
        separator: "'",
        pattern: `#`,
        negativePattern: `-#`,
        increment: 0.05
      }).format();
    },
    async generateProducts() {
      // set spinner to button
      const button = this.$refs["kt_generate"];
      button.classList.add("spinner", "spinner-light", "spinner-right");
      await this.generate(this.check ? "hours" : "full_price");
      button.classList.remove("spinner", "spinner-light", "spinner-right");
    }
  }
};
</script>

<style scoped>
.estimate-item {
  display: flex;
  align-items: center;
}

.action {
  display: flex;
  justify-content: flex-end;
}
</style>
