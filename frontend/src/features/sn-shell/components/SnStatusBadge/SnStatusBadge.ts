import { defineComponent, computed } from "vue";

const VARIANT: Record<string, string> = {
  POSTED: "info",
  MATCHED: "primary",
  ACCEPTED: "primary",
  ESCROW_FUNDED: "success",
  CHECKED_IN: "warning",
  CHECKED_OUT: "warning",
  COMPLETED: "success",
  PAID: "success",
  RATED: "dark",
  NO_SHOW: "danger",
  DISPUTED: "danger",
  CANCELLED: "dark",
  EXPIRED: "dark"
};

export default defineComponent({
  name: "SnStatusBadge",
  compatConfig: { MODE: 3 },
  props: { status: { type: String, required: true } },
  setup(props) {
    const variant = computed(() => VARIANT[props.status] || "dark");
    return { variant };
  }
});
