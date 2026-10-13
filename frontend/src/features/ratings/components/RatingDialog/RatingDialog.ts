import { defineComponent, ref } from "vue";
import { snApi } from "@/api/sn-api";
import { SN_SHIFTS } from "@/api/sn-endpoints";
import { errorText } from "@/features/sn-shell/i18n";
import SnModal from "@/features/sn-shell/components/SnModal/SnModal.vue";

const TAGS = { employer: ["dung_gio", "cham_chi", "than_thien", "chuyen_nghiep"], worker: ["tra_luong_dung", "moi_truong_tot", "than_thien", "chuyen_nghiep"] };

/** Shared rating dialog (PLAN P11.7): 1-5 stars, tags, comment. */
export default defineComponent({
  name: "RatingDialog",
  compatConfig: { MODE: 3 },
  components: { SnModal },
  props: {
    show: { type: Boolean, default: false },
    shiftId: { type: String, required: true },
    raterRole: { type: String as () => "employer" | "worker", required: true }
  },
  emits: ["close", "rated"],
  setup(props, { emit }) {
    const stars = ref(5);
    const tags = ref<string[]>([]);
    const comment = ref("");
    const error = ref("");
    const busy = ref(false);
    const toggle = (tag: string) => (tags.value = tags.value.includes(tag) ? tags.value.filter(x => x !== tag) : [...tags.value, tag]);
    const submit = async () => {
      busy.value = true;
      error.value = "";
      try {
        const shift = await snApi.post(SN_SHIFTS.RATE(props.shiftId), { stars: stars.value, tags: tags.value, ...(comment.value.trim() && { comment: comment.value.trim() }) });
        emit("rated", shift);
        emit("close");
      } catch (e) {
        error.value = errorText(e);
      } finally {
        busy.value = false;
      }
    };
    return { stars, tags, comment, error, busy, toggle, submit, available: TAGS[props.raterRole] };
  }
});
