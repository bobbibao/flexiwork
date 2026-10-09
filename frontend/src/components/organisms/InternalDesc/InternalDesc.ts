import { defineComponent, PropType } from "vue";
import { OfferInternalDesc } from "@/common/models/offerInternalDesc.model";
import { Accordion, ContentEditor } from "@/components/atoms";

export default defineComponent({
  name: "InternalDesc",
  components: {
    ContentEditor,
    Accordion
  },
  props: {
    internalDesc: {
      type: Array as PropType<OfferInternalDesc[]>,
      default: () => [],
      required: true
    },
    disabled: {
      type: Boolean,
      default: false,
      required: false
    },
    className: {
      type: String,
      default: "",
      required: false
    }
  },
  data() {
    return {
      isDisabled: this.disabled,
      customClassName: this.className
    };
  },
  methods: {
    updateInternalDesc(label: string) {
      const updatedInternalDesc = this.internalDesc.map(desc => {
        if (desc.label === label) {
          desc.is_active = !desc.is_active;
        }
        return desc;
      });
      this.$emit("updateInternalDesc", updatedInternalDesc);
    }
  }
});
