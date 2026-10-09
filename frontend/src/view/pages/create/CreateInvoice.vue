<template>
  <div>
    <div class="card card-custom bg-white card-stretch gutter-b">
      <div class="card-header p-6">
        <div class="col-md-6 p-0" style="display: flex; align-items: center">
          <i class="flaticon2-left-arrow-1 mr-4 action-icon" @click="back"></i>
          <h3 class="m-0">{{ $t("title.createInvoice") }}</h3>
        </div>
      </div>
      <div class="card-body p-6 position-relative rounded-xl">
        <div v-if="loading" class="text-center text-danger my-2">
          <b-spinner class="align-middle"></b-spinner>
        </div>
        <b-form v-else @submit.stop.prevent="onSubmit">
          <div class="subtitle-1 font-weight-bolder mb-2">
            {{ $t("invoice.customer") }}
          </div>
          <CustomerSelect />

          <div class="row mt-4">
            <div class="col-md-3">
              <div class="subtitle-1 font-weight-bolder mb-2">
                {{ $t("project.project") }}
              </div>
              <b-form-select
                v-model="form.project"
                :options="currentProjects"
                value-field="id"
                text-field="project_nbr_and_name"
              ></b-form-select>
            </div>
          </div>

          <div class="row mt-4">
            <div class="col-md-3">
              <div class="subtitle-1 font-weight-bolder mb-2">
                {{ $t("invoice.invoice") }}
              </div>
              <b-form-group label-for="invoice-input">
                <b-form-input
                  id="invoice-input"
                  name="invoice-input"
                  v-model="form.name"
                  :state="validateState('name')"
                  aria-describedby="invoice-feedback"
                ></b-form-input>

                <b-form-invalid-feedback id="invoice-feedback">
                  {{ $t("msg.required") }}
                </b-form-invalid-feedback>
              </b-form-group>
            </div>
          </div>

          <div class="row">
            <div class="col-md-3">
              <div class="subtitle-1 font-weight-bolder mb-2">
                {{ $t("invoice.location") }}
              </div>
              <b-form-input v-model="form.location"></b-form-input>
            </div>
            <!-- <div class="col-md-3">
              <div class="subtitle-1 font-weight-bolder mb-2">
                {{ $t("invoice.date") }}
              </div>
              <b-input-group>
                <b-form-input
                  v-model="form.date_formatted"
                  type="text"
                  autocomplete="off"
                  placeholder="dd.mm.yyyy"
                  @blur="formatDateInvert"
                ></b-form-input>
                <b-input-group-append>
                  <b-form-datepicker
                    v-model="form.date"
                    :locale="locale"
                    :start-weekday="1"
                    button-only
                    right
                    @context="formatDate"
                  ></b-form-datepicker>
                </b-input-group-append>
              </b-input-group>
            </div> -->
          </div>

          <!-- Temporary for migrate -->
          <div class="row mt-4">
            <div class="col-md-3">
              <div class="subtitle-1 font-weight-bolder mb-2">
                {{ $t("invoice.charged") }}
              </div>
              <b-input-group>
                <b-form-input
                  v-model="form.charge_date_formatted"
                  type="text"
                  autocomplete="off"
                  placeholder="dd.mm.yyyy"
                  @blur="formatChargeDateInvert"
                ></b-form-input>
                <b-input-group-append>
                  <b-form-datepicker
                    v-model="form.charge_date"
                    :locale="locale"
                    :start-weekday="1"
                    button-only
                    right
                    @context="formatChargeDate"
                  ></b-form-datepicker>
                </b-input-group-append>
              </b-input-group>
            </div>
            <div class="col-md-3">
              <div class="subtitle-1 font-weight-bolder mb-2">
                {{ $t("invoice.due") }}
              </div>
              <b-input-group>
                <b-form-input
                  v-model="form.due_date_formatted"
                  type="text"
                  autocomplete="off"
                  placeholder="dd.mm.yyyy"
                  @blur="formatDueDateInvert"
                ></b-form-input>
                <b-input-group-append>
                  <b-form-datepicker
                    v-model="form.due_date"
                    :locale="locale"
                    :start-weekday="1"
                    button-only
                    right
                    @context="formatDueDate"
                  ></b-form-datepicker>
                </b-input-group-append>
              </b-input-group>
            </div>
          </div>

          <div v-if="currentSettings.master_data.allow_to_use_other_currencies" class="row mt-4">
            <div class="col-md-3">
              <div class="subtitle-1 font-weight-bolder mb-2">{{ $t("settings.form.master.currency") }}:</div>
              <b-form-select
                v-model="form.currency_val"
                :options="currentSettings.master_data.currencies"
              ></b-form-select>
            </div>
          </div>

          <div class="row mt-4">
            <div class="col-md-12">
              <div class="subtitle-1 font-weight-bolder mb-2">Anschrift</div>
            </div>
            <div class="col-md-12 mt-2 editor">
              <TextEditor v-model="form.address" />
            </div>
          </div>

          <div class="row mt-n4">
            <div class="col-md-3">
              <b-form-checkbox size="md" :checked="form.is_final" @change="form.is_final = !form.is_final">
                {{ $t("invoice.finalInvoice") }}
              </b-form-checkbox>
            </div>
          </div>

          <div class="row mt-6">
            <div class="col-md-12">
              <div class="subtitle-1 font-weight-bolder mb-2">
                1. Rahmenbedingungen
              </div>
            </div>
            <div class="col-md-12 mt-2 editor">
              <TextEditor v-model="form.begin_desc" />
            </div>
            <div class="col-md-12 mt-n4">
              <b-form-checkbox
                class="break-box"
                :checked="form.inv_begin_break"
                @change="form.inv_begin_break = !form.inv_begin_break"
                >{{ $t("button.breakPage") }}</b-form-checkbox
              >
            </div>
            <div class="col-md-12 mt-2">
              <QuoteItems
                @persistAdditionalCost="percent => persistAdditionalCost(percent)"
                :currency="form.currency_val"
                :isInvoice="true"
              />
            </div>
            <div class="col-md-12 mt-4">
              <b-form-checkbox
                class="break-box"
                :checked="form.inv_quote_break"
                @change="form.inv_quote_break = !form.inv_quote_break"
                >{{ $t("button.breakPage") }}</b-form-checkbox
              >
            </div>
          </div>

          <div class="row mt-4">
            <div class="col-md-12">
              <AdditionalCosts
                :currency="form.currency_val"
                :generate="
                  () => {
                    return false;
                  }
                "
                @persistAdditionalCost="percent => persistAdditionalCost(percent)"
              />
            </div>
          </div>

          <div class="row mt-4">
            <div class="col-md-12" style="display: inline-flex; align-items: center">
              <span class="mr-2">{{ $t("invoice.payable") }}</span>
              <b-form-input
                v-model="form.payment_deadline"
                size="sm"
                style="width: 50px; font-weight: bold"
                @blur="generateDueDate"
              ></b-form-input>
              <span class="ml-2">{{ $t("invoice.days") }}</span>
            </div>
            <div class="col-md-12 mt-2" style="display: inline-flex; align-items: center">
              <span class="mr-2">{{ $t("invoice.slipNumber") }}</span>
              <b-form-input v-model="form.slip_number" size="sm" style="width: 200px"></b-form-input>
            </div>
            <div class="col-md-12">
              <PaidHistory :currency="form.currency_val" />
            </div>
          </div>

          <div class="row mt-4">
            <div class="col-md-12">
              <div class="subtitle-1 font-weight-bolder mb-2">
                2. Ende des Textes
              </div>
            </div>
            <div class="col-md-12 mt-2 editor">
              <TextEditor v-model="form.end_desc" />
            </div>
          </div>

          <div class="row mt-n2">
            <div class="col-md-12">
              <div class="subtitle-1 font-weight-bolder mb-2">{{ $t("invoice.internalDesc") }}:</div>
              <InternalDesc />
              <b-form-textarea v-model="form.internal_desc_custom" rows="3"></b-form-textarea>
            </div>
          </div>

          <!-- Actions -->
          <div class="mt-6 action">
            <b-button variant="primary" class="save-btn" type="submit" :disabled="loading">
              <i class="flaticon2-check-mark p-0 mr-2"></i>
              <span>{{ $t("button.save") }}</span>
            </b-button>
          </div>
        </b-form>
      </div>
    </div>
  </div>
