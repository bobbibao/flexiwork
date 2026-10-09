<script lang="ts">
import TableProduct from "./TableProduct";
export default TableProduct;
</script>

<template>
  <div class="m-0 table-product">
    <b-table
      striped
      hover
      outlined
      responsive
      show-empty
      ref="TableProduct"
      :select-mode="selectMode"
      :busy="isLoading"
      :items="data"
      :fields="fields"
      :selectable="selectable"
      @row-selected="onRowSelected"
      class="archapp-table table"
    >
      <!-- Custom render for Status, Priority, and Assignee with avatar -->
      <template #table-busy>
        <div class="text-center text-danger my-2">
          <b-spinner class="align-middle"></b-spinner>
        </div>
      </template>

      <template #empty="scope">
        <p class="text-center">{{ scope.emptyText }}</p>
      </template>

      <template v-for="field in filteredHeads" v-slot:[`head(${field.key})`]="data">
        <div :key="field.key">
          <slot :name="`head(${field.key})`" v-bind="data"></slot>
        </div>
      </template>

      <template v-for="field in filteredCell" v-slot:[`cell(${field.key})`]="data">
        <div :key="field.key">
          <slot :name="`cell(${field.key})`" v-bind="data"></slot>
        </div>
      </template>
    </b-table>
    <TableProductPagination v-if="pagination !== null" @onPageChange="onPageChange" :pagination="pagination" />
  </div>
</template>

<style scoped>
.table-product {
  .archapp-table {
    border-top: 1px;
    margin-top: 0px;
    white-space: nowrap;
    margin-bottom: 0;
    height: calc(100vh - 412px);
    min-height: 100px;
  }
  .archapp-table::v-deep .text-wrap {
    white-space: normal !important;
    word-wrap: break-word;
    min-width: 100px;
  }

  .archapp-table::v-deep td {
    max-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: normal;
  }
}
</style>
