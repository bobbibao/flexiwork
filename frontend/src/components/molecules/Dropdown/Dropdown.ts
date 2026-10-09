import { ButtonCustom, FilterLinesIcon } from "@/components";
import SelectInput from "@/components/atoms/input/SelectInput/SelectInput.vue";
import { defineComponent } from "vue";
import { SelectOption } from "@/components/atoms/input/SelectInput/SelectInput";

export default defineComponent({
  name: "Dropdown",
  components: {
    ButtonCustom,
    SelectInput,
    FilterLinesIcon
  },
  props: {
    options: {
      type: Array as () => SelectOption[],
      default: () => []
    }
  },
  emits: {
    optionsChange: (value: SelectOption[]) => {}
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

    handleOnChangeOptions(value: SelectOption[]) {
      this.$emit("optionsChange", value);
    }
  }
});
