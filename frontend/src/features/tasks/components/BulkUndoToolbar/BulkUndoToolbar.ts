import { defineComponent, ref } from "vue";
import { ButtonDropDown, ConfirmModal, SeverityBadge } from "@/components";

export default defineComponent({
  name: "BulkUndoToolbar",
  components: {
    ConfirmModal,
    ButtonDropDown,
    SeverityBadge
  },
  emits: {
    onUndoBulk: (listTaskId: number[]) => {}
  },
  props: {
    selectedTasks: {
      type: Array as () => number[],
      default: [],
      required: true
    },
  },
  setup(props) {
    const tasks = ref<number[]>(props.selectedTasks);
    return { tasks };
  },
  methods: {
    async undoBulk() {
      const tasksToUndo: number[] = Array.from(
        this.tasks.values()).map((id) => parseInt(id.toString())
      );
      this.$emit("onUndoBulk", tasksToUndo);
    },
    handleCloseButton() {
      this.selectedTasks.splice(0, this.selectedTasks.length);
    }
  }
});
