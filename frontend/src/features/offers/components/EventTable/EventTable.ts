import { defineComponent } from "vue";
import { ChevronMove, PlusIconOutline, Trash2 } from "@/components";
import draggable from "vuedraggable";

export default defineComponent({
  name: "EventTable",
  props: {
    events: {
      type: Array as () => { id?: string | number; label: string; value: string }[],
      required: true
    },
    disabled: {
      type: Boolean,
      required: false,
      default: false
    }
  },
  components: {
    // Import components here
    ChevronMove,
    Trash2,
    PlusIconOutline,
    draggable
  },
  data() {
    return {
      isDisabled: this.disabled
    };
  },
  setup() {},
  methods: {
    // Define methods here
    addEvent() {
      this.events.push({ label: "", value: "" });
      this.$emit("update:events", this.events);
    },
    updateEvent(index: number, updatedEvent: { label?: string; value?: string }) {
      if (updatedEvent.label) {
        this.events[index].label = updatedEvent.label;
      }
      if (updatedEvent.value) {
        this.events[index].value = updatedEvent.value;
      }
      this.$emit("update:events", this.events);
    },
    deleteEvent(index: number) {
      this.events.splice(index, 1);
      this.$emit("update:events", this.events);
    }
  },
  computed: {
    // Define computed properties here
  }
});
