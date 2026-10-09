import { defineComponent, PropType, Ref, ref } from "vue";
import ButtonCustom from "../../button/ButtonCustom/ButtonCustom.vue";
import { randString } from "@/common";
import { VNodeRef } from "vue/types/vnode";
import { TranslateResult } from "vue-i18n";

export interface SelectOption {
  label: string | TranslateResult;
  value: string;
  selected?: boolean;
}

/** Support functions: Get & Set selected option */
export function getSelectedOption(options: SelectOption[]): SelectOption {
  return options.find(option => option.selected) as SelectOption;
}

export function setSelectedOption(
  options: SelectOption[],
  selectedOption: SelectOption,
  multiple: boolean = false
): SelectOption[] {
  return options.map(option => {
    if (multiple) {
      return {
        ...option,
        selected: String(option.value) === String(selectedOption.value) ? !option.selected : option.selected
      };
    } else {
      return {
        ...option,
        selected: String(option.value) === String(selectedOption.value)
      };
    }
  });
}

/** Support functions: Get & Set multiple selected option */
export function getMultipleSelectedOption(options: SelectOption[]): SelectOption[] {
  return options.filter(option => option.selected);
}

export function setMultipleSelectedOption(options: SelectOption[], selectedOptions: SelectOption[]): SelectOption[] {
  return options.map(option => ({
    ...option,
    selected: selectedOptions.some(selectedOption => String(option.value) === String(selectedOption.value))
  }));
}

/** Define component */

export default defineComponent({
  name: "SelectInput",
  components: {
    ButtonCustom
  },
  props: {
    options: {
      type: Array as PropType<SelectOption[]>,
      required: true
    },
    size: {
      type: String as PropType<"sm" | "md" | "lg" | "xl" | "2xl">,
      default: "lg"
    },
    variant: {
      type: String as PropType<
        "primary" | "secondary" | "secondary-gray" | "tertiary-color" | "tertiary-gray" | "link-color" | "link-gray"
      >,
      default: "secondary-gray"
    },
    customClass: {
      type: String,
      default: ""
    },
    multiple: {
      type: Boolean,
      default: false
    }
  },
  emits: {
    onChange: (options: SelectOption[]) => {}
  },
  setup({ options, multiple }) {
    let preSelectedOptions = options.filter(option => option.selected);
    if (preSelectedOptions.length === 0) {
      preSelectedOptions = [options[0]];
    }
    const displayOptions: Ref<SelectOption[]> = ref<SelectOption[]>(
      multiple
        ? setMultipleSelectedOption(options, preSelectedOptions)
        : setSelectedOption(options, preSelectedOptions[0])
    );
    const dropdownElementRef = ref<VNodeRef | undefined>(undefined);

    return {
      displayOptions,
      dropdownElementRef
    };
  },
  watch: {
    options() {
      this.displayOptions = this.options;
    }
  },
  data() {
    return {
      showDropdownPanel: false
    };
  },
  beforeDestroy() {
    document.removeEventListener("click", this.handleClickOutside);
  },
  computed: {
    selectedOptionLabel() {
      let selected = null;
      if (this.multiple) {
        selected = getMultipleSelectedOption(this.displayOptions);
        return selected && selected.length == 1 ? selected[0].label : "Selected options";
      } else {
        selected = getSelectedOption(this.displayOptions);
        return selected ? selected.label : "";
      }
    }
  },
  methods: {
    randString,
    toggleDropdown() {
      this.showDropdownPanel = !this.showDropdownPanel;

      if (this.showDropdownPanel) {
        document.addEventListener("click", this.handleClickOutside);
      } else {
        document.removeEventListener("click", this.handleClickOutside);
      }
    },
    handleClickOutside(event: MouseEvent) {
      if (this.dropdownElementRef && !this.dropdownElementRef.contains(event.target as Node)) {
        this.showDropdownPanel = false;
        document.removeEventListener("click", this.handleClickOutside);
      }
    },
    changeOption(selectedOption: SelectOption) {
      this.displayOptions = setSelectedOption(this.displayOptions, selectedOption, this.multiple);
      this.$emit("onChange", this.displayOptions);
    }
  }
});
