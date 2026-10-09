import { randString } from "@/common";
import { defineComponent, PropType, ref, Ref } from "vue";

export interface SwitchOption {
  label: string;
  value: string;
  selected?: boolean;
}

/** Support function: Get & Set selected option */
export function getSelectedSwitchOption(options: SwitchOption[]): SwitchOption {
  return options.find(option => option.selected) as SwitchOption;
}

export function setSelectedSwitchOption(
  options: SwitchOption[], 
  selectedOption: SwitchOption
): SwitchOption[] {
  return options.map(option => ({
    ...option,
    selected: String(option.value) === String(selectedOption.value)
  }))
}

/** Define component */
export default defineComponent({
  name: "ButtonSwitch",
  props: {
    options: {
      type: Array as PropType<SwitchOption[]>,
      required: true
    }
  },
  emits: {
    onChange: (value: SwitchOption[]) => {}
  },
  setup({ options }) {
    const preSelectedOption: SwitchOption = options.find(option => option.selected) ?? options[0];
    const displayOptions: Ref<SwitchOption[]> = ref<SwitchOption[]>(
      setSelectedSwitchOption(options, preSelectedOption)
    );

    return {
      displayOptions
    };
  },
  watch: {
    options() {
      this.displayOptions = this.options;
    }
  },
  methods: {
    randString,
    changeOption(selectedOption: SwitchOption) {
      this.$emit(
        "onChange", 
        setSelectedSwitchOption(this.displayOptions, selectedOption)
      );
    }
  }
});
