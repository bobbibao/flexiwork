<script lang="ts">
import OfferDetail from "./OfferDetail";
import i18n from "@/core/plugins/vue-i18n";

export default {
  ...OfferDetail,
  i18n
};
</script>

<template>
  <div class="archapp-wrapper bg-white rounded-lg border border-secondary w-100 overflow-auto position-relative">
    <div class="py-6 px-8 mb-0 sticky bg-white top-0 z-10 top-section gap-1">
      <div class="archapp-create-offer">
        <div class="sticky-action-bar">
          <div class="action-bar d-flex justify-content-between">
            <div class="d-flex">
              <ButtonCustom
                :text="$t('button.back')"
                size="sm"
                @click="goTo('/offer')"
                variant="secondary-gray"
                customClass="back-button"
              >
                <template #start-icon>
                  <ChevronLeft :width="20" :height="20" />
                </template>
              </ButtonCustom>
            </div>
            <div class="action-buttons">
              <div v-if="!!offerId" class="update-buttons-bar d-flex flex-row gap-2">
                <ButtonCustom
                  v-b-modal="'Delete-' + offerId"
                  :text="$t('button.delete')"
                  size="sm"
                  variant="link-gray"
                  :disabled="originalOffer?.status === 'deleted'"
                  class="button-custom-style"
                >
                  <template #start-icon>
                    <Trash2 :width="20" :height="20" />
                    <ConfirmModal
                      :modal-id="'Delete-' + offerId"
                      :header="$t('title.deleteOffer')"
                      :body="$t('msg.delOffer') + ' ' + currentCompany.name + '?'"
                      @confirm="!!$event && handleDeleteOffer()"
                    />
                  </template>
                </ButtonCustom>
                <ButtonCustom
                  :text="$t('button.previewPdf')"
                  size="sm"
                  variant="link-gray"
                  @click="handlePreviewPdf"
                  class="button-custom-style"
                >
                  <template #start-icon>
                    <Eye :width="30" :height="30" />
                  </template>
                </ButtonCustom>
                <b-dropdown size="md" variant="link-gray" class="button-custom-style">
                  <template #button-content>
                    <div style="font-size: 14px; font-weight: 500;">{{ $t("button.more") }}</div>
                  </template>
                  <b-dropdown-item
                    class="button-dropdown-item"
                    style="font-size: 14px; font-weight: 500;"
                    @click="handleCopyOffer"
                    >{{ $t("button.copy") }}</b-dropdown-item
                  >
                  <b-dropdown-item
                    class="button-dropdown-item"
                    style="font-size: 14px; font-weight: 500;"
                    @click="handleSendMail"
                    >{{ $t("button.mail") }}</b-dropdown-item
                  >
                  <b-dropdown-item
                    class="button-dropdown-item"
                    style="font-size: 14px; font-weight: 500;"
                    @click="handlePrintPdf"
                    >{{ $t("button.printpdf") }}</b-dropdown-item
                  >
                  <b-dropdown-item
                    class="button-dropdown-item"
                    style="font-size: 14px; font-weight: 500;"
                    @click="handlePrintDocx"
                    >{{ $t("button.printdocx") }}</b-dropdown-item
                  >
                  <b-dropdown-item
                    class="button-dropdown-item"
                    style="font-size: 14px; font-weight: 500;"
                    @click="acceptDialog = true"
                    >{{ $t("button.acceptOffer") }}</b-dropdown-item
                  >
                </b-dropdown>
                <ButtonCustom
                  :text="$t('button.update')"
                  size="sm"
                  @click="handleSubmit"
                  :disabled="!allowSubmit() || isSaving"
                  :loading="isSaving"
                />
              </div>
              <div v-else class="create-button-bar d-flex">
                <ButtonCustom
                  :text="$t('button.create')"
                  size="sm"
                  @click="handleSubmit"
                  :disabled="isSaving"
                  :loading="isSaving"
                >
                  <template #start-icon></template>
                </ButtonCustom>
              </div>
            </div>
          </div>
        </div>
        <div v-if="loading" class="text-center text-danger my-2">
          <b-spinner class="align-middle"></b-spinner>
        </div>
        <div v-else class="offer-detail">
          <form class="offer-form" @submit.prevent="handleSubmit" :class="{ 'pointer-events-none': isSaving }">
            <div class="require-block">
              <div class="input-container">
                <div class="input-label col-4 p-0">
                  {{ $t("offer.name") }}
                </div>
                <div class="col-6 px-0">
                  <div
                    @click="openCustomerSelector"
                    class="select-customer-input w-100 d-flex justify-content-between"
                    :class="{ disabled: checkArchived() }"
                  >
                    <slot name="title">
                      <div style="text-overflow: ellipsis;">
                        {{
                          currentOffer.customer?.company
                            ? currentOffer.customer.company
                            : currentOffer.customer?.first_name || currentOffer.customer?.last_name
                            ? `${currentOffer.customer.first_name || ""}, ${currentOffer.customer.last_name || ""}`
                            : currentOffer.customer?.details?.company
                            ? currentOffer.customer.details.company
                            : currentOffer.customer?.details?.first_name || currentOffer.customer?.details?.last_name
                            ? `${currentOffer.customer.details.first_name || ""}, ${currentOffer.customer.details
                                .last_name || ""}`
                            : currentOffer.customer?.details?.address || $t("button.selectCustomer")
                        }}
                      </div>
                    </slot>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M5 7.5L10 12.5L15 7.5"
                        stroke="#667085"
                        stroke-width="1.66667"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                  </div>
                </div>
              </div>
              <div class="input-container">
                <div class="input-label col-4 p-0">
                  {{ $t("offer.offer") }}
                </div>
                <div class="col-6 px-0">
                  <b-form-input
                    id="offerTitle"
                    v-model="currentOffer.name"
                    :state="validation.name.touched ? validation.name.valid : null"
                    aria-describedby="offer-title"
                    :placeholder="$t('offer.enterTitle')"
                    :disabled="checkArchived()"
                    required
                    @blur="validateField('name', currentOffer.name)"
                  />
                  <b-form-invalid-feedback id="offer-title" v-if="!validation.name.valid">
                    {{ validation.name.message }}
                  </b-form-invalid-feedback>
                </div>
              </div>
              <div class="input-container">
                <div class="input-label col-4 p-0">
                  {{ $t("offer.location") }}
                </div>
                <div class="col-6 px-0">
                  <b-form-input
                    id="offerLocation"
                    v-model="currentOffer.location"
                    :placeholder="$t('offer.enterLocation')"
                    :state="validation.location.touched ? validation.location.valid : null"
                    :disabled="checkArchived()"
                    @blur="validateField('location', currentOffer.location)"
                    aria-describedby="offer-location"
                  ></b-form-input>

                  <b-form-invalid-feedback id="offer-location" v-if="!validation.location.valid">
                    {{ validation.location.message }}
                  </b-form-invalid-feedback>
                </div>
              </div>
              <div class="input-container">
                <div class="input-label col-4 p-0">
                  {{ $t("offer.date") }}
                </div>
                <div class="col-6 px-0">
                  <b-input-group>
                    <b-form-input
                      v-model="currentOffer.date_formatted"
                      type="text"
                      autocomplete="off"
                      :disabled="checkArchived()"
                      placeholder="dd.mm.yyyy"
                      readonly
                      :style="checkArchived() ? 'background-color: #f3f6f9 !important;' : ''"
                    ></b-form-input>
                    <b-input-group-append>
                      <b-form-datepicker
                        v-model="currentOffer.date"
                        :locale="locale"
                        :start-weekday="1"
                        button-only
                        right
                        :disabled="checkArchived()"
                        @context="formatDate"
                      ></b-form-datepicker>
                    </b-input-group-append>
                  </b-input-group>
                </div>
              </div>
              <div class="input-container">
                <div class="input-label col-4 p-0">
                  Offer Type
                </div>
                <div class="col-6 px-0">
                  <b-form-input
                    id="offerType"
                    v-model="currentOffer.title"
                    :placeholder="$t('offer.enterType')"
                    :state="validation.title.touched ? validation.title.valid : null"
                    :disabled="checkArchived()"
                    @blur="validateField('title', currentOffer.title)"
                    aria-describedby="offer-type"
                  ></b-form-input>
                  <b-form-invalid-feedback id="offer-type" v-if="!validation.title.valid">
                    {{ validation.title.message }}
                  </b-form-invalid-feedback>
                </div>
              </div>
              <div class="input-container">
                <div class="input-label col-4 p-0">
                  {{ $t("settings.form.offer.subtitle") }}
                </div>
                <div class="col-6 px-0">
                  <b-form-select
                    id="offerSubtitles"
                    v-model="currentOffer.subtitle"
                    :options="subtitleOptions"
                    value-field="label"
                    :disabled="checkArchived()"
                    text-field="label"
                  ></b-form-select>
                </div>
              </div>
            </div>

            <!-- section 1 -->
            <div class="optional-container">
              <Accordion name="begin">
                <template #title>
                  <EditableTitle
                    :value="currentOffer.begin"
                    :disabled="checkArchived()"
                    @update="currentOffer.begin = $event"
                  />
                </template>
                <template #body>
                  <ContentEditor :disabled="checkArchived()" v-model="currentOffer.begin_desc" />
                  <div class="d-flex flex-row align-items-center gap-2">
                    <input
                      id="begin-break"
                      type="checkbox"
                      v-model="currentOffer.begin_break"
                      :checked="false"
                      class="cursor-pointer"
                      :disabled="checkArchived()"
                    />
                    <label for="begin-break" class="mb-0 cursor-pointer">{{ $t("button.breakPage") }}</label>
                  </div>
                </template>
              </Accordion>
            </div>

            <!-- section 2 -->
            <div class="optional-container">
              <Accordion name="performance">
                <template #title>
                  <EditableTitle
                    :value="currentOffer.performance"
                    :disabled="checkArchived()"
                    @update="currentOffer.performance = $event"
                  />
                </template>
                <template #body>
                  <ContentEditor :disabled="checkArchived()" v-model="currentOffer.performance_desc" />
                  <div class="d-flex flex-row gap-2">
                    <input
                      id="performance_break"
                      type="checkbox"
                      v-model="currentOffer.performance_break"
                      :checked="false"
                      class="cursor-pointer"
                      :disabled="checkArchived()"
                    />
                    <label for="performance_break" class="mb-0 cursor-pointer">{{ $t("button.breakPage") }}</label>
                  </div>
                </template>
              </Accordion>
            </div>

            <!-- section 3a -->
            <div class="optional-container">
              <Accordion name="estimate_cost">
                <template #title>
                  <EditableTitle
                    :value="currentOffer.estimate_cost"
                    :disabled="checkArchived()"
                    @update="currentOffer.estimate_cost = $event"
                  />
                </template>
                <template #body>
                  <div class="cost-estimate">
                    <table>
                      <thead>
                        <tr>
                          <th style="width: 15%;">BKP</th>
                          <th style="width: 30%;">Bezeichnung</th>
                          <th style="width: 20%;">Kosten</th>
                          <th style="width: 35%;"></th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="(costEstimateItem, i) in currentOffer.cost_estimate" :key="i">
                          <td>{{ costEstimateItem.order || costEstimateItem?.id || "" }}</td>
                          <td>{{ costEstimateItem.label }}</td>
                          <td>{{ currentOffer.currency_val }}</td>
                          <td>
                            <b-form-input
                              type="number"
                              class="cost-estimate-input"
                              size="sm"
                              style="text-align: right;"
                              v-model="currentOffer.cost_estimate[i].value"
                              @blur="handleBlur(i)"
                              :disabled="checkArchived()"
                              :style="
                                checkArchived() ? 'background-color: #f3f6f9 !important; cursor: not-allowed;' : ''
                              "
                            ></b-form-input>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div class="total d-flex flex-row justify-content-between">
                    <div class="message">{{ $t("offer.totalCostsExclVat", { vat: calculateVat }) }}</div>
                    <div class="total-sum" style="padding-right: 16px">{{ formatMoney(totalSum) }}</div>
                  </div>
                </template>
              </Accordion>
            </div>

            <!-- section 3b -->
            <div class="optional-container">
              <Accordion name="parameter">
                <template #title>
                  <EditableTitle
                    :value="currentOffer.parameter"
                    :disabled="checkArchived()"
                    @update="currentOffer.parameter = $event"
                  />
                </template>
                <template #body>
                  <ContentEditor :disabled="checkArchived()" v-model="currentOffer.parameter_desc" />
                  <div class="additional-cost-text">
                    {{ $t("offer.additional") + " " + currentOffer.estimate_cost }}
                  </div>
                  <div class="d-flex flex-row gap-2">
                    <input
                      id="parameter_break"
                      v-model="currentOffer.parameter_break"
                      type="checkbox"
                      :disabled="checkArchived()"
                      :checked="false"
                      class="cursor-pointer"
                    />
                    <label for="parameter_break" class="mb-0 cursor-pointer">{{ $t("button.breakPage") }}</label>
                  </div>
                </template>
              </Accordion>
            </div>

            <!-- section 4 -->
            <div class="optional-container">
              <Accordion name="test-accordion-4">
                <template #title>
                  <EditableTitle
                    :value="currentOffer.offer"
                    :disabled="checkArchived()"
                    @update="currentOffer.offer = $event"
                  />
                </template>
                <template #body>
                  <Accordion name="cost-generation" :alwaysOpen="true">
                    <template #title>
                      {{ $t("offer.messerliCal") }}
                    </template>
                    <template #body>
                      <div class="cost-generation-block d-flex flex-row flex-wrap justify-content-between w-100">
                        <div class="cost-item col-4 pb-2">
                          <label>{{ currentOffer.cost_generate.coefficients_z1?.label }}</label>
                          <b-form-input
                            id="coefficients_z1"
                            :value="currentOffer.cost_generate.coefficients_z1?.value"
                            disabled
                            size="sm"
                          />
                        </div>
                        <div class="cost-item col-4">
                          <label>{{ currentOffer.cost_generate.coefficients_z2?.label }}</label>
                          <b-form-input
                            id="coefficients_z2"
                            type="text"
                            :value="formatMoney(currentOffer.cost_generate.coefficients_z2?.value)"
                            disabled
                            size="sm"
                          />
                        </div>
                        <div class="cost-item col-4">
                          <label>{{ currentOffer.cost_generate.basic_factor?.label }}</label>
                          <b-form-input
                            id="basic_factor"
                            type="text"
                            :value="formatMoney(currentOffer.cost_generate.basic_factor?.value)"
                            disabled
                            size="sm"
                          />
                        </div>
                        <div class="cost-item col-4">
                          <label>{{ currentOffer.cost_generate.construction_cost?.label }}</label>
                          <b-form-input
                            id="construction_cost"
                            type="text"
                            :value="formatMoney(currentOffer.cost_generate.construction_cost?.value)"
                            size="sm"
                            @change="updateCostGenerate('construction_cost', $event)"
                            :disabled="checkArchived()"
                          />
                        </div>
                        <div class="cost-item col-4">
                          <label>{{ currentOffer.cost_generate.team_factor?.label }}</label>
                          <b-form-input
                            id="team_factor"
                            type="text"
                            :value="formatMoney(currentOffer.cost_generate.team_factor?.value)"
                            size="sm"
                            @change="updateCostGenerate('team_factor', $event)"
                            :disabled="checkArchived()"
                          />
                        </div>
                        <div class="cost-item col-4">
                          <label>{{ currentOffer.cost_generate.u_factor?.label }}</label>
                          <b-form-input
                            id="u_factor"
                            type="text"
                            :value="formatMoney(currentOffer.cost_generate.u_factor?.value)"
                            size="sm"
                            @change="updateCostGenerate('u_factor', $event)"
                            :disabled="checkArchived()"
                          />
                        </div>
                        <div class="cost-item col-4">
                          <label>{{ currentOffer.cost_generate.time?.label }}</label>
                          <b-form-input
                            id="time"
                            type="text"
                            :value="formatMoney(currentOffer.cost_generate.time?.value)"
                            size="sm"
                            @change="updateCostGenerate('time', $event)"
                            :disabled="checkArchived()"
                          />
                        </div>
                        <div class="cost-item col-4">
                          <label>{{ currentOffer.cost_generate.advertised?.label }}</label>
                          <b-form-input
                            id="advertised"
                            type="text"
                            :value="formatMoney(currentOffer.cost_generate.advertised?.value)"
                            size="sm"
                            @change="updateCostGenerate('advertised', $event)"
                            :disabled="checkArchived()"
                          />
                        </div>
                        <div class="cost-item col-4 px-0 d-inline-flex align-self-end gap-1" @click="toggleGenType()">
                          <input type="checkbox" :value="genType" :disabled="checkArchived()" />
                          <!-- advertised -->
                          {{ $t("offer.genType") }}
                        </div>
                      </div>
                      <div class="d-flex flex-row justify-content-center col-12">
                        <ButtonCustom
                          v-if="!checkArchived()"
                          type="button"
                          :text="$t('button.generate')"
                          size="sm"
                          @click="handleGenerateProducts"
                        />
                      </div>
                    </template>
                  </Accordion>
                  <ContentEditor v-model="currentOffer.offer_desc" :disabled="checkArchived()" />
                  <div class="d-flex flex-row gap-2">
                    <input
                      id="offer_break"
                      type="checkbox"
                      v-model="currentOffer.offer_break"
                      :disabled="checkArchived()"
                      :checked="currentOffer.offer_break"
                      class="cursor-pointer"
                    />
                    <label for="offer_break" class="mb-0 cursor-pointer">{{ $t("button.breakPage") }}</label>
                  </div>

                  <QuoteItems
                    :currency="currentOffer.currency_val"
                    :quoteItems="currentOffer.quote_items"
                    :disabled="checkArchived()"
                    :additionalCost="additionalCost"
                    :discountPercent="currentOffer.discount_percent"
                    @update:quoteItems="updateQuoteItems"
                    @update:discountPercent="currentOffer.discount_percent = $event"
                  />
                  <div class="d-flex flex-row gap-2">
                    <input
                      id="offer-quote_break"
                      type="checkbox"
                      :checked="currentOffer.offer_quote_break"
                      :disabled="checkArchived()"
                      v-model="currentOffer.offer_quote_break"
                      class="cursor-pointer"
                    />
                    <label for="offer-quote_break" class="mb-0 cursor-pointer">{{ $t("button.breakPage") }}</label>
                  </div>
                </template>
              </Accordion>
            </div>

            <!-- section 5 -->
            <div class="optional-container">
              <Accordion name="additional-cost">
                <template #title>
                  <EditableTitle
                    :value="currentOffer.additional"
                    :disabled="checkArchived()"
                    @update="currentOffer.additional = $event"
                  />
                </template>
                <template #body>
                  <AdditionalCosts
                    :companyName="currentCompany.name"
                    :additionalDesc="currentOffer.additional_desc"
                    :selected_km_label="selected_km_label"
                    :defaultKmOptions="defaultKmOptions"
                    :defaultAdditionalOptions="defaultAdditionalOptions"
                    @addQuoteItem="addQuoteItem"
                    @update:additionalDesc="currentOffer.additional_desc = $event"
                    @update:selected_km_label="selected_km_label = $event"
                    :disabled="checkArchived()"
                  />
                  <div class="d-flex flex-row gap-2" @click="() => {}">
                    <input
                      id="additional_break"
                      type="checkbox"
                      :checked="currentOffer.additional_break"
                      :disabled="checkArchived()"
                      v-model="currentOffer.additional_break"
                      class="cursor-pointer"
                    />
                    <label for="additional_break" class="mb-0 cursor-pointer">{{ $t("button.breakPage") }}</label>
                  </div>
                </template>
              </Accordion>
            </div>

            <!-- section 6 -->
            <div class="optional-container">
              <Accordion name="event">
                <template #title>
                  <EditableTitle
                    :value="currentOffer.event"
                    :disabled="checkArchived()"
                    @update="currentOffer.event = $event"
                  />
                </template>
                <template #body>
                  <div class="w-100">
                    <EventTable
                      :events="currentOffer.events"
                      @update:events="currentOffer.events = $event"
                      :disabled="checkArchived()"
                    />
                  </div>
                  <div class="d-flex flex-row gap-2" @click="() => {}">
                    <input
                      id="event_break"
                      type="checkbox"
                      v-model="currentOffer.event_break"
                      :checked="currentOffer.event_break"
                      :disabled="checkArchived()"
                      class="cursor-pointer"
                    />
                    <label for="event_break" class="mb-0 cursor-pointer">{{ $t("button.breakPage") }}</label>
                  </div>
                </template>
              </Accordion>
            </div>

            <!-- section 7 -->
            <div class="optional-container">
              <Accordion name="end">
                <template #title>
                  <EditableTitle
                    :value="currentOffer.end"
                    :disabled="checkArchived()"
                    @update="currentOffer.end = $event"
                  />
                </template>
                <template #body>
                  <ContentEditor v-model="currentOffer.end_desc" :disabled="checkArchived()" />
                  <InternalDesc :internalDesc.sync="currentOffer.internal_desc" :disabled="checkArchived()" />
                  <b-form-textarea
                    style="border: 1px solid #e4e7ec; border-radius: 8px; padding: 10px 14px;"
                    :placeholder="$t('offer.enterDescription')"
                    v-model="currentOffer.internal_desc_custom"
                    :disabled="checkArchived()"
                  ></b-form-textarea>
                </template>
              </Accordion>
            </div>
          </form>
        </div>
      </div>
    </div>

    <CustomerSelector
      :dialog="dialogVisible"
      :searchQuery="searchQuery"
      :filteredCustomers="filteredCustomers"
      :selectedCustomer="selectedCustomer"
      @update:searchQuery="updateSearchQuery"
      @selectCustomer="selectCustomer"
      @cancel="cancelCustomerSelection"
      @confirm="confirmCustomerSelection"
    />

    <!-- Accept offer modal -->
    <b-modal v-model="acceptDialog" hide-footer no-close-on-backdrop :title="`${$t('title.acceptOffer')}`">
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
          v-model="acceptDateFormatted"
          type="text"
          autocomplete="off"
          @blur="formatAcceptDateInvert"
        ></b-form-input>
        <b-input-group-append>
          <b-form-datepicker
            v-model="acceptDate"
            :locale="locale"
            :start-weekday="1"
            button-only
            right
            @context="formatAcceptDate"
          ></b-form-datepicker>
        </b-input-group-append>
      </b-input-group>

      <div class="d-flex flex-row justify-content-end mt-4">
        <b-button variant="primary" class="save-btn" @click="handleAcceptOffer">
          <i class="flaticon2-check-mark p-0"></i>
        </b-button>
      </div>
    </b-modal>
  </div>
</template>

<style lang="scss" scoped>
@import "./OfferDetail.scss";
</style>
