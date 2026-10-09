<template>
  <div>
    <div class="card card-custom bg-white card-stretch gutter-b">
      <div class="card-header p-6">
        <div class="col-md-6 p-0" style="display: flex; align-items: center">
          <i class="flaticon2-left-arrow-1 mr-4 action-icon" @click="back"></i>
          <h3 class="m-0">{{ $t("title.editOffer") }}</h3>
        </div>
        <div v-if="currentOffer.last_generated" class="col-md-6 p-0 text-muted action">
          {{ $t("msg.lastGenerated") + " " + formatGeneratedDate(currentOffer.last_generated) }}
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
          <CustomerSelect :disabled="checkArchived() ? true : false" />

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
                  :disabled="checkArchived()"
                  @input="edited = true"
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
                  :disabled="checkArchived()"
                  @input="edited = true"
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
                  @input="edited = true"
                  :disabled="checkArchived()"
                ></b-form-input>
                <b-input-group-append>
                  <b-form-datepicker
                    v-model="form.date"
                    :locale="locale"
                    :start-weekday="1"
                    button-only
                    right
                    :disabled="checkArchived()"
                    @context="formatDate"
                    @hidden="edited = true"
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
              <b-form-input v-model="form.title" :disabled="checkArchived()" @input="edited = true"></b-form-input>
            </div>
            <div class="col-md-3">
              <div class="subtitle-1 font-weight-bolder mb-2">Untertitel</div>
              <b-form-select
                v-model="form.category"
                :options="subtitles"
                value-field="label"
                text-field="label"
                :disabled="checkArchived()"
                @change="edited = true"
              ></b-form-select>
            </div>
          </div>

          <div class="row mt-4">
            <div v-if="currentSettings.master_data.allow_to_use_other_currencies" class="col-md-3 mt-2">
              <div class="subtitle-1 font-weight-bolder mb-2">{{ $t("settings.form.master.currency") }}:</div>
              <b-form-select
                v-model="form.currency_val"
                :options="currentSettings.master_data.currencies"
                @change="edited = true"
              ></b-form-select>
            </div>
          </div>

          <div class="row mt-6">
            <div class="col-md-12">
              <b-form-input
                v-model="form.begin"
                class="form-control-solid font-weight-bolder"
                :disabled="checkArchived()"
                @input="edited = true"
              ></b-form-input>
            </div>
            <div class="col-md-12 mt-2 editor">
              <TextEditor v-model="form.begin_desc" :disabled="checkArchived()" @input="edited = true" />
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
              <b-form-input
                v-model="form.performance"
                class="form-control-solid font-weight-bolder"
                :disabled="checkArchived()"
                @input="edited = true"
              ></b-form-input>
            </div>
            <div class="col-md-12 mt-2 editor">
              <TextEditor v-model="form.performance_desc" :disabled="checkArchived()" @input="edited = true" />
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
              <b-form-input
                v-model="form.estimate_cost"
                class="form-control-solid font-weight-bolder"
                :disabled="checkArchived()"
                @input="edited = true"
              ></b-form-input>
            </div>
            <div class="col-md-12 mt-2 pl-6">
              <CostEstimate :currency="form.currency_val" :disabled="checkArchived()" />
            </div>
          </div>

          <div class="row mt-4">
            <div class="col-md-12">
              <b-form-input
                v-model="form.parameter"
                class="form-control-solid font-weight-bolder"
                :disabled="checkArchived()"
                @input="edited = true"
              ></b-form-input>
            </div>
            <div class="col-md-12 mt-2 editor">
              <TextEditor v-model="form.parameter_desc" :disabled="checkArchived()" @input="edited = true" />
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

          <!-- service table -->
          <div class="row mt-4">
            <div class="col-md-12">
              <b-form-input
                v-model="form.offer"
                class="form-control-solid font-weight-bolder"
                :disabled="checkArchived()"
                @input="edited = true"
              ></b-form-input>
            </div>
            <div class="col-md-6 mt-2">
              <Generator :generate="generateProduct" :disabled="checkArchived()" />
            </div>
            <div class="col-md-12 mt-4 editor">
              <TextEditor v-model="form.offer_desc" :disabled="checkArchived()" @input="edited = true" />
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
                :currency="form.currency_val"
                :disabled="checkArchived()"
                @persistAdditionalCost="percent => persistAdditionalCost(percent)"
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
              <b-form-input
                v-model="form.additional"
                class="form-control-solid font-weight-bolder"
                :disabled="checkArchived()"
                @input="edited = true"
              ></b-form-input>
            </div>
            <div class="col-md-12 mt-2 editor">
              <TextEditor v-model="form.additional_desc" :disabled="checkArchived()" @input="edited = true" />
            </div>
            <div class="col-md-12">
              <AdditionalCosts
                :currency="form.currency_val"
                :generate="generateAddCostDesc"
                :disabled="checkArchived()"
                :disabledAction="checkArchived()"
                @persistAdditionalCost="percent => persistAdditionalCost(percent)"
              />
            </div>
            <div class="col-md-12 mt-4">
              <!-- Add cost invoice -->
              <div v-if="currentOffer.invoices">
                <div v-for="(item, i) in currentOffer.invoices" :key="i">
                  {{ $t("offer.addcostInvoice") }}
                  <span class="font-weight-bolder underline-text mx-1" @click="$router.push(`/invoice/${item.id}`)">
                    {{ item.name }}
                  </span>
                  {{ $t("offer.from") }}
                  {{ formatInvoiceDate(item.created_at) }}
                </div>
              </div>
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
              <b-form-input
                v-model="form.event"
                class="form-control-solid font-weight-bolder"
                :disabled="checkArchived()"
                @input="edited = true"
              ></b-form-input>
            </div>
            <div class="col-md-6 mt-2">
              <Events :disabled="checkArchived()" />
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
              <b-form-input
                v-model="form.end"
                class="form-control-solid font-weight-bolder"
                :disabled="checkArchived()"
              ></b-form-input>
            </div>
            <div class="col-md-12 mt-2 editor">
              <TextEditor v-model="form.end_desc" :disabled="checkArchived()" @input="edited = true" />
            </div>
          </div>

          <div class="row mt-n2">
            <div class="col-md-12">
              <div class="subtitle-1 font-weight-bolder mb-2">{{ $t("offer.internalDesc") }}:</div>
              <InternalDesc :disabled="checkArchived()" />
              <b-form-textarea
                v-model="form.internal_desc_custom"
                rows="3"
                :disabled="checkArchived()"
                @input="edited = true"
              ></b-form-textarea>
            </div>
          </div>

          <!-- Actions -->
          <div class="mt-6">
            <b-button variant="danger" class="del-btn mr-2" :disabled="checkEdited()" @click="remove_dialog = true">
              <i class="flaticon2-rubbish-bin p-0 mr-2"></i>
              <span>{{ $t("button.delete") }}</span>
            </b-button>
            <b-button ref="kt_preview" class="mr-2" @click="onSubmit(false), preview()">
              <i class="flaticon-eye p-0 mr-2"></i>
              <span>Preview PDF</span>
            </b-button>
            <b-button
              variant="primary"
              class="print-btn mr-2"
              ref="kt_download"
              :disabled="checkEdited()"
              @click="printPdf"
            >
              <i class="flaticon2-printer p-0 mr-2"></i>
              <span>{{ $t("button.printpdf") }}</span>
            </b-button>
            <b-button
              variant="primary"
              class="print-btn mr-2"
              ref="kt_download_doc"
              :disabled="checkEdited()"
              @click="printDoc"
            >
              <i class="flaticon2-printer p-0 mr-2"></i>
              <span>{{ $t("button.printdocx") }}</span>
            </b-button>
            <b-button
              variant="primary"
              class="mail-btn mr-2"
              ref="kt_email"
              :disabled="checkEdited()"
              @click="sendMail"
            >
              <i class="flaticon-multimedia p-0 mr-2"></i>
              <span>{{ $t("button.mail") }}</span>
            </b-button>
            <b-button variant="primary" class="copy-btn mr-2" :disabled="checkEdited()" @click="copy">
              <i class="flaticon2-copy p-0 mr-2"></i>
              <span>{{ $t("button.copy") }}</span>
            </b-button>
            <b-button variant="primary" class="save-btn" type="submit" style="float: right">
              <i class="flaticon2-check-mark p-0 mr-2"></i>
              <span>{{ $t("button.save") }}</span>
            </b-button>
            <b-button
              variant="success"
              class="accept-btn mr-2"
              style="float: right"
              :disabled="checkEdited()"
              @click="accept_dialog = true"
            >
              <i class="flaticon-black p-0 mr-2"></i>
              <span>{{ $t("button.acceptOffer") }}</span>
            </b-button>
          </div>
        </b-form>
      </div>
    </div>

    <!-- Remove Dialog -->
    <b-modal v-model="remove_dialog" hide-footer no-close-on-backdrop :title="`${$t('title.confirm')}`">
      <div>{{ $t("msg.delOffer") }}</div>
      <div class="col-md-12 p-0 mt-4 action">
        <b-button variant="primary" class="save-btn" @click="remove">
          {{ $t("button.confirm") }}
        </b-button>
      </div>
    </b-modal>

    <!-- Accept Dialog -->
    <b-modal v-model="accept_dialog" hide-footer no-close-on-backdrop :title="`${$t('title.acceptOffer')}`">
      <div>
        {{ $t("offer.acceptText1") }}
      </div>
      <div class="mt-4">
        {{ $t("offer.acceptText2") }}
      </div>
      <div class="subtitle-1 font-weight-bolder mb-2 mt-4">
        {{ $t("offer.projectComplete") }}
      </div>
      <b-input-group>
        <b-form-input
          v-model="acdate_formatted"
          type="text"
          autocomplete="off"
          @blur="formateAcceptDateInvert"
        ></b-form-input>
        <b-input-group-append>
          <b-form-datepicker
            v-model="acdate"
            :locale="locale"
            :start-weekday="1"
            button-only
            right
            @context="formateAcceptDate"
          ></b-form-datepicker>
        </b-input-group-append>
      </b-input-group>

      <!-- Modal Actions -->
      <div class="mt-6 action">
        <b-button variant="primary" class="save-btn" @click="accept" :disabled="calling_promise">
          <i class="flaticon2-check-mark p-0"></i>
        </b-button>
      </div>
    </b-modal>
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
import { GET_COMPANY, GET_SETTINGS } from "@/core/services/store/settings";
import { SET_SELECTEDCUSTOMER } from "@/core/services/store/customer";
import { SET_QUOTE_ITEMS, SET_DISPERCENT } from "@/core/services/store/product";
import { SET_ADDITIONAL_TOTAL } from "@/core/services/store/offer";
import {
  GET_OFFER,
  UPDATE_OFFER,
  DELETE_OFFER,
  COPY_OFFER,
  EXPORT_OFFER_PDF,
  EXPORT_OFFER_DOC,
  SET_EVENTS,
  SET_ESTIMATES,
  SET_KM,
  SET_ADDCOSTS,
  SET_OFFER_TOAST,
  SET_OFFER_ID,
  ACCEPT_OFFER,
  SET_KMOPTIONS,
  SET_GENERATOR,
  GENERATE_PRODUCT,
  SET_OFFER_ERROR,
  SET_INTERNAL_CHOICES,
  PREVIEW_OFFER_PDF
} from "@/core/services/store/offer";
import { formatDate } from "@/common";

