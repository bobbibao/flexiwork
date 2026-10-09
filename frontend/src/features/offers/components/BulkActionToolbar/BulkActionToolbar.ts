import { defineComponent, ref, watch } from "vue";
import { ButtonDropDown, ConfirmModal, CopyIcon, PrintIcon, SeverityBadge } from "@/components";
import { TaskState } from "@/common/models";
import TrashIcon from "@/components/atoms/Icons/TrashIcon.vue";

export default defineComponent({
  name: "BulkActionToolbar",
  components: {
    ConfirmModal,
    ButtonDropDown,
    SeverityBadge,
    CopyIcon,
    PrintIcon,
    TrashIcon
  },
  emits: {
    onDeleteBulk: (listOfferId: number[]) => {},
    onCopyBulk: (listOfferId: number[]) => {},
    onPrintBulk: (listOfferId: number[]) => {}
  },
  props: {
    selectedOffers: {
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
    const offers = ref<number[]>(props.selectedOffers);
    const selectedStatus = ref<TaskState | null>(null);

    watch(
      () => props.selectedOffers,
      newSelectedOffers => {
        offers.value = newSelectedOffers;
      },
      { immediate: true }
    );

    return {
      offers,
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
      this.$emit("onDeleteBulk", this.offers);
    },

    async copyBulk() {
      this.$emit("onCopyBulk", this.offers);
    },

    async printBulk() {
      this.$emit("onPrintBulk", this.offers);
    },

    handleChangeStatus(value: TaskState) {
      this.selectedStatus = value;
    },
    handleCloseButton() {
      this.selectedOffers.splice(0, this.selectedOffers.length);
    }
  }
});
