<template>
  <div>
    <div class="card card-custom bg-white card-stretch gutter-b">
      <div class="card-header p-6">
        <div class="col-md-6 p-0" style="display: flex; align-items: center">
          <i class="flaticon2-left-arrow-1 mr-4 action-icon" @click="back"></i>
          <h3 class="m-0">{{ $t("title.createOffer") }}</h3>
        </div>
      </div>
      <div class="card-body p-6 position-relative overflow-hidden rounded-xl">
        <div v-if="loading" class="text-center text-danger my-2">
          <b-spinner class="align-middle"></b-spinner>
        </div>
        <b-form v-else @submit.stop.prevent="onSubmit">
          <div class="subtitle-1 font-weight-bolder mb-2">
            {{ $t("offer.name") }}
          </div>
          <CustomerSelect />

          <div class="row mt-4">
            <div class="col-md-3">
              <div class="subtitle-1 font-weight-bolder mb-2">
                {{ $t("offer.offer") }}
              </div>
              <b-form-group label-for="offer-input">
                <b-form-input
                  id="offer-input"
                  name="offer-input"
                  v-model="form.name"
                  :state="validateState('name')"
                  aria-describedby="offer-feedback"
                ></b-form-input>

                <b-form-invalid-feedback id="offer-feedback">
                  {{ $t("msg.required") }}
                </b-form-invalid-feedback>
              </b-form-group>
            </div>
          </div>

          <div class="row mt-n2">
            <div class="col-md-3">
              <div class="subtitle-1 font-weight-bolder mb-2">
                {{ $t("offer.location") }}
              </div>
              <b-form-group label-for="location-input">
                <b-form-input
                  id="location-input"
                  name="location-input"
                  v-model="form.location"
                  :state="validateState('location')"
                  aria-describedby="location-feedback"
                ></b-form-input>

                <b-form-invalid-feedback id="location-feedback">
                  {{ $t("msg.required") }}
                </b-form-invalid-feedback>
              </b-form-group>
            </div>
            <div class="col-md-3">
              <div class="subtitle-1 font-weight-bolder mb-2">
                {{ $t("offer.date") }}
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
            </div>
          </div>

          <div class="row mt-n2">
            <div class="col-md-3">
              <div class="subtitle-1 font-weight-bolder mb-2">
                {{ $t("offer.title") }}
              </div>
              <b-form-input v-model="form.title"></b-form-input>
            </div>
            <div class="col-md-3">
              <div class="subtitle-1 font-weight-bolder mb-2">Untertitel</div>
              <b-form-select
                v-model="form.category"
                :options="subtitles"
                value-field="label"
                text-field="label"
              ></b-form-select>
            </div>
          </div>

          <div class="row mt-4">
            <div v-if="currentSettings.master_data.allow_to_use_other_currencies" class="col-md-3 mt-2">
              <div class="subtitle-1 font-weight-bolder mb-2">{{ $t("settings.form.master.currency") }}:</div>
              <b-form-select
                v-model="form.currency_val"
                :options="currentSettings.master_data.currencies"
              ></b-form-select>
            </div>
          </div>

          <div class="row mt-6">
            <div class="col-md-12">
              <b-form-input v-model="form.begin" class="form-control-solid font-weight-bolder"></b-form-input>
            </div>
            <div class="col-md-12 mt-2 editor">
              <TextEditor v-model="form.begin_desc" />
            </div>
            <div class="col-md-12 mt-n4">
              <b-form-checkbox
                class="break-box"
                :checked="form.begin_break"
                @change="form.begin_break = !form.begin_break"
                >{{ $t("button.breakPage") }}</b-form-checkbox
              >
            </div>
          </div>

          <div class="row mt-4">
            <div class="col-md-12">
              <b-form-input v-model="form.performance" class="form-control-solid font-weight-bolder"></b-form-input>
            </div>
            <div class="col-md-12 mt-2 editor">
              <TextEditor v-model="form.performance_desc" />
            </div>
            <div class="col-md-12 mt-n4">
              <b-form-checkbox
                class="break-box"
                :checked="form.performance_break"
                @change="form.performance_break = !form.performance_break"
                >{{ $t("button.breakPage") }}</b-form-checkbox
              >
            </div>
          </div>

          <div class="row mt-4">
            <div class="col-md-12">
              <b-form-input v-model="form.estimate_cost" class="form-control-solid font-weight-bolder"></b-form-input>
            </div>
            <div class="col-md-12 mt-2">
              <CostEstimate :currency="form.currency_val" />
            </div>
          </div>

          <div class="row mt-4">
            <div class="col-md-12">
              <b-form-input v-model="form.parameter" class="form-control-solid font-weight-bolder"></b-form-input>
            </div>
            <div class="col-md-12 mt-2 editor">
              <TextEditor v-model="form.parameter_desc" />
            </div>
            <div class="col-md-12 mt-n6">
              <div class="text-muted">{{ $t("offer.additional") }} {{ form.estimate_cost }}</div>
            </div>
            <div class="col-md-12 mt-1">
              <b-form-checkbox
                class="break-box"
                :checked="form.parameter_break"
                @change="form.parameter_break = !form.parameter_break"
                >{{ $t("button.breakPage") }}</b-form-checkbox
              >
            </div>
          </div>

          <div class="row mt-4">
            <div class="col-md-12">
              <b-form-input v-model="form.offer" class="form-control-solid font-weight-bolder"></b-form-input>
            </div>
            <div class="col-md-6 mt-2">
              <Generator :generate="generateProduct" />
            </div>
            <div class="col-md-12 mt-4 editor">
              <TextEditor v-model="form.offer_desc" />
            </div>
            <div class="col-md-12 mt-n4">
              <b-form-checkbox
                class="break-box"
                :checked="form.offer_break"
                @change="form.offer_break = !form.offer_break"
                >{{ $t("button.breakPage") }}</b-form-checkbox
              >
            </div>
            <div class="col-md-12 mt-2">
              <QuoteItems
                @persistAdditionalCost="percent => persistAdditionalCost(percent)"
                :currency="form.currency_val"
              />
            </div>
            <div class="col-md-12 mt-4">
              <b-form-checkbox
                class="break-box"
                :checked="form.offer_quote_break"
                @change="form.offer_quote_break = !form.offer_quote_break"
                >{{ $t("button.breakPage") }}</b-form-checkbox
              >
            </div>
          </div>

          <div class="row mt-4">
            <div class="col-md-12">
              <b-form-input v-model="form.additional" class="form-control-solid font-weight-bolder"></b-form-input>
            </div>
            <div class="col-md-12 mt-2 editor">
              <TextEditor v-model="form.additional_desc" />
            </div>
            <div class="col-md-12">
              <AdditionalCosts
                :currency="form.currency_val"
                :generate="generateAddCostDesc"
                @persistAdditionalCost="percent => persistAdditionalCost(percent)"
              />
            </div>
            <div class="col-md-12 mt-4">
              <b-form-checkbox
                class="break-box"
                :checked="form.additional_break"
                @change="form.additional_break = !form.additional_break"
                >{{ $t("button.breakPage") }}</b-form-checkbox
              >
            </div>
          </div>

          <div class="row mt-4">
            <div class="col-md-12">
              <b-form-input v-model="form.event" class="form-control-solid font-weight-bolder"></b-form-input>
            </div>
            <div class="col-md-6 mt-2">
              <Events />
            </div>
            <div class="col-md-12 mt-4">
              <b-form-checkbox
                class="break-box"
                :checked="form.event_break"
                @change="form.event_break = !form.event_break"
                >{{ $t("button.breakPage") }}</b-form-checkbox
              >
            </div>
          </div>

          <div class="row mt-4">
            <div class="col-md-12">
              <b-form-input v-model="form.end" class="form-control-solid font-weight-bolder"></b-form-input>
            </div>
            <div class="col-md-12 mt-2 editor">
              <TextEditor v-model="form.end_desc" />
            </div>
          </div>

          <div class="row mt-n2">
            <div class="col-md-12">
              <div class="subtitle-1 font-weight-bolder mb-2">{{ $t("offer.internalDesc") }}:</div>
              <InternalDesc />
              <b-form-textarea v-model="form.internal_desc_custom" rows="3"></b-form-textarea>
            </div>
          </div>

          <!-- Actions -->
          <div class="mt-6 action">
            <b-button variant="primary" class="save-btn" type="submit">
              <i class="flaticon2-check-mark p-0 mr-2"></i>
              <span> {{ $t("button.save") }}</span>
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
import CostEstimate from "@/view/content/selector/CostEstimate.vue";
import Events from "@/view/content/selector/Events.vue";
import AdditionalCosts from "@/view/content/selector/AdditionalCosts.vue";
import InternalDesc from "@/view/content/selector/InternalDesc.vue";
import Generator from "@/view/content/selector/Generator.vue";
import { mapGetters, mapState } from "vuex";
import { RESET_ITEM } from "@/core/services/store/product";
import { RESET_CUSTOMER } from "@/core/services/store/customer";
import { GET_SETTINGS, GET_COMPANY } from "@/core/services/store/settings";
import { SET_ADDITIONAL_TOTAL } from "@/core/services/store/offer";
import {
  ADD_OFFER,
  SET_KMOPTIONS,
  SET_KM,
  SET_ADDCOSTS,
  SET_OFFER_TOAST,
  SET_EVENTS,
  GENERATE_PRODUCT,
  SET_ESTIMATES,
  SET_GENERATOR,
  SET_OFFER_ERROR
} from "@/core/services/store/offer";