export default {
  name: "editOffer",
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
    title: "Edit Offer",
    meta: [
      {
        hid: "description",
        name: "description",
        content: "Edit Offer Page"
      },
      {
        hid: "og:site_name",
        property: "og:site_name",
        content: "Archapp"
      },
      {
        hid: "og:title",
        property: "og:title",
        content: "Edit Offer | Archapp"
      },
      {
        hid: "og:description",
        property: "og:description",
        content: "Edit Offer | Archapp"
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
        currency_val: "",
        name: "",
        location: "",
        date: "",
        date_formatted: "",
        title: "Honorarofferte",
        category: "Architektur",
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
      acdate: "",
      acdate_formatted: "",
      remove_dialog: false,
      accept_dialog: false,
      loading: true,
      edited: false,
      calling_promise: false
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
  computed: {
    ...mapGetters([
      "currentSettings",
      "currentCompany",
      "currentOffer",
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
      "additionalPercent",
      "detailCost",
      "currentPreviewOfferPDF"
    ]),
    quoteItems(state) {
      return state.quote_items;
    },
    ...mapState({
      error: state => state.offer.error,
      id: state => state.offer.id,
      project_id: state => state.project.id,
      invoice_id: state => state.invoice.id,
      customer_edited: state => state.customer.customer_edited,
      quote_edited: state => state.product.quote_edited,
      additional_edited: state => state.offer.additional_edited,
      estimate_edited: state => state.offer.estimate_edited,
      event_edited: state => state.offer.event_edited,
      internal_edited: state => state.offer.internal_edited,
      generate_edited: state => state.offer.generate_edited,
      pdf_code: state => state.offer.pdf,
      docx_code: state => state.offer.doc
    }),
    currentLanguage() {
      return i18nService.getActiveLanguage();
    }
  },
  async mounted() {
    this.$store.commit(SET_OFFER_ID, this.$route.params.offer_id);
    await this.$store.dispatch(GET_OFFER, { id: this.id });
    await this.$store.dispatch(GET_COMPANY);
    await this.$store.dispatch(GET_SETTINGS);
    this.initData();
    if (this.currentLanguage === "de") {
      this.locale = "de";
    } else {
      this.locale = "en-US";
    }
    this.acdate = moment().format("YYYY-MM-DD");
    this.acdate_formatted = moment().format("DD.MM.YYYY");
    this.loading = !this.loading;
  },
  methods: {
    initData() {
      this.form.name = this.currentOffer.name;
      this.form.location = this.currentOffer.location;
      if (this.currentOffer.date) {
        this.form.date = this.currentOffer.date;
        this.form.date_formatted = formatDate(this.currentOffer.date);
      }
      this.form.title = this.currentOffer.title;
      this.subtitles = this.currentSettings.offer.subtitle_setting;
      this.form.category = this.currentOffer.category;
      this.form.begin = this.currentOffer.begin;
      this.form.performance = this.currentOffer.performance;
      this.form.estimate_cost = this.currentOffer.estimate_cost;
      this.form.parameter = this.currentOffer.parameter;
      this.form.offer = this.currentOffer.offer;
      this.form.additional = this.currentOffer.additional;
      this.form.event = this.currentOffer.event;
      this.form.end = this.currentOffer.end;
      this.form.begin_desc = this.currentOffer.begin_desc;
      this.form.performance_desc = this.currentOffer.performance_desc;
      this.form.parameter_desc = this.currentOffer.parameter_desc;
      this.form.offer_desc = this.currentOffer.offer_desc;
      this.form.additional_desc = this.currentOffer.additional_desc;
      this.form.end_desc = this.currentOffer.end_desc;
      this.form.internal_desc_custom = this.currentOffer.internal_desc_custom;
      this.form.begin_break = this.currentOffer.begin_break;
      this.form.performance_break = this.currentOffer.performance_break;
      this.form.parameter_break = this.currentOffer.parameter_break;
      this.form.offer_break = this.currentOffer.offer_break;
      this.form.offer_quote_break = this.currentOffer.offer_quote_break;
      this.form.additional_break = this.currentOffer.additional_break;
      this.form.event_break = this.currentOffer.event_break;
      this.$store.commit(SET_SELECTEDCUSTOMER, this.currentOffer.customer);
      this.$store.commit(SET_ESTIMATES, this.currentOffer.cost_estimate);
      this.$store.commit(SET_GENERATOR, this.currentOffer.cost_generate);
      this.$store.commit(SET_QUOTE_ITEMS, this.currentOffer.quote_items);
      this.$store.commit(SET_KMOPTIONS, this.currentSettings.offer.km_dropdown_setting);
      this.$store.commit(SET_KM, this.currentOffer.km_dropdown);
      this.$store.commit(SET_ADDCOSTS, this.currentOffer.additional_cost);
      if (this.currentOffer.events) {
        this.$store.commit(SET_EVENTS, this.currentOffer.events);
      }
      this.$store.commit(SET_DISPERCENT, this.currentOffer.discount_percent);
      this.$store.commit(SET_INTERNAL_CHOICES, this.currentOffer.internal_desc);
      if (this.currentOffer.currency) {
        this.form.currency_val = this.currentOffer.currency;
      } else {
        this.form.currency_val = this.currentCompany.currency;
      }
    },
    validateState(name) {
      const { $dirty, $error } = this.$v.form[name];
      return $dirty ? !$error : null;
    },
    async onSubmit(toHome = true) {
      this.$v.form.$touch();
      if (this.$v.form.$anyError) {
        this.scrollToError();
        return;
      }

      await this.$store.dispatch(UPDATE_OFFER, {
        id: this.id,
        data: {
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
          cost_estimate: this.currentEstimateCost,
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
        }
      });
      if (this.error) {
        this.toastMsg("error", this.error);
      } else {
        if (toHome) {
          this.$store.commit(SET_OFFER_TOAST, {
            type: "success",
            msg: this.$t("msg.updateSuccess")
          });
          this.$router.push("/offer");
        }
      }
    },
    resetForm() {
      this.$nextTick(() => {
        this.$v.$reset();
      });
    },
    async remove() {
      await this.$store.dispatch(DELETE_OFFER, { id: this.id });
      if (this.error) {
        this.toastMsg("error", this.error);
      } else {
        this.$store.commit(SET_OFFER_TOAST, {
          type: "success",
          msg: this.$t("msg.delSuccess")
        });
        this.$router.push("/offer");
      }
    },
    async printPdf() {
      // set spinner to button
      const button = this.$refs["kt_download"];
      button.classList.add("spinner", "spinner-light", "spinner-right");
      button.disabled = true;

      await this.$store.dispatch(EXPORT_OFFER_PDF, {
        id: this.id,
        lang: this.currentLanguage === "de" ? "de" : "en"
      });

      // update new logic
      button.classList.remove("spinner", "spinner-light", "spinner-right");
      button.disabled = false;

      const popUp = window.open(this.pdf_code, "_blank");
      if (popUp == null || typeof popUp == "undefined") {
        this.toastMsg("error", this.$t("msg.disablePopup"));
      } else {
        popUp.focus();
      }

      // if (this.error) {
      //   button.classList.remove("spinner", "spinner-light", "spinner-right");
      //   button.disabled = false;
      //   this.toastMsg("error", this.error);
      // } else {
      //   button.classList.remove("spinner", "spinner-light", "spinner-right");
      //   button.disabled = false;
      //   const download = this.handleDownload(this.pdf_code);

      //   const popUp = window.open(download, "_blank");
      //   if (popUp == null || typeof popUp == "undefined") {
      //     this.toastMsg("error", this.$t("msg.disablePopup"));
      //   } else {
      //     popUp.focus();
      //   }
      // }
    },
    async printDoc() {
      // set spinner to button
      const button = this.$refs["kt_download_doc"];
      button.classList.add("spinner", "spinner-light", "spinner-right");
      button.disabled = true;

      await this.$store.dispatch(EXPORT_OFFER_DOC, {
        id: this.id,
        lang: this.currentLanguage === "de" ? "de" : "en"
      });

      // update new logic
      button.classList.remove("spinner", "spinner-light", "spinner-right");
      button.disabled = false;
      const popUp = window.open(this.pdf_code, "_blank");
      if (popUp == null || typeof popUp == "undefined") {
        this.toastMsg("error", this.$t("msg.disablePopup"));
      } else {
        popUp.focus();
      }
      // if (this.error) {
      //   button.classList.remove("spinner", "spinner-light", "spinner-right");
      //   button.disabled = false;
      //   this.toastMsg("error", this.error);
      // } else {
      //   button.classList.remove("spinner", "spinner-light", "spinner-right");
      //   button.disabled = false;
      //   const download = this.handleDownload(this.docx_code);

      //   const popUp = window.open(download, "_blank");
      //   if (popUp == null || typeof popUp == "undefined") {
      //     this.toastMsg("error", this.$t("msg.disablePopup"));
      //   } else {
      //     popUp.focus();
      //   }
      // }
    },
    async sendMail() {
      // set spinner to button
      const button = this.$refs["kt_email"];
      button.classList.add("spinner", "spinner-light", "spinner-right");
      button.disabled = true;

      await this.$store.dispatch(EXPORT_OFFER_PDF, { id: this.id });
      if (this.error) {
        button.classList.remove("spinner", "spinner-light", "spinner-right");
        button.disabled = false;
        this.toastMsg("error", this.error);
      } else {
        button.classList.remove("spinner", "spinner-light", "spinner-right");
        button.disabled = false;
        const download = this.handleDownload(this.pdf_code);

        const emailTo = this.selectedCustomer.email ? this.selectedCustomer.email : "";
        const subject = this.$t("menu.offer");
        const body =
          this.$t("email.salutation") +
          "\n\n" +
          this.$t("email.offerIntro") +
          download +
          "\n" +
          this.$t("email.offerEnd") +
          "\n\n" +
          this.$t("email.end") +
          "\n" +
          this.currentCompany.name;
        const popUp = window.open(`mailto:${emailTo}:?subject=${subject}&body=${encodeURIComponent(body)}`);
        if (popUp == null || typeof popUp == "undefined") {
          this.toastMsg("error", this.$t("msg.disablePopup"));
        } else {
          popUp.focus();
        }
      }
    },
    async copy() {
      await this.$store.dispatch(COPY_OFFER, { id: this.id });
      if (this.error) {
        this.toastMsg("error", this.error);
      } else {
        this.$store.commit(SET_OFFER_TOAST, {
          type: "success",
          msg: this.$t("msg.copySuccess")
        });
        this.$router.push("/offer");
      }
    },
    async accept() {
      try {
        this.calling_promise = true;
        await this.$store.dispatch(ACCEPT_OFFER, {
          id: this.id,
          data: {
            end_on: moment(this.acdate).toISOString()
          }
        });
        if (this.error) {
          this.toastMsg("error", this.error);
        } else {
          this.accept_dialog = false;
          this.$router.push(`/project/${this.project_id}`);
        }
      } finally {
        // Reset calling_promise after Promisify is done
        this.calling_promise = false;
      }
    },
    back() {
      window.history.back();
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
    formateAcceptDate() {
      if (this.acdate) {
        this.acdate_formatted = formatDate(this.acdate);
      }
    },
    formateAcceptDateInvert() {
      if (this.acdate_formatted) {
        const split = this.acdate_formatted.split(".");
        const join = split[2] + "-" + split[1] + "-" + split[0];
        this.acdate = join;
      }
    },
    formatInvoiceDate(val) {
      return formatDate(val);
    },
    formatGeneratedDate(val) {
      return moment(val).format("DD.MM.YYYY - hh:mm A");
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
    checkEdited() {
      if (
        this.edited ||
        this.customer_edited ||
        this.quote_edited ||
        this.estimate_edited ||
        this.additional_edited ||
        this.event_edited ||
        this.internal_edited ||
        this.generate_edited
      ) {
        return true;
      } else {
        return false;
      }
    },
    checkArchived() {
      if (this.currentOffer.status === "archive") {
        return true;
      } else {
        return false;
      }
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
    },
    async preview() {
      // set spinner to button
      const button = this.$refs["kt_preview"];
      button.classList.add("spinner", "spinner-light", "spinner-right");
      button.disabled = true;

      await this.$store.dispatch(PREVIEW_OFFER_PDF, {
        id: this.$route.params.offer_id
      });

      const popUp = window.open(this.pdf_code, "_blank");
      if (popUp == null || typeof popUp == "undefined") {
        this.toastMsg("error", this.$t("msg.disablePopup"));
      } else {
        popUp.focus();
      }

      // var byte = this.base64ToArrayBuffer(this.currentPreviewOfferPDF);
      // var blob = new Blob([byte], { type: "application/pdf" });
      // window.open(URL.createObjectURL(blob), "_blank");

      button.classList.remove("spinner", "spinner-light", "spinner-right");
      button.disabled = false;
    },
    base64ToArrayBuffer(_base64Str) {
      var binaryString = window.atob(_base64Str);
      var binaryLen = binaryString.length;
      var bytes = new Uint8Array(binaryLen);
      for (var i = 0; i < binaryLen; i++) {
        var ascii = binaryString.charCodeAt(i);
        bytes[i] = ascii;
      }
      return bytes;
    }
  }
};
</script>

<style scoped>
.action-icon:hover,
.underline-text:hover {
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

.underline-text {
  text-decoration: underline;
  cursor: pointer;
}
</style>
