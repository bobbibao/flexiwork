import { defineComponent, ref, watch } from "vue";
import { ButtonDropDown, ConfirmModal, CopyIcon, PrintIcon, SeverityBadge } from "@/components";
import { TaskState } from "@/common/models";
import TrashIcon from "@/components/atoms/Icons/TrashIcon.vue";
import EditIcon from "@/components/atoms/Icons/EditIcon.vue";

export default defineComponent({
  name: "BulkActionToolbar",
  components: {
    ConfirmModal,
    ButtonDropDown,
    SeverityBadge,
    CopyIcon,
    PrintIcon,
    TrashIcon,
    EditIcon
  },
  emits: {
    onDeleteBulk: (listProjectId: number[]) => {},
    onCopyBulk: (listProjectId: number[]) => {},
    onPrintBulk: (listProjectId: number[]) => {},
    onUpdateBulk: (listProjectId: number[], status: string) => {}
  },
  props: {
    selectedProjects: {
      type: Array as () => number[],
      default: [],
      required: true
    },
    statuses: {
      type: Array as () => { value: string; label: string }[],
      default: () => []
    }
  },
  setup(props) {
    const projects = ref<number[]>(props.selectedProjects);
    const selectedStatus = ref<{ value: string; label: string } | null>(null);

    watch(
      () => props.selectedProjects,
      newSelectedProjects => {
        projects.value = newSelectedProjects;
      },
      { immediate: true }
    );

    return {
      projects,
      selectedStatus
    };
  },
  computed: {
    getStatusOption(): { value: string; label: string }[] {
      return this.statuses;
    }
  },
  methods: {
    async deleteBulk() {
      this.$emit("onDeleteBulk", this.projects);
    },

    async copyBulk() {
      this.$emit("onCopyBulk", this.projects);
    },

    async printBulk() {
      this.$emit("onPrintBulk", this.projects);
    },

    async updateBulk() {
      if (this.selectedStatus) {
        this.$emit("onUpdateBulk", this.projects, this.selectedStatus.value);
      }
    },

    handleChangeStatus(value: { value: string; label: string }) {
      this.selectedStatus = value;
    },
    handleCloseButton() {
      this.selectedProjects.splice(0, this.selectedProjects.length);
    }
  }
});
