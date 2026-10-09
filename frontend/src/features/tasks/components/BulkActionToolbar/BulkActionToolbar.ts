import { defineComponent, ref, watch } from "vue";
import { ButtonDropDown, ConfirmModal, SeverityBadge } from "@/components";
import { TaskState } from "@/common/models";

export default defineComponent({
  name: "BulkActionToolbar",
  components: {
    ConfirmModal,
    ButtonDropDown,
    SeverityBadge
  },
  emits: {
    onDeleteBulk: (listTaskId: number[]) => {},
    onUpdateBulk: (listTaskId: number[], status_id: number) => {}
  },
  props: {
    selectedTasks: {
      type: Array as () => number[],
      default: [],
      required: true
    },

    statuses: {
      type: Array as () => TaskState[],
      default: () => []
    }
  },
  setup(props) {
    const tasks = ref<number[]>(props.selectedTasks);
    const selectedStatus = ref<TaskState | null>(null);
    watch(
      () => props.selectedTasks,
      newSelectedTasks => {
        tasks.value = newSelectedTasks;
      },
      { immediate: true }
    );

    return {
      tasks,
      selectedStatus
    };
  },

  computed: {
    getStatusOption(): TaskState[] {
      return this.statuses;
    }
  },
  methods: {
    async deleteBulk() {
      this.$emit("onDeleteBulk", this.tasks);
    },
    async updateBulk() {
      if (this.selectedStatus) {
        this.$emit("onUpdateBulk", this.tasks, Number(this.selectedStatus.id));
      }
    },
    handleChangeStatus(value: TaskState) {
      this.selectedStatus = value;
    },
    handleCloseButton() {
      this.selectedTasks.splice(0, this.selectedTasks.length);
    }
  }
});
