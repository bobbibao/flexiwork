<template>
  <div id="quote-items">
    <!-- Drag Drop -->
    <div class="row">
      <div class="col-md-12">
        <div class="spacer"></div>
      </div>
      <div class="col-md-12" style="display: flex">
        <div class="col-md-4 font-weight-bolder">
          {{ $t("quoteItems.service") }}
        </div>
        <div class="col-md-1 font-weight-bolder text-center">
          {{ $t("quoteItems.optional") }}
        </div>
        <div class="col-md-1 font-weight-bolder text-right">
          {{ $t("quoteItems.unit") }}
        </div>
        <div class="col-md-1 font-weight-bolder text-right">
          {{ $t("quoteItems.amount") }}
        </div>
        <div class="col-md-1 font-weight-bolder text-right">{{ $t("quoteItems.price") }} {{ currency }}</div>
        <div class="col-md-1 font-weight-bolder text-right">
          {{ $t("quoteItems.vat") }}
        </div>
        <div class="col-md-1 font-weight-bolder text-right">
          {{ $t("quoteItems.planning") }}
        </div>
        <div class="col-md-1 font-weight-bolder text-right">{{ $t("quoteItems.cost") }} {{ currency }}</div>
      </div>
      <div class="col-md-12">
        <div class="spacer"></div>
      </div>
    </div>

    <div class="row">
      <div class="col-md-12">
        <draggable
          :item-key="(el) => draggableList.indexOf(el)"
          :list="draggableList"
          class="item-group"
          ghost-class="ghost"
          @start="dragging = true"
          @end="dragging = false"
          handle=".handle"
        >
          <template #item="{ element: item, index: i }">
            <div class="row list-group-item m-0">
              <!-- Individual -->
              <div v-if="item.type === 'individual'" style="display: block">
                <div class="row pl-2">
                  <div class="col-md-4 p-0">
                    <b-form-input
                      :id="`individual_name_${i}`"
                      :value="item.name"
                      size="sm"
                      placeholder="Product"
                      class="form-control-solid mb-2"
                      :disabled="disabled"
                      @blur="setName(i)"
                    ></b-form-input>
                  </div>
                </div>
                <div class="row pl-2">
                  <div class="col-md-4 p-0">
                    <b-form-textarea
                      :id="`individual_desc_${i}`"
                      rows="3"
                      placeholder="Description"
                      :value="item.description"
                      :disabled="disabled"
                      @blur="setDesc(i)"
                    ></b-form-textarea>
                  </div>
                  <div class="col-md-1 center">
                    <b-form-checkbox
                      :id="`individual_opt_${i}`"
                      size="lg"
                      :checked="item.optional"
                      :disabled="disabled || item.is_nk"
                      @change="setOptional(i)"
                    />
                  </div>
                  <div class="col-md-1 pl-0 pr-0 center">
                    <b-form-select
                      :id="`individual_unit_${i}`"
                      :options="units"
                      :value="item.unit"
                      value-field="name"
                      text-field="description"
                      :disabled="disabled || item.is_nk"
                      @change="setUnit(i)"
                    ></b-form-select>
                  </div>
                  <div class="col-md-1 pr-0 center">
                    <b-form-input
                      :id="`individual_amount_${i}`"
                      style="text-align: right"
                      :value="draggableList[i].amount"
                      :disabled="disabled || item.is_nk"
                      @blur="setAmount(i)"
                    ></b-form-input>
                  </div>
                  <div class="col-md-1 pr-0 center">
                    <b-form-input
                      :id="`individual_price_${i}`"
                      :value="formatMoney(draggableList[i].price)"
                      style="text-align: right"
                      :disabled="disabled || item.is_nk"
                      @blur="getCost(i)"
                    ></b-form-input>
                  </div>
                  <div class="col-md-1 pr-0 center">
                    <b-form-select
                      :id="`individual_vat_${i}`"
                      :value="parseFloat(item.vat_rate)"
                      :options="vat"
                      :disabled="disabled"
                      @change="setVAT(i)"
                    ></b-form-select>
                  </div>
                  <div class="col-md-1 pr-0">
                    <b-form-select
                      v-if="!item.is_nk"
                      :id="`individual_quarter_${i}`"
                      :value="item.quarter"
                      :options="quarters"
                      :disabled="disabled || isInvoice"
                      text-field="name"
                      value-field="value"
                      class="mb-2"
                      @change="setQuarter(i)"
                    ></b-form-select>
                    <b-form-select
                      v-if="!item.is_nk"
                      :id="`individual_year_${i}`"
                      :value="item.year"
                      :options="years"
                      :disabled="disabled || isInvoice"
                      @change="setYear(i)"
                    ></b-form-select>
                  </div>
                  <div :id="`individual_cost_${i}`" class="col-md-1 right item-cost">
                    {{ item.optional === true ? `(${formatMoney(item.cost)})` : formatMoney(item.cost) }}
                  </div>
                  <div class="col-md-1 center">
                    <i v-show="!disabled" class="flaticon2-sort handle mr-4"></i>
                    <i v-show="!disabled" class="flaticon2-cancel remove-btn" @click="removeItem(i)"></i>
                  </div>
                </div>
                <div v-if="item.apply_discount !== undefined && isInvoice" class="row pl-2 mt-2">
                  <div class="col-md-4 p-0">
                    <b-form-checkbox
                      :id="`individual_applydis_${i}`"
                      :checked="item.apply_discount"
                      :disabled="disabled"
                      @change="setApplyDiscount(i)"
                      >{{ $t("quoteItems.applyDiscount") }}</b-form-checkbox
                    >
                  </div>
                </div>
              </div>

              <!-- Title -->
              <div v-else-if="item.type === 'title'" style="display: block">
                <div class="row pl-2">
                  <div class="col-md-4 p-0">
                    <b-form-input
                      :id="`title_${i}`"
                      v-model="draggableList[i].description"
                      placeholder="Title"
                      class="form-control-solid"
                      :disabled="disabled"
                    ></b-form-input>
                  </div>
                  <div :id="`title_cost_${i}`" class="col-md-7 font-weight-bolder left">
                    {{ $t("quoteItems.titleCost") }}
                    {{ currency }} {{ formatMoney(item.cost) }}
                  </div>
                  <div class="col-md-1 center">
                    <i v-show="!disabled" class="flaticon2-sort handle mr-4"></i>
                    <i v-show="!disabled" class="flaticon2-cancel remove-btn" @click="removeItem(i)"></i>
                  </div>
                </div>
              </div>

              <!-- Textfield -->
              <div v-else style="display: block">
                <div class="row pl-2">
                  <div class="col-md-11 p-0">
                    <b-form-textarea
                      :id="`textfield_${i}`"
                      v-model="draggableList[i].description"
                      rows="3"
                      :value="item.description"
                      :disabled="disabled"
                    ></b-form-textarea>
                  </div>
                  <div class="col-md-1 center">
                    <i v-show="!disabled" class="flaticon2-sort handle mr-4"></i>
                    <i v-show="!disabled" class="flaticon2-cancel remove-btn" @click="removeItem(i)"></i>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </draggable>
      </div>
    </div>

    <!-- Sum up -->
    <div class="row mt-4">
      <div class="col-md-12" style="display: flex">
        <div class="col-md-10 font-weight-bolder left">
          {{ $t("quoteItems.discountPercent") }}
        </div>
        <div class="col-md-1">
          <b-form-input
            id="discount_percent"
            :value="discount_percent"
            placeholder="0%"
            style="text-align: right"
            :disabled="disabled"
            @blur="getDiscount(), setEdited()"
          ></b-form-input>
        </div>
      </div>
      <!-- Total cost excluding discount -->
      <div v-show="quoteItems.length > 0" class="col-md-12 mt-2" style="display: flex">
        <div class="col-md-10 font-weight-bolder left">
          {{ $t("quoteItems.totalNoDiscount") }}
        </div>
        <div id="discount" class="col-md-1 font-weight-bolder right pr-8">
          {{ formatMoney(detailCost.total_net + detailCost.total_discount) }}
        </div>
      </div>
      <!-- Discount -->
      <div v-show="quoteItems.length > 0" class="col-md-12 mt-2" style="display: flex">
        <div class="col-md-10 font-weight-bolder left">
          {{ $t("quoteItems.discount") + " " + discount_percent + "%" }}
        </div>
        <div id="discount" class="col-md-1 font-weight-bolder right pr-8">
          {{ formatMoney(detailCost.total_discount) }}
        </div>
      </div>
      <!-- Total cost including discount -->
      <div v-show="quoteItems.length > 0" class="col-md-12 mt-2" style="display: flex">
        <div class="col-md-10 font-weight-bolder left">
          {{ "Honorarsumme " + $t("quoteItems.total") }}
        </div>
        <div id="discount" class="col-md-1 font-weight-bolder right pr-8">
          {{ formatMoney(detailCost.total_net, 0.05) }}
        </div>
      </div>
      <!-- Additional -->
      <div class="col-md-12 mt-2" style="display: flex">
        <div class="col-md-10 font-weight-bolder left">
          {{ "Nebenkosten " + additionalPercent + "% von " + $t("quoteItems.total") }}
        </div>
        <div id="additional" class="col-md-1 font-weight-bolder right pr-8">
          {{ formatMoney(detailCost.total_net_nk + detailCost.total_discount_nk, 0.05) }}
        </div>
      </div>
      <!-- Total net -->
      <div v-show="quoteItems.length > 0" class="col-md-12 mt-2" style="display: flex">
        <div class="col-md-10 font-weight-bolder left">
          {{ $t("quoteItems.net") }}
        </div>
        <div id="net-total" class="col-md-1 font-weight-bolder right pr-8">
          {{ formatMoney(detailCost.total_net + detailCost.total_net_nk + detailCost.total_discount_nk, 0.05) }}
        </div>
      </div>
      <!-- Invoice list -->
      <div
        v-show="currentProjectInvoices.length > 0"
        v-for="item in currentProjectInvoices"
        :key="item.id"
        class="col-md-12 mt-2"
        style="display: flex"
      >
        <div :id="`invoice_${item.id}`" class="col-md-10 left">
          <!-- {{ setInvoiceType(item.type, item.is_final) }} -->
          {{ item.charged_on ? formatDateUtil(item.charged_on) : formatDateUtil(item.created_at) }}
          <span class="font-weight-bolder underline-text mx-1" @click="$router.push(`/invoice/${item.id}`)">
            {{ item.name }}
          </span>
        </div>
        <div :id="`invoice_amount_${item.id}`" class="col-md-1 right pr-8">
          -{{ formatMoney(item.amount) }}
          <span v-if="item.status !== 'paid'" class="ml-1">
            <b-badge class="filter-badge" :variant="item.status === 'cancelled' ? 'danger' : 'secondary'">
              <div class="text-capitalize">
                {{ item.status === "cancelled" ? $t("status.cancelled") : $t("status.unpaid") }}
              </div>
            </b-badge></span
          >
        </div>
      </div>
      <!-- Remaining net -->
      <div v-show="currentProjectInvoices.length > 0" class="col-md-12 mt-2" style="display: flex">
        <div class="col-md-10 font-weight-bolder left">
          {{ $t("quoteItems.netRemaining") }}
        </div>
        <div id="net-remaining" class="col-md-1 font-weight-bolder right pr-8">
          {{ formatMoney(remainingNet) }}
        </div>
      </div>
      <!-- Vat list -->
      <div
        v-show="vat_list.length > 0"
        v-for="item in vat_list"
        :key="item.rate"
        class="col-md-12 mt-2"
        style="display: flex"
      >
        <div :id="`vat_rate_${item.rate}`" class="col-md-10 left">
          {{ $t("quoteItems.vat") }} {{ item.rate }}% von
          {{
            currentProjectInvoices.length > 0
              ? formatMoney(remainingNet)
              : formatMoney(
                  (detailCost.total_init_net_by_vat[item.rate] ?? 0) +
                    (detailCost.total_init_net_nk_by_vat[item.rate] ?? 0),
                  0.05
                )
          }}
        </div>
        <div :id="`vat_cost_${item.rate}`" class="col-md-1 right pr-8 vat_cost">
          {{
            currentProjectInvoices.length > 0
              ? formatMoney(remainingNet * (item.rate / 100), 0.05)
              : formatMoney(detailCost.total_vat_list[item.rate], 0.05)
          }}
        </div>
      </div>
      <!-- Total gross -->
      <div
        v-if="quoteItems.length > 0 && currentProjectInvoices.length === 0"
        class="col-md-12 mt-2"
        style="display: flex"
      >
        <div class="col-md-10 font-weight-bolder left">
          {{ $t("quoteItems.gross") }}
        </div>
        <div id="gross-total" class="col-md-1 font-weight-bolder right pr-8">
          {{ formatMoney(detailCost.total_gross + detailCost.total_gross_nk, 0.05) }}
        </div>
      </div>
      <!-- Remaining gross -->
      <div v-if="currentProjectInvoices.length > 0" class="col-md-12 mt-2" style="display: flex">
        <div class="col-md-10 font-weight-bolder left">
          {{ $t("quoteItems.grossRemaining") }}
        </div>
        <div id="gross-total" class="col-md-1 font-weight-bolder right pr-8">
          {{ formatMoney(remainingGross, 0.05) }}
        </div>
      </div>

      <div class="col-md-12">
        <div class="spacer"></div>
      </div>
    </div>

    <!-- Actions -->
    <div class="col-md-12 mt-4 p-0" style="display: inline-flex">
      <ProductSelect v-show="!disabled" class="mr-2" :add-product="addProduct" />
      <ProductGroupSelect v-show="!disabled" class="mr-2" :add-group="addGroup" />
      <b-button v-show="!disabled" variant="primary" class="add-btn mr-2" @click="addItem">
        <i class="menu-icon flaticon2-plus"></i>
        <span class="menu-text"> {{ $t("button.individual") }} </span>
      </b-button>
      <b-button v-show="!disabled" variant="primary" class="add-btn mr-2" @click="addTitle">
        <i class="menu-icon flaticon2-plus"></i>
        <span class="menu-text"> {{ $t("button.title") }} </span>
      </b-button>
      <b-button v-show="!disabled" variant="primary" class="add-btn mr-2" @click="addTextfield">
        <i class="menu-icon flaticon2-plus"></i>
        <span class="menu-text"> {{ $t("button.textfield") }} </span>
      </b-button>
    </div>
  </div>
