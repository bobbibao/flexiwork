<!-- eslint-disable max-len -->
<template>
  <div id="quote-items" class="quote-table mt-4">
    <!-- Header -->
    <div class="table-header margin-neg-24">
      <div class="table-row">
        <div class="table-cell service border-right">{{ $t("quoteItems.service") }}</div>
        <div class="table-cell unit">{{ $t("quoteItems.unit") }}</div>
        <div class="table-cell amount">{{ $t("quoteItems.amount") }}</div>
        <div class="table-cell price">{{ $t("quoteItems.price") }} {{ currency }}</div>
        <div class="table-cell vat">{{ $t("quoteItems.vat") }}</div>
        <div class="table-cell planning">{{ $t("quoteItems.planning") }}</div>
        <div class="table-cell cost">{{ $t("quoteItems.cost") }} {{ currency }}</div>
        <div class="table-cell actions"></div>
      </div>
    </div>

    <!-- Table Body -->
    <div class="table-body margin-neg-24">
      <draggable
        :list="draggableList"
        class=""
        ghost-class="ghost"
        @start="dragging = true"
        @end="dragging = false"
        handle=".handle"
      >
        <div class="table-row" v-for="(item, i) in draggableList" :key="i">
          <!-- Title Row -->
          <template v-if="item.type === 'title'">
            <div class="table-cell service">
              <b-form-input
                :id="`title_${i}`"
                v-model="item.description"
                placeholder="Title"
                :disabled="disabled"
              ></b-form-input>
            </div>
            <div class="table-cell unit"></div>
            <div class="table-cell amount"></div>
            <div class="table-cell price"></div>
            <div class="table-cell vat"></div>
            <div class="table-cell planning"></div>
            <div :id="`title_cost_${i}`" class="table-cell title-cost font-weight-bolder">
              {{ formatMoney(item.cost ?? 0) }}
            </div>
            <div class="table-cell actions">
              <div class="action-buttons">
                <i v-show="!disabled" class="handle">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M15 6.66927L10 1.66927L5 6.66927M5 13.3359L10 18.3359L15 13.3359"
                      stroke="#475467"
                      stroke-width="1.66667"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                </i>
                <i v-show="!disabled" class="remove-btn" @click="removeItem(i)">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M2.5 4.9974H4.16667M4.16667 4.9974H17.5M4.16667 4.9974V16.6641C4.16667 17.1061 4.34226 17.53 4.65482 17.8426C4.96738 18.1551 5.39131 18.3307 5.83333 18.3307H14.1667C14.6087 18.3307 15.0326 18.1551 15.3452 17.8426C15.6577 17.53 15.8333 17.1061 15.8333 16.6641V4.9974H4.16667ZM6.66667 4.9974V3.33073C6.66667 2.8887 6.84226 2.46478 7.15482 2.15222C7.46738 1.83966 7.89131 1.66406 8.33333 1.66406H11.6667C12.1087 1.66406 12.5326 1.83966 12.8452 2.15222C13.1577 2.46478 13.3333 2.8887 13.3333 3.33073V4.9974"
                      stroke="#475467"
                      stroke-width="1.66667"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                </i>
              </div>
            </div>
          </template>

          <!-- Individual Row -->
          <template v-else-if="item.type === 'individual'">
            <div class="table-cell service">
              <div class="service-content">
                <b-form-checkbox
                  :id="`individual_opt_${i}`"
                  :checked="item.optional"
                  :disabled="disabled || item.is_nk"
                  @change="setOptional(i)"
                />
                <div class="service-inputs">
                  <b-form-input
                    :id="`individual_name_${i}`"
                    :value="item.name"
                    placeholder="Product"
                    class="mb-2"
                    :disabled="disabled"
                    @blur="setName(i)"
                  ></b-form-input>
                  <b-form-textarea
                    :id="`individual_desc_${i}`"
                    rows="3"
                    v-model="item.description"
                    placeholder="Description"
                    :disabled="disabled"
                    @blur="setDesc(i)"
                  ></b-form-textarea>
                </div>
              </div>
            </div>
            <div class="table-cell unit">
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
            <div class="table-cell amount">
              <b-form-input
                :id="`individual_amount_${i}`"
                :value="item.amount"
                :disabled="disabled || item.is_nk"
                @blur="setAmount(i)"
              ></b-form-input>
            </div>
            <div class="table-cell price">
              <b-form-input
                :id="`individual_price_${i}`"
                :value="formatMoney(item.price ?? 0)"
                :disabled="disabled || item.is_nk"
                @blur="getCost(i)"
              ></b-form-input>
            </div>
            <div class="table-cell vat">
              <b-form-select
                :id="`individual_vat_${i}`"
                :value="parseFloat(item.vat_rate?.toString() ?? '0')"
                :options="vat"
                :disabled="disabled"
                @change="setVAT(i)"
              ></b-form-select>
            </div>
            <div class="table-cell planning">
              <div class="planning-inputs" v-if="!item.is_nk">
                <b-form-select
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
                  :id="`individual_year_${i}`"
                  :value="item.year"
                  :options="years"
                  :disabled="disabled || isInvoice"
                  @change="setYear(i)"
                ></b-form-select>
              </div>
            </div>
            <div :class="['table-cell', 'cost', { 'optional-cost': item.optional }]">
              {{ item.optional === true ? `(${formatMoney(item.cost ?? 0)})` : formatMoney(item.cost ?? 0) }}
            </div>
            <div class="table-cell actions">
              <div class="action-buttons" v-if="!disabled">
                <i class="handle">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M15 6.66927L10 1.66927L5 6.66927M5 13.3359L10 18.3359L15 13.3359"
                      stroke="#475467"
                      stroke-width="1.66667"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                </i>
                <i class="remove-btn" @click="removeItem(i)">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M2.5 4.9974H4.16667M4.16667 4.9974H17.5M4.16667 4.9974V16.6641C4.16667 17.1061 4.34226 17.53 4.65482 17.8426C4.96738 18.1551 5.39131 18.3307 5.83333 18.3307H14.1667C14.6087 18.3307 15.0326 18.1551 15.3452 17.8426C15.6577 17.53 15.8333 17.1061 15.8333 16.6641V4.9974H4.16667ZM6.66667 4.9974V3.33073C6.66667 2.8887 6.84226 2.46478 7.15482 2.15222C7.46738 1.83966 7.89131 1.66406 8.33333 1.66406H11.6667C12.1087 1.66406 12.5326 1.83966 12.8452 2.15222C13.1577 2.46478 13.3333 2.8887 13.3333 3.33073V4.9974"
                      stroke="#475467"
                      stroke-width="1.66667"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                </i>
              </div>
            </div>
          </template>

          <!-- Textfield Row -->
          <template v-else>
            <div class="table-cell service">
              <b-form-textarea
                :id="`textfield_${i}`"
                v-model="item.description"
                rows="3"
                :disabled="disabled"
              ></b-form-textarea>
            </div>
            <div class="table-cell actions">
              <div class="action-buttons" v-if="!disabled">
                <i class="handle">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M15 6.66927L10 1.66927L5 6.66927M5 13.3359L10 18.3359L15 13.3359"
                      stroke="#475467"
                      stroke-width="1.66667"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                </i>
                <i class="remove-btn" @click="removeItem(i)">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M2.5 4.9974H4.16667M4.16667 4.9974H17.5M4.16667 4.9974V16.6641C4.16667 17.1061 4.34226 17.53 4.65482 17.8426C4.96738 18.1551 5.39131 18.3307 5.83333 18.3307H14.1667C14.6087 18.3307 15.0326 18.1551 15.3452 17.8426C15.6577 17.53 15.8333 17.1061 15.8333 16.6641V4.9974H4.16667ZM6.66667 4.9974V3.33073C6.66667 2.8887 6.84226 2.46478 7.15482 2.15222C7.46738 1.83966 7.89131 1.66406 8.33333 1.66406H11.6667C12.1087 1.66406 12.5326 1.83966 12.8452 2.15222C13.1577 2.46478 13.3333 2.8887 13.3333 3.33073V4.9974"
                      stroke="#475467"
                      stroke-width="1.66667"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                </i>
              </div>
            </div>
          </template>
        </div>
      </draggable>
    </div>

    <!-- Actions -->
    <b-button-group size="sm" class="service-buttons-group">
      <ProductModal v-show="!disabled" class="first-child" :add-product="addProduct" />
      <ProductGroupModal v-show="!disabled" :add-group="addGroup" />

      <b-button v-show="!disabled" class="service-button" @click="addItem">
        <i><PlusIcon></PlusIcon></i>
        <span class="menu-text"> {{ $t("button.individual") }} </span>
      </b-button>
      <b-button v-show="!disabled" class="service-button" @click="addTitle">
        <i><PlusIcon></PlusIcon></i>
        <span class="menu-text"> {{ $t("button.title") }} </span>
      </b-button>
      <b-button v-show="!disabled" class="service-button" @click="addTextfield">
        <i><PlusIcon></PlusIcon></i>
        <span class="menu-text"> {{ $t("button.textfield") }} </span>
      </b-button>
    </b-button-group>

    <!-- Sum up -->
    <div class="row mt-2">
      <div class="col-md-12 p-0 d-flex justify-content-between">
        <div class="col-md-10 left d-flex align-items-center">
          {{ $t("quoteItems.discountPercent") }}
        </div>
        <div class="col-md-2 right" style="max-width: 100px;">
          <b-form-input
            id="discount_percent"
            :value="discountPercent"
            placeholder="0.0"
            :disabled="disabled"
            @input="setDiscount"
          ></b-form-input>
        </div>
      </div>
      <!-- Total cost excluding discount -->
      <div v-show="quoteItems.length > 0" class="col-md-12 mt-2 p-0 d-flex">
        <div class="col-md-10 left">
          {{ $t("quoteItems.totalNoDiscount") }}
        </div>
        <div id="discount" class="col-md-2 font-weight-bolder text-right pl-0">
          {{ formatMoney(detailCost.total_net + detailCost.total_discount || 0) }}
        </div>
      </div>
      <!-- Discount -->
      <div v-show="quoteItems.length > 0" class="col-md-12 mt-2 p-0 d-flex">
        <div class="col-md-10 left">
          {{ $t("quoteItems.discount") + " " + discountPercent.toString() + "%" }}
        </div>
        <div id="discount" class="col-md-2 font-weight-bolder text-right pl-0">
          {{ formatMoney(detailCost.total_discount) }}
        </div>
      </div>
      <!-- Total cost including discount -->
      <div v-show="quoteItems.length > 0" class="col-md-12 mt-2 p-0 d-flex">
        <div class="col-md-10 left">
          {{ "Honorarsumme " + $t("quoteItems.total") }}
        </div>
        <div id="discount" class="col-md-2 font-weight-bolder text-right pl-0">
          {{ formatMoney(detailCost.total_net, 0.05) || 0.0 }}
        </div>
      </div>
      <!-- Additional -->
      <div class="col-md-12 mt-2 p-0 d-flex">
        <div class="col-md-10 left">
          {{ "Nebenkosten " + additionalCost.percent + "% von " + $t("quoteItems.total") }}
        </div>
        <div id="additional" class="col-md-2 font-weight-bolder text-right pl-0">
          {{ formatMoney(detailCost.total_net_nk + detailCost.total_discount_nk || 0, 0.05) }}
        </div>
      </div>
      <!-- Total net -->
      <div v-show="quoteItems.length > 0" class="col-md-12 mt-2 p-0 d-flex">
        <div class="col-md-10 left text-primary">
          {{ $t("quoteItems.net") }}
        </div>
        <div id="net-total" class="col-md-2 font-weight-bolder text-right pl-0 text-primary">
          {{ formatMoney(detailCost.total_net + detailCost.total_net_nk + detailCost.total_discount_nk || 0, 0.05) }}
        </div>
      </div>
      <!-- Invoice list -->
      <div
        v-show="currentProjectInvoices.length > 0"
        v-for="item in currentProjectInvoices"
        :key="item.id"
        class="col-md-12 mt-2 p-0 d-flex"
      >
        <div :id="`invoice_${item.id}`" class="col-md-10 left">
          <!-- {{ setInvoiceType(item.type, item.is_final) }} -->
          {{ item.charged_on ? formatDate(item.charged_on) : formatDate(item.created_at) }}
          <span class=" underline-text mx-1" @click="$router.push(`/invoice/${item.id}`)">
            {{ item.name }}
          </span>
        </div>
        <div :id="`invoice_amount_${item.id}`" class="col-md-2 text-right pl-0">
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
      <div v-show="currentProjectInvoices.length > 0" class="col-md-12 mt-2 p-0 d-flex">
        <div class="col-md-10 left">
          {{ $t("quoteItems.netRemaining") }}
        </div>
        <div id="net-remaining" class="col-md-2 font-weight-bolder text-right pl-0">
          {{ formatMoney(remainingNet) }}
        </div>
      </div>
      <!-- Vat list -->

      <div v-show="vat_list.length > 0" v-for="item in vat_list" :key="item.rate" class="col-md-12 mt-2 p-0 d-flex">
        <div :id="`vat_rate_${item.rate}`" class="col-md-10 left">
          {{ $t("quoteItems.vat") }} {{ item.rate }}% von
          {{
            currentProjectInvoices.length > 0
              ? formatMoney(remainingNet || 0, 0.05)
              : formatMoney(
                  detailCost.total_init_net_by_vat[item.rate] + detailCost.total_init_net_nk_by_vat[item.rate] || 0,
                  0.05
                )
          }}
        </div>
        <div :id="`vat_cost_${item.rate}`" class="col-md-2 font-weight-bolder text-right pl-0 vat_cost">
          {{
            currentProjectInvoices.length > 0
              ? formatMoney(remainingNet * (item.rate / 100) || 0, 0.05)
              : formatMoney(detailCost.total_vat_list[item.rate] || 0, 0.05)
          }}
        </div>
      </div>
      <!-- Total gross -->
      <div v-if="quoteItems.length > 0 && currentProjectInvoices.length === 0" class="col-md-12 mt-2 p-0 d-flex">
        <div class="col-md-10 left text-primary">
          {{ $t("quoteItems.gross") }}
        </div>
        <div id="gross-total" class="col-md-2 font-weight-bolder text-right pl-0 text-primary">
          {{ formatMoney(detailCost.total_gross + detailCost.total_gross_nk || 0.0, 0.05) }}
        </div>
      </div>
      <!-- Remaining gross -->
      <div v-if="currentProjectInvoices.length > 0" class="col-md-12 mt-2 p-0 d-flex">
        <div class="col-md-10 left text-primary">
          {{ $t("quoteItems.grossRemaining") }}
        </div>
        <div id="gross-total" class="col-md-2 font-weight-bolder text-right pl-0">
          {{ formatMoney(remainingGross, 0.05) || 0.0 }}
        </div>
      </div>

      <div class="col-md-12">
        <div class="spacer"></div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import QuoteItems from "./QuoteItems";
export default QuoteItems;
</script>

<style lang="scss" scoped>
@import "./QuoteItems.scss";
</style>
