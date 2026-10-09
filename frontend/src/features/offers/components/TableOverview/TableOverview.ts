import { defineComponent, PropType } from "vue";
import { ITableField, ITablePagination } from "../../../../components/organisms/table/type";
import TablePagination from "@/components/organisms/table/TablePagination.vue";

export default defineComponent({
  name: "TableOverview",
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
      default: true
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
    onRowSelected(rows: any[]) {
      this.$emit("rowSelected", rows);
    },
    selectAllRows() {
      const table = this.$refs.TableOverview as any;
      if (table && typeof table.selectAllRows === "function") {
        table.selectAllRows();
      }
    },
    clearSelected() {
      const table = this.$refs.TableOverview as any;
      if (table && typeof table.clearSelected === "function") {
        table.clearSelected();
      }
    }
  }
});
