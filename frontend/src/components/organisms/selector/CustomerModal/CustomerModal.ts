import { Customer } from "@/common/models/customer.model";
import { defineComponent } from "vue";

export default defineComponent({
  name: "CustomerModal",
  props: {
    dialog: {
      type: Boolean,
      required: true
    },
    searchQuery: {
      type: String,
      required: true
    },
    filteredCustomers: {
      type: Array as () => Customer[],
      required: true
    },
    selectedCustomer: {
      type: Object as () => Customer,
      required: false,
      default: null
    }
  },
  data() {
    return {
      localSearchQuery: this.searchQuery // Local copy of searchQuery
    };
  },
  watch: {
    // Sync prop changes to local data
    searchQuery(newVal) {
      this.localSearchQuery = newVal;
    }
  },
  methods: {
    updateSearchQuery(query: string) {
      this.$emit("update:searchQuery", query);
    },
    selectCustomer(customer: Customer) {
      this.$emit("selectCustomer", customer);
    },
    cancel() {
      this.$emit("cancel");
    },
    confirm() {
      this.$emit("confirm", this.selectedCustomer);
    }
  }
});