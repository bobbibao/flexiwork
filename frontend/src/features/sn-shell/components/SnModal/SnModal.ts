import { defineComponent } from "vue";

/** Lightweight modal (no bootstrap-vue dependency, pure Vue 3). */
export default defineComponent({
  name: "SnModal",
  compatConfig: { MODE: 3 },
  props: {
    show: { type: Boolean, default: false },
    title: { type: String, default: "" }
  },
  emits: ["close"]
});
