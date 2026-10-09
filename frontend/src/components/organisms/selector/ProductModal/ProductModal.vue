<script lang="ts">
import ProductModal from "./ProductModal";
export default ProductModal;
</script>

<template>
  <div>
    <b-button class="service-button" @click="showDialog">
      <i><PlusIcon></PlusIcon></i>
      <span class="menu-text"> {{ $t("button.product") }} </span>
    </b-button>

    <!-- Dialog -->
    <b-modal v-model="dialog" hide-footer no-close-on-backdrop size="xl" @close="(loading = true), resetFolder()">
      <template #modal-title>
        <div class="customer-selector d-flex align-items-center">
          <div class="icon-container">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M8 18L1 22V6L8 2M8 18L16 22M8 18V2M16 22L23 18V2L16 6M16 22V6M16 6L8 2"
                stroke="#2884EF"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </div>
          {{ $t("menu.product") }}
        </div>
      </template>
      <!-- Search -->
      <div class="row mb-4 action-row">
        <div class="col-md-7 action">
          <!-- <span class="mr-2">{{ $t("button.search") }}:</span>
          <b-form-input v-model="filter" type="search" id="filterInput"></b-form-input> -->
          <SearchInput @onSearch="handleOnSearch($event)" />
        </div>
        <div class="col-md-2">
          <b-form-select
            v-model="folder"
            :options="folders"
            value-field="value"
            text-field="name"
            class="folder-select mr-2"
            @change="initProduct"
          ></b-form-select>
        </div>
        <!-- <div class="col-md-3 action-start">
          <span class="mr-2">{{ $t("button.show") }}</span>
          <b-form-select v-model="perPage" id="perPageSelect" size="sm" :options="pageOptions"></b-form-select>
          <span class="ml-2">{{ $t("button.entries") }}</span>
        </div> -->
      </div>
      <TableProduct
        ref="Table"
        wrap="true"
        select-mode="single"
        :data="products"
        :fields="fields"
        :isLoading="loading"
        :pagination="pagination"
        @rowSelected="selectProduct"
        @onPageChange="handlePageChange"
      >
        <template #head(name)="data">
          <div class="cursor-pointer">
            {{ $t("product.name") }}
          </div>
        </template>

        <template #head(description)="data">
          <div class="cursor-pointer">
            {{ $t("product.desc") }}
          </div>
        </template>

        <template #head(unit)="data">
          <div class="cursor-pointer">
            {{ $t("product.unit") }}
          </div>
        </template>

        <template #head(vat_rate)="data">
          <div class="cursor-pointer">
            {{ $t("product.vat") }}
          </div>
        </template>

        <template #head(price)="data">
          <div class="cursor-pointer">
            {{ $t("product.price") }}
          </div>
        </template>
        <!-- body -->
        <template #cell(name)="data">
          <p class="row-bold">{{ data.item.name }}</p>
        </template>

        <template #cell(description)="data">
          <p class="row">{{ data.item.description }}</p>
        </template>

        <template #cell(unit)="data">
          <p class="row">{{ data.item.unit.display }}</p>
        </template>

        <template #cell(vat_rate)="data">
          {{ formatMoney(data.item.vat_rate.rate) }}
        </template>

        <template #cell(price)="data">
          {{ formatMoney(data.item.price) }}
        </template>
      </TableProduct>
      <!-- Data Table -->
      <!-- <b-table
        bordered
        hover
        selectable
        head-variant="light"
        :items="products"
        :fields="fields"
        :current-page="currentPage"
        :per-page="perPage"
        :filter="filter"
        :busy="loading"
        @filtered="onFiltered"
        @row-clicked="selectProduct"
      >
        <template #table-busy>
          <div class="text-center text-danger my-2">
            <b-spinner class="align-middle"></b-spinner>
          </div>
        </template>

        <template v-slot:cell(unit)="row">
          {{ row.item.unit.display }}
        </template>

        <template v-slot:cell(vat_rate)="row">
          {{ row.item.vat_rate.rate }}
        </template>
      </b-table> -->

      <!-- Pagination -->
      <!-- <div class="row action">
        <div class="col-md-3">
          <b-pagination
            v-model="currentPage"
            :total-rows="totalRows"
            :per-page="perPage"
            align="fill"
            size="md"
            class="my-0"
          ></b-pagination>
        </div>
      </div> -->
    </b-modal>
  </div>
</template>

<style scoped lang="scss">
@import "./ProductModal.scss";
</style>
