<template>
  <b-overlay :show="loading" variant="white" opacity="0.85" blur="5px" spinner-variant="danger">
    <ag-grid-vue
      ref="grid"
      style="width: 100%; height: 600px"
      class="ag-theme-balham"
      :columnDefs="columnDefs"
      :rowData="rowData"
      :pinnedBottomRowData="[...footerData, flexData]"
      :singleClickEdit="true"
      :animateRows="true"
      :isExternalFilterPresent="isExternalFilterPresent"
      :doesExternalFilterPass="doesExternalFilterPass"
      :tooltipShowDelay="0"
      @gridReady="onGridReady"
      @cellClicked="onCellClicked"
      @cellValueChanged="onCellValueChanged"
    />
  </b-overlay>
</template>

<script>
import { AgGridVue } from "ag-grid-vue3"; // Vue 3 build of the same grid (v27)
import { isEqual, get } from "lodash";
import moment from "moment";
import { generateColumnDefs, generateRowData, generateFooterData, generateFlexData } from "./utils/generators";
import ValueCell from "./ValueCell.vue";
import ValueCellEditor from "./ValueCellEditor.vue";
import TotalCell from "./TotalCell.vue";

export default {
  name: "TimesheetTable",
  props: {
    sheet: {
      type: Array,
      required: true
    },
    dates: {
      type: Array,
      required: true
    },
    currentUser: {
      type: Object,
      required: true
    },
    flexibleTime: {
      type: Array,
      required: true
    },
    loading: {
      type: Boolean,
      default: false
    },
    targetUser: {
      type: Object
    }
  },
  components: {
    AgGridVue,
    // eslint-disable-next-line vue/no-unused-components
    ValueCell,
    // eslint-disable-next-line vue/no-unused-components
    ValueCellEditor,
    // eslint-disable-next-line vue/no-unused-components
    TotalCell
  },
  data() {
    return {
      gridApi: null,
      rowData: [],
      footerData: [],
      flexData: {},
      collapsedSheets: []
    };
  },
  computed: {
    isAdmin() {
      //admin view when checking other employees only
      return get(this.currentUser, "role") === "admin" && get(this.currentUser, "id") !== get(this.targetUser, "id");
    },
    columnDefs() {
      return generateColumnDefs(this.dates, {
        $t: this.$t.bind(this)
      });
    }
  },
  mounted() {
    this.rowData = generateRowData(this.sheet, this.dates);
    this.footerData = generateFooterData(this.rowData, this.dates, {
      flexibleTime: this.flexibleTime,
      user: this.targetUser,
      $t: this.$t.bind(this)
    });
    this.flexData = generateFlexData(this.dates, {
      flexibleTime: this.flexibleTime,
      $t: this.$t.bind(this)
    });
  },
  watch: {
    loading(value) {
      if (!value) {
        // recalculate row data after loading
        this.rowData = generateRowData(this.sheet, this.dates);
        this.footerData = generateFooterData(this.rowData, this.dates, {
          flexibleTime: this.flexibleTime,
          user: this.targetUser,
          $t: this.$t.bind(this)
        });
      }
    },
    flexibleTime(value, oldValue) {
      if (value.length > 0 && !isEqual(value, oldValue)) {
        this.flexData = generateFlexData(this.dates, {
          flexibleTime: value || [],
          $t: this.$t.bind(this)
        });
      }
    },
    dates() {
      this.flexData = generateFlexData(this.dates, {
        flexibleTime: this.flexibleTime,
        $t: this.$t.bind(this)
      });
    }
  },
  methods: {
    onGridReady(params) {
      this.gridApi = params.api;
    },
    toggleSheet(sheetId) {
      if (this.collapsedSheets.includes(sheetId)) {
        this.collapsedSheets = this.collapsedSheets.filter(id => id !== sheetId);
      } else {
        this.collapsedSheets = [...this.collapsedSheets, sheetId];
      }
      if (this.gridApi) {
        this.gridApi.onFilterChanged();
      }
    },
    isExternalFilterPresent() {
      if (!this.isAdmin) {
        // if user is not admin, always filter by is_hidden value
        return true;
      }
      return this.collapsedSheets.length > 0;
    },
    doesExternalFilterPass(node) {
      return (
        // filter collapsed rows
        !(node.data.type === "workitem" && this.collapsedSheets.includes(node.data.project_id)) &&
        // filter hidden rows if current user is not admin
        (this.isAdmin || !node.data.is_hidden)
      );
    },
    onCellClicked(event) {
      if (event.data.type === "sheet" && event.column.colId === "name") {
        this.toggleSheet(event.data.project_id);
      }
      if (event.data.type === "workitem" && event.column.colId === "task") {
        const payload = {
          project_id: event.data.project_id,
          service_id: event.data.service_id,
          workitem_id: event.data.workitem_id
        };
        this.$emit("workitem-selected", payload);
      }
    },
    updateSheetRowValue() {
      // update footer data
      // TODO: improve performance by not recalculating the whole footer
      this.footerData = generateFooterData(this.rowData, this.dates, {
        flexibleTime: this.flexibleTime,
        user: this.targetUser,
        $t: this.$t.bind(this)
      });
    },
    onCellValueChanged(event) {
      if (!isEqual(event.oldValue, event.newValue)) {
        const payload = {
          project_id: event.data.project_id,
          service_id: event.data.service_id,
          workitem_id: event.data.workitem_id,
          date_formatted: moment(event.colDef.field, "DD_MM_YYYY").format("YYYY-MM-DD"),
          data: event.newValue
        };
        this.$emit("worklog-updated", payload);
        if (event.oldValue.value !== event.newValue.value) {
          this.updateSheetRowValue();
        }
      }
    }
  }
};
</script>

<style lang="scss">
@import "~ag-grid-community/dist/styles/ag-grid.css";
// @import "~ag-grid-community/src/styles/ag-theme-alpine/sass/ag-theme-alpine-mixin";
@import "~ag-grid-community/src/styles/ag-theme-balham/sass/ag-theme-balham-mixin";

.ag-theme-balham {
  @include ag-theme-balham(
    (
      cell-horizontal-border: solid ag-derived(secondary-border-color)
    )
  );
  .ag-header-viewport {
    .ag-header-cell-text {
      width: 100%;
      text-align: right;
    }
  }
  .ag-header-cell {
    color: black;
  }
  .cell-today {
    color: #f64e60;
    background-color: #e9e9e9;
  }
  .cell-holiday {
    background-color: #c3e6cb;
  }
  .cell-weekend {
    background-color: #c6c6c9;
  }
  .cell-header {
    background-color: #f3f6f9;
  }
  .cell-total {
    background-color: #b8daff;
  }
  .ag-tooltip {
    background-color: white;
  }
}
</style>
