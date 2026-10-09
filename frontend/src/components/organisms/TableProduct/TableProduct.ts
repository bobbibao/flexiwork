import { ITableField, ITablePagination } from "@/components";
import { defineComponent, PropType } from "vue";
import TableProductPagination from "@/components/organisms/TableProduct/TableProductPagination.vue";

export default defineComponent({
  name: "TableProduct",
  components: {
    TableProductPagination
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
    onPageChange(page: number) {
      this.$emit("onPageChange", page);
    },
    onRowSelected(items: any[]) {
      // Emit only the first selected item since we're using single select mode
      const selectedItem = items && items.length > 0 ? items[0] : null;
      this.$emit("rowSelected", selectedItem);
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
