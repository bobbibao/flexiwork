<template>
  <div>
    <div class="row">
      <div class="col-md-8 mt-4 pl-6">
        <div class="row">
          <div class="col-md-2">
            <div class="font-weight-bolder">BKP</div>
          </div>
          <div class="col-md-4">
            <div class="font-weight-bolder">Bezeichnung</div>
          </div>
          <div class="col-md-2">
            <div class="font-weight-bolder">Kosten</div>
          </div>
        </div>

        <div v-for="(item, i) in currentEstimateCost" :key="i">
          <div class="row mb-2 estimate-item">
            <div class="col-md-2">
              <div>{{ isCreateOffer() ? item.id : item.order }}</div>
            </div>
            <div class="col-md-4">
              <div>{{ item.label }}</div>
            </div>
            <div class="col-md-2">
              <div>{{ currency }}</div>
            </div>
            <div class="col-md-4">
              <b-form-input
                class="free-estimate-input"
                size="sm"
                style="text-align: right"
                :id="`free-estimate-${isCreateOffer() ? item.id : item.order}`"
                :value="item.value > 0 ? formatMoney(item.value) : null"
                :disabled="disabled"
                @blur="setCost(isCreateOffer() ? item.id : item.order), setEdited()"
              ></b-form-input>
            </div>
          </div>
        </div>

        <div class="row mt-4">
          <div class="col-md-8">
            <div class="font-weight-bolder">
              {{ "Total Anlagekosten netto exkl. MwSt. " + defaultVat + "%" }}
            </div>
          </div>
          <div class="col-md-4">
            <div id="total-estimate" class="font-weight-bolder pr-3" style="float: right">
              {{ formatMoney(calculateTotal) }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import currency from "currency.js";
import { mapGetters } from "vuex";
import { SET_ESTIMATE, RESET_ESTIMATE, SET_ESTIMATE_EDITED } from "@/core/services/store/offer";

export default {
  props: {
    currency: {
      type: String,
      default: ""
    },
    disabled: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      options: [
        {
          id: "messerliCal",
          name: this.$t("offer.messerliCal")
        },
        {
          id: "freeCal",
          name: this.$t("offer.freeCal")
        }
      ],
      sum: 0.0
    };
  },
  computed: {
    ...mapGetters(["currentEstimateCost", "currentGenerator", "currentEstimateType", "currentVatRates"]),
    calculateTotal() {
      let total = 0.0;
      for (let index = 0; index < this.currentEstimateCost.length; index++) {
        total += parseFloat(this.currentEstimateCost[index].value ? this.currentEstimateCost[index].value : 0.0);
      }
      return total.toFixed(2);
    },
    defaultVat() {
      let rate = 0;
      for (const item of this.currentVatRates) {
        if (item.is_default) {
          rate = item.rate;
          break;
        }
      }
      return rate;
    }
  },
  destroyed() {
    this.$store.commit(RESET_ESTIMATE);
    this.$store.commit(SET_ESTIMATE_EDITED, false);
  },
  methods: {
    setCost(id) {
      const el = document.getElementById(`free-estimate-${id}`);
      if (el) {
        const reformattedValue = currency(el.value, {
          separator: "",
          pattern: `#`,
          negativePattern: `-#`,
          increment: 0.05
        }).format();
        this.$store.commit(SET_ESTIMATE, {
          order: id,
          value: parseFloat(reformattedValue)
        });
      }
    },
    isCreateOffer() {
      return window.location.href.endsWith("offer/create");
    },
    formatMoney(val) {
      return currency(val, {
        separator: "'",
        pattern: `#`,
        negativePattern: `-#`,
        increment: 0.05
      }).format();
    },
    setEdited() {
      this.$store.commit(SET_ESTIMATE_EDITED, true);
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
