<script lang="ts">
import { defineComponent, PropType } from "vue";
import { ITableField, ITablePagination } from "./type";
import TablePagination from "./TablePagination.vue";

export default defineComponent({
  name: "TableDefault",
  components: {
    TablePagination
  },
  props: {
    data: {
      type: Array,
      required: true
    },
    fields: {
      type: Array as PropType<ITableField[]>,
      required: true
    },
    pagination: {
      type: Object as PropType<ITablePagination>,
      default: null
    },
    isLoading: {
      type: Boolean,
      default: false
    },
    selectable: {
      type: Boolean,
      default: false
    },
    selectMode: {
      type: String as PropType<"multi" | "single" | "range">,
      default: "single"
    }
  },
  computed: {
    filteredHeads(): ITableField[] {
      return this.fields.filter(field => this.$scopedSlots[`head(${field.key})`]);
    },
    filteredCell(): ITableField[] {
      return this.fields.filter(field => this.$scopedSlots[`cell(${field.key})`]);
    }
  },
  methods: {
    onChangePage() {
      this.$emit("onChangePage");
    },
    onRowSelected(row: any[]) {
      this.$emit("rowSelected", row);
    },
    selectAllRows() {
      const table = this.$refs.tableDefault as any;
      if (table && typeof table.selectAllRows === "function") {
        table.selectAllRows();
      }
    },
    clearSelected() {
      const table = this.$refs.tableDefault as any;
      if (table && typeof table.clearSelected === "function") {
        table.clearSelected();
      }
    }
  }
});
</script>

<template>
  <div class="m-0">
    <b-table
      striped
      hover
      outlined
      responsive
      show-empty
      ref="tableDefault"
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
        <p class="text-center">{{ $t("msg.noRecords") }}</p>
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

<style scoped></style>
