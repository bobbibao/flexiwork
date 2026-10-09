<template>
  <div>
    <div class="card card-custom bg-white card-stretch gutter-b">
      <div class="card-header p-6">
        <div class="col-md-6 p-0" style="display: flex; align-items: center">
          <i class="flaticon2-left-arrow-1 mr-4 action-icon" @click="back"></i>
          <h3 v-if="currentInvoice.type === 'partial' && currentInvoice.is_final" class="m-0">
            {{ $t("title.editFinalInvoice") }}
          </h3>
          <h3 v-else-if="currentInvoice.type === 'partial' && !currentInvoice.is_final" class="m-0">
            {{ $t("title.editPartialInvoice") }}
          </h3>
          <h3 v-else class="m-0">{{ $t("title.editInvoice") }}</h3>
        </div>
        <div v-if="currentInvoice.last_generated" class="col-md-6 p-0 text-muted action">
          {{
            $t("msg.lastGenerated") +
              " " +
              (currentInvoice.last_generated !== "N/A" ? formatGeneratedDate(currentInvoice.last_generated) : "N/A")
          }}
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
                @change="edited = true"
              ></b-form-select>
            </div>
          </div>

          <div class="row mt-4">
            <div class="col-md-3">
              <div
                v-if="currentInvoice.type === 'partial' && currentInvoice.is_final"
                class="subtitle-1 font-weight-bolder mb-2"
              >
                {{ $t("invoice.finalInvoice") }}
              </div>
              <div
                v-else-if="currentInvoice.type === 'partial' && !currentInvoice.is_final"
                class="subtitle-1 font-weight-bolder mb-2"
              >
                {{ $t("invoice.partialInvoice") }}
              </div>
              <div v-else class="subtitle-1 font-weight-bolder mb-2">
                {{ $t("invoice.invoice") }}
              </div>

              <b-form-group label-for="invoice-input">
                <b-form-input
                  id="invoice-input"
                  name="invoice-input"
                  v-model="form.name"
                  :state="validateState('name')"
                  aria-describedby="invoice-feedback"
                  @input="edited = true"
                ></b-form-input>

                <b-form-invalid-feedback id="invoice-feedback">
                  {{ $t("msg.required") }}
                </b-form-invalid-feedback>
              </b-form-group>
            </div>
            <div class="col-md-12 mt-n4">
              <b-form-checkbox size="md" v-model="form.is_custom_title">
                {{ $t("invoice.customTitle") }}
              </b-form-checkbox>
            </div>
          </div>

          <div class="row mt-4">
            <div class="col-md-3">
              <div class="subtitle-1 font-weight-bolder mb-2">
                {{ $t("invoice.location") }}
              </div>
              <b-form-input v-model="form.location" @input="edited = true"></b-form-input>
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
                  @change="edited = true"
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
                  :disabled="!form.is_custom_date"
                  @blur="formatChargeDateInvert"
                ></b-form-input>
                <b-input-group-append>
                  <b-form-datepicker
                    v-model="form.charge_date"
                    :locale="locale"
                    :start-weekday="1"
                    button-only
                    right
                    :disabled="!form.is_custom_date"
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
                  :disabled="!form.is_custom_date"
                  @blur="formatDueDateInvert"
                ></b-form-input>
                <b-input-group-append>
                  <b-form-datepicker
                    v-model="form.due_date"
                    :locale="locale"
                    :start-weekday="1"
                    button-only
                    right
                    :disabled="!form.is_custom_date"
                    @context="formatDueDate"
                  ></b-form-datepicker>
                </b-input-group-append>
              </b-input-group>
            </div>
            <div class="col-md-12 mt-4">
              <b-form-checkbox size="md" v-model="form.is_custom_date">
                {{ $t("invoice.customDate") }}
              </b-form-checkbox>
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
              <TextEditor v-model="form.address" @input="edited = true" />
            </div>
          </div>

          <div class="row mt-n4">
            <div class="col-md-3">
              <b-form-checkbox size="md" :checked="form.is_final" @change="toggleFinalInvoice">
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
              <TextEditor v-model="form.begin_desc" @input="edited = true" />
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
                :currency="form.currency_val"
                :isInvoice="true"
                @persistAdditionalCost="percent => persistAdditionalCost(percent)"
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

            <div v-if="currentInvoice.km_dropdown && currentInvoice.additional_cost" class="col-md-12 mt-4">
              <AdditionalCosts
                :currency="form.currency_val"
                :active-generate="false"
                @persistAdditionalCost="percent => persistAdditionalCost(percent)"
              />
            </div>
          </div>

          <div v-if="form.is_final" class="row mt-4">
            <div class="col-md-12">
              <div class="subtitle-1 font-weight-bolder mb-2">
                {{ $t("invoice.listHistory") }}
              </div>
            </div>
            <div v-for="(item, i) in currentHistoryInvoices" :key="i" class="col-md-12" style="display: flex">
              <div class="col-md-9 left">
                <span class="font-weight-bolder underline-text mx-1" @click="$router.push(`/invoice/${item.id}`)">{{
                  item.name
                }}</span>
                {{
                  $t("invoice.from") +
                    " " +
                    (item.charged_on ? formatInvoiceDate(item.charged_on) : formatInvoiceDate(item.created_at))
                }}
              </div>
              <div class="col-md-2 right pr-8">
                {{ "-" + formatMoney(item.amount) }}
              </div>
            </div>
          </div>

          <div class="row mt-4">
            <div class="col-md-12" style="display: inline-flex; align-items: center">
              <span class="mr-2">{{ $t("invoice.payable") }}</span>
              <b-form-input
                v-model="form.payment_deadline"
                size="sm"
                style="width: 50px; font-weight: bold"
                @input="edited = true"
                @blur="generateDueDate"
              ></b-form-input>
              <span class="ml-2">{{ $t("invoice.days") }}</span>
            </div>
            <div class="col-md-12 mt-2" style="display: inline-flex; align-items: center">
              <span class="mr-2">{{ $t("invoice.slipNumber") }}</span>
              <b-form-input
                v-model="form.slip_number"
                size="sm"
                style="width: 200px"
                @input="edited = true"
              ></b-form-input>
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
              <TextEditor v-model="form.end_desc" @input="edited = true" />
            </div>
          </div>

          <div class="row mt-n2">
            <div class="col-md-12">
              <div class="subtitle-1 font-weight-bolder mb-2">{{ $t("invoice.internalDesc") }}:</div>
              <InternalDesc />
              <b-form-textarea v-model="form.internal_desc_custom" rows="3" @input="edited = true"></b-form-textarea>
            </div>
          </div>

          <div v-if="currentInvoice.type === 'hour'" class="row mt-6">
            <div class="col-md-3">
              <div class="subtitle-1 font-weight-bolder mb-2">
                {{ $t("invoice.reportFrom") }}
              </div>
              <b-form-input v-model="form.hour_report_start" disabled></b-form-input>
            </div>
            <div class="col-md-3">
              <div class="subtitle-1 font-weight-bolder mb-2">
                {{ $t("invoice.reportTo") }}
              </div>
              <b-form-input v-model="form.hour_report_end" disabled></b-form-input>
            </div>
            <div class="col-md-12 mt-4">
              <b-form-checkbox size="md" v-model="form.is_include_internal_hour_report" @change="setIncludeInternal">
                {{ $t("invoice.includeInternalHourReport") }}
              </b-form-checkbox>
              <b-form-checkbox size="md" v-model="form.is_include_external_hour_report" @change="setIncludeExternal">
                {{ $t("invoice.includeExternalHourReport") }}
              </b-form-checkbox>
            </div>
            <div class="col-md-12 mt-2">
              <b-form-checkbox size="md" v-model="form.is_include_external_hour_report">
                {{ $t("invoice.includeExternalHourReport") }}
              </b-form-checkbox>
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
              class="paid-btn mr-2"
              style="float: right"
              :disabled="checkEdited()"
              @click="paid_dialog = true"
            >
              <i class="flaticon2-list p-0 mr-2"></i>
              <span>{{ $t("button.paidInvoice") }}</span>
            </b-button>
          </div>
          <div class="spacer"></div>
          <!-- Second Actions -->
          <div class="row">
            <div
              v-if="form.status !== 'archive' && form.status !== 'cancelled' && form.status !== 'paid'"
              class="col-md-8"
            >
              <b-button
                :variant="form.status !== 'reminder1' && form.status !== 'reminder2' ? 'primary' : null"
                class="reset-btn mr-2"
                @click="setReminder(0)"
              >
                <i class="flaticon-alert-off p-0 mr-2"></i>
                <span>{{ $t("button.noReminder") }}</span>
              </b-button>
              <b-button
                :variant="form.status === 'reminder1' ? 'warning' : null"
                class="reminder1-btn mr-2"
                @click="setReminder(1)"
              >
                <i class="flaticon-alert p-0 mr-2"></i>
                <span>{{ $t("button.reminder1") }}</span>
              </b-button>
              <b-button
                :variant="form.status === 'reminder2' ? 'warning' : null"
                class="reminder2-btn"
                @click="setReminder(2)"
              >
                <i class="flaticon-bell p-0 mr-2"></i>
                <span>{{ $t("button.reminder2") }}</span>
              </b-button>
            </div>
            <div class="col-md-4">
              <b-button class="cancel-btn" style="float: right" :disabled="checkEdited()" @click="cancel">
                <i class="flaticon2-cancel p-0 mr-2"></i>
                <span>{{ $t("button.cancelInvoice") }}</span>
              </b-button>
            </div>
          </div>
        </b-form>
      </div>
    </div>

    <!-- Remove Dialog -->
    <b-modal v-model="remove_dialog" hide-footer no-close-on-backdrop :title="`${$t('title.confirm')}`">
      <div>{{ $t("msg.delInvoice") }}</div>
      <div class="col-md-12 p-0 mt-4 action">
        <b-button variant="primary" class="save-btn" @click="remove" :disabled="loading">
          {{ $t("button.confirm") }}
        </b-button>
      </div>
    </b-modal>

    <!-- Paid Dialog -->
    <b-modal v-model="paid_dialog" hide-footer no-close-on-backdrop :title="`${$t('invoice.paidTitle')}`">
      <div class="row">
        <div class="col-md-4">{{ $t("invoice.invoiceNum") }}:</div>
        <div class="col-md-4" v-if="currentInvoice.number">
          {{ currentInvoice.number.custom_id ? currentInvoice.number.custom_id : currentInvoice.number.id }}
        </div>
      </div>
      <div class="row mt-4">
        <div class="col-md-4">{{ $t("invoice.refNum") }}:</div>
        <div class="col-md-4">{{ currentInvoice.slip_number }}</div>
      </div>
      <div class="row mt-4">
        <div class="col-md-4">{{ $t("invoice.totalNet") }}:</div>
        <div class="col-md-4">
          {{ formatMoney(detailCost.total_net + detailCost.total_net_nk) }}
        </div>
      </div>
      <div class="row mt-4">
        <div class="col-md-4">{{ $t("invoice.totalGross") }}:</div>
        <div class="col-md-4">
          {{ formatMoney(detailCost.total_gross + detailCost.total_gross_nk) }}
        </div>
      </div>
      <div class="row mt-4">
        <div class="col-md-12">
          <div class="subtitle-1 font-weight-bolder mb-2">
            {{ $t("invoice.valueDate") }}
          </div>
          <b-input-group>
            <b-form-input
              v-model="valdate_formatted"
              type="text"
              autocomplete="off"
              @blur="formatValDateInvert"
            ></b-form-input>
            <b-input-group-append>
              <b-form-datepicker
                v-model="valdate"
                :locale="locale"
                :start-weekday="1"
                button-only
                right
                @context="formatValDate"
              ></b-form-datepicker>
            </b-input-group-append>
          </b-input-group>
        </div>
      </div>
      <div class="row">
        <div class="col-md-12">
          <div class="subtitle-1 font-weight-bolder mb-2 mt-4">
            {{ $t("invoice.comment") }}
          </div>
          <b-form-input v-model="paid_comment"></b-form-input>
        </div>
      </div>

      <!-- Modal Actions -->
      <div class="mt-6 action">
        <b-button variant="primary" class="save-btn" @click="paid" :disabled="loading">
          <i class="flaticon2-check-mark p-0"></i>
        </b-button>
      </div>
    </b-modal>
  </div>
