<template>
  <div>
    <div class="row">
      <div class="col-md-12">
        <div class="subtitle-1 font-weight-bolder mb-2">
          {{ $t("offer.kilometers") }}
        </div>
        <b-form-select
          :value="selectedKm.label"
          :options="currentKmOptions"
          value-field="label"
          text-field="label"
          :disabled="disabled"
          @change="setKm"
        ></b-form-select>
      </div>
    </div>

    <div class="row mt-4">
      <div v-for="(item, i) in selectedAddCost" :key="i" class="col-md-8 mb-2 additional-item">
        <b-form-checkbox size="md" :checked="item.is_active" :disabled="disabled" @change="setAddCost(item)">
          {{ item.label }}
        </b-form-checkbox>
        <div>{{ item.value }}%</div>
      </div>
    </div>

    <div class="row mt-4">
      <div class="col-md-12">
        <div>
          <span>Nebenkosten Prozent: </span>
          <span class="font-weight-bolder">{{ calculatedTotalPerCent }}</span>
          <span>%</span>
        </div>
      </div>
      <div class="col-md-12 mt-4">
        <b-button
          ref="additional_button"
          variant="primary"
          class="add-btn"
          :disabled="disableAction()"
          @click="addToQuote"
        >
          <i class="menu-icon flaticon2-plus"></i>
          <span class="menu-text"> {{ $t("button.additional") }} </span>
        </b-button>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from "vuex";
import currency from "currency.js";
import { SET_KM, SET_ADDCOST, SET_ADDITIONAL_EDITED, SET_ADDITIONAL_PERCENT } from "@/core/services/store/offer";
import { SET_PUSH_NK } from "@/core/services/store/product";

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
    disabledAction: {
      type: Boolean,
      default: false
    },
    generate: {
      type: Function,
      default: null
    },
    activeGenerate: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      selected: null
    };
  },
  mounted() {
    this.persistAdditionalCost();
  },
  computed: {
    ...mapGetters([
      "detailCost",
      "discountPercent",
      "currentSettings",
      "currentKmOptions",
      "selectedKm",
      "selectedAddCost"
    ]),
    calculatedTotalPerCent() {
      let percent = 0.0;

      for (let index = 0; index < this.selectedAddCost.length; index++) {
        if (this.selectedAddCost[index].is_active === true) {
          percent += parseFloat(this.selectedAddCost[index].value);
        }
      }
      //handle dropdown value
      for (let index = 0; index < this.currentKmOptions.length; index++) {
        if (this.selectedKm.label === this.currentKmOptions[index].label) {
          percent += parseFloat(this.currentKmOptions[index].value);
        }
      }

      return percent;
    }
  },
  destroyed() {
    this.$store.commit(SET_ADDITIONAL_EDITED, false);
  },
  methods: {
    setKm(e) {
      for (const item of this.currentKmOptions) {
        if (item.label === e) {
          this.$store.commit(SET_KM, item);
        }
      }
      this.$store.commit(SET_ADDITIONAL_EDITED, true);
      if (this.activeGenerate) {
        this.generate(this.selectedKm, this.selectedAddCost);
      }
      this.persistAdditionalCost();
    },
    setAddCost(item) {
      this.$store.commit(SET_ADDCOST, item);
      this.$store.commit(SET_ADDITIONAL_EDITED, true);
      if (this.activeGenerate) {
        this.generate(this.selectedKm, this.selectedAddCost);
      }
      this.persistAdditionalCost();
    },
    persistAdditionalCost() {
      let percent = this.calculatedTotalPerCent;
      this.$store.commit(SET_ADDITIONAL_PERCENT, parseFloat(percent));
      this.$emit("persistAdditionalCost", percent);
    },
    formatMoney(val) {
      return currency(val, {
        separator: "'",
        pattern: `#`,
        negativePattern: `-#`,
        increment: 0.05
      }).format();
    },
    addToQuote() {
      this.$store.commit(SET_PUSH_NK, true);
    },
    disableAction() {
      if (this.disabledAction) {
        return true;
      } else {
        if (this.calculatedTotalPerCent <= 0) {
          return true;
        } else {
          return false;
        }
      }
    }
  }
};
</script>

<style scoped>
.additional-item {
  display: flex;
  justify-content: space-between;
}
</style>
