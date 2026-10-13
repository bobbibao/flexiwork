import { defineComponent } from "vue";

/** Inline message box (Vietnamese text passed by the caller). */
export default defineComponent({
  name: "SnAlert",
  compatConfig: { MODE: 3 },
  props: {
    variant: { type: String, default: "danger" },
    message: { type: String, default: "" }
  }
});
