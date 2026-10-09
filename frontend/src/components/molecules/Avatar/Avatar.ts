import { FetchImage } from "@/components/atoms";
import { defineComponent, PropType } from "vue";

export default defineComponent({
  name: "Avatar",
  components: { FetchImage },
  props: {
    filePath: {
      type: String,
      default: null
    },
    classNames: {
      type: String,
      default: ""
    },
    alt: {
      type: String,
      default: "Default avatar"
    },
    width: {
      type: [String, Number],
      default: "auto"
    },
    height: {
      type: [String, Number],
      default: "auto"
    },
    loading: {
      type: String as PropType<"lazy" | "eager">,
      default: "eager"
    },
    draggable: {
      type: Boolean,
      default: true
    }
  }
});
