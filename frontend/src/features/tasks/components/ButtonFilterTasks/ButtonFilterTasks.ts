import { ButtonCustom, FilterLinesIcon, SelectInput, SelectOption, ChevronDownIcon, CheckIcon } from "@/components";
import { defineComponent } from "vue";

export default defineComponent({
  name: "ButtonFilterTasks",
  components: { ButtonCustom, SelectInput, FilterLinesIcon, ChevronDownIcon, CheckIcon },
  props: {
    assignees: {
      type: Array as () => SelectOption[],
      default: () => []
    },
    statuses: {
      type: Array as () => SelectOption[],
      default: () => []
    },
    priorities: {
      type: Array as () => SelectOption[],
      default: () => []
    }
  },
  emits: {
    assigneeFilterChanged: (value: SelectOption[]) => {},
    statusFilterChanged: (value: SelectOption[]) => {},
    priorityFilterChanged: (value: SelectOption[]) => {}
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
    handleOnChangeStatus1(selectedOption: SelectOption) {
      const index = this.statuses.findIndex(status => String(status.value) === String(selectedOption.value));
      if (index > -1) {
        const newStatuses = [...this.statuses];
        newStatuses[index].selected = !newStatuses[index].selected;
        this.$emit("statusFilterChanged", newStatuses);
      }
    },
    handleOnChangeAssignee(value: SelectOption[]) {
      this.$emit("assigneeFilterChanged", value);
    },
    handleOnChangeStatus(value: SelectOption[]) {
      this.$emit("statusFilterChanged", value);
    },
    handleOnChangePriority(value: SelectOption[]) {
      this.$emit("priorityFilterChanged", value);
    }
  }
});