</template>

<script>
import draggable from "vuedraggable";
import currency from "currency.js";
import moment from "moment";
import { uuid } from "vue-uuid";
import ProductSelect from "@/view/content/selector/ProductDialog.vue";
import ProductGroupSelect from "@/view/content/selector/ProductGroupDialog.vue";
import { mapGetters, mapState } from "vuex";
import { GET_UNITS, GET_VAT, SET_SETTING_ERROR } from "@/core/services/store/settings";
import { SET_PROJECT_INVOICES } from "@/core/services/store/project";
import {
  SET_ITEM,
  REMOVE_ITEM,
  SET_ITEM_VALUE,
  SET_REMAININGNET,
  SET_REMAININGGROSS,
  SET_DISPERCENT,
  SET_ITEM_GROUP,
  SET_QUOTE_ITEMS,
  SET_VAT_COUNT,
  SET_QUOTE_EDITED,
  SET_PUSH_NK,
  SET_IS_INVOICE,
} from "@/core/services/store/product";
import { formatDate } from "@/common/dateUtils";

function multiIndexOf(el, compare) {
  var idxs = [];
  for (var i = el.length - 1; i >= 0; i--) {
    if (compare(el[i])) {
      idxs.unshift(i);
    }
  }
  return idxs;
}

export default {
  props: {
    currency: {
      type: String,
      default: "",
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    isInvoice: {
      type: Boolean,
      default: false,
    },
  },
  components: {
    ProductSelect,
    ProductGroupSelect,
    draggable,
  },
  data() {
    return {
      dragging: false,
      units: [],
      vat: [],
      vat_list: [],
      default_unit: "",
      default_vat: 0.0,
      additional_display: false,
      allow_add_additional: true,
      quarters: [
        { name: "Q1", value: 1 },
        { name: "Q2", value: 2 },
        { name: "Q3", value: 3 },
        { name: "Q4", value: 4 },
      ],
      years: [],
    };
  },
  watch: {
    push_nk(newVal) {
      if (newVal === true) {
        this.addAdditional();
      }
    },
  },
  computed: {
    ...mapGetters([
      "quoteItems",
      "remainingNet",
      "remainingGross",
      "discountPercent",
      "currentUnits",
      "currentVatRates",
      "currentProjectInvoices",
      "additionalPercent",
      "additionalTotal",
      "detailCost",
    ]),
    ...mapState({
      discount_percent: (state) => state.product.discount_percent,
      push_nk: (state) => state.product.push_nk,
    }),
    draggableList() {
      let draggableList = this.quoteItems;

      //get list title
      let titleList = multiIndexOf(this.quoteItems, (e) => {
        return e.type === "title";
      });

      //get list ind
      let individualList = multiIndexOf(this.quoteItems, (e) => {
        return e.type === "individual";
      });

      //loop title list
      for (let i = 0; i < titleList.length; i++) {
        draggableList[titleList[i]].cost = 0.0; //set cost = 0 each row to prevent dupe
        //loop individual list to find range between titleList[i] to titleList[i+1]
        for (let j = 0; j < individualList.length; j++) {
          //sum from titleList[i] to titleList[i+1]
          //if titleList[i + 1] is undefined it means the last title
          if (
            individualList[j] < (titleList[i + 1] ? titleList[i + 1] : draggableList.length) &&
            individualList[j] > titleList[i]
          ) {
            if (!draggableList[individualList[j]].optional && !draggableList[individualList[j]].is_nk) {
              draggableList[titleList[i]].cost += parseFloat(draggableList[individualList[j]].cost);
            }
          }
        }
      }

      if (this.quoteItems.length > 0) {
        this.getDiscount();
        this.getVATRate();
        this.getRemain();
        if (this.additionalPercent > 0) {
          this.$emit("persistAdditionalCost", this.additionalPercent);
        }
      }

      return draggableList;
    },
  },
  async mounted() {
    this.$store.commit(SET_IS_INVOICE, this.isInvoice);
    await this.$store.dispatch(GET_UNITS);
    await this.$store.dispatch(GET_VAT);
    this.initData();
  },
  destroyed() {
    this.vat_list = [];
    this.$store.commit(SET_QUOTE_ITEMS, []);
    this.$store.commit(SET_PROJECT_INVOICES, []);
    this.$store.commit(SET_REMAININGNET, parseFloat(0).toFixed(2));
    this.$store.commit(SET_REMAININGGROSS, parseFloat(0).toFixed(2));
    this.$store.commit(SET_DISPERCENT, 0.0);
    this.$store.commit(SET_VAT_COUNT, 0);
    this.$store.commit(SET_QUOTE_EDITED, false);
  },
  methods: {
    initData() {
      for (const unit of this.currentUnits) {
        let item = {
          name: unit.description,
          description: unit.description.includes("unit.") ? this.$t(unit.description.toString()) : unit.description,
        };
        this.units.push(item);
        if (unit.is_default) {
          this.default_unit = unit.description;
        }
      }
      for (const vat of this.currentVatRates) {
        this.vat.push(vat.rate);
        if (vat.is_default) {
          this.default_vat = vat.rate;
        }
      }
      //not allow add additional if individual existed
      if (this.additionalPercent > 0 && !this.isInvoice) {
        for (const item of this.draggableList) {
          if (item.is_nk) {
            this.allow_add_additional = false;
            this.additional_display = true;
            break;
          }
        }
      }
      //get year
      const year = moment().year();
      this.years.push(year - 2);
      this.years.push(year - 1);
      this.years.push(year);
      this.years.push(year + 1);
      this.years.push(year + 2);
      this.years.push(year + 3);
      this.years.push(year + 4);
      this.years.push(year + 5);
    },
    formatDateUtil(date, format = "DD.MM.YYYY") {
      return formatDate(date, format);
    },
    setEdited() {
      this.$store.commit(SET_QUOTE_EDITED, true);
    },
    addItem() {
      let item = {
        uuid: uuid.v4(),
        type: "individual",
        name: "",
        description: "",
        optional: false,
        unit: this.default_unit,
        amount: 1,
        vat_rate: parseFloat(this.default_vat),
        price: 0.0,
        cost: 0.0,
        quarter: 1,
        year: moment().year(),
      };
      this.$store.commit(SET_ITEM, item);
      this.setEdited();
    },
    addTitle() {
      let item = {
        uuid: uuid.v4(),
        type: "title",
        description: "",
        cost: 0.0,
      };
      this.$store.commit(SET_ITEM, item);
      this.setEdited();
    },
    addTextfield() {
      let item = {
        uuid: uuid.v4(),
        type: "textfield",
        description: "",
      };
      this.$store.commit(SET_ITEM, item);
      this.setEdited();
    },
    addAdditional() {
      if (this.additionalPercent > 0) {
        this.$emit("persistAdditionalCost", this.additionalPercent);
      }
      const nkValue = Math.round(this.additionalTotal / 0.05, 0) * 0.05;
      let item = {
        uuid: uuid.v4(),
        type: "individual",
        name: "Nebenkosten " + this.additionalPercent + "%",
        description:
          "der Total Honorarsumme von " + this.currency + " " + this.formatMoney(this.detailCost.total_net, 0.05),
        optional: false,
        unit: "unit.flatRate",
        amount: 1,
        vat_rate: parseFloat(this.default_vat),
        price: nkValue,
        cost: nkValue,
        apply_discount: false,
        is_nk: true, //apply for additional in offer and project
      };
      this.$store.commit(SET_ITEM, item);
      this.$store.commit(SET_PUSH_NK, false);
      this.additional_display = true;
      this.allow_add_additional = false;
    },
    removeItem(id) {
      //handle display additional
      if (this.draggableList[id].is_nk) {
        this.additional_display = false;
        this.allow_add_additional = true;
      }

      this.$store.commit(REMOVE_ITEM, id);
      this.setEdited();
    },
    setName(id) {
      const item = document.getElementById(`individual_name_${id}`);
      this.$store.commit(SET_ITEM_VALUE, {
        id: id,
        field: "name",
        value: item.value,
      });
      this.setEdited();
    },
    setDesc(id) {
      const item = document.getElementById(`individual_desc_${id}`);
      this.$store.commit(SET_ITEM_VALUE, {
        id: id,
        field: "description",
        value: item.value,
      });
      this.setEdited();
    },
    setOptional(id) {
      const item = document.getElementById(`individual_opt_${id}`);
      this.$store.commit(SET_ITEM_VALUE, {
        id: id,
        field: "optional",
        value: item.checked,
      });
      this.setEdited();
    },
    setUnit(id) {
      const item = document.getElementById(`individual_unit_${id}`);
      this.$store.commit(SET_ITEM_VALUE, {
        id: id,
        field: "unit",
        value: item.value,
      });
      this.setEdited();
    },
    setAmount(id) {
      const item = document.getElementById(`individual_amount_${id}`);
      this.$store.commit(SET_ITEM_VALUE, {
        id: id,
        field: "amount",
        value: parseFloat(item.value),
      });
      if (item.value) {
        this.getCost(id);
      }
      this.setEdited();
    },
    setVAT(id) {
      const item = document.getElementById(`individual_vat_${id}`);
      this.$store.commit(SET_ITEM_VALUE, {
        id: id,
        field: "vat_rate",
        value: parseFloat(item.value),
      });
      for (let index = 0; index < this.vat_list.length; index++) {
        const element = this.vat_list[index];
        element.total = 0.0;
      }
      this.setEdited();
    },
    setQuarter(id) {
      const item = document.getElementById(`individual_quarter_${id}`);
      this.$store.commit(SET_ITEM_VALUE, {
        id: id,
        field: "quarter",
        value: parseInt(item.value),
      });
      this.setEdited();
    },
    setYear(id) {
      const item = document.getElementById(`individual_year_${id}`);
      this.$store.commit(SET_ITEM_VALUE, {
        id: id,
        field: "year",
        value: parseInt(item.value),
      });
      this.setEdited();
    },
    setApplyDiscount(id) {
      const item = document.getElementById(`individual_applydis_${id}`);
      this.$store.commit(SET_ITEM_VALUE, {
        id: id,
        field: "apply_discount",
        value: item.checked,
      });
      this.setEdited();

      if (this.additionalPercent > 0) {
        this.$emit("persistAdditionalCost", this.additionalPercent);
      }
    },
    getCost(id) {
      let cost = 0.0;
      const price_item = document.getElementById(`individual_price_${id}`);
      const amount_item = document.getElementById(`individual_amount_${id}`);
      cost = price_item.value ? parseFloat(price_item.value.replaceAll("'", "")) * parseFloat(amount_item.value) : 0.0;
      this.$store.commit(SET_ITEM_VALUE, {
        id: id,
        field: "price",
        value: price_item.value ? parseFloat(price_item.value.replaceAll("'", "")) : 0.0,
      });
      this.$store.commit(SET_ITEM_VALUE, {
        id: id,
        field: "cost",
        value: parseFloat(cost),
      });
    },
    getRemain() {
      //invoice net remaining
      if (this.currentProjectInvoices.length > 0) {
        let invoiceTotal = 0.0;
        for (const item of this.currentProjectInvoices) {
          invoiceTotal += parseFloat(item.amount || 0);
        }

        if (!this.additional_display) {
          this.$store.commit(SET_REMAININGNET, parseFloat(this.detailCost.total_net - invoiceTotal));
        } else {
          this.$store.commit(
            SET_REMAININGNET,
            parseFloat(this.detailCost.total_net + this.detailCost.total_net_nk - invoiceTotal)
          );
        }

        if (parseFloat(this.remainingNet) === 0.0) {
          this.$store.commit(SET_REMAININGGROSS, parseFloat(0));
        } else {
          let vat = 0.0;
          for (const item in this.detailCost.total_vat_list) {
            vat += this.remainingNet * (item / 100);
          }

          this.$store.commit(SET_REMAININGGROSS, parseFloat(this.remainingNet) + vat);
        }
      }
    },
    async getDiscount() {
      const item = await document.getElementById("discount_percent");
      if (item) {
        this.$store.commit(SET_DISPERCENT, item.value ? parseFloat(item.value) : parseFloat(0));
      }
    },
    getVATRate() {
      const vatRates = this.quoteItems
        .map((quoteItem) => {
          if (quoteItem.type === "individual") {
            return {
              rate: parseFloat(quoteItem.vat_rate),
              total: 0.0,
              cost: 0.0,
            };
          }
          return null;
        })
        .filter((item) => item)
        .filter((item, index, self) => index === self.findIndex((other) => other.rate === item.rate));

      this.$store.commit(SET_VAT_COUNT, vatRates.length);
      this.vat_list = vatRates;
    },
    async addProduct(e) {
      let item = {
        id: e.id,
        product_id: e.id,
        uuid: uuid.v4(),
        type: "individual",
        name: e.name,
        description: e.description,
        optional: false,
        unit: e.unit.description,
        amount: 1.0,
        vat_rate: e.vat_rate.rate,
        price: e.price,
        cost: e.price,
        quarter: 1,
        year: moment().year(),
      };
      const dup = this.quoteItems.filter((record) => record.id === item.product_id);
      if (dup.length === 0) {
        await this.$store.commit(SET_ITEM, item);
      } else {
        this.toastMsg("error", this.$t("msg.duplicateProduct"));
      }
      this.setEdited();
    },
    async addGroup(e) {
      const group = [];
      let title = {
        uuid: uuid.v4(),
        type: "title",
        description: e.name,
        cost: 0.0,
      };
      for (const item of e.products) {
        title.cost += parseFloat(item.price);
      }
      group.push(title);

      for (const item of e.products) {
        let ind = {
          id: item.id,
          product_id: item.id,
          uuid: uuid.v4(),
          type: "individual",
          name: item.name,
          description: item.description,
          optional: false,
          unit: item.unit.description,
          amount: item.amount ?? 1,
          vat_rate: item.vat_rate.rate,
          price: item.price,
          cost: item.price,
          quarter: 1,
          year: moment().year(),
        };
        const dup = this.quoteItems.filter((record) => record.id === ind.product_id);
        if (dup.length > 0) {
          this.toastMsg("error", this.$t("msg.duplicateProduct"));
          break;
        }
        group.push(ind);
      }
      await this.$store.commit(SET_ITEM_GROUP, group);
      this.setEdited();
    },
    setInvoiceType(type, is_final) {
      if (is_final) {
        return this.$t("quoteItems.finalInvoice");
      } else {
        if (type === "partial") {
          return this.$t("quoteItems.partial");
        } else {
          return this.$t("quoteItems.invoice");
        }
      }
    },
    formatMoney(val, increment = 0) {
      return currency(val, {
        separator: "'",
        pattern: `#`,
        negativePattern: `-#`,
        increment: increment,
      }).format();
    },

    toastMsg(type, msg) {
      const h = this.$createElement;
      this.count++;
      const vNodesTitle = h("div", { class: ["d-flex", "flex-grow-1", "align-items-baseline", "mr-2"] }, [
        h("strong", { class: "mr-2" }, type === "error" ? "Error" : this.$t("title.notice")),
      ]);
      const vNodesMsg = h("h5", { class: ["mb-0"] }, [h("strong", msg)]);
      this.$bvToast.toast([vNodesMsg], {
        title: vNodesTitle,
        variant: type === "error" ? "danger" : "success",
        toaster: "b-toaster-top-center",
        autoHideDelay: 5000,
        solid: true,
      });
      this.$store.commit(SET_SETTING_ERROR, null);
    },
  },
};
</script>

<style scoped>
.remove-btn:hover,
.handle:hover,
.underline-text:hover {
  color: #3699ff;
}

.spacer {
  height: 1px;
  background-color: rgba(153, 153, 153, 0.3);
  margin-top: 1rem;
  margin-bottom: 1rem;
}

.ghost {
  opacity: 0.5;
  background: #c8ebfb;
}

.center {
  display: flex;
  justify-content: center;
  align-items: center;
}

.right {
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.left {
  display: flex;
  justify-content: flex-start;
  align-items: center;
}

.underline-text {
  text-decoration: underline;
  cursor: pointer;
}

.form-control,
.custom-select {
  font-size: 0.85rem;
}
</style>