</template>

<script>
import { validationMixin } from "vuelidate";
import { required } from "vuelidate/lib/validators";
import moment from "moment";
import currency from "currency.js";
import i18nService from "@/core/services/i18n.service.js";
import TextEditor from "@/view/content/TextEditor.vue";
import CustomerSelect from "@/view/content/selector/CustomerDialog.vue";
import QuoteItems from "@/view/content/selector/QuoteItems.vue";
import AdditionalCosts from "@/view/content/selector/AdditionalCosts.vue";
import InternalDesc from "@/view/content/selector/InternalDesc.vue";
import PaidHistory from "@/view/content/selector/PaidHistory.vue";
import { mapGetters, mapState } from "vuex";
import { GET_COMPANY, GET_SETTINGS } from "@/core/services/store/settings";
import {
  GET_INVOICE,
  GET_HISTORY_INVOICES,
  UPDATE_INVOICE,
  DELETE_INVOICE,
  COPY_INVOICE,
  CANCEL_INVOICE,
  PAID_INVOICE,
  EXPORT_INVOICE_PDF,
  EXPORT_INVOICE_DOC,
  SET_INVOICE_TOAST,
  SET_INVOICE_ID,
  SET_INVOICE_HISTORY,
  SET_INVOICE_ERROR,
  PREVIEW_INVOICE_PDF
} from "@/core/services/store/invoice";
import { SET_SELECTEDCUSTOMER } from "@/core/services/store/customer";
import { SET_QUOTE_ITEMS, SET_DISPERCENT } from "@/core/services/store/product";
import {
  SET_KM,
  SET_KMOPTIONS,
  SET_ADDCOSTS,
  SET_INTERNAL_CHOICES,
  SET_ADDITIONAL_PERCENT,
  SET_ADDITIONAL_TOTAL
} from "@/core/services/store/offer";
import { GET_PROJECTS } from "@/core/services/store/project";
import { formatDate } from "@/common";

