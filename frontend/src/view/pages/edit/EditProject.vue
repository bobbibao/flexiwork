<template>
  <div>
    <div class="card card-custom bg-white card-stretch gutter-b">
      <div class="card-header p-6">
        <div class="col-md-6 p-0" style="display: flex; align-items: center">
          <i class="flaticon2-left-arrow-1 mr-4 action-icon" @click="back"></i>
          <h3 class="m-0">{{ $t("title.editProject") }}</h3>
        </div>
        <div v-if="currentProject.last_generated" class="col-md-6 p-0 text-muted action">
          {{ $t("msg.lastGenerated") + " " + formatGeneratedDate(currentProject.last_generated) }}
        </div>
      </div>
      <div class="card-body p-6 position-relative overflow-hidden rounded-xl">
        <div v-if="loading" class="text-center text-danger my-2">
          <b-spinner class="align-middle"></b-spinner>
        </div>
        <b-form v-else @submit.stop.prevent="onSubmit">
          <div class="subtitle-1 font-weight-bolder mb-2">
            {{ $t("project.customer") }}
          </div>
          <CustomerSelect :disabled="checkArchived() ? true : false" />

          <div class="row mt-4">
            <div class="col-md-3">
              <div class="subtitle-1 font-weight-bolder mb-2">
                {{ $t("project.project") }}
              </div>
              <b-form-group label-for="project-input">
                <b-form-input
                  id="project-input"
                  name="project-input"
                  v-model="form.name"
                  :state="validateState('name')"
                  aria-describedby="project-feedback"
                  :disabled="checkArchived()"
                  @input="edited = true"
                ></b-form-input>

                <b-form-invalid-feedback id="project-feedback">
                  {{ $t("msg.required") }}
                </b-form-invalid-feedback>
              </b-form-group>
            </div>
            <div class="col-md-3">
              <div class="subtitle-1 font-weight-bolder mb-2">
                {{ $t("project.assignee") }}
              </div>
              <b-form-select
                v-model="form.assignee"
                :options="currentUsers"
                value-field="id"
                text-field="email"
                :disabled="checkArchived()"
                @change="edited = true"
              ></b-form-select>
            </div>
          </div>

          <div class="row">
            <div class="col-md-3">
              <div class="subtitle-1 font-weight-bolder mb-2">
                {{ $t("project.location") }}
              </div>
              <b-form-input v-model="form.location" :disabled="checkArchived()" @input="edited = true"></b-form-input>
            </div>
            <div class="col-md-3">
              <div class="subtitle-1 font-weight-bolder mb-2">
                {{ $t("project.date") }}
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

          <div class="row mt-4">
            <div class="col-md-3">
              <div class="subtitle-1 font-weight-bolder mb-2">
                {{ $t("project.number") }}
              </div>
              <b-form-input v-model="form.number" :disabled="checkArchived()" @input="edited = true"></b-form-input>
            </div>
            <div class="col-md-3">
              <div class="subtitle-1 font-weight-bolder mb-2">
                {{ $t("project.completion") }}
              </div>
              <b-input-group>
                <b-form-input
                  v-model="form.end_on_formatted"
                  type="text"
                  autocomplete="off"
                  @blur="formatEndDateInvert"
                  @input="edited = true"
                  :disabled="checkArchived()"
                ></b-form-input>
                <b-input-group-append>
                  <b-form-datepicker
                    v-model="form.end_on"
                    :locale="locale"
                    :start-weekday="1"
                    button-only
                    right
                    :disabled="checkArchived()"
                    @context="formatEndDate"
                    @hidden="edited = true"
                  ></b-form-datepicker>
                </b-input-group-append>
              </b-input-group>
            </div>
          </div>

          <div class="row mt-4">
            <div class="col-md-3">
              <div class="subtitle-1 font-weight-bolder mb-2">
                {{ $t("project.hourRate") }}
              </div>
              <b-form-input v-model="form.rate_per_hour"></b-form-input>
            </div>
          </div>

          <div v-if="currentSettings.master_data.allow_to_use_other_currencies" class="row mt-4">
            <div class="col-md-3">
              <div class="subtitle-1 font-weight-bolder mb-2">{{ $t("settings.form.master.currency") }}:</div>
              <b-form-select
                v-model="form.currency_val"
                :options="currentSettings.master_data.currencies"
                @change="edited = true"
              ></b-form-select>
            </div>
          </div>

          <div class="row mt-4">
            <div class="col-md-12">
              <div class="subtitle-1 font-weight-bolder mb-2">Anschrift</div>
            </div>
            <div class="col-md-12 mt-2 editor">
              <TextEditor v-model="form.address" :disabled="checkArchived()" @input="edited = true" />
            </div>
          </div>

          <div class="row">
            <div class="col-md-12">
              <div class="subtitle-1 font-weight-bolder mb-2">
                1. Rahmenbedingungen
              </div>
            </div>
            <div class="col-md-12 mt-2 editor">
              <TextEditor v-model="form.begin_desc" :disabled="checkArchived()" @input="edited = true" />
            </div>
            <div class="col-md-12 mt-n4">
              <b-form-checkbox
                class="break-box"
                :checked="form.pr_begin_break"
                @change="form.pr_begin_break = !form.pr_begin_break"
                >{{ $t("button.breakPage") }}</b-form-checkbox
              >
            </div>
            <div class="col-md-12 mt-2">
              <QuoteItems
                :currency="form.currency_val"
                @persistAdditionalCost="percent => persistAdditionalCost(percent)"
                :disabled="checkArchived()"
              />
            </div>
            <div class="col-md-12 mt-4">
              <b-form-checkbox
                class="break-box"
                :checked="form.pr_quote_break"
                @change="form.pr_quote_break = !form.pr_quote_break"
                >{{ $t("button.breakPage") }}</b-form-checkbox
              >
            </div>

            <div
              v-if="currentProject.details.selected_km_label && currentProject.additional_cost"
              class="col-md-12 mt-4"
            >
              <AdditionalCosts
                :currency="form.currency_val"
                :active-generate="false"
                :disabled="checkArchived()"
                :disabledAction="checkArchived()"
                @persistAdditionalCost="percent => persistAdditionalCost(percent)"
              />
            </div>
          </div>

          <div class="row mt-4">
            <div class="col-md-12">
              <div class="subtitle-1 font-weight-bolder mb-2">
                2. Ende des Textes
              </div>
            </div>
            <div class="col-md-12 mt-2 editor">
              <TextEditor v-model="form.end_desc" :disabled="checkArchived()" @input="edited = true" />
            </div>
          </div>

          <div class="row mt-n2">
            <div class="col-md-12">
              <div class="subtitle-1 font-weight-bolder mb-2">{{ $t("project.internalDesc") }}:</div>
              <InternalDesc :disabled="checkArchived()" />
              <b-form-textarea
                v-model="form.internal_desc_custom"
                rows="3"
                :disabled="checkArchived()"
                @input="edited = true"
              ></b-form-textarea>
            </div>
          </div>

          <div class="row mt-4">
            <div class="col-md-3">
              <b-form-checkbox class="break-box" :checked="form.internal" @change="form.internal = !form.internal">{{
                $t("button.internal")
              }}</b-form-checkbox>
              <b-form-checkbox
                class="break-box"
                :checked="form.only_my_company"
                @change="form.only_my_company = !form.only_my_company"
                >{{ $t("button.myCompanyOnly") }}</b-form-checkbox
              >
            </div>
          </div>

          <!-- Actions -->
          <div class="mt-6">
            <b-button
              variant="danger"
              class="del-btn mr-2"
              :disabled="checkEdited() || loadingDelete"
              @click="remove_dialog = true"
            >
              <i class="flaticon2-rubbish-bin p-0 mr-2"></i>
              <span>{{ $t("button.delete") }}</span>
            </b-button>
            <b-button ref="kt_preview" class="mr-2" :disabled="loadingPreview" @click="onSubmit(false), preview()">
              <i :class="loadingPreview ? 'fas fa-spinner fa-spin' : 'flaticon-eye'" class="p-0 mr-2"></i>
              <span>Preview PDF</span>
            </b-button>
            <b-button
              variant="primary"
              class="print-btn mr-2"
              ref="kt_download"
              :disabled="checkEdited() || loadingPrint"
              @click="printPdf"
            >
              <i :class="loadingPrint ? 'fas fa-spinner fa-spin' : 'flaticon2-printer'" class="p-0 mr-2"></i>
              <span>{{ $t("button.printpdf") }}</span>
            </b-button>
            <b-button
              variant="primary"
              class="print-btn mr-2"
              ref="kt_download_doc"
              :disabled="checkEdited() || loadingDoc"
              @click="printDoc"
            >
              <i :class="loadingDoc ? 'fas fa-spinner fa-spin' : 'flaticon2-printer'" class="p-0 mr-2"></i>
              <span>{{ $t("button.printdocx") }}</span>
            </b-button>
            <b-button
              variant="primary"
              class="mail-btn mr-2"
              ref="kt_email"
              :disabled="checkEdited() || loadingMail"
              @click="sendMail"
            >
              <i :class="loadingMail ? 'fas fa-spinner fa-spin' : 'flaticon-multimedia'" class="p-0 mr-2"></i>
              <span>{{ $t("button.mail") }}</span>
            </b-button>
            <b-button variant="primary" class="save-btn" type="submit" :disabled="loadingSave" style="float: right">
              <i :class="loadingSave ? 'fas fa-spinner fa-spin' : 'flaticon2-check-mark'" class="p-0 mr-2"></i>
              <span>{{ $t("button.save") }}</span>
            </b-button>
            <b-button
              variant="primary"
              class="accept-btn mr-2"
              style="float: right"
              :disabled="checkEdited() || loadingInvoice"
              @click="initDialog"
            >
              <i :class="loadingInvoice ? 'fas fa-spinner fa-spin' : 'flaticon-price-tag'" class="p-0 mr-2"></i>
              <span>{{ $t("button.invoice") }}</span>
            </b-button>
          </div>
          <div class="spacer"></div>
          <!-- Second Actions -->
          <div class="row">
            <div class="col-md-12 action">
              <b-button variant="primary" class="copy-btn mr-2" :disabled="checkEdited() || loadingCopy" @click="copy">
                <i :class="loadingCopy ? 'fas fa-spinner fa-spin' : 'flaticon2-copy'" class="p-0 mr-2"></i>
                <span>{{ $t("button.copy") }}</span>
              </b-button>
              <b-button
                variant="success"
                class="copy-btn"
                :disabled="checkEdited() || loadingCopyOffer"
                @click="copyAsOffer"
              >
                <i :class="loadingCopyOffer ? 'fas fa-spinner fa-spin' : 'flaticon2-copy'" class="p-0 mr-2"></i>
                <span>{{ $t("button.copyAsOffer") }}</span>
              </b-button>
            </div>
          </div>
        </b-form>
      </div>
    </div>

    <!-- Remove Dialog -->
    <b-modal v-model="remove_dialog" hide-footer no-close-on-backdrop :title="`${$t('title.confirm')}`">
      <div>{{ $t("msg.delProject") }}</div>
      <div class="col-md-12 p-0 mt-4 action">
        <b-button variant="primary" class="save-btn" :disabled="loadingRemove" @click="remove">
          <i :class="loadingRemove ? 'fas fa-spinner fa-spin' : ''" class="p-0 mr-2"></i>
          {{ $t("button.confirm") }}
        </b-button>
      </div>
    </b-modal>

    <!-- Invoice Dialog -->
    <b-modal v-model="invoice_dialog" hide-footer no-close-on-backdrop :title="`${$t('menu.invoice')}`">
      <div>
        {{ $t("project.invoiceText1") }}
      </div>

      <div class="mt-4 text-primary">
        <span id="notice" class="text-danger">{{ $t("project.invoiceText2") }}</span>
        <b-tooltip show target="notice" placement="right" variant="dark">
          <div class="col-md-12 font-weight-bolder text-left">{{ $t("project.attention") }}:</div>
          <div class="col-md-12 text-left">
            {{ $t("project.attentionText") }}
          </div>
        </b-tooltip>
      </div>
      <div>{{ $t("project.invoiceAmount") }}:</div>

      <div class="mt-4" style="display: inline-flex">
        <b-form-radio
          v-model="invoice_type"
          name="invoice_radio"
          value="percent"
          class="mr-4"
          @change="setDefaultRemaining(), (final_inv = false)"
          >{{ $t("project.percent") }}</b-form-radio
        >
        <b-form-radio
          v-model="invoice_type"
          name="invoice_radio"
          value="service"
          class="mr-4"
          @change="setInvoiceByService(), (final_inv = false)"
          >{{ $t("project.service") }}</b-form-radio
        >
        <b-form-radio v-model="invoice_type" name="invoice_radio" value="hour" @change="setInvoiceByHour">{{
          $t("project.hour")
        }}</b-form-radio>
      </div>

      <div v-if="invoice_type === 'hour'" class="row mt-6">
        <div class="col-md-12" style="display: inline-flex">
          <b-form-checkbox
            size="md"
            :checked="last_month_effort"
            class="mr-4"
            @change="setInvoiceDate('last month'), setInvoiceByHour()"
          >
            {{ $t("project.lastMonth") }}
          </b-form-checkbox>
          <b-form-checkbox
            size="md"
            :checked="this_month_effort"
            class="mr-4"
            @change="setInvoiceDate('this month'), setInvoiceByHour()"
          >
            {{ $t("project.thisMonth") }}
          </b-form-checkbox>
          <b-form-checkbox size="md" :checked="all_effort" @change="setInvoiceDate('all'), setInvoiceByHour()">
            {{ $t("project.beginOfTime") }}
          </b-form-checkbox>
        </div>
      </div>
      <div class="row mt-6">
        <div class="col-md-12">
          <b-form-checkbox size="md" :checked="final_inv" @change="setFinalInvoice">
            {{ $t("invoice.finalInvoice") }}
          </b-form-checkbox>
        </div>
      </div>

      <div class="mt-4">
        <!-- Normal invoice -->
        <div v-if="invoice_type === 'percent'" class="row">
          <div class="col-md-6">
            <div class="subtitle-1 font-weight-bolder mb-2">
              {{ form.currency_val }}
            </div>
            <b-form-input id="value_number" v-model="value_number" @input="setInvoiceByAmount"></b-form-input>
          </div>
          <div class="col-md-6">
            <div class="subtitle-1 font-weight-bolder mb-2">in %</div>
            <b-form-input
              id="value_percent"
              v-model="value_percent"
              type="number"
              :min="0"
              :max="100"
              @input="setInvoiceByPercent"
            ></b-form-input>
          </div>
        </div>
        <!-- Service invoice -->
        <div v-else-if="invoice_type === 'service'" class="row">
          <div class="col-md-12">
            <div class="subtitle-1 font-weight-bolder mb-2">
              {{ $t("project.service") }}
            </div>
            <div v-for="(item, i) in services" :key="i" :title="item.name" class="service-item">
              <b-form-checkbox
                size="md"
                :checked="item.checked"
                class="mb-2"
                :disabled="item.remaining <= 0"
                @change="(item.checked = !item.checked), setInvoiceByService()"
              >
                <div class="service-name">
                  {{ item.name }}
                </div>
                <div>
                  {{
                    $t("project.remaining") +
                      ": " +
                      item.remaining +
                      " " +
                      form.currency_val +
                      " (" +
                      item.charged +
                      "% " +
                      $t("project.charged") +
                      ")"
                  }}
                </div>
              </b-form-checkbox>
              <b-form-select
                v-model="item.rate"
                :options="invoiceRates"
                value-field="value"
                text-field="name"
                style="width:100px"
                :disabled="item.remaining <= 0"
                @change="setInvoiceByService()"
              ></b-form-select>
            </div>
          </div>
        </div>
        <!-- Hour invoice -->
        <div v-else class="row">
          <div class="col-md-6">
            <div class="subtitle-1 font-weight-bolder mb-2">
              {{ $t("project.start") }}
            </div>
            <b-input-group>
              <b-form-input
                id="inv-start-select"
                v-model="start_date_inv_formatted"
                type="text"
                autocomplete="off"
                placeholder="dd.mm.yyyy"
                @blur="formatStartInvDateInvert(), setInvoiceByHour()"
              ></b-form-input>
              <b-input-group-append>
                <b-form-datepicker
                  v-model="start_date_inv"
                  :locale="locale"
                  :start-weekday="1"
                  :min="min_date"
                  button-only
                  right
                  @context="formatStartInvDate(), setInvoiceByHour()"
                ></b-form-datepicker>
              </b-input-group-append>
            </b-input-group>
          </div>
          <div class="col-md-6">
            <div class="subtitle-1 font-weight-bolder mb-2">
              {{ $t("project.end") }}
            </div>
            <b-input-group>
              <b-form-input
                id="inv-end-select"
                v-model="end_date_inv_formatted"
                type="text"
                autocomplete="off"
                placeholder="dd.mm.yyyy"
                @blur="formatEndInvDateInvert(), setInvoiceByHour()"
              ></b-form-input>
              <b-input-group-append>
                <b-form-datepicker
                  v-model="end_date_inv"
                  :locale="locale"
                  :start-weekday="1"
                  :min="min_date"
                  button-only
                  right
                  @context="formatEndInvDate(), setInvoiceByHour()"
                ></b-form-datepicker>
              </b-input-group-append>
            </b-input-group>
          </div>
          <!-- Connected companies -->
          <div class="col-md-12 mt-4">
            <div class="subtitle-1 font-weight-bolder mb-2">
              {{ $t("project.connections") }}
            </div>
            <div v-for="(item, i) in connections" :key="i">
              <b-form-checkbox
                v-model="item.selected"
                class="connection-box"
                :checked="item.selected"
                @change="(item.seleected = !item.selected), setInvoiceByHour()"
              >
                {{ item.name }}
              </b-form-checkbox>
            </div>
          </div>
          <div class="col-md-12 mt-4">
            <div class="subtitle-1 font-weight-bolder mb-2">
              {{ $t("project.service") }}
            </div>
            <div v-for="item in connected_effort_rows" :key="item.name" class="service-item">
              <div class="service-name">
                {{ item.name }}
              </div>

              <div class="service-hour font-weight-bold">
                {{ item.price + "(" + item.spent_in_hour + "h)" }}
              </div>
            </div>
            <div v-for="item in connnected_company_effort" :key="item.name" class="service-item">
              <div class="service-name text-primary">
                {{ item.name }}
              </div>

              <div class="service-hour font-weight-bold text-primary">
                {{ item.price + "(" + item.spent_in_hour + "h)" }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="row mt-4">
        <!-- Sum text -->
        <div class="col-md-4">
          <div v-if="invoice_type === 'hour'" class="font-weight-bold mb-2">{{ $t("project.totalHour") }}:</div>
          <div v-if="invoice_type === 'hour'" class="font-weight-bold mb-2">{{ $t("project.totalRate") }}:</div>
          <div class="font-weight-bold mb-2">{{ $t("project.orderTotal") }}:</div>
          <div v-if="invoice_type === 'service'" class="font-weight-bold mb-2">{{ $t("project.invoicedTotal") }}:</div>
          <div class="font-weight-bold mb-2">{{ $t("project.remainingClaim") }}:</div>
          <div class="font-weight-bold mb-2">{{ $t("quoteItems.discount") }}:</div>
          <div class="font-weight-bold">NK:</div>
        </div>
        <!-- Sum value -->
        <div class="col-md-4">
          <div v-if="invoice_type === 'hour'" class="font-weight-bold mb-2">
            {{ connected_effort.toFixed(2) + "h" }}
          </div>
          <div v-if="invoice_type === 'hour'" class="font-weight-bold mb-2">
            {{ form.currency_val + " " + formatMoney(hourRate) }}
          </div>
          <div class="font-weight-bold mb-2">
            {{
              form.currency_val +
                " " +
                (currentProject.invoices?.length > 0
                  ? `${
                      checkApplyAdditional()
                        ? formatMoney(calculatePartialRemainingRatio() * detailCost.total_net)
                        : formatMoney(remainingNet)
                    }`
                  : formatMoney(detailCost.total_net))
            }}
          </div>
          <div v-if="invoice_type === 'service'" class="font-weight-bold mb-2">
            {{ form.currency_val + " " + formatMoney(invoiced) }}
          </div>
          <div class="font-weight-bold mb-2">
            {{ form.currency_val + " " + formatMoney(remaining) }}
          </div>
          <div class="font-weight-bold mb-2">{{ this.discountPercent }}%</div>
          <div class="font-weight-bold">
            {{
              form.currency_val +
                " " +
                formatMoney(additional) +
                " (" +
                `${checkApplyAdditional() ? additionalPercent : 0}` +
                "%)"
            }}
          </div>
        </div>
      </div>

      <!-- Action -->
      <div class="col-md-12 p-0 mt-6 action">
        <b-button
          variant="primary"
          class="save-btn"
          :disabled="loadingCreateInv"
          @click="createInvoice"
          ref="create-inv-button"
        >
          <i :class="loadingCreateInv ? 'fas fa-spinner fa-spin' : 'flaticon2-check-mark'" class="p-0"></i>
        </b-button>
      </div>
    </b-modal>
  </div>
</template>

<script>
import _ from "lodash";
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
import { mapGetters, mapState } from "vuex";
import { GET_SETTINGS, GET_COMPANY, GET_USERS } from "@/core/services/store/settings";
import {
  GET_PROJECT,
  UPDATE_PROJECT,
  DELETE_PROJECT,
  COPY_PROJECT,
  COPY_PROJECT_AS_OFFER,
  EXPORT_PROJECT_PDF,
  EXPORT_PROJECT_DOC,
  CREATE_INVOICE,
  CREATE_SERVICE_INVOICE,
  CREATE_EFFORT_INVOICE,
  SET_PROJECT_TOAST,
  SET_PROJECT_ID,
  SET_PROJECT_INVOICES,
  GET_PROJECT_SERVICES,
  GET_PROJECT_EFFORT,
  GET_PROJECT_EFFORT_BY_COMPANY,
  GET_PROJECT_CONNECTION_LIST,
  GET_START_INVOICE_DATE,
  SET_PROJECT_ERROR,
  GET_PROJECT_CONNECTION_SHARES,
  PREVIEW_PROJECT_PDF
} from "@/core/services/store/project";
import { SET_SELECTEDCUSTOMER } from "@/core/services/store/customer";
import { SET_QUOTE_ITEMS, SET_DISPERCENT } from "@/core/services/store/product";
import {
  SET_KM,
  SET_KMOPTIONS,
  SET_ADDCOSTS,
  SET_INTERNAL_CHOICES,
  SET_ADDITIONAL_TOTAL
} from "@/core/services/store/offer";
import { Toast } from "@/components";
import { formatDate } from "@/common";

export default {
  name: "editProject",
  mixins: [validationMixin, Toast],
  components: {
    TextEditor,
    CustomerSelect,
    QuoteItems,
    AdditionalCosts,
    InternalDesc
  },
  metaInfo: {
    title: "Edit Project",
    meta: [
      {
        hid: "description",
        name: "description",
        content: "Edit Project Page"
      },
      {
        hid: "og:site_name",
        property: "og:site_name",
        content: "Archapp"
      },
      {
        hid: "og:title",
        property: "og:title",
        content: "Edit Project | Archapp"
      },
      {
        hid: "og:description",
        property: "og:description",
        content: "Edit Project | Archapp"
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
        assignee: "",
        location: "",
        date: "",
        date_formatted: "",
        end_on: "",
        end_on_formatted: "",
        number: "",
        address: "",
        begin_desc: "",
        end_desc: "",
        internal_desc_custom: "",
        rate_per_hour: 0.0,
        pr_begin_break: false,
        pr_quote_break: false,
        internal: false,
        only_my_company: false
      },
      invoiceRates: [
        {
          name: "25%",
          value: 0.25
        },
        {
          name: "50%",
          value: 0.5
        },
        {
          name: "75%",
          value: 0.75
        },
        {
          name: "100%",
          value: 1.0
        }
      ],
      invoice_type: "percent",
      value_number: "",
      value_percent: 100.0,
      services: [],
      invoiced: 0.0,
      remaining: 0.0,
      additional: 0.0,
      hourRate: 0.0,
      min_date: "",
      start_date_inv: "",
      start_date_inv_formatted: "",
      end_date_inv: "",
      end_date_inv_formatted: "",
      connections: [],
      connected_effort: 0.0,
      connected_effort_rows: [],
      connnected_company_effort: [],
      final_inv: false,
      all_effort: false,
      this_month_effort: false,
      last_month_effort: false,
      remove_dialog: false,
      invoice_dialog: false,
      loading: true,
      edited: false,
      loadingPreview: false,
      loadingPrint: false,
      loadingDoc: false,
      loadingMail: false,
      loadingSave: false,
      loadingCopy: false,
      loadingCopyOffer: false,
      loadingRemove: false,
      loadingCreateInv: false,
      loadingInvoice: false,
      loadingDelete: false
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
      "currentUsers",
      "currentProject",
      "selectedCustomer",
      "quoteItems",
      "discountPercent",
      "additionalTotal",
      "remainingNet",
      "projectServices",
      "currentInteralDesc",
      "currentInternalChoices",
      "selectedKm",
      "selectedAddCost",
      "additionalPercent",
      "projectEffort",
      "projectEffortRows",
      "projectEffortByCompany",
      "projectEffortByCompanyRows",
      "projectConnectionList",
      "projectConnectionShares",
      "detailCost",
      "currentPreviewProjectPDF"
    ]),
    ...mapState({
      error: state => state.project.error,
      id: state => state.project.id,
      invoice_id: state => state.invoice.id,
      vat_count: state => state.product.vat_count,
      customer_edited: state => state.customer.customer_edited,
      quote_edited: state => state.product.quote_edited,
      internal_edited: state => state.offer.internal_edited,
      pdf_code: state => state.project.pdf,
      docx_code: state => state.project.doc,
      invoice_date: state => state.project.invoice_date
    }),
    currentLanguage() {
      return i18nService.getActiveLanguage();
    }
  },
  async mounted() {
    this.$store.commit(SET_PROJECT_ID, this.$route.params.project_id);
    await this.$store.dispatch(GET_PROJECT, { id: this.id });
    await this.$store.dispatch(GET_SETTINGS);
    await this.$store.dispatch(GET_COMPANY);
    await this.$store.dispatch(GET_USERS);
    await this.$store.dispatch(GET_PROJECT_SERVICES, { id: this.id });
    this.initData();
    if (this.currentLanguage === "de") {
      this.locale = "de";
    } else {
      this.locale = "en-US";
    }
    this.loading = !this.loading;
  },
  watch: {
    end_date_inv(value) {
      if (value !== moment().format("YYYY-MM-DD")) {
        this.all_effort = false;
      }
    }
  },
  methods: {
    initData() {
      this.form.name = this.currentProject.name;
      this.form.location = this.currentProject.location;
      if (this.currentProject.date) {
        this.form.date = moment(this.currentProject.date).format("YYYY-MM-DD");
        this.form.date_formatted = formatDate(this.currentProject.date);
      }
      if (this.currentProject.end_on) {
        this.form.end_on = moment(this.currentProject.end_on).format("YYYY-MM-DD");
        this.form.end_on_formatted = formatDate(this.currentProject.end_on);
      }
      if (this.currentProject.assignee) {
        this.form.assignee = this.currentProject.assignee.id;
      }
      this.form.number = this.currentProject.number.custom_id
        ? this.currentProject.number.custom_id
        : this.currentProject.number.id;
      this.form.address = this.currentProject.address;
      this.form.begin_desc = this.currentProject.begin_desc;
      this.form.end_desc = this.currentProject.end_desc;
      this.form.internal_desc_custom = this.currentProject.internal_desc_custom;
      this.form.pr_begin_break = this.currentProject.pr_begin_break;
      this.form.pr_quote_break = this.currentProject.pr_quote_break;
      this.form.internal = this.currentProject.is_internal;
      this.form.only_my_company = this.currentProject.only_my_company;
      this.form.rate_per_hour = this.currentProject.rate_per_hour || 130.0;
      if (this.currentProject.currency) {
        this.form.currency_val = this.currentProject.currency;
      } else {
        this.form.currency_val = this.currentCompany.currency;
      }
      this.$store.commit(SET_SELECTEDCUSTOMER, this.currentProject.customer);
      this.$store.commit(
        SET_QUOTE_ITEMS,
        this.currentProject.details.quote_items.map(item => {
          return {
            ...item,
            vat_rate: parseFloat(item.vat_rate)
          };
        })
      );
      this.$store.commit(SET_DISPERCENT, this.currentProject.discount_percent);
      if (this.currentProject.details) {
        this.$store.commit(SET_KMOPTIONS, this.currentSettings.offer.km_dropdown_setting);
        this.$store.commit(SET_KM, {
          label: this.currentProject.details.selected_km_label,
          value: Number(this.currentProject.details.selected_km_value ?? 0)
        });
      }
      if (this.currentProject.additional_cost) {
        this.$store.commit(SET_ADDCOSTS, this.currentProject.additional_cost);
      }
      this.$store.commit(SET_INTERNAL_CHOICES, this.currentProject.internal_desc);
      if (this.currentProject.invoices?.length > 0) {
        this.$store.commit(SET_PROJECT_INVOICES, this.currentProject.invoices);
      }
      if (this.projectServices.length > 0) {
        for (const service of this.projectServices) {
          //exclude additional individual from list
          if (!Boolean(service.is_nk === "true")) {
            this.services.push({
              id: service.uuid,
              name: service.name,
              cost: service.cost,
              remaining: this.formatMoney(service.remaining) || 0.0,
              charged: Math.round(((service.cost - service.remaining) / service.cost) * 100),
              rate: 1.0,
              checked: false
            });
          }
        }
      }
    },
    initDate() {
      let year = moment().year();
      this.min_date = year - 1 + "-01-01";

      this.start_date_inv = moment()
        .startOf("month")
        .format("YYYY-MM-DD");
      this.end_date_inv = moment()
        .endOf("month")
        .format("YYYY-MM-DD");
      this.start_date_inv_formatted = moment()
        .startOf("month")
        .format("DD.MM.YYYY");
      this.end_date_inv_formatted = moment()
        .endOf("month")
        .format("DD.MM.YYYY");
    },
    setEffortRange() {},
    setInvoiceDate(type) {
      if (type === "all") {
        this.all_effort = !this.all_effort;
        this.this_month_effort = false;
        this.last_month_effort = false;
        if (this.all_effort) {
          this.start_date_inv = moment(this.invoice_date).format("YYYY-MM-DD");
          this.end_date_inv = moment().format("YYYY-MM-DD");
          this.start_date_inv_formatted = formatDate(this.invoice_date);
          this.end_date_inv_formatted = moment().format("DD.MM.YYYY");
        }
      } else if (type === "this month") {
        this.this_month_effort = !this.this_month_effort;
        this.last_month_effort = false;
        this.all_effort = false;
        if (this.this_month_effort) {
          this.start_date_inv = moment()
            .startOf("month")
            .format("YYYY-MM-DD");
          this.end_date_inv = moment()
            .endOf("month")
            .format("YYYY-MM-DD");
          this.start_date_inv_formatted = moment()
            .startOf("month")
            .format("DD.MM.YYYY");
          this.end_date_inv_formatted = moment()
            .endOf("month")
            .format("DD.MM.YYYY");
        }
      } else if (type === "last month") {
        this.last_month_effort = !this.last_month_effort;
        this.this_month_effort = false;
        this.all_effort = false;
        if (this.last_month_effort) {
          this.start_date_inv = moment()
            .subtract(1, "months")
            .startOf("month")
            .format("YYYY-MM-DD");
          this.end_date_inv = moment()
            .subtract(1, "months")
            .endOf("month")
            .format("YYYY-MM-DD");
          this.start_date_inv_formatted = moment()
            .subtract(1, "months")
            .startOf("month")
            .format("DD.MM.YYYY");
          this.end_date_inv_formatted = moment()
            .subtract(1, "months")
            .endOf("month")
            .format("DD.MM.YYYY");
        }
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

      let selected_assignee = {};
      for (const user of this.currentUsers) {
        if (user.id === this.form.assignee) {
          selected_assignee = user;
          break;
        }
      }

      await this.$store.dispatch(UPDATE_PROJECT, {
        id: this.id,
        data: {
          name: this.form.name,
          location: this.form.location,
          date: this.form.date,
          end_on: this.form.end_on,
          assignee: selected_assignee,
          number: this.form.number.toString(),
          address: this.form.address,
          begin_desc: this.form.begin_desc,
          end_desc: this.form.end_desc,
          internal_desc: this.currentInternalChoices,
          internal_desc_custom: this.form.internal_desc_custom,
          customer: this.selectedCustomer,
          quote_items: this.quoteItems,
          discount_percent: this.discountPercent,
          km_dropdown: this.selectedKm,
          additional_cost: this.selectedAddCost,
          pr_begin_break: this.form.pr_begin_break,
          pr_quote_break: this.form.pr_quote_break,
          is_internal: this.form.internal,
          only_my_company: this.form.only_my_company,
          currency: this.form.currency_val,
          rate_per_hour: parseFloat(this.form.rate_per_hour)
        }
      });
      if (this.error) {
        this.toastMsg("error", this.error);
      } else {
        if (toHome) {
          this.$store.commit(SET_PROJECT_TOAST, {
            type: "success",
            msg: this.$t("msg.updateSuccess")
          });
          await this.$router.push("/project");
        }
      }
    },
    resetForm() {
      this.$nextTick(() => {
        this.$v.$reset();
      });
    },
    async remove() {
      if (this.loadingRemove) return;
      this.loadingRemove = true;
      try {
        await this.$store.dispatch(DELETE_PROJECT, { id: this.id });
        if (this.error) {
          this.toastMsg("error", this.error);
          this.loadingRemove = false;
        } else {
          this.$store.commit(SET_PROJECT_TOAST, {
            type: "success",
            msg: this.$t("msg.delSuccess")
          });
          await this.$router.push("/project");
          this.loadingRemove = false;
        }
      } catch (error) {
        this.loadingRemove = false;
      }
    },
    async copy() {
      if (this.loadingCopy) return;
      this.loadingCopy = true;
      try {
        await this.$store.dispatch(COPY_PROJECT, { id: this.id });
        if (this.error) {
          this.toastMsg("error", this.error);
          this.loadingCopy = false;
        } else {
          this.$store.commit(SET_PROJECT_TOAST, {
            type: "success",
            msg: this.$t("msg.copySuccess")
          });
          await this.$router.push("/project");
          this.loadingCopy = false;
        }
      } catch (error) {
        this.loadingCopy = false;
      }
    },
    async copyAsOffer() {
      if (this.loadingCopyOffer) return;
      this.loadingCopyOffer = true;
      try {
        await this.$store.dispatch(COPY_PROJECT_AS_OFFER, { id: this.id });
        if (this.error) {
          this.toastMsg("error", this.error);
          this.loadingCopyOffer = false;
        } else {
          this.$store.commit(SET_PROJECT_TOAST, {
            type: "success",
            msg: this.$t("msg.copySuccess")
          });
          await this.$router.push("/offer");
          this.loadingCopyOffer = false;
        }
      } catch (error) {
        this.loadingCopyOffer = false;
      }
    },
    async printPdf() {
      if (this.loadingPrint) return;
      this.loadingPrint = true;
      try {
        await this.$store.dispatch(EXPORT_PROJECT_PDF, {
          id: this.id,
          lang: this.currentLanguage === "de" ? "de" : "en"
        });
        const popUp = window.open(this.pdf_code, "_blank");
        if (popUp == null || typeof popUp == "undefined") {
          this.toastMsg("error", this.$t("msg.disablePopup"));
        } else {
          popUp.focus();
        }
      } finally {
        this.loadingPrint = false;
      }
    },
    async printDoc() {
      if (this.loadingDoc) return;
      this.loadingDoc = true;
      try {
        await this.$store.dispatch(EXPORT_PROJECT_DOC, {
          id: this.id,
          lang: this.currentLanguage === "de" ? "de" : "en"
        });
        const popUp = window.open(this.pdf_code, "_blank");
        if (popUp == null || typeof popUp == "undefined") {
          this.toastMsg("error", this.$t("msg.disablePopup"));
        } else {
          popUp.focus();
        }
      } finally {
        this.loadingDoc = false;
      }
    },
    async sendMail() {
      if (this.loadingMail) return;
      this.loadingMail = true;
      try {
        await this.$store.dispatch(EXPORT_PROJECT_PDF, { id: this.id });
        if (this.error) {
          this.toastMsg("error", this.error);
        } else {
          const download = this.handleDownload(this.pdf_code);
          const emailTo = this.selectedCustomer.email ? this.selectedCustomer.email : "";
          const subject = this.$t("menu.project");
          const body =
            this.$t("email.salutation") +
            "\n\n" +
            this.$t("email.projectIntro") +
            download +
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
      } finally {
        this.loadingMail = false;
      }
    },
    async createInvoice() {
      if (this.loadingCreateInv) return;
      this.loadingCreateInv = true;
      try {
        if (this.invoice_type === "percent") {
          await this.$store.dispatch(CREATE_INVOICE, {
            id: this.id,
            data: {
              amount: parseFloat(this.value_number),
              percent: parseFloat(this.value_percent),
              total:
                this.currentProject.invoices?.length > 0
                  ? parseFloat(this.remainingNet)
                  : parseFloat(this.detailCost.total_net),
              remaining: parseFloat(this.remaining),
              additional_cost: parseFloat(this.additional),
              additional_percent: this.checkApplyAdditional() ? parseFloat(this.additionalPercent) : 0,
              is_final: this.final_inv
            },
            locale: this.locale
          });
        } else if (this.invoice_type === "service") {
          let selected_service = [];
          for (const selected of this.services) {
            for (const item of this.projectServices) {
              if (selected.checked && item.uuid === selected.id) {
                const sv = item;
                sv.invoice_rate = selected.rate;
                selected_service.push(sv);
              }
            }
          }

          await this.$store.dispatch(CREATE_SERVICE_INVOICE, {
            id: this.id,
            data: {
              service: selected_service,
              total:
                this.currentProject.invoices?.length > 0
                  ? parseFloat(this.remainingNet)
                  : parseFloat(this.detailCost.total_net),
              remaining: parseFloat(this.remaining),
              additional_cost: parseFloat(this.additional),
              additional_percent: this.checkApplyAdditional() ? parseFloat(this.additionalPercent) : 0,
              is_final: this.final_inv
            },
            locale: this.locale
          });
        } else {
          let arr = [...this.connected_effort_rows, ...this.connnected_company_effort];
          await this.$store.dispatch(CREATE_EFFORT_INVOICE, {
            id: this.id,
            data: {
              total: parseFloat(this.connected_effort),
              rows: arr,
              additional_cost: parseFloat(this.additional),
              additional_percent: this.checkApplyAdditional() ? parseFloat(this.additionalPercent) : 0,
              start_date: this.start_date_inv,
              end_date: this.end_date_inv,
              is_final: this.final_inv
            },
            locale: this.locale
          });
        }

        if (this.error) {
          this.toastMsg("error", this.error);
          this.loadingCreateInv = false;
        } else {
          this.invoice_dialog = false;
          this.toast("Create invoice successful!", "success");
          await this.$router.push(`/invoice/${this.invoice_id}`);
          this.loadingCreateInv = false;
        }
      } catch (error) {
        this.loadingCreateInv = false;
      }
    },
    checkApplyAdditional() {
      let nk = false;
      for (const item of this.quoteItems) {
        if (item.is_nk) {
          nk = true;
          break;
        }
      }
      return nk;
    },
    calculatePartialRemainingRatio() {
      let ratio = this.remainingNet / (this.detailCost.total_net + this.additionalTotal);
      return ratio;
    },
    async initDialog() {
      if (this.loadingInvoice) return;
      this.loadingInvoice = true;
      try {
        //handle connected project
        if (this.currentProject.is_connected) {
          await this.$store.dispatch(GET_PROJECT_CONNECTION_SHARES, {
            id: this.id
          });
          let arr = [];
          for (const connection of this.projectConnectionShares) {
            const item = {
              id: connection.id,
              name: connection.name,
              selected: true
            };
            arr.push(item);
          }
          this.connections = arr;
        }

        this.initDate();
        if (this.currentProject.invoices?.length > 0) {
          if (this.checkApplyAdditional()) {
            let ratio = this.calculatePartialRemainingRatio();
            this.value_number = parseFloat(this.detailCost.total_net * ratio).toFixed(2);
            this.additional = this.additionalTotal * ratio;
          } else {
            this.value_number = parseFloat(this.remainingNet).toFixed(2);
            this.additional = parseFloat(0);
          }
        } else {
          this.value_number = parseFloat(this.detailCost.total_net).toFixed(2);
          if (this.checkApplyAdditional()) {
            this.additional = parseFloat(this.detailCost.total_net) * (parseFloat(this.additionalPercent) / 100);
          } else {
            this.additional = 0;
          }
        }
        this.remaining = parseFloat(0);
        this.value_percent = parseFloat(100);
        if (this.currentProject.invoice_type) {
          if (this.currentProject.invoice_type === "service") {
            for (const item of this.services) {
              item.checked = false;
            }
            this.invoice_type = "service";
            this.setInvoiceByService();
          } else if (this.currentProject.invoice_type === "hour") {
            this.invoice_type = "hour";
            this.setInvoiceByHour();
          } else {
            this.invoice_type = "percent";
          }
        } else {
          this.invoice_type = "percent";
        }
        await this.$store.dispatch(GET_START_INVOICE_DATE, {
          id: this.currentProject.id
        });
        this.final_inv = false;
        this.all_effort = false;
        this.invoice_dialog = true;
      } finally {
        this.loadingInvoice = false;
      }
    },
    setDefaultRemaining() {
      this.remaining = parseFloat(0);
    },
    setInvoiceByAmount(e) {
      if (e) {
        let val = 0.0;
        let nk = 0.0;
        if (this.currentProject.invoices?.length > 0) {
          if (this.checkApplyAdditional()) {
            let ratio = this.calculatePartialRemainingRatio();
            val = parseFloat(this.detailCost.total_net * ratio) - parseFloat(e);
            this.value_percent = ((parseFloat(e) / parseFloat(this.detailCost.total_net * ratio)) * 100).toFixed(2);
            nk = parseFloat(e);
          } else {
            val = parseFloat(this.remainingNet) - parseFloat(e);
            this.value_percent = ((parseFloat(e) / parseFloat(this.remainingNet)) * 100).toFixed(2);
            nk = 0;
          }
        } else {
          val = parseFloat(this.detailCost.total_net) - parseFloat(e);
          this.value_percent = ((parseFloat(e) / parseFloat(this.detailCost.total_net)) * 100).toFixed(2);
          if (this.checkApplyAdditional()) {
            nk = (parseFloat(this.detailCost.total_net + this.detailCost.total_discount) * this.value_percent) / 100;
          } else {
            nk = 0;
          }
        }
        this.remaining = val;
        this.additional = nk * (parseFloat(this.additionalPercent) / 100);
      } else {
        this.remaining = parseFloat(0);
        this.value_percent = parseFloat(0);
        this.additional = parseFloat(0);
      }
    },
    setInvoiceByPercent(e) {
      if (e) {
        let val = 0.0;
        let nk = 0.0;
        if (this.currentProject.invoices?.length > 0) {
          if (this.checkApplyAdditional()) {
            let ratio = this.calculatePartialRemainingRatio();
            let total = this.detailCost.total_net * ratio;
            val = (parseFloat(total) * parseFloat(e)) / 100;
            nk = val;
            this.remaining = parseFloat(total) - val;
          } else {
            val = (parseFloat(this.remainingNet) * parseFloat(e)) / 100;
            nk = 0;
            this.remaining = parseFloat(this.remainingNet) - val;
          }
        } else {
          val = (parseFloat(this.detailCost.total_net) * parseFloat(e)) / 100;
          this.remaining = parseFloat(this.detailCost.total_net) - val;
          if (this.checkApplyAdditional()) {
            nk = (parseFloat(this.detailCost.total_net + this.detailCost.total_discount) * parseFloat(e)) / 100;
          } else {
            nk = 0;
          }
        }
        this.value_number = parseFloat(val).toFixed(2);
        this.additional = parseFloat(nk) * (parseFloat(this.additionalPercent) / 100);
      } else {
        this.remaining = parseFloat(0);
        this.value_number = parseFloat(0);
        this.additional = parseFloat(0);
      }
    },
    setInvoiceByService() {
      let val = 0.0;
      let cost = 0.0;
      for (const selected of this.services) {
        for (const item of this.projectServices) {
          if (selected.checked && selected.id === item.uuid) {
            cost +=
              (parseFloat(item.cost) - parseFloat(item.cost) * (parseFloat(this.discountPercent) / 100)) *
              selected.rate;
          }
        }
      }
      this.invoiced = cost;
      if (this.checkApplyAdditional()) {
        //additional value exclude discount
        this.additional = cost * (parseFloat(this.additionalPercent) / 100);
      } else {
        this.additional = 0;
      }
      if (this.currentProject.invoices?.length > 0) {
        val = parseFloat(this.remainingNet) - cost - this.additional;
      } else {
        val = parseFloat(this.detailCost.total_net) - cost;
      }

      this.remaining = val;
    },
    async setInvoiceByHour() {
      let val = 0.0;
      let rate = 0.0;
      let connected_rate = 0.0;
      let connected_hours = 0.0;
      this.connected_effort_rows = [];
      this.connnected_company_effort = [];
      if (this.start_date_inv <= this.end_date_inv) {
        //handle connected projects
        if (this.currentProject.is_connected) {
          await this.$store.dispatch(GET_PROJECT_CONNECTION_LIST, {
            id: this.id
          });
          for (const item of this.projectConnectionList) {
            for (const connection of this.connections) {
              if (item.company_id === connection.id && connection.selected) {
                await this.$store.dispatch(GET_PROJECT_EFFORT_BY_COMPANY, {
                  company_id: item.company_id,
                  id: item.id,
                  start_date: this.start_date_inv,
                  end_date: this.end_date_inv,
                  all_effort: this.all_effort
                });
                connected_hours += parseFloat(this.projectEffortByCompany);
                this.connnected_company_effort = _.uniqBy(
                  [...this.connnected_company_effort, ...this.projectEffortByCompanyRows],
                  "name"
                );
                // rate by connected services
                for (const service of this.projectEffortByCompanyRows) {
                  connected_rate += service.price * service.spent_in_hour;
                }
              }
            }
          }
        }

        await this.$store.dispatch(GET_PROJECT_EFFORT, {
          id: this.id,
          start_date: this.start_date_inv,
          end_date: this.end_date_inv,
          all_effort: this.all_effort
        });
        // rate by services
        for (const service of this.projectEffortRows) {
          rate += service.price * service.spent_in_hour;
        }
        rate += connected_rate;
        if (this.currentProject.invoices?.length > 0) {
          if (this.checkApplyAdditional()) {
            let ratio = this.calculatePartialRemainingRatio();
            val = parseFloat(this.detailCost.total_net * ratio) - rate;
            this.additional = rate * (parseFloat(this.additionalPercent) / 100);
          } else {
            val = parseFloat(this.remainingNet) - rate;
            this.additional = 0;
          }
        } else {
          val = parseFloat(this.detailCost.total_net) - rate;
          if (this.checkApplyAdditional()) {
            this.additional = rate * (parseFloat(this.additionalPercent) / 100);
          } else {
            this.additional = 0;
          }
        }
        this.hourRate = rate;
        this.connected_effort = connected_hours + parseFloat(this.projectEffort);
        this.connected_effort_rows = [...this.projectEffortRows];
        this.remaining = val;
      }
    },
    setFinalInvoice() {
      this.final_inv = !this.final_inv;
      if (this.final_inv) {
        if (this.invoice_type === "percent") {
          if (this.currentProject.invoices?.length > 0) {
            if (this.checkApplyAdditional()) {
              let ratio = this.calculatePartialRemainingRatio();
              this.value_number = parseFloat(this.detailCost.total_net * ratio).toFixed(2);
              this.additional = this.additionalTotal * ratio;
            } else {
              this.value_number = parseFloat(this.remainingNet).toFixed(2);
              this.additional = parseFloat(0);
            }
            this.value_percent = 100;
          } else {
            this.value_number = parseFloat(this.detailCost.total_net).toFixed(2);
            this.value_percent = 100;
            this.additional =
              parseFloat(this.detailCost.total_net + this.detailCost.total_discount) *
              (parseFloat(this.additionalPercent) / 100);
          }
          this.remaining = parseFloat(0);
        } else if (this.invoice_type === "service") {
          for (const item of this.services) {
            item.checked = true;
          }
          this.setInvoiceByService();
        }
      }
    },
    percentLimit() {
      if (this.currentProject.invoices?.length > 0) {
        if (parseFloat(this.value_percent) < 0) {
          this.value_number = parseFloat(0);
          this.value_percent = parseFloat(0);
          this.remaining = parseFloat(this.remainingNet);
        }
        if (parseFloat(this.value_percent) > 100) {
          this.value_number = parseFloat(this.remainingNet);
          this.value_percent = parseFloat(100);
          this.remaining = parseFloat(0);
        }
      } else {
        if (parseFloat(this.value_percent) < 0) {
          this.value_number = parseFloat(0);
          this.value_percent = parseFloat(0);
          this.remaining = parseFloat(this.detailCost.total_net);
        }
        if (parseFloat(this.value_percent) > 100) {
          this.value_number = parseFloat(this.detailCost.total_net);
          this.value_percent = parseFloat(100);
          this.remaining = parseFloat(0);
        }
      }
    },
    amountLimit() {
      if (this.currentProject.invoices?.length > 0) {
        if (parseFloat(this.value_number) < 0) {
          this.value_number = parseFloat(0);
          this.value_percent = parseFloat(0);
          this.remaining = parseFloat(this.remainingNet);
        }
        if (parseFloat(this.value_number) > parseFloat(this.remainingNet)) {
          this.value_number = parseFloat(this.remainingNet);
          this.value_percent = parseFloat(100);
          this.remaining = parseFloat(0);
        }
      } else {
        if (parseFloat(this.value_number) < 0) {
          this.value_number = parseFloat(0);
          this.value_percent = parseFloat(0);
          this.remaining = parseFloat(this.detailCost.total_net);
        }
        if (parseFloat(this.value_number) > parseFloat(this.detailCost.total_net)) {
          this.value_number = parseFloat(this.detailCost.total_net);
          this.value_percent = parseFloat(100);
          this.remaining = parseFloat(0);
        }
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
    formatEndDate() {
      if (this.form.end_on) {
        this.form.end_on_formatted = formatDate(this.form.end_on);
      }
    },
    formatEndDateInvert() {
      if (this.form.end_on_formatted) {
        const split = this.form.end_on_formatted.split(".");
        const join = split[2] + "-" + split[1] + "-" + split[0];
        this.form.end_on = join;
      }
    },
    formatStartInvDate() {
      if (this.start_date_inv) {
        this.start_date_inv_formatted = formatDate(this.start_date_inv);
      }
    },
    formatStartInvDateInvert() {
      if (this.start_date_inv_formatted) {
        const split = this.start_date_inv_formatted.split(".");
        const join = split[2] + "-" + split[1] + "-" + split[0];
        this.start_date_inv = join;
      }
    },
    formatEndInvDate() {
      if (this.end_date_inv) {
        this.end_date_inv_formatted = formatDate(this.end_date_inv);
      }
    },
    formatEndInvDateInvert() {
      if (this.end_date_inv_formatted) {
        const split = this.end_date_inv_formatted.split(".");
        const join = split[2] + "-" + split[1] + "-" + split[0];
        this.end_date_inv = join;
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
      this.$store.commit(SET_PROJECT_ERROR, null);
    },
    checkEdited() {
      if (this.edited || this.customer_edited || this.quote_edited || this.internal_edited) {
        return true;
      } else {
        return false;
      }
    },
    checkArchived() {
      if (this.currentProject.status === "archive") {
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
      if (this.loadingPreview) return;
      this.loadingPreview = true;
      try {
        await this.$store.dispatch(PREVIEW_PROJECT_PDF, {
          id: this.$route.params.project_id
        });

        // update new logic
        const popUp = window.open(this.pdf_code, "_blank");
        if (popUp == null || typeof popUp == "undefined") {
          this.toastMsg("error", this.$t("msg.disablePopup"));
        } else {
          popUp.focus();
        }

        // var byte = this.base64ToArrayBuffer(this.currentPreviewProjectPDF);
        // var blob = new Blob([byte], { type: "application/pdf" });
        // window.open(URL.createObjectURL(blob), "_blank");
      } finally {
        this.loadingPreview = false;
      }
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

.service-item {
  display: flex;
  width: 100%;
  justify-content: space-between;
}

.service-name {
  width: 300px;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}
</style>
