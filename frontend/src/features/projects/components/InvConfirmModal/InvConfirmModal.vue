<script lang="ts">
import InvConfirmModal from "./InvConfirmModal";
export default InvConfirmModal;
</script>

<template>
  <b-modal v-model="dialog" hide-footer hide-header-close no-close-on-backdrop size="lg" centered scrollable>
    <template #modal-title>
      <div class="invoice-selector d-flex">
        <div class="icon-container">
          <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="4" y="4" width="48" height="48" rx="24" fill="#EEF6FF" />
            <rect x="4" y="4" width="48" height="48" rx="24" stroke="#F4F9FF" stroke-width="8" />
            <path
              d="M30 18H22C21.4696 18 20.9609 18.2107 20.5858 18.5858C20.2107 18.9609 20 19.4696 20 20V36C20 36.5304 20.2107 37.0391 20.5858 37.4142C20.9609 37.7893 21.4696 38 22 38H34C34.5304 38 35.0391 37.7893 35.4142 37.4142C35.7893 37.0391 36 36.5304 36 36V24M30 18L36 24M30 18V24H36M32 29H24M32 33H24M26 25H24"
              stroke="#2884EF"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </div>
        <div class="title-container d-flex flex-column ml-2">
          <h4 class="modal-title invoice-title">{{ $t("menu.invoice") }}</h4>
          <p class="invoice-description">{{ $t("project.invoiceText1") }}</p>
        </div>
      </div>
    </template>

    <div class="invoice-selector">
      <!-- Main Content Container with Border -->
      <div class="content-container">
        <!-- Invoice Type Selection -->
        <div class="invoice-type-selection">
          <div class="custom-radio-group">
            <div class="custom-radio-item">
              <input
                type="radio"
                id="percent-radio"
                name="invoice-type"
                :value="InvoiceType.PERCENT"
                v-model="invoiceType"
              />
              <label for="percent-radio">{{ $t("project.percent") }}</label>
            </div>
            <div class="custom-radio-item">
              <input
                type="radio"
                id="service-radio"
                name="invoice-type"
                :value="InvoiceType.SERVICE"
                v-model="invoiceType"
              />
              <label for="service-radio">{{ $t("project.service") }}</label>
            </div>
            <div class="custom-radio-item">
              <input type="radio" id="hour-radio" name="invoice-type" :value="InvoiceType.HOUR" v-model="invoiceType" />
              <label for="hour-radio">{{ $t("project.hour") }}</label>
            </div>
          </div>
        </div>

        <!-- Percent Type Content -->
        <div v-if="invoiceType === InvoiceType.PERCENT" class="percent-content">
          <div class="d-flex mb-3">
            <div class="flex-grow-1 mr-2">
              <label class="w-100 text-muted">{{ projectData.currency }}</label>
              <b-form-input
                v-model="percentAmount"
                @blur="onPercentAmountBlur"
                @keyup.enter="onPercentAmountBlur"
              ></b-form-input>
            </div>
            <div class="flex-grow-1 ml-2">
              <label class="w-100 text-muted">in %</label>
              <b-form-input
                v-model="percentValue"
                type="number"
                :min="0"
                :max="100"
                @blur="onPercentValueBlur"
                @keyup.enter="onPercentValueBlur"
              ></b-form-input>
            </div>
          </div>
        </div>

        <!-- Service Type Content -->
        <div v-if="invoiceType === InvoiceType.SERVICE" class="service-content">
          <h5 class="service-header">{{ $t("project.service") }}</h5>
          <div class="service-items">
            <div v-for="(service, index) in services" :key="index" class="service-item">
              <div class="d-flex">
                <div class="service-name-container d-flex flex-grow-1">
                  <b-form-checkbox
                    v-model="service.checked"
                    class="mr-1"
                    :disabled="service.remaining <= 0"
                    @change="setInvoiceByService()"
                    :id="`service-checkbox-${index}`"
                  ></b-form-checkbox>
                  <label :for="`service-checkbox-${index}`" class="service-label flex-grow-1">
                    <div class="service-name">{{ service.name }}</div>
                    <div class="service-remaining text-muted">
                      {{
                        $t("project.remaining") +
                          ": " +
                          formatMoney(service.remaining) +
                          " " +
                          projectData.currency +
                          " (" +
                          (service.charged || "0") +
                          "% " +
                          $t("project.charged") +
                          ")"
                      }}
                    </div>
                  </label>
                </div>
                <div class="service-percentage-selector ml-3">
                  <b-form-select
                    v-model="service.rate"
                    :options="invoiceRates"
                    :disabled="service.remaining <= 0"
                    class="percentage-select"
                    @change="setInvoiceByService()"
                  ></b-form-select>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Hour Type Content -->
        <div v-if="invoiceType === InvoiceType.HOUR" class="hour-content">
          <div class="time-period mb-3">
            <b-form-radio-group v-model="hourPeriod" class="d-flex flex-column">
              <b-form-radio
                @change="setInvoiceDate(DatePeriod.LAST_MONTH)"
                :value="DatePeriod.LAST_MONTH"
                class="mb-2"
                >{{ $t("project.lastMonth") }}</b-form-radio
              >
              <b-form-radio
                @change="setInvoiceDate(DatePeriod.THIS_MONTH)"
                :value="DatePeriod.THIS_MONTH"
                class="mb-2"
                >{{ $t("project.thisMonth") }}</b-form-radio
              >
              <b-form-radio
                @change="setInvoiceDate(DatePeriod.FROM_BEGINNING)"
                :value="DatePeriod.FROM_BEGINNING"
                class="mb-2"
                >{{ $t("project.beginOfTime") }}</b-form-radio
              >
            </b-form-radio-group>
          </div>

          <div class="date-range">
            <div class="d-flex">
              <div class="flex-grow-1 mr-2">
                <label class="w-100 text-muted">{{ $t("project.start") }}</label>
                <b-form-datepicker
                  v-model="startDate"
                  placeholder="Select date"
                  class="mb-2"
                  :min="minDate"
                  :locale="locale"
                  :date-format-options="{ year: 'numeric', month: '2-digit', day: '2-digit' }"
                ></b-form-datepicker>
              </div>
              <div class="flex-grow-1 ml-2">
                <label class="w-100 text-muted">{{ $t("project.end") }}</label>
                <b-form-datepicker
                  v-model="endDate"
                  placeholder="Select date"
                  class="mb-2"
                  :min="startDate"
                  :locale="locale"
                  :date-format-options="{ year: 'numeric', month: 'numeric', day: 'numeric' }"
                ></b-form-datepicker>
              </div>
            </div>
          </div>

          <!-- Add connection selection for connected projects -->
          <div class="connections-section mt-3">
            <label class="w-100 text-muted">{{ $t("project.connections") }}</label>
            <div v-for="(connection, index) in connections" :key="connection.id" class="connection-item">
              <b-form-checkbox
                plain
                :checked="connection.checked"
                @change="toggleConnectionSelection(index), setInvoiceByHour()"
              >
                <span class="connected-label">{{ connection.name }}</span>
              </b-form-checkbox>
            </div>
          </div>

          <!-- Display connected effort details -->
          <div class="mt-3">
            <label class="w-100 text-muted">{{ $t("project.service") }}</label>

            <!-- Project effort rows -->
            <div v-for="(item, index) in connectedEffortRows" :key="'effort-' + index" class="effort-item">
              <div class="d-flex justify-content-between">
                <span class="effort-name">{{ item.name }}</span>
                <span class="effort-value">{{ item.price }} ({{ item.spent_in_hour }}h)</span>
              </div>
            </div>

            <!-- Connected companies effort rows -->
            <div
              v-for="(item, index) in connectedCompanyEffort"
              :key="'connected-effort-' + index"
              class="effort-item connected"
            >
              <div class="d-flex justify-content-between">
                <span class="effort-name text-primary">{{ item.name }}</span>
                <span class="effort-value text-primary">{{ item.price }} ({{ item.spent_in_hour }}h)</span>
              </div>
            </div>
          </div>
        </div>
        <div class="final-invoice">
          <b-form-checkbox v-model="isFinalInvoice" @change="setFinalInvoice">{{
            $t("invoice.finalInvoice")
          }}</b-form-checkbox>
        </div>
      </div>

      <!-- Summary Section -->
      <div class="summary-section mt-4">
        <!-- Hour-specific Summary Fields -->
        <template v-if="invoiceType === InvoiceType.HOUR">
          <div class="summary-row d-flex justify-content-between">
            <span class="summary-label">{{ $t("project.totalHour") + ":" }}</span>
            <span class="summary-value">{{ totalHours }}h</span>
          </div>
          <div class="summary-row d-flex justify-content-between">
            <span class="summary-label">{{ $t("project.totalRate") + ":" }}</span>
            <span class="summary-value">{{ projectData.currency }} {{ formatMoney(hourCost) }}</span>
          </div>
        </template>

        <!-- Common Summary Fields -->
        <div class="summary-row d-flex justify-content-between">
          <span class="summary-label">{{ $t("project.orderTotal") + ":" }}</span>
          <span class="summary-value"
            >{{ projectData.currency }}
            {{
              projectData.invoices?.length > 0
                ? `${
                    checkApplyAdditional()
                      ? formatMoney(calculatePartialRemainingRatio() * detailCostValue.total_net)
                      : formatMoney(remainingNetValue)
                  }`
                : formatMoney(detailCostValue.total_net)
            }}</span
          >
        </div>

        <!-- Service-specific Summary Fields -->
        <div v-if="invoiceType === InvoiceType.SERVICE" class="summary-row d-flex justify-content-between">
          <span class="summary-label">{{ $t("project.invoicedTotal") + ":" }}</span>
          <span class="summary-value">{{ projectData.currency }} {{ formatMoney(invoicedAmount) }}</span>
        </div>

        <div class="summary-row d-flex justify-content-between">
          <span class="summary-label">{{ $t("project.remainingClaim") + ":" }}</span>
          <span class="summary-value">{{ projectData.currency }} {{ formatMoney(remainingAmount) }}</span>
        </div>
        <div class="summary-row d-flex justify-content-between">
          <span class="summary-label">{{ $t("quoteItems.discount") + ":" }}</span>
          <span class="summary-value">{{ discountPercentValue }}%</span>
        </div>
        <div class="summary-row d-flex justify-content-between">
          <span class="summary-label">NK:</span>
          <span class="summary-value"
            >{{ projectData.currency }} {{ formatMoney(nkAmount) }} ({{ nkPercentage }}%)</span
          >
        </div>
      </div>

      <!-- Buttons -->
      <div class="col-md-12 p-0 mt-4 d-flex flex-row justify-content-between">
        <b-button variant="secondary" class="cancel-btn w-100 text-center mr-2 transparent-btn" @click="cancel">
          {{ $t("button.cancel") }}
        </b-button>
        <b-button variant="primary" class="save-btn w-100 text-center ml-2" @click="confirm">
          {{ $t("button.confirm") }}
        </b-button>
      </div>
    </div>
  </b-modal>
</template>

<style lang="scss" scoped>
@import "./InvConfirmModal.scss";
</style>
