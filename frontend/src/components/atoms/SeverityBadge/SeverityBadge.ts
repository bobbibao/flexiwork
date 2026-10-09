import { defineComponent, PropType } from "vue";
import DotIcon from "@/components/atoms/Icons/DotIcon.vue";

export default defineComponent({
  name: "SeverityBadge",
  components: {
    DotIcon
  },
  props: {
    title: {
      type: String
    },
    color: {
      type: String,
      default: "#2E90FA"
    },
    size: {
      type: String as PropType<"sm" | "md" | "lg" | "xl" | "2xl">,
      default: "sm"
    },
    customClass: {
      type: String,
      default: ""
    },
    showDot: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    badgeStyles() {
      return {
        color: this.color,
        backgroundColor: this.hexToRgba(this.color, 0.1)
      };
    }
  },
  methods: {
    hexToRgba(hex: string, alpha: number) {
      let r = 0,
        g = 0,
        b = 0;
      if (hex.length === 4) {
        r = parseInt(hex[1] + hex[1], 16);
        g = parseInt(hex[2] + hex[2], 16);
        b = parseInt(hex[3] + hex[3], 16);
      } else if (hex.length === 7) {
        r = parseInt(hex[1] + hex[2], 16);
        g = parseInt(hex[3] + hex[4], 16);
        b = parseInt(hex[5] + hex[6], 16);
      }
      return `rgba(${r},${g},${b},${alpha})`;
    }
  }
});
