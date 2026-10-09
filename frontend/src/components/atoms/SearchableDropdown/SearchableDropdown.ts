import { randString } from "@/common";
import { defineComponent, ref } from "vue";

export default defineComponent({
  name: "SearchableDropdown",
  props: {
    options: {
      type: Array,
      required: true,
      default: () => []
    },
    selectedOption: {
      type: Object, 
      required: true
    },
    searchFunction: {
      type: Function,
      required: true
    },
    showSelectedOptionFunction: {
      type: Function,
      required: true
    },
    placeholder: {
      type: String,
      default: "Select"
    },
    disabled: {
      type: Boolean,
      default: false
    }
  },
  emits: {
    onSelectOption: (value: any) => {}
  },
  setup({ options }) {
    const showDropdownPanel = ref<boolean>(false);
    const displayOptions = ref(options);
    const searchInput = ref<HTMLInputElement | null>(null);
    const dropdown = ref<HTMLElement | null>(null);
    const toggleButton = ref<HTMLElement | null>(null);

    return {
      showDropdownPanel,
      searchInput,
      displayOptions,
      dropdown,
      toggleButton
    };
  },
  mounted() {
    document.addEventListener("click", this.handleClickOutside);
  },
  beforeDestroy() {
    document.removeEventListener("click", this.handleClickOutside);
  },
  watch: {
    options() {
      this.displayOptions = this.options;
    },
    selectedOption() {
      this.searchInput!.value = this.showSelectedOptionFunction(this.selectedOption) || "";
    }
  },
  methods: {
    randString,
    toggleDropdown() {
      this.showDropdownPanel = !this.showDropdownPanel;
    },
    handleClickOutside(event: MouseEvent) {
      if (
        this.dropdown &&
        !this.dropdown.contains(event.target as Node) &&
        this.toggleButton &&
        !this.toggleButton.contains(event.target as Node) &&
        this.searchInput &&
        !this.searchInput.contains(event.target as Node)
      ) {
        this.showDropdownPanel = false;
      }
    },
    onSearch() {
      if (this.searchInput) {
        this.showDropdownPanel = true;
        this.displayOptions = this.searchFunction(this.options, this.searchInput.value);
      }
    },
    selectOption(option: any) {
      this.showDropdownPanel = false;
      this.displayOptions = this.options;
      this.$emit("onSelectOption", option);
    }
  }
});