</template>

<script>
import { validationMixin } from "vuelidate";
import currency from "currency.js";
import { required } from "vuelidate/lib/validators";
import moment from "moment";
import i18nService from "@/core/services/i18n.service.js";
import TextEditor from "@/view/content/TextEditor.vue";
import CustomerSelect from "@/view/content/selector/CustomerDialog.vue";
import QuoteItems from "@/view/content/selector/QuoteItems.vue";
import InternalDesc from "@/view/content/selector/InternalDesc.vue";
import PaidHistory from "@/view/content/selector/PaidHistory.vue";
import AdditionalCosts from "@/view/content/selector/AdditionalCosts.vue";
import { mapGetters, mapState } from "vuex";
import { RESET_ITEM } from "@/core/services/store/product";
import { RESET_CUSTOMER } from "@/core/services/store/customer";
import { GET_SETTINGS, GET_COMPANY } from "@/core/services/store/settings";
import { ADD_INVOICE, SET_INVOICE_TOAST, SET_INVOICE_ERROR } from "@/core/services/store/invoice";
import { SET_ADDITIONAL_TOTAL, SET_KMOPTIONS, SET_KM, SET_ADDCOSTS } from "@/core/services/store/offer";
import { GET_PROJECTS } from "@/core/services/store/project";
import { formatDate } from "@/common";

