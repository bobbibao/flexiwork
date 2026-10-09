import { defineComponent, PropType } from "vue";

export default defineComponent({
  name: "ButtonSwitchView",
  props: {
    viewType: {
      type: String as PropType<"list" | "byProject" | "softDeleted">,
      default: "byProject"
    }
  },
  emits: {
    changeView(viewType: "list" | "byProject" | "softDeleted") {}
  },
  methods: {
    changeView(viewType: "list" | "byProject" | ) {
      this.$emit("changeView", viewType);
    }
  }
});
