<script lang="ts">
import ProductGroupModal from "./ProductGroupModal";
export default ProductGroupModal;
</script>

<template>
  <div>
    <b-button class="service-button" @click="showDialog">
      <i><PlusIcon></PlusIcon></i>
      <span class="menu-text"> {{ $t("button.group") }} </span>
    </b-button>
    <!-- Dialog -->
    <b-modal v-model="dialog" hide-footer no-close-on-backdrop size="xl" @close="loading = true">
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
          {{ $t("menu.group") }}
        </div>
      </template>
      <!-- Search -->
      <!-- <div class="row mb-4">
        <div class="col-md-3 action-start">
          <span class="mr-2">{{ $t("button.show") }}</span>
          <b-form-select v-model="perPage" id="perPageSelect" size="sm" :options="pageOptions"></b-form-select>
          <span class="ml-2">{{ $t("button.entries") }}</span>
        </div>
        <div class="col-md-9 action">
          <span class="mr-2">{{ $t("button.search") }}:</span>
          <b-form-input v-model="filter" type="search" id="filterInput"></b-form-input>
        </div>
      </div> -->
      <div class="row mb-4 ">
        <div class="col-md-7 action">
          <!-- <span class="mr-2">{{ $t("button.search") }}:</span>
          <b-form-input v-model="filter" type="search" id="filterInput"></b-form-input> -->
          <SearchInput @onSearch="handleOnSearch($event)" />
        </div>
      </div>
      <!-- Data Table -->
      <TableProduct
        ref="Table"
        wrap="true"
        select-mode="single"
        :data="groups"
        :fields="fields"
        :isLoading="loading"
        :pagination="pagination"
        @rowSelected="selectGroup"
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
        <!-- body -->
        <template #cell(name)="data">
          <p class="row-bold">{{ data.item.name }}</p>
        </template>

        <template #cell(description)="data">
          <p class="row">{{ data.item.description }}</p>
        </template>
      </TableProduct>
      <!-- <b-table
        bordered
        hover
        selectable
        head-variant="light"
        :items="currentGroups"
        :fields="fields"
        :current-page="currentPage"
        :per-page="perPage"
        :filter="filter"
        :busy="loading"
        @filtered="onFiltered"
        @row-clicked="selectGroup"
      >
        <template #table-busy>
          <div class="text-center text-danger my-2">
            <b-spinner class="align-middle"></b-spinner>
          </div>
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
@import "./ProductGroupModal.scss";
</style>
