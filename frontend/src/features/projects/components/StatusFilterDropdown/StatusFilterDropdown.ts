import { ButtonCustom, FilterLinesIcon, SelectInput, SelectOption } from "@/components";
import { defineComponent } from "vue";

export default defineComponent({
  name: "StatusFilterDropdown",
  components: { ButtonCustom, SelectInput, FilterLinesIcon },
  props: {
    statuses: {
      type: Array as () => SelectOption[],
      default: () => []
    }
  },
  emits: {
    statusFilterChanged: (value: SelectOption[]) => {}
  },
  data() {
    return {
      showFilter: true
    };
  },
  methods: {
    toggleSelectGroup() {
      this.showFilter = !this.showFilter;
    },

    handleOnChangeStatus(value: SelectOption[]) {
      this.$emit("statusFilterChanged", value);
    }
  }
});
