import { defineComponent } from "vue";
// @ts-ignore
import Quill from "quill";
import "quill/dist/quill.snow.css";

export default defineComponent({
  name: "ContentEditor",
  props: {
    value: {
      type: String,
      default: ""
    },
    placeholder: {
      type: String,
      default: "Enter a description..."
    },
    disabled: {
      type: Boolean,
      default: false
    },
    toolbarOptions: {
      type: Array,
      default: () => [
        [{ header: [1, 2, 3, 4, 5, 6, false] }],
        ["bold", "italic", "link", { list: "ordered" }, { list: "bullet" }]
      ]
    },
    formatsOptions: {
      type: Array,
      default: () => ["bold", "italic", "underline", "link", "list", "indent", "header"]
    },
    minHeight: {
      type: Number,
      default: 120
    },
    maxHeight: {
      type: Number,
      default: 500
    }
  },
  emits: {
    input: (value: string) => {}
  },
  data() {
    const editorInstance: any = null;
    const editorContent = "";

    return {
      editorInstance,
      editorContent
    };
  },
  mounted() {
    this.initializeEditor();
  },
  beforeDestroy() {
    if (this.editorInstance) {
      this.editorInstance.off("text-change");
    }
  },
  watch: {
    value(newValue: string) {
      if (this.editorInstance && newValue !== this.editorContent) {
        this.editorInstance.pasteHTML(this.value);
      }
    }
  },
  methods: {
    initializeEditor() {
      const contentEditor = this.$refs.editor;
      if (contentEditor) {
        // @ts-ignore
        contentEditor.innerHTML = this.value;

        this.editorInstance = new Quill(contentEditor, {
          theme: "snow",
          modules: {
            toolbar: this.toolbarOptions
          },
          placeholder: this.placeholder,
          formats: this.formatsOptions,
          focus: false
        });

        if (this.disabled) {
          this.editorInstance.enable(false);
        }
        this.editorInstance.on("text-change", this.onEditorContentChange);

        // Add resize observer to adjust editor height
        const container = this.editorInstance.container;
        const resizeObserver = new ResizeObserver(() => {
          const height = container.offsetHeight;
          if (height < this.minHeight) {
            container.style.height = `${this.minHeight}px`;
          } else if (height > this.maxHeight) {
            container.style.height = `${this.maxHeight}px`;
          }
        });
        resizeObserver.observe(container);
      }
    },
    onEditorContentChange() {
      if (this.editorInstance) {
        this.editorContent = this.editorInstance.getText().trim() ? this.editorInstance.root.innerHTML : "";
        this.$emit("input", this.editorContent);
      }
    }
  }
});