export default {
  name: "createOffer",
  mixins: [validationMixin],
  components: {
    TextEditor,
    CustomerSelect,
    QuoteItems,
    CostEstimate,
    Events,
    AdditionalCosts,
    InternalDesc,
    Generator
  },
  metaInfo: {
    title: "Create Offer",
    meta: [
      {
        hid: "description",
        name: "description",
        content: "Create Offer Page"
      },
      {
        hid: "og:site_name",
        property: "og:site_name",
        content: "Archapp"
      },
      {
        hid: "og:title",
        property: "og:title",
        content: "Create Offer | Archapp"
      },
      {
        hid: "og:description",
        property: "og:description",
        content: "Create Offer | Archapp"
      },
      {
        hid: "og:image",
        property: "og:image",
        content: ""
      }
    ]
  },
  computed: {
    ...mapGetters([
      "currentSettings",
      "currentCompany",
      "selectedCustomer",
      "quoteItems",
      "selectedKm",
      "selectedAddCost",
      "currentEstimateCost",
      "currentGenerator",
      "currentEvents",
      "discountPercent",
      "currentEstimateDesc",
      "currentInternalChoices",
      "detailCost",
      "additionalPercent"
    ]),
    ...mapState({
      error: state => state.offer.error
    }),
    currentLanguage() {
      return i18nService.getActiveLanguage();
    }
  },
  data() {
    return {
      form: {
        currency_val: "",
        name: "",
        location: "",
        date: "",
        date_formatted: "",
        title: "Honorarofferte",
        category: "",
        begin: "",
        performance: "",
        estimate_cost: "",
        parameter: "",
        offer: "",
        additional: "",
        event: "",
        end: "",
        begin_desc: "",
        performance_desc: "",
        parameter_desc: "",
        offer_desc: "",
        additional_desc: "",
        end_desc: "",
        internal_desc_custom: "",
        begin_break: false,
        performance_break: false,
        parameter_break: false,
        offer_break: false,
        offer_quote_break: false,
        additional_break: false,
        event_break: false
      },
      subtitles: [],
      locale: "de",
      loading: true
    };
  },
  validations: {
    form: {
      name: {
        required
      },
      location: {
        required
      }
    }
  },
  async mounted() {
    await this.$store.dispatch(GET_COMPANY);
    await this.$store.dispatch(GET_SETTINGS);
    this.$store.commit(RESET_ITEM);
    this.$store.commit(RESET_CUSTOMER);
    this.form.date = moment().format("YYYY-MM-DD");
    this.form.date_formatted = moment().format("DD.MM.YYYY");
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
      this.subtitles = this.currentSettings.offer.subtitle_setting;
      this.form.category = this.currentSettings.offer.subtitle_setting[0].label;
      this.form.begin = this.currentSettings.offer.begin;
      this.form.performance = this.currentSettings.offer.performance;
      this.form.estimate_cost = this.currentSettings.offer.estimate_cost;
      this.form.parameter = this.currentSettings.offer.parameter;
      this.form.offer = this.currentSettings.offer.offer;
      this.form.additional = this.currentSettings.offer.additional;
      this.form.event = this.currentSettings.offer.event;
      this.form.end = this.currentSettings.offer.end;
      this.form.begin_desc = this.currentSettings.offer.begin_desc;
      this.form.performance_desc = this.currentSettings.offer.performance_desc;
      this.form.parameter_desc = this.currentSettings.offer.parameter_desc;
      this.form.offer_desc = this.currentSettings.offer.offer_desc;
      this.form.additional_desc = this.currentSettings.offer.additional_desc;
      this.form.end_desc = this.currentSettings.offer.end_desc;
      this.$store.commit(SET_ESTIMATES, this.currentSettings.offer.estimate_setting);
      this.$store.commit(SET_GENERATOR, this.currentSettings.offer.generate_setting);
      this.$store.commit(SET_KMOPTIONS, this.currentSettings.offer.km_dropdown_setting);
      this.$store.commit(SET_KM, this.currentSettings.offer.km_dropdown_setting[0]);
      this.$store.commit(SET_EVENTS, this.currentSettings.offer.event_setting);
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

      if (this.selectedCustomer.first_name || this.selectedCustomer.company) {
        await this.$store.dispatch(ADD_OFFER, {
          name: this.form.name,
          location: this.form.location,
          date: this.form.date,
          title: this.form.title,
          category: this.form.category,
          begin: this.form.begin,
          performance: this.form.performance,
          estimate_cost: this.form.estimate_cost,
          parameter: this.form.parameter,
          offer: this.form.offer,
          additional: this.form.additional,
          event: this.form.event,
          end: this.form.end,
          begin_desc: this.form.begin_desc,
          performance_desc: this.form.performance_desc,
          parameter_desc: this.form.parameter_desc,
          offer_desc: this.form.offer_desc,
          additional_desc: this.form.additional_desc,
          end_desc: this.form.end_desc,
          internal_desc: this.currentInternalChoices,
          internal_desc_custom: this.form.internal_desc_custom,
          customer: this.selectedCustomer,
          cost_estimate: this.currentEstimateCost.map(({ id, ...others }) => ({
            ...others,
            order: id
          })),
          cost_generate: this.currentGenerator,
          quote_items: this.quoteItems,
          km_dropdown: this.selectedKm,
          additional_cost: this.selectedAddCost,
          events: this.currentEvents,
          discount_percent: this.discountPercent,
          begin_break: this.form.begin_break,
          performance_break: this.form.performance_break,
          parameter_break: this.form.parameter_break,
          offer_break: this.form.offer_break,
          offer_quote_break: this.form.offer_quote_break,
          additional_break: this.form.additional_break,
          event_break: this.form.event_break,
          currency: this.form.currency_val
        });
        if (this.error) {
          this.toastMsg("error", this.error);
        } else {
          this.$store.commit(SET_OFFER_TOAST, {
            type: "success",
            msg: this.$t("msg.addSuccess")
          });
          this.$router.push("/offer");
        }
      } else {
        this.toastMsg("error", this.$t("msg.noCustomer"));
      }
    },
    resetForm() {
      this.$nextTick(() => {
        this.$v.$reset();
      });
    },
    back() {
      window.history.back();
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
    async generateProduct(type) {
      await this.$store.dispatch(GENERATE_PRODUCT, {
        data: this.currentGenerator,
        type: type
      });
      if (this.error) {
        this.toastMsg("error", this.error);
      } else {
        this.form.offer_desc = this.currentEstimateDesc;
        const el = document.getElementById("quote-items");
        if (el) {
          el.scrollIntoView({ behavior: "smooth" });
        }
      }
    },
    generateAddCostDesc(dropdown, addcost) {
      const start =
        "<p>Die Nebenkosten werden als Pauschale in Prozent der Netto-Honorarsumme (exkl. MWST) berechnet und stellen sich je nach Projekt und Notwendigkeit wie folgt zusammen:</p>";
      const end =
        "<p>Planplots werden über externe Reprografieanstalten in Auftrag gegeben und sind nicht Bestandteil der " +
        this.currentCompany.name +
        " Nebenkostenpauschale. Diese Rechnungen werden durch Plan4 kontrolliert und werden der Bauherrschaft direkt zugestellt.</p>";
      let percent = 0.0;
      let final = null;

      if (dropdown.value > 0) {
        const dropdownText = `<p>Fahrkilometer inkl,. Fahrzeit je nach Umkreis (U1-3)/Parkierungsspesen/Bewilligungen etc. = <strong>${dropdown.value.toFixed(
          1
        )}%&nbsp;</strong></p>`;
        const dropdownSubText =
          "<p>(Bürostandort; U1 = <strong>1.0%</strong>, Bis 10km; U2 = <strong>2.0%</strong>, über 10km; U3 = <strong>3.0%</strong>)</p>";
        final = start + dropdownText + dropdownSubText;
        percent = parseFloat(dropdown.value);
      } else {
        final = start;
      }

      for (const item of addcost) {
        if (item.is_active) {
          final += "<p>" + item.label + " = <strong>" + parseFloat(item.value).toFixed(1) + "%</strong></p>";
          percent += parseFloat(item.value);
        }
      }

      const total = "<p><strong>Total NK: " + percent + "%</strong></p>";
      final += total;
      final += end;
      this.form.additional_desc = final;
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
      this.$store.commit(SET_OFFER_ERROR, null);
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
