import { EditIcon } from "@/components/atoms";
import { defineComponent } from "vue";

export default defineComponent({
  name: "EditableTitle",
  components: {
    EditIcon
  },
  props: {
    value: {
      type: String,
      required: true
    },
    disabled: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      editValue: "",
      isEditing: false,
      showEditButton: false,
      inputWidth: 0
    };
  },
  methods: {
    startEditing(): void {
      this.editValue = this.value;
      // Get the width of the text to set the input width
      const textWidth = (this.$refs.titleText as Element).querySelector("h4")?.offsetWidth || 0;
      this.inputWidth = textWidth + 50;
      this.$nextTick(() => {
        if (this.$refs.editInput) {
          (this.$refs.editInput as HTMLElement).focus();
        }
      });
      this.isEditing = true;
    },
    finishEditing(): void {
      if (this.editValue.trim() !== "") {
        this.$emit("update", this.editValue.trim());
      }
      this.isEditing = false;
    },
    cancelEditing(): void {
      this.editValue = this.value;
      this.isEditing = false;
    },
    addSpace(event: KeyboardEvent): void {
      const input = this.$refs.editInput as HTMLInputElement;
      const start = input.selectionStart || 0;
      const end = input.selectionEnd || 0;
      this.editValue = this.editValue.substring(0, start) + " " + this.editValue.substring(end);
      this.$nextTick(() => {
        input.setSelectionRange(start + 1, start + 1);
      });
      event.preventDefault();
    },
    handleKeydown(event: KeyboardEvent): void {
      // Prevent enter key from finishing edit
      if (event.key === "Enter") {
        event.preventDefault();
      }
    }
  }
});
