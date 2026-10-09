<template>
  <div>
    <div class="row">
      <div class="col-md-8 mt-4">
        <div class="row">
          <div class="col-md-12">
            <div class="font-weight-bolder">
              {{ $t("invoice.paidHistory") }}
            </div>
          </div>
        </div>

        <div class="row mt-2">
          <div class="col-md-3">
            <div class="font-weight-bolder">{{ $t("invoice.date") }}</div>
          </div>
          <div class="col-md-3">
            <div class="font-weight-bolder">in %</div>
          </div>
          <div class="col-md-3">
            <div class="font-weight-bolder">{{ currency }}</div>
          </div>
        </div>

        <div v-for="(item, i) in currentPaidHistory" :key="i">
          <div class="row mb-2">
            <div class="col-md-3">
              <b-input-group>
                <b-form-input
                  :id="`date_${i}`"
                  :value="formatDate(item.date)"
                  type="text"
                  autocomplete="off"
                  placeholder="dd.mm.yyyy"
                  size="sm"
                  @blur="setDate(i), setEdited()"
                ></b-form-input>
                <b-input-group-append>
                  <b-form-datepicker
                    v-model="item.date"
                    :locale="locale"
                    :start-weekday="1"
                    button-only
                    right
                    size="sm"
                    @context="setDate(i)"
                    @click="setEdited()"
                  ></b-form-datepicker>
                </b-input-group-append>
              </b-input-group>
            </div>
            <div class="col-md-3">
              <b-form-input
                class="percent-input"
                size="sm"
                style="text-align: right"
                :id="`percent_${i}`"
                :placeholder="percent_remain.toFixed(2)"
                :value="item.percent > 0 ? item.percent : null"
                @blur="setPercent(i), setEdited()"
              ></b-form-input>
            </div>
            <div class="col-md-3">
              <b-form-input
                class="value-input"
                size="sm"
                style="text-align: right"
                :id="`value_${i}`"
                :placeholder="formatMoney(remaining)"
                :value="item.value > 0 ? formatMoney(item.value) : null"
                @blur="setValue(i), setEdited()"
              ></b-form-input>
            </div>
            <div class="col-md-3">
              <b-button variant="primary" class="minus-btn mr-2" size="sm" @click="remove(i), setEdited()">
                <i class="flaticon2-line p-0"></i>
              </b-button>
              <b-button variant="primary" class="plus-btn" size="sm" @click="add(), setEdited()">
                <i class="flaticon2-plus p-0"></i>
              </b-button>
            </div>
          </div>
        </div>

        <div class="row mt-2">
          <div class="col-md-12">
            <div class="font-weight-bolder">
              {{ $t("invoice.remain") + ": " + formatMoney(remaining) + " " + currency }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import i18nService from "@/core/services/i18n.service.js";
import currency from "currency.js";
import moment from "moment";
import { mapGetters } from "vuex";
import {
  SET_HISTORY,
  ADD_HISTORY,
  REMOVE_HISTORY,
  RESET_HISTORY,
  SET_HISTORY_EDITED
} from "@/core/services/store/invoice";
import { formatDate } from "@/common";

export default {
  props: {
    currency: {
      type: String,
      default: null
    }
  },
  data() {
    return {
      locale: "de",
      value_remain: 0.0,
      percent_remain: 0.0
    };
  },
  computed: {
    ...mapGetters(["currentPaidHistory", "detailCost"]),
    currentLanguage() {
      return i18nService.getActiveLanguage();
    },
    remaining() {
      let total = 0.0;
      for (const item of this.currentPaidHistory) {
        total += parseFloat(item.value);
      }
      return parseFloat(this.detailCost.total_gross + this.detailCost.total_gross_nk) - total;
    }
  },
  mounted() {
    if (this.currentLanguage === "de") {
      this.locale = "de";
    } else {
      this.locale = "en-US";
    }
    this.calculatePercent();
    if (this.currentPaidHistory.length === 0) {
      this.add();
    }
  },
  destroyed() {
    this.$store.commit(RESET_HISTORY);
    this.$store.commit(SET_HISTORY_EDITED, false);
  },
  methods: {
    formatDate,
    add() {
      const item = { date: "", percent: 0.0, value: 0.0 };
      this.$store.commit(ADD_HISTORY, item);
    },
    remove(index) {
      this.$store.commit(REMOVE_HISTORY, index);
    },
    setDate(id) {
      const el = document.getElementById(`date_${id}`);
      if (el.value) {
        const split = el.value.split(".");
        const join = split[2] + "-" + split[1] + "-" + split[0];
        this.$store.commit(SET_HISTORY, {
          id: id,
          field: "date",
          value: join
        });
      }
    },
    setPercent(id) {
      const el = document.getElementById(`percent_${id}`);
      let val = parseFloat(el.value);
      if (val) {
        const gross = this.formatMoney(this.detailCost.total_gross + this.detailCost.total_gross_nk);
        const equal = parseFloat(gross.replaceAll("'", "")) * (val / 100);
        this.$store.commit(SET_HISTORY, {
          id: id,
          field: "percent",
          value: val.toFixed(2)
        });
        this.$store.commit(SET_HISTORY, {
          id: id,
          field: "value",
          value: parseFloat(equal)
        });

        this.calculatePercent();
      } else {
        this.$store.commit(SET_HISTORY, {
          id: id,
          field: "value",
          value: 0.0
        });
        this.$store.commit(SET_HISTORY, {
          id: id,
          field: "percent",
          value: 0.0
        });
      }
    },
    setValue(id) {
      const el = document.getElementById(`value_${id}`);
      let val = parseFloat(el.value);
      if (val) {
        const gross = this.formatMoney(this.detailCost.total_gross + this.detailCost.total_gross_nk);
        const equal = (val / parseFloat(gross.replaceAll("'", ""))) * 100;
        this.$store.commit(SET_HISTORY, {
          id: id,
          field: "value",
          value: val
        });
        this.$store.commit(SET_HISTORY, {
          id: id,
          field: "percent",
          value: equal.toFixed(2)
        });

        this.calculatePercent();
      } else {
        this.$store.commit(SET_HISTORY, {
          id: id,
          field: "value",
          value: 0.0
        });
        this.$store.commit(SET_HISTORY, {
          id: id,
          field: "percent",
          value: 0.0
        });
      }
    },
    setEdited() {
      this.$store.commit(SET_HISTORY_EDITED, true);
    },
    calculatePercent() {
      let percent = 0.0;
      for (const item of this.currentPaidHistory) {
        percent += parseFloat(item.percent);
      }
      this.percent_remain = 100 - percent;
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
