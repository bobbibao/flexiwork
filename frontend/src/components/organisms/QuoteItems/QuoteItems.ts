import { defineComponent, ref } from "vue";
import draggable from "vuedraggable";
import { PlusIcon, Toast } from "@/components/atoms";
import currency from "currency.js";
import moment from "moment";
import { v4 as uuidv4 } from "uuid";
import ApiService from "@/api/api.service";
import { Response } from "@/common/dtos";
import ProductModal from "../selector/ProductModal/ProductModal";
import ProductGroupModal from "../selector/ProductGroupModal/ProductGroupModal";
import { DetailCost } from "@/common/models/detailCost.model";
import { QuoteItem, Unit, Vat } from "./type";
import { ProjectInvoice } from "@/common/models/projectInvoices.model";
import { formatDate } from "@/common";

let observer: MutationObserver | null = null;

const getIndexesByType = (items: QuoteItem[], type: string): number[] =>
  items.map((item, index) => (item.type === type ? index : -1)).filter(index => index !== -1);

export default defineComponent({
  name: "QuoteItems",
  components: {
    PlusIcon,
    draggable,
    ProductModal,
    ProductGroupModal
  },
  props: {
    currency: {
      type: String,
      default: ""
    },
    disabled: {
      type: Boolean,
      default: false
    },
    isInvoice: {
      type: Boolean,
      default: false
    },
    additionalCost: {
      type: Object as () => { percent: number; push_nk: boolean },
      default: false
    },
    discountPercent: {
      type: Number,
      default: 0.0
    },
    quoteItems: {
      type: Array as () => QuoteItem[],
      required: true
    },
    invoiceList: {
      type: Array as () => ProjectInvoice[],
      default: () => [],
      required: false
    }
  },

  mixins: [Toast],

  emits: ["update:quoteItems", "update:discountPercent"],

  setup() {
    const currentUnits = ref<Unit[]>([]);
    const currentVatRates = ref<Vat[]>([]);

    return {
      currentUnits,
      currentVatRates
    };
  },

  data() {
    return {
      dragging: false,
      units: [] as Unit[],
      vat: [] as number[],
      quarters: [
        { name: "Q1", value: 1 },
        { name: "Q2", value: 2 },
        { name: "Q3", value: 3 },
        { name: "Q4", value: 4 }
      ],
      years: [] as number[],
      detailCost: {} as DetailCost,
      currentProjectInvoices: this.invoiceList,
      remainingNet: 0.0,
      remainingGross: 0.0,
      vat_list: [] as { rate: number; total: number; cost: number }[],
      additional_display: false,
      allow_add_additional: true,
      default_unit: "",
      default_vat: 0.0,
      additionalTotal: 0.0
    };
  },
  async mounted() {
    await Promise.all([this.fetchUnits(), this.fetchVatRates()]);
    this.initData();
    const targetNode = document.body;
    observer = new MutationObserver(this.adjustTableHeader);
    observer.observe(targetNode, { childList: true, subtree: true });
  },
  computed: {
    draggableList() {
      if (!this.quoteItems || this.quoteItems.length === 0) {
        return [];
      }

      let draggableList = this.quoteItems;

      // get list title and individual
      const titleList = getIndexesByType(this.quoteItems, "title");
      const individualList = getIndexesByType(this.quoteItems, "individual");

      // loop title list
      for (let i = 0; i < titleList.length; i++) {
        draggableList[titleList[i]].cost = 0.0; // set cost = 0 each row to prevent dupe
        // loop individual list to find range between titleList[i] to titleList[i+1]
        for (let j = 0; j < individualList.length; j++) {
          // sum from titleList[i] to titleList[i+1]
          // if titleList[i + 1] is undefined it means the last title
          if (
            individualList[j] < (titleList[i + 1] ? titleList[i + 1] : draggableList.length) &&
            individualList[j] > titleList[i]
          ) {
            const individualItem = draggableList[individualList[j]];
            const titleItem = draggableList[titleList[i]];

            if (individualItem && titleItem && !individualItem.optional && !individualItem.is_nk) {
              if (titleItem.cost !== undefined) {
                titleItem.cost += parseFloat(individualItem.cost?.toString() || "0");
              }
            }
          }
        }
      }

      this.detailCost = this.calculateDetailCost();
      this.getVATRate();
      this.getRemain();
      if (this.additionalCost.percent > 0) {
        this.persistAdditionalCost();
      }

      return draggableList;
    }
  },
  watch: {
    quoteItems: {
      immediate: true,
      deep: true,
      handler(newItems: QuoteItem[], oldItems: QuoteItem[]) {
        if (JSON.stringify(newItems) !== JSON.stringify(oldItems)) {
          this.$emit("update:quoteItems", [...newItems]);
        }
      }
    },
    additionalCost: {
      handler(newVal: { percent: number; push_nk: boolean }) {
        if (newVal.push_nk) {
          this.addAdditional();
        }
      }
    }
  },
  methods: {
    formatDate,
    initData() {
      for (const unit of this.currentUnits) {
        let item: Unit = {
          name: unit.description,
          description: unit.description.includes("unit.")
            ? (this.$t(unit.description?.toString()) as string)
            : unit.description
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

      // not allow add additional if individual existed
      if (this.additionalCost.percent > 0 && !this.isInvoice) {
        for (const item of this.draggableList) {
          if (item.is_nk) {
            this.allow_add_additional = false;
            this.additional_display = true;
            break;
          }
        }
      }

      // populate years from current year - 2 to current year + 5
      const currentYear = moment().year();
      this.years = Array.from({ length: 8 }, (_, i) => currentYear - 2 + i);
    },
    removeItem(id: number) {
      if (this.quoteItems[id].is_nk) {
        this.additional_display = false;
        this.allow_add_additional = true;
      }

      this.$delete(this.quoteItems, id);
      this.detailCost = this.calculateDetailCost();
    },
    setName(id: number) {
      const item = document.getElementById(`individual_name_${id}`) as HTMLInputElement;
      this.$set(this.quoteItems, id, {
        ...this.quoteItems[id],
        name: item.value
      });
    },
    setDesc(id: number) {
      const item = document.getElementById(`individual_desc_${id}`) as HTMLInputElement;
      this.$set(this.quoteItems, id, {
        ...this.quoteItems[id],
        description: item.value
      });
    },
    setOptional(id: number) {
      const item = document.getElementById(`individual_opt_${id}`) as HTMLInputElement;
      this.$set(this.quoteItems, id, {
        ...this.quoteItems[id],
        optional: item.checked
      });
      this.detailCost = this.calculateDetailCost();
    },
    setUnit(id: number) {
      const item = document.getElementById(`individual_unit_${id}`) as HTMLSelectElement;
      this.$set(this.quoteItems, id, {
        ...this.quoteItems[id],
        unit: item.value
      });
      this.detailCost = this.calculateDetailCost();
    },
    setAmount(id: number) {
      const item = document.getElementById(`individual_amount_${id}`) as HTMLInputElement;

      this.$set(this.quoteItems, id, {
        ...this.quoteItems[id],
        amount: parseFloat(item.value)
      });
      if (item.value) {
        this.getCost(id);
      }
      this.detailCost = this.calculateDetailCost();
    },
    setVAT(id: number) {
      const item = document.getElementById(`individual_vat_${id}`) as HTMLSelectElement;
      this.$set(this.quoteItems, id, {
        ...this.quoteItems[id],
        vat_rate: parseFloat(item.value)
      });
      this.vat_list.forEach(element => {
        element.total = 0.0;
      });
      this.detailCost = this.calculateDetailCost();
    },
    setQuarter(id: number): void {
      const element = document.getElementById(`individual_quarter_${id}`) as HTMLSelectElement;
      if (!element) return;

      const quarter = parseInt(element.value);
      if (isNaN(quarter)) return;

      this.$set(this.quoteItems, id, {
        ...this.quoteItems[id],
        quarter
      });
    },
    setYear(id: number): void {
      const element = document.getElementById(`individual_year_${id}`) as HTMLSelectElement;
      if (!element) return;

      const year = parseInt(element.value);
      if (isNaN(year)) return;

      this.$set(this.quoteItems, id, {
        ...this.quoteItems[id],
        year
      });
    },
    setApplyDiscount(id: number): void {
      const element = document.getElementById(`individual_applydis_${id}`) as HTMLInputElement;
      if (!element) return;

      this.$set(this.quoteItems, id, {
        ...this.quoteItems[id],
        apply_discount: element.checked
      });

      if (this.additionalCost.percent > 0) {
        this.persistAdditionalCost();
      }
      this.detailCost = this.calculateDetailCost();
    },
    getCost(id: number): void {
      const priceElement = document.getElementById(`individual_price_${id}`) as HTMLInputElement;
      const amountElement = document.getElementById(`individual_amount_${id}`) as HTMLInputElement;

      if (!priceElement || !amountElement) return;

      const price = priceElement.value ? parseFloat(priceElement.value.replaceAll("'", "")) : 0.0;
      const amount = parseFloat(amountElement.value);

      if (isNaN(price) || isNaN(amount)) return;

      const cost = price * amount;

      this.$set(this.quoteItems, id, {
        ...this.quoteItems[id],
        price,
        cost
      });
      this.detailCost = this.calculateDetailCost();
    },
    getRemain(): void {
      //invoice net remaining
      if (!this.currentProjectInvoices?.length) return;
      const invoiceTotal = this.currentProjectInvoices.reduce((total: number, item: { amount: string | number }) => {
        const amount = typeof item.amount === "string" ? parseFloat(item.amount) : item.amount;
        return total + (isNaN(amount) ? 0 : amount);
      }, 0);

      // Calculate remaining net
      const newRemainingNet = !this.additional_display
        ? this.detailCost.total_net - invoiceTotal
        : this.detailCost.total_net + this.detailCost.total_net_nk - invoiceTotal;

      this.remainingNet = newRemainingNet;

      // Calculate remaining gross
      if (this.remainingNet === 0) {
        this.remainingGross = 0;
      } else {
        const vat = Object.entries(this.detailCost.total_vat_list).reduce((total, [rate, _]) => {
          const vatRate = parseFloat(rate);
          return total + this.remainingNet * (vatRate / 100);
        }, 0);

        this.remainingGross = this.remainingNet + vat;
      }
    },
    async setDiscount(percent: string) {
      this.detailCost = this.calculateDetailCost();
      this.$emit("update:discountPercent", parseFloat(percent) || 0);
    },
    getVATRate(): void {
      const vatRates = this.quoteItems
        .map(quoteItem => {
          if (quoteItem.type === "individual" && quoteItem.vat_rate !== undefined) {
            return {
              rate: parseFloat((quoteItem.vat_rate || 0).toString()),
              total: 0,
              cost: 0
            };
          }
          return null;
        })
        .filter(item => item !== null)
        .filter((item, index, self) => index === self.findIndex(other => other.rate === item.rate));

      this.vat_list = vatRates as { rate: number; total: number; cost: number }[];
    },
    async addProduct(e: {
      id: string;
      name: string;
      description: string;
      unit: { description: string };
      vat_rate: { rate: number };
      price: number;
    }) {
      const item: QuoteItem = {
        product_id: e.id,
        uuid: uuidv4(),
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
        year: moment().year()
      };
      const dup = this.quoteItems.filter(record => record.id === item.product_id);
      if (dup.length === 0) {
        this.quoteItems.push(item);
        this.detailCost = this.calculateDetailCost();
        this.scrollToBottom();
      } else {
        this.toast(this.$t("msg.duplicateProduct") as string, "danger");
      }
    },
    async addGroup(e: {
      name: string;
      products: {
        id: string;
        name: string;
        description: string;
        unit: { description: string };
        vat_rate: { rate: number };
        price: number;
        amount?: number;
      }[];
    }) {
      const group: any = [];
      const title = {
        uuid: uuidv4(),
        type: "title",
        description: e.name,
        cost: 0.0
      };
      for (const item of e.products) {
        title.cost += item.price;
      }
      group.push(title);

      for (const item of e.products) {
        const ind: QuoteItem = {
          product_id: item.id,
          uuid: uuidv4(),
          type: "individual",
          name: item.name,
          description: item.description,
          optional: false,
          unit: item.unit.description,
          amount: item.amount ?? 1.0,
          vat_rate: item.vat_rate.rate,
          price: item.price,
          cost: item.price,
          quarter: 1,
          year: moment().year()
        };
        const dup = this.quoteItems.filter((record: QuoteItem) => record.id === ind.product_id);
        if (dup.length > 0) {
          this.toast(this.$t("msg.duplicateProduct") as string, "danger");
          break;
        }
        group.push(ind);
      }
      for (const item of group) {
        this.quoteItems.push(item);
      }

      this.detailCost = this.calculateDetailCost();
      this.scrollToBottom();
    },
    addItem() {
      const item: QuoteItem = {
        uuid: uuidv4(),
        type: "individual",
        name: "",
        description: "",
        optional: false,
        unit: this.default_unit,
        amount: 1.0,
        vat_rate: this.default_vat,
        price: 0.0,
        cost: 0.0,
        quarter: 1,
        year: moment().year()
      };

      this.quoteItems.push(item);
      this.detailCost = this.calculateDetailCost();
      this.scrollToBottom();
    },
    addTitle() {
      const item: QuoteItem = {
        uuid: uuidv4(),
        type: "title",
        description: "",
        cost: 0.0
      };

      this.quoteItems.push(item);
      this.scrollToBottom();
    },
    addTextfield() {
      const item: QuoteItem = {
        uuid: uuidv4(),
        type: "textfield",
        description: ""
      };

      this.quoteItems.push(item);
      this.scrollToBottom();
    },
    addAdditional() {
      this.additionalTotal = (this.detailCost.total_net * this.additionalCost.percent) / 100;
      const nkValue = Math.round(this.additionalTotal / 0.05) * 0.05;
      const item: QuoteItem = {
        uuid: uuidv4(),
        type: "individual",
        name: "Nebenkosten " + this.additionalCost.percent + "%",
        description:
          "der Total Honorarsumme von " + this.currency + " " + this.formatMoney(this.detailCost.total_net, 0.05),
        optional: false,
        unit: "unit.flatRate",
        amount: 1,
        vat_rate: this.default_vat,
        price: nkValue,
        cost: nkValue,
        apply_discount: false,
        is_nk: true
      };

      this.quoteItems.push(item);
      this.additional_display = true;
      this.allow_add_additional = false;
      this.$set(this.additionalCost, "push_nk", false);
      this.detailCost = this.calculateDetailCost();
      this.scrollToBottom();
    },
    calculateDetailCost(): DetailCost {
      let total_net = 0.0,
        total_net_nk = 0.0,
        total_gross_nk = 0.0,
        total_gross = 0.0,
        total_discount = 0.0,
        total_discount_nk = 0.0,
        vat_value = 0.0,
        total_vat_list: { [key: string]: number } = {},
        total_init_net_by_vat: { [key: string]: number } = {},
        total_init_net_nk_by_vat: { [key: string]: number } = {};
      //init array
      this.quoteItems.forEach(it => {
        if (it.type !== "individual" || it.optional !== false) return;
        const vatRate = parseFloat(it.vat_rate?.toString() ?? "0.0");
        total_vat_list[vatRate] = 0.0;
        total_init_net_by_vat[vatRate] = 0.0;
        total_init_net_nk_by_vat[vatRate] = 0.0;
      });

      //process
      this.quoteItems.forEach(it => {
        if (it.type !== "individual" || it.optional !== false) return;
        const vatRate = parseFloat(it.vat_rate?.toString() ?? "0.0");
        let is_apply_discount_to_nk = it.apply_discount ?? true;
        if (this.isInvoice) {
          is_apply_discount_to_nk = it.apply_discount ?? false;
        }
        const is_nk = it.is_nk ?? false;
        let cost = it.cost ?? 0.0;
        const discounted_value = cost * (this.discountPercent / 100);

        //flow for nk
        if (is_nk) {
          cost = it.price ?? 0.0;
          //if apply_discount is set
          if (is_apply_discount_to_nk) {
            cost -= discounted_value;
            total_discount_nk += discounted_value;

            if (this.isInvoice) {
              total_init_net_nk_by_vat[vatRate] += discounted_value;
              let vat_value_discount = discounted_value * (vatRate / 100);
              total_vat_list[vatRate] += vat_value_discount;
              total_gross_nk += discounted_value + vat_value_discount;
            }
          }

          vat_value = cost * (vatRate / 100);
          total_net_nk += cost;
          total_init_net_nk_by_vat[vatRate] += cost;
          total_vat_list[vatRate] += vat_value;
          total_gross_nk += cost + vat_value;
          return;
        }

        //flow for normal item
        cost -= discounted_value;
        total_discount += discounted_value;

        vat_value = cost * (vatRate / 100);
        total_vat_list[vatRate] += vat_value;
        total_init_net_by_vat[vatRate] += cost;
        total_net += cost;
        total_gross += cost + vat_value;
      });

      return {
        total_net,
        total_net_nk,
        total_gross,
        total_gross_nk,
        total_discount,
        total_discount_nk,
        total_vat_list,
        total_init_net_by_vat,
        total_init_net_nk_by_vat
      };
    },
    persistAdditionalCost() {
      this.additionalTotal = (this.detailCost.total_net * this.additionalCost.percent) / 100;
      const nkTotal =
        ((this.isInvoice ? this.detailCost.total_net + this.detailCost.total_discount : this.detailCost.total_net) *
          this.additionalCost.percent) /
        100;
      for (let index = 0; index < this.quoteItems.length; index++) {
        const element = this.quoteItems[index];
        if (element.is_nk) {
          this.quoteItems[index].name = "Nebenkosten " + this.additionalCost.percent + "%";
          this.quoteItems[index].description =
            "der Total Honorarsumme von " +
            this.currency +
            " " +
            this.formatMoney(
              this.isInvoice
                ? element.apply_discount
                  ? this.detailCost.total_net
                  : this.detailCost.total_net + this.detailCost.total_discount
                : this.detailCost.total_net,
              0.05
            );

          if (this.isInvoice) {
            const nkTotalApplyDiscount = (this.detailCost.total_net * this.additionalCost.percent) / 100;
            this.quoteItems[index].price = this.quoteItems[index].cost =
              Math.round((element.apply_discount ? nkTotalApplyDiscount : nkTotal) / 0.05) * 0.05;
          } else {
            this.quoteItems[index].price = this.quoteItems[index].cost = Math.round(nkTotal / 0.05) * 0.05;
          }

          break;
        }
      }
    },
    setInvoiceType(type: string, is_final: boolean) {
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
    formatMoney(val: number, increment = 0) {
      return currency(val, {
        separator: "'",
        pattern: `#`,
        negativePattern: `-#`,
        increment: increment
      }).format();
    },
    updateQuoteItems() {
      this.$emit("update:quoteItems", this.quoteItems);
    },
    scrollToBottom() {
      requestAnimationFrame(() => {
        const tableBody = document.querySelector(".table-body") as HTMLElement;
        if (tableBody) {
          tableBody.scrollTo({ top: tableBody.scrollHeight, behavior: "smooth" });
        }
      });
    },
    adjustTableHeader() {
      const tableBody = document.querySelector(".quote-table .table-body") as HTMLElement;
      const tableHeader = document.querySelector(".quote-table .table-header .table-row") as HTMLElement;

      // Only proceed if both elements exist
      if (!tableBody || !tableHeader) return;

      if (tableBody && tableBody.offsetHeight < 711) {
        tableHeader.style.paddingRight = "0px";
      } else {
        tableHeader.style.paddingRight = "6.5px";
      }
    },
    async fetchUnits() {
      try {
        const response = await ApiService.get<Response<Unit[]>>("units"); // FIXME: Move to a service
        this.currentUnits = response.data.payload || [];
      } catch (e) {
        console.error(e);
      }
    },
    async fetchVatRates() {
      try {
        const response = await ApiService.get<Response<Vat[]>>("vatrates"); // FIXME: Move to a service
        this.currentVatRates = response.data.payload || [];
      } catch (e) {
        console.error(e);
      }
    }
  }
});
