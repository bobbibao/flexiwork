import { defineComponent, PropType } from "vue";
import { formatDateTimeVn } from "@/common/vnFormat";

export interface TimelineEvent {
  version: number;
  type: string;
  occurred_at: string;
  actor: { type?: string; role?: string };
  payload: Record<string, any>;
}

export default defineComponent({
  name: "SnTimeline",
  compatConfig: { MODE: 3 },
  props: { events: { type: Array as PropType<TimelineEvent[]>, default: () => [] } },
  setup() {
    return { formatDateTimeVn };
  }
});