export default {
  name: "createInvoice",
  mixins: [validationMixin],
  components: {
    TextEditor,
    CustomerSelect,
    QuoteItems,
    InternalDesc,
    PaidHistory,
    AdditionalCosts
  },
  metaInfo: {
    title: "Create Invoice",
    meta: [
      {
        hid: "description",
        name: "description",
        content: "Create Invoice Page"
      },
      {
        hid: "og:site_name",
        property: "og:site_name",
        content: "Archapp"
      },
      {
        hid: "og:title",
        property: "og:title",
        content: "Create Invoice | Archapp"
      },
      {
        hid: "og:description",
        property: "og:description",
        content: "Create Invoice | Archapp"
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
      form: {
        project: "",
        currency_val: "",
        name: "",
        location: "",
        date: "",
        date_formatted: "",
        charge_date: "",
        charge_date_formatted: "",
        due_date: "",
        due_date_formatted: "",
        address: "",
        begin_desc: "",
        end_desc: "",
        payment_deadline: 0.0,
        slip_number: "",
        internal_desc_custom: "",
        inv_begin_break: false,
        inv_quote_break: false,
        is_final: false
      },
      locale: "de",
      loading: true
    };
  },
  validations: {
    form: {
      name: {
        required
      }
    }
  },
  computed: {
    ...mapGetters([
      "currentSettings",
      "currentCompany",
      "selectedCustomer",
      "quoteItems",
      "discountPercent",
      "currentInternalChoices",
      "currentPaidHistory",
      "detailCost",
      "additionalPercent",
      "selectedKm",
      "selectedAddCost",
      "currentProjects"
    ]),
    ...mapState({
      error: state => state.invoice.error
    }),
    currentLanguage() {
      return i18nService.getActiveLanguage();
    }
  },
  async mounted() {
    await this.$store.dispatch(GET_COMPANY);
    await this.$store.dispatch(GET_SETTINGS);
    await this.$store.dispatch(GET_PROJECTS, { for_selector: true });
    this.$store.commit(RESET_ITEM);
    this.$store.commit(RESET_CUSTOMER);
    this.form.date = moment().format("YYYY-MM-DD");
    this.form.date_formatted = moment().format("DD.MM.YYYY");

    this.$store.commit(SET_KMOPTIONS, this.currentSettings.offer.km_dropdown_setting);
    this.$store.commit(SET_KM, this.currentSettings.offer.km_dropdown_setting[0]);
    const add_cost = [];
    for (const record of this.currentSettings.offer.add_cost_setting) {
      const item = {
        label: record.label,
        value: record.value,
        is_active: false
      };
      add_cost.push(item);
    }
    this.$store.commit(SET_ADDCOSTS, add_cost);

    this.initData();
    if (this.currentLanguage === "de") {
      this.locale = "de";
    } else {
      this.locale = "en-US";
    }
    this.loading = !this.loading;
  },
  methods: {
    initData() {
      if (this.currentProjects) {
        this.form.project = this.currentProjects[0].id;
      }
      this.form.begin_desc = this.currentSettings.invoice.begin_desc;
      this.form.end_desc = this.currentSettings.invoice.end_desc;
      this.form.payment_deadline = this.currentSettings.invoice.payment_deadline;
      if (!this.currentSettings.master_data.allow_to_use_other_currencies) {
        this.form.currency_val = this.currentCompany.currency;
      } else {
        this.form.currency_val = this.currentSettings.master_data.currencies[0];
      }
    },
    validateState(name) {
      const { $dirty, $error } = this.$v.form[name];
      return $dirty ? !$error : null;
    },
    async onSubmit() {
      this.$v.form.$touch();
      if (this.$v.form.$anyError) {
        this.scrollToError();
        return;
      }

      if (this.loading) {
        return;
      }

      this.loading = true;

      if (this.selectedCustomer.first_name || this.selectedCustomer.company) {
        await this.$store.dispatch(ADD_INVOICE, {
          name: this.form.name,
          location: this.form.location,
          date: this.form.date,
          address: this.form.address,
          begin_desc: this.form.begin_desc,
          end_desc: this.form.end_desc,
          internal_desc: this.currentInternalChoices,
          internal_desc_custom: this.form.internal_desc_custom,
          payment_deadline: this.form.payment_deadline || this.currentSettings.invoice.payment_deadline,
          slip_number: this.form.slip_number,
          customer: this.selectedCustomer,
          quote_items: this.quoteItems,
          discount_percent: this.discountPercent,
          inv_begin_break: this.form.inv_begin_break,
          inv_quote_break: this.form.inv_quote_break,
          currency: this.form.currency_val,
          is_final: this.form.is_final,
          paid_history: this.currentPaidHistory,
          charged_on: this.form.charge_date,
          due_on: this.form.due_date,
          km_dropdown: this.selectedKm,
          additional_cost: this.selectedAddCost,
          project_id: this.form.project
        });
        if (this.error) {
          this.toastMsg("error", this.error);
        } else {
          this.$store.commit(SET_INVOICE_TOAST, {
            type: "success",
            msg: this.$t("msg.addSuccess")
          });
          this.$router.push("/invoice");
        }
      } else {
        this.toastMsg("error", this.$t("msg.noCustomer"));
      }
      this.loading = false;
    },
    resetForm() {
      this.$nextTick(() => {
        this.$v.$reset();
      });
    },
    back() {
      window.history.back();
    },
    generateDueDate() {
      if (this.form.charge_date) {
        const result = moment(this.form.charge_date).add(this.form.payment_deadline, "d");
        this.form.due_date = moment(result).format("YYYY-MM-DD");
        this.form.due_date_formatted = formatDate(result);
      }
    },
    formatMoney(val, increment = 0) {
      return currency(val, {
        separator: "'",
        pattern: `#`,
        negativePattern: `-#`,
        increment: increment
      }).format();
    },
    formatDate() {
      if (this.form.date) {
        this.form.date_formatted = formatDate(this.form.date);
      }
    },
    formatDateInvert() {
      if (this.form.date_formatted) {
        const split = this.form.date_formatted.split(".");
        const join = split[2] + "-" + split[1] + "-" + split[0];
        this.form.date = join;
      }
    },
    formatChargeDate() {
      if (this.form.charge_date) {
        this.form.charge_date_formatted = formatDate(this.form.charge_date);
      }
    },
    formatChargeDateInvert() {
      if (this.form.charge_date_formatted) {
        const split = this.form.charge_date_formatted.split(".");
        const join = split[2] + "-" + split[1] + "-" + split[0];
        this.form.charge_date = join;
      }
    },
    formatDueDate() {
      if (this.form.due_date) {
        this.form.due_date_formatted = this.form.due_date ? formatDate(this.form.due_date) : "";
      }
    },
    formatDueDateInvert() {
      if (this.form.due_date_formatted) {
        const split = this.form.due_date_formatted.split(".");
        const join = split[2] + "-" + split[1] + "-" + split[0];
        this.form.due_date = join;
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
      this.$store.commit(SET_INVOICE_ERROR, null);
    },
    scrollToError() {
      var checkExist = setInterval(function() {
        const el = document.getElementsByClassName("is-invalid").item(0);
        if (el) {
          const headerOffset = 65;
          const elementPosition = el.getBoundingClientRect().top;
          const offsetPosition = elementPosition - headerOffset;
          window.scrollTo({
            top: offsetPosition,
            behavior: "smooth"
          });
          clearInterval(checkExist);
        }
      }, 100);
    },
    persistAdditionalCost() {
      this.$store.commit(SET_ADDITIONAL_TOTAL, parseFloat((this.detailCost.total_net * this.additionalPercent) / 100));
      const nkTotal = (this.detailCost.total_net * this.additionalPercent) / 100;
      for (let index = 0; index < this.quoteItems.length; index++) {
        const element = this.quoteItems[index];
        if (element.is_nk) {
          this.quoteItems[index].name = "Nebenkosten " + this.additionalPercent + "%";
          this.quoteItems[index].description =
            "der Total Honorarsumme von " +
            this.currentCompany.currency +
            " " +
            this.formatMoney(this.detailCost.total_net, 0.05);
          this.quoteItems[index].price = this.quoteItems[index].cost = Math.round(nkTotal / 0.05, 0) * 0.05;
          break;
        }
      }
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
  align-items: center;
}

.spacer {
  height: 1px;
  background-color: #999999;
  opacity: 30%;
  margin-top: 1rem;
  margin-bottom: 1rem;
}

.editor {
  height: 25rem;
}

.editor > div {
  height: 20rem;
}
</style>
