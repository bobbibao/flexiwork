<script lang="ts">
import TableOverview from "./TableOverview";
export default TableOverview;
</script>

<template>
  <div class="m-0 table-overview">
    <b-table
      striped
      hover
      outlined
      responsive
      show-empty
      ref="TableOverview"
      :select-mode="selectMode"
      :busy="isLoading"
      :items="data"
      :fields="fields"
      :selectable="selectable"
      @row-selected="onRowSelected"
      class="flexiwork-table table"
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
    <TablePagination v-if="pagination !== null" @onChangePage="onChangePage" :pagination="pagination" />
  </div>
</template>

<style scoped>
@import "./TableOverview.scss";
</style>
