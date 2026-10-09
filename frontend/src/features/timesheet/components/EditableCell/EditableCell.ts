import { defineComponent, ref, watch, nextTick } from "vue";

export default defineComponent({
  name: "EditableCell",
  props: {
    value: {
      type: Number,
      required: true
    },
    comment: {
      type: String,
      default: ""
    },
    onSave: {
      type: Function,
      required: true
    },
    onComment: {
      type: Function,
      required: false
    },
    hasComment: {
      type: Boolean,
      default: false
    }
  },
  setup(props) {
    const isEditing = ref(false);
    const editValue = ref(props.value.toFixed(2));
    const inputRef = ref<HTMLInputElement | null>(null);

    const localValue = ref(props.value);
    const localComment = ref(props.comment || "");

    watch(
      () => props.value,
      newVal => {
        if (!isEditing.value) {
          localValue.value = newVal;
          editValue.value = newVal.toFixed(2);
        }
      }
    );

    watch(
      () => props.comment,
      newComment => {
        // Always update local comment immediately, regardless of editing state
        localComment.value = newComment || "";
      },
      { immediate: true }
    );

    const startEditing = () => {
      isEditing.value = true;
      editValue.value = localValue.value.toFixed(2);
      nextTick(() => {
        inputRef.value?.focus();
        inputRef.value?.select();
      });
    };

    const handleBlur = () => {
      saveEdit();
    };

    const handleKeydown = (event: KeyboardEvent) => {
      const allowedKeys = ["Backspace", "Delete", "Tab", "Enter", "ArrowLeft", "ArrowRight", "."];
      const isNumber = /^[0-9]$/.test(event.key);

      if (!isNumber && !allowedKeys.includes(event.key)) {
        event.preventDefault();
        return;
      }

      if (event.key === "." && editValue.value.includes(".")) {
        event.preventDefault();
        return;
      }

      if (event.key === "Enter") {
        saveEdit();
      } else if (event.key === "Escape") {
        isEditing.value = false;
        editValue.value = localValue.value.toFixed(2);
      }
    };

    const saveEdit = () => {
      let value = parseFloat(editValue.value);
      if (isNaN(value)) value = localValue.value;

      value = Math.round(value * 100) / 100;
      value = Math.max(0, value);

      localValue.value = value;
      isEditing.value = false;

      if (value !== props.value) {
        nextTick(() => {
          props.onSave(value, localComment.value).catch((error: Error) => {
            console.error("Failed to save:", error);
            localValue.value = props.value;
            localComment.value = props.comment || "";
          });
        });
      }
    };

    return {
      isEditing,
      editValue,
      inputRef,
      localValue,
      localComment,
      startEditing,
      handleBlur,
      handleKeydown
    };
  }
});
