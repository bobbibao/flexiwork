import { defineComponent, PropType } from "vue";

export default defineComponent({
  name: "Accordion",
  props: {
    name: {
      type: String,
      required: true
    },
    title: {
      type: String,
      default: ""
    },
    alwaysOpen: {
      type: Boolean,
      default: false
    },
    headerClassName: {
      type: String,
      default: ""
    },
    bodyClassName: {
      type: String,
      default: ""
    },
    headerVariant: {
      type: String,
      default: "secondary"
    },
    headerType: {
      type: String as PropType<"button" | "div">,
      default: "button"
    },
    showBorder: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      isOpen: this.alwaysOpen || false,
      accordionId: this.name,
      accordionHeader: this.title,
      isAlwaysOpen: this.alwaysOpen,
      headerClass: this.headerClassName,
      bodyClass: this.bodyClassName,
      customHeaderVariant: this.headerVariant,
      customHeaderType: this.headerType,
      isShowBorder: this.showBorder
    };
  },
  methods: {
    toggleAccordion() {
      this.isOpen = !this.isOpen;
    },
    onSelectAll() {},
    onClearAll() {},
    onSelectChange() {}
  },
  emits: {}
});