export default {
  name: "editInvoice",
  mixins: [validationMixin],
  metaInfo: {
    title: "Edit Invoice",
    meta: [
      {
        hid: "description",
        name: "description",
        content: "Edit Invoice Page"
      },
      {
        hid: "og:site_name",
        property: "og:site_name",
        content: "Archapp"
      },
      {
        hid: "og:title",
        property: "og:title",
        content: "Edit Invoice | Archapp"
      },
      {
        hid: "og:description",
        property: "og:description",
        content: "Edit Invoice | Archapp"
      },
      {
        hid: "og:image",
        property: "og:image",
        content: ""
      }
    ]
  },
  components: {
    TextEditor,
    CustomerSelect,
    QuoteItems,
    AdditionalCosts,
    InternalDesc,
    PaidHistory
  },
  data() {
    return {
      form: {
        project: "",
        status: "",
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
        payment_deadline: "",
        slip_number: "",
        internal_desc_custom: "",
        hour_report_start: "",
        hour_report_end: "",
        inv_begin_break: false,
        inv_quote_break: false,
        currency_val: "",
        is_final: false,
        is_custom_title: false,
        is_custom_date: false,
        is_include_internal_hour_report: false,
        is_include_external_hour_report: false,
        start_date_inv: "",
        end_date_inv: ""
      },
      locale: "de",
      valdate: "",
      valdate_formatted: "",
      paid_comment: "",
      remove_dialog: false,
      paid_dialog: false,
      loading: true,
      edited: false
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
      "currentCompany",
      "currentSettings",
      "currentInvoice",
      "selectedCustomer",
      "quoteItems",
      "discountPercent",
      "currentInternalChoices",
      "currentPaidHistory",
      "currentHistoryInvoices",
      "detailCost",
      "selectedKm",
      "selectedAddCost",
      "additionalPercent",
      "currentProjects",
      "currentPreviewInvoicePdf"
    ]),
    ...mapState({
      error: state => state.invoice.error,
      id: state => state.invoice.id,
      customer_edited: state => state.customer.customer_edited,
      quote_edited: state => state.product.quote_edited,
      internal_edited: state => state.offer.internal_edited,
      history_edited: state => state.invoice.history_edited,
      pdf_code: state => state.invoice.pdf,
      docx_code: state => state.invoice.doc
    }),
    currentLanguage() {
      return i18nService.getActiveLanguage();
    }
  },
  async mounted() {
    this.$store.commit(SET_INVOICE_ID, this.$route.params.invoice_id);
    await this.$store.dispatch(GET_INVOICE, { id: this.id });
    await this.$store.dispatch(GET_COMPANY);
    await this.$store.dispatch(GET_SETTINGS);
    await this.$store.dispatch(GET_PROJECTS, { for_selector: true });
    this.initData();
    if (this.currentInvoice.is_final) {
      this.$store.dispatch(GET_HISTORY_INVOICES, { id: this.id });
    }
    if (this.currentLanguage === "de") {
      this.locale = "de";
    } else {
      this.locale = "en-US";
    }
    this.valdate = moment().format("YYYY-MM-DD");
    this.valdate_formatted = moment().format("DD.MM.YYYY");
    this.loading = !this.loading;
  },
  methods: {
    initData() {
      // Check value of due_on and format it to null if it's = "null"
      if (this.currentInvoice.due_on == "null") {
        this.currentInvoice.due_on = null;
      }
      if (this.currentInvoice.project) {
        this.form.project = this.currentInvoice.project.id;
      } else if (this.currentProjects) {
        this.form.project = this.currentProjects[0].id;
      }
      this.form.status = this.currentInvoice.status;
      this.form.name = this.currentInvoice.name;
      this.form.location = this.currentInvoice.location;
      if (this.currentInvoice.date) {
        this.form.date = moment(this.currentInvoice.date).format("YYYY-MM-DD");
        this.form.date_formatted = formatDate(this.currentInvoice.date);
      }
      if (this.currentInvoice.charged_on) {
        this.form.charge_date = moment(this.currentInvoice.charged_on).format("YYYY-MM-DD");
        this.form.charge_date_formatted = formatDate(this.currentInvoice.charged_on);
      }
      if (this.currentInvoice.due_on) {
        this.form.due_date = this.currentInvoice.due_on
          ? moment(this.currentInvoice.due_on).format("YYYY-MM-DD")
          : null;
        this.form.due_date_formatted = this.currentInvoice.due_on ? formatDate(this.currentInvoice.due_on) : "";
      }
      if (this.currentInvoice.type === "hour") {
        this.form.hour_report_start = moment(this.currentInvoice.hour_report_start).format("YYYY-MM-DD");
        this.form.hour_report_end = moment(this.currentInvoice.hour_report_end).format("YYYY-MM-DD");
      }
      this.form.is_custom_title = this.currentInvoice.is_custom_title ?? false;
      this.form.is_include_internal_hour_report = this.currentInvoice.is_include_internal_hour_report ?? false;
      this.form.is_include_external_hour_report = this.currentInvoice.is_include_external_hour_report ?? false;
      this.form.is_custom_date = this.currentInvoice.is_custom_date ?? false;
      this.form.address = this.currentInvoice.address;
      this.form.is_final = this.currentInvoice.is_final ? this.currentInvoice.is_final : false;
      if (this.currentInvoice.begin_desc) {
        this.form.begin_desc = this.currentInvoice.begin_desc;
      } else {
        if (this.currentInvoice.type === "partial") {
          if (this.currentInvoice.status === "reminder1") {
            this.form.begin_desc = this.currentSettings.invoice.reminder1_begin_desc;
          } else if (this.currentInvoice.status === "reminder2") {
            this.form.begin_desc = this.currentSettings.invoice.reminder2_begin_desc;
          } else {
            this.form.begin_desc = this.currentSettings.invoice.partial_begin_desc;
          }
        } else {
          this.form.begin_desc = this.currentSettings.invoice.begin_desc;
        }
      }
      if (this.currentInvoice.end_desc) {
        this.form.end_desc = this.currentInvoice.end_desc;
      } else {
        if (this.currentInvoice.type === "partial") {
          if (this.currentInvoice.status === "reminder1") {
            this.form.end_desc = this.currentSettings.invoice.reminder1_end_desc;
          } else if (this.currentInvoice.status === "reminder2") {
            this.form.end_desc = this.currentSettings.invoice.reminder2_end_desc;
          } else {
            this.form.end_desc = this.currentSettings.invoice.partial_end_desc;
          }
        } else {
          this.form.end_desc = this.currentSettings.invoice.end_desc;
        }
      }
      this.form.internal_desc_custom = this.currentInvoice.internal_desc_custom;
      this.form.inv_begin_break = this.currentInvoice.inv_begin_break;
      this.form.inv_quote_break = this.currentInvoice.inv_quote_break;
      if (this.currentInvoice.payment_deadline) {
        this.form.payment_deadline = this.currentInvoice.payment_deadline;
      } else {
        if (this.currentInvoice.status === "reminder1") {
          this.form.payment_deadline = this.currentSettings.invoice.reminder1_payment_deadline;
        } else if (this.currentInvoice.status === "reminder2") {
          this.form.payment_deadline = this.currentSettings.invoice.reminder2_payment_deadline;
        } else {
          this.form.payment_deadline = this.currentSettings.invoice.payment_deadline;
        }
      }
      if (this.currentInvoice.slip_number) {
        this.form.slip_number = this.currentInvoice.slip_number;
      }
      this.$store.commit(SET_SELECTEDCUSTOMER, this.currentInvoice.customer);
      this.$store.commit(SET_QUOTE_ITEMS, this.currentInvoice.quote_items);
      this.$store.commit(SET_DISPERCENT, this.currentInvoice.discount_percent);
      if (this.currentInvoice.km_dropdown) {
        this.$store.commit(SET_KMOPTIONS, this.currentSettings.offer.km_dropdown_setting);
        this.$store.commit(SET_KM, this.currentInvoice.km_dropdown);
      }
      if (this.currentInvoice.additional_cost) {
        this.$store.commit(SET_ADDCOSTS, this.currentInvoice.additional_cost);
      }
      this.$store.commit(SET_INTERNAL_CHOICES, this.currentInvoice.internal_desc);
      if (this.currentInvoice.paid_history) {
        this.$store.commit(SET_INVOICE_HISTORY, this.currentInvoice.paid_history);
      }
      if (this.currentInvoice.currency) {
        this.form.currency_val = this.currentInvoice.currency;
      } else {
        this.form.currency_val = this.currentCompany.currency;
      }
      //init additional if any
      let percent = 0.0;
      if (this.currentInvoice.additional_cost) {
        for (const item of this.currentInvoice.additional_cost) {
          if (item.is_active) {
            percent += parseFloat(item.value);
          }
        }
      }
      if (this.currentInvoice.km_dropdown) {
        percent += parseFloat(this.currentInvoice.km_dropdown.value);
      }
      this.$store.commit(SET_ADDITIONAL_PERCENT, parseFloat(percent));
      this.form.start_date_inv = this.currentInvoice.start_date_inv;
      this.form.end_date_inv = this.currentInvoice.end_date_inv;
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
      if (this.loading) {
        return;
      }
      this.loading = true;
      await this.$store.dispatch(UPDATE_INVOICE, {
        id: this.id,
        data: {
          status: this.form.status,
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
          is_custom_title: this.form.is_custom_title,
          is_include_internal_hour_report: this.form.is_include_internal_hour_report,
          is_include_external_hour_report: this.form.is_include_external_hour_report,
          is_custom_date: this.form.is_custom_date,
          km_dropdown: this.selectedKm,
          additional_cost: this.selectedAddCost,
          start_date_inv: this.form.start_date_inv,
          end_date_inv: this.form.end_date_inv,
          project_id: this.form.project
        }
      });
      if (this.error) {
        this.toastMsg("error", this.error);
      } else {
        if (toHome) {
          this.$store.commit(SET_INVOICE_TOAST, {
            type: "success",
            msg: this.$t("msg.updateSuccess")
          });
          await this.$router.push("/invoice");
        }
      }
      this.loading = false;
    },
    resetForm() {
      this.$nextTick(() => {
        this.$v.$reset();
      });
    },
    async remove() {
      this.loading = true;
      await this.$store.dispatch(DELETE_INVOICE, { id: this.id });
      if (this.error) {
        this.toastMsg("error", this.error);
      } else {
        this.$store.commit(SET_INVOICE_TOAST, {
          type: "success",
          msg: this.$t("msg.delSuccess")
        });
        await this.$router.push("/invoice");
      }
      this.loading = false;
    },
    async copy() {
      await this.$store.dispatch(COPY_INVOICE, { id: this.id });
      if (this.error) {
        this.toastMsg("error", this.error);
      } else {
        this.$store.commit(SET_INVOICE_TOAST, {
          type: "success",
          msg: this.$t("msg.copySuccess")
        });
        this.$router.push("/invoice");
      }
    },
    async cancel() {
      await this.$store.dispatch(CANCEL_INVOICE, { id: this.id });
      if (this.error) {
        this.toastMsg("error", this.error);
      } else {
        this.$store.commit(SET_INVOICE_TOAST, {
          type: "success",
          msg: this.$t("msg.cancelSuccess")
        });
        this.$router.push("/invoice");
      }
    },
    async paid() {
      this.loading = true;
      await this.$store.dispatch(PAID_INVOICE, {
        id: this.id,
        data: {
          value_date: moment(this.valdate).toISOString(),
          comment: this.paid_comment
        }
      });
      if (this.error) {
        this.toastMsg("error", this.error);
      } else {
        this.$store.commit(SET_INVOICE_TOAST, {
          type: "success",
          msg: this.$t("msg.paidSuccess")
        });
        await this.$router.push("/invoice");
      }
      this.loading = false;
    },
    setIncludeInternal(e) {
      if (e && this.form.is_include_external_hour_report) {
        this.form.is_include_external_hour_report = false;
      }
    },
    setIncludeExternal(e) {
      if (e && this.form.is_include_internal_hour_report) {
        this.form.is_include_internal_hour_report = false;
      }
    },
    async printPdf() {
      // set spinner to button
      const button = this.$refs["kt_download"];
      button.classList.add("spinner", "spinner-light", "spinner-right");
      button.disabled = true;

      await this.$store.dispatch(EXPORT_INVOICE_PDF, {
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
    },
    async printDoc() {
      // set spinner to button
      const button = this.$refs["kt_download_doc"];
      button.classList.add("spinner", "spinner-light", "spinner-right");
      button.disabled = true;

      await this.$store.dispatch(EXPORT_INVOICE_DOC, {
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
    },
    async sendMail() {
      // set spinner to button
      const button = this.$refs["kt_email"];
      button.classList.add("spinner", "spinner-light", "spinner-right");
      button.disabled = true;

      await this.$store.dispatch(EXPORT_INVOICE_PDF, { id: this.id });
      if (this.error) {
        button.classList.remove("spinner", "spinner-light", "spinner-right");
        button.disabled = false;
        this.toastMsg("error", this.error);
      } else {
        button.classList.remove("spinner", "spinner-light", "spinner-right");
        button.disabled = false;

        const emailTo = this.selectedCustomer.email ? this.selectedCustomer.email : "";
        const subject = this.$t("menu.invoice");
        const body =
          this.$t("email.salutation") +
          "\n\n" +
          this.$t("email.invoiceIntro") +
          this.pdf_code +
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
    generateDueDate() {
      if (this.form.charge_date) {
        const result = moment(this.form.charge_date).add(this.form.payment_deadline, "d");
        this.form.due_date = moment(result).format("YYYY-MM-DD");
        this.form.due_date_formatted = formatDate(result);
      }
    },
    back() {
      window.history.back();
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
      this.form.due_date_formatted = "";
      if (this.form.due_date) {
        this.form.due_date_formatted = formatDate(this.form.due_date);
      }
    },
    formatDueDateInvert() {
      this.form.due_date = "";
      if (this.form.due_date_formatted) {
        const split = this.form.due_date_formatted.split(".");
        const join = split[2] + "-" + split[1] + "-" + split[0];
        this.form.due_date = join;
      }
    },
    formatValDate() {
      if (this.valdate) {
        this.valdate_formatted = formatDate(this.valdate);
      }
    },
    formatValDateInvert() {
      if (this.valdate_formatted) {
        const split = this.valdate_formatted.split(".");
        const join = split[2] + "-" + split[1] + "-" + split[0];
        this.valdate = join;
      }
    },
    formatGeneratedDate(val) {
      return moment(val).format("DD.MM.YYYY - hh:mm A");
    },
    formatMoney(val) {
      return currency(val, {
        separator: "'",
        pattern: `#`,
        negativePattern: `-#`,
        increment: 0.05
      }).format();
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
    checkEdited() {
      if (this.edited || this.customer_edited || this.quote_edited || this.internal_edited || this.history_edited) {
        return true;
      } else {
        return false;
      }
    },
    setReminder(val) {
      if (val === 0) {
        this.form.status = "open";
        this.form.begin_desc = this.currentInvoice.begin_desc;
        this.form.end_desc = this.currentInvoice.end_desc;
        this.form.payment_deadline = this.currentInvoice.payment_deadline;
      } else if (val === 1) {
        this.form.status = "reminder1";
        this.form.begin_desc = this.currentSettings.invoice.reminder1_begin_desc;
        this.form.end_desc = this.currentSettings.invoice.reminder1_end_desc;
        this.form.payment_deadline = this.currentSettings.invoice.reminder1_payment_deadline;
      } else {
        this.form.status = "reminder2";
        this.form.begin_desc = this.currentSettings.invoice.reminder2_begin_desc;
        this.form.end_desc = this.currentSettings.invoice.reminder2_end_desc;
        this.form.payment_deadline = this.currentSettings.invoice.reminder2_payment_deadline;
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
    async toggleFinalInvoice() {
      this.form.is_final = !this.form.is_final;
      this.edited = true;
      if (this.form.is_final) {
        await this.$store.dispatch(GET_HISTORY_INVOICES, { id: this.id });
      }
    },
    formatInvoiceDate(date) {
      if (date) {
        return formatDate(date);
      }
    },
    persistAdditionalCost() {
      this.$store.commit(SET_ADDITIONAL_TOTAL, parseFloat((this.detailCost.total_net * this.additionalPercent) / 100));
      const nkTotal = ((this.detailCost.total_net + this.detailCost.total_discount) * this.additionalPercent) / 100;
      const nkTotalApplyDiscount = (this.detailCost.total_net * this.additionalPercent) / 100;
      for (let index = 0; index < this.quoteItems.length; index++) {
        const element = this.quoteItems[index];
        if (element.is_nk) {
          this.quoteItems[index].name = "Nebenkosten " + this.additionalPercent + "%";
          this.quoteItems[index].description =
            "der Total Honorarsumme von " +
            this.currentCompany.currency +
            " " +
            this.formatMoney(
              element.apply_discount
                ? this.detailCost.total_net
                : this.detailCost.total_net + this.detailCost.total_discount,
              0.05
            );
          this.quoteItems[index].price = this.quoteItems[index].cost =
            Math.round((element.apply_discount ? nkTotalApplyDiscount : nkTotal) / 0.05, 0) * 0.05;
          break;
        }
      }
    },
    async preview() {
      // set spinner to button
      const button = this.$refs["kt_preview"];
      button.classList.add("spinner", "spinner-light", "spinner-right");
      button.disabled = true;

      await this.$store.dispatch(PREVIEW_INVOICE_PDF, {
        id: this.$route.params.invoice_id
      });

      const popUp = window.open(this.pdf_code, "_blank");
      if (popUp == null || typeof popUp == "undefined") {
        this.toastMsg("error", this.$t("msg.disablePopup"));
      } else {
        popUp.focus();
      }

      // var byte = this.base64ToArrayBuffer(this.currentPreviewInvoicePdf);
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
  background-color: rgba(153, 153, 153, 0.3);
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

.underline-text:hover {
  color: #3699ff;
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
</style>
