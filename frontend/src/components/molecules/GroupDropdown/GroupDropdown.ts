import { defineComponent, PropType, ref } from "vue";
import { Accordion, ButtonCustom } from "@/components/atoms";
import { ChevronUpIcon, ChevronDownIcon } from "@/components/atoms";
import { randString } from "@/common";
import i18n from "@/core/plugins/vue-i18n";
import { VNodeRef } from "vue/types/vnode";

export interface GroupOption {
  label: string;
  selected?: boolean;
  expanded?: boolean;
  options: {
    label: string;
    value: string;
    selected?: boolean;
    html?: any;
    desc?: string;
    isTask?: boolean; // New field to identify task items
    parentValue?: string; // Reference to parent product
  }[];
  indeterminate?: boolean;
}

const GroupDropdown = defineComponent({
  name: "GroupDropdown",
  components: {
    ButtonCustom,
    Accordion,
    ChevronUpIcon,
    ChevronDownIcon
  },
  props: {
    displayOptions: {
      type: Array as () => GroupOption[],
      required: false,
      default: () => []
    },
    disabled: {
      type: Boolean,
      default: false
    },
    customClassName: {
      type: String,
      default: ""
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
    }
  },
  setup() {
    const dropdownRef = ref<VNodeRef | undefined>(undefined);
    return { dropdownRef };
  },
  data() {
    return {
      showDropdown: false,
      showAll: true,
      selected: [] as string[],
      allSelected: false,
      indeterminate: false,
      internalOptions: [] as GroupOption[],
      isInitialized: false,
      saveTimeout: null as any,
      isInitializing: false
    };
  },
  watch: {
    selected(newValue, oldValue) {
      if (JSON.stringify(newValue) === JSON.stringify(oldValue)) return;
      const totalOptions = this.displayOptions.flatMap(group => group.options).length;
      if (newValue.length === 0) {
        this.indeterminate = false;
      } else if (newValue.length === totalOptions) {
        this.indeterminate = false;
        this.allSelected = true;
      } else {
        this.indeterminate = true;
        this.allSelected = false;
      }
      this.displayOptions.forEach(group => {
        const groupValues = group.options.map(opt => opt.value);
        const selectedCount = groupValues.filter(value => newValue.includes(value)).length;
        group.selected = selectedCount === groupValues.length;
        group.indeterminate = selectedCount > 0 && selectedCount < groupValues.length;

        group.options.forEach(opt => {
          opt.selected = newValue.includes(opt.value);
        });
      });

      // Emit change immediately for parent to track selections
      this.$emit("filterProjects", this.selected);

      // Only debounce save if not initializing
      if (!this.isInitializing) {
        this.debouncedSave();
      }
    },
    displayOptions: {
      immediate: true,
      handler(newOptions: GroupOption[]) {
        this.isInitializing = true; // Set flag during initialization
        // Initialize with expanded false for each group
        this.internalOptions = JSON.parse(JSON.stringify(newOptions)).map((group: GroupOption) => ({
          ...group,
          expanded: false, // Make sure this is explicitly set
          selected: false,
          indeterminate: false
        }));
        this.initData();
        // Reset flag after initialization
        this.$nextTick(() => {
          this.isInitializing = false;
        });
      }
    }
  },
  mounted() {
    document.addEventListener("click", this.handleClickOutside);
  },
  beforeDestroy() {
    document.removeEventListener("click", this.handleClickOutside);
    // Clear timeout on component destroy
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
  },
  methods: {
    initData() {
      this.isInitializing = true; // Set flag during init
      this.selected = this.internalOptions.flatMap(group =>
        group.options.filter(opt => opt.selected).map(opt => opt.value)
      );
      this.updateGroupStates();
      // Reset flag after init
      this.$nextTick(() => {
        this.isInitializing = false;
      });
    },
    updateGroupStates() {
      const allValues = this.internalOptions.flatMap(group => group.options.map(opt => opt.value));

      this.allSelected = this.selected.length === allValues.length;
      this.indeterminate = this.selected.length > 0 && this.selected.length < allValues.length;

      this.internalOptions.forEach(group => {
        const groupValues = group.options.map(opt => opt.value);
        const selectedInGroup = groupValues.filter(value => this.selected.includes(value));

        group.selected = selectedInGroup.length === groupValues.length;
        group.indeterminate = selectedInGroup.length > 0 && selectedInGroup.length < groupValues.length;
      });
    },
    toggleDropdown() {
      if (!this.showDropdown && !this.isInitialized) {
        // First time opening dropdown - initialize options
        this.$emit("initializeOptions");
        this.isInitialized = true;
      }
      this.showDropdown = !this.showDropdown;
    },
    closeDropdown() {
      this.showDropdown = false;
    },
    randString,
    truncate(str: string, length: number) {
      return str.length > length ? str.substring(0, length) + "..." : str;
    },
    handleClickOutside(event: MouseEvent) {
      if (this.dropdownRef && !this.dropdownRef.contains(event.target as Node)) {
        this.showDropdown = false;
      }
    },
    toggleExpand(group: GroupOption, event: Event) {
      event.stopPropagation();
      // Use Vue.set to ensure reactivity
      this.$set(group, "expanded", !group.expanded);
    },
    toggleGroupCheckbox(group: GroupOption, event: Event) {
      const target = event.target as HTMLInputElement;
      const checked = target.checked;
      const groupValues = group.options.map(opt => opt.value);

      if (checked) {
        this.selected = [...new Set([...this.selected, ...groupValues])];
      } else {
        this.selected = this.selected.filter(value => !groupValues.includes(value));
      }

      group.selected = checked;
      group.indeterminate = false;
      this.updateGroupStates();
    },
    toggleAll(event: Event) {
      const target = event.target as HTMLInputElement;
      const checked = target.checked;

      if (checked) {
        this.selected = this.internalOptions.flatMap(group => group.options.map(opt => opt.value));
      } else {
        this.selected = [];
      }

      this.internalOptions.forEach(group => {
        group.selected = checked;
        group.indeterminate = false;
      });

      this.allSelected = checked;
      this.indeterminate = false;
    },
    debouncedSave() {
      // Clear existing timeout
      if (this.saveTimeout) {
        clearTimeout(this.saveTimeout);
      }
      // Set new timeout to save after 500ms of no changes
      this.saveTimeout = setTimeout(() => {
        this.$emit("applyOptions");
      }, 500);
    }
  }
});

export default {
  ...GroupDropdown,
  i18n
};
