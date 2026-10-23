import { defineComponent, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { shiftBoardService } from "../../services";
import { SnShift } from "@/common/models/snShift.model";
import { errorText } from "@/features/sn-shell/i18n";
import { formatShiftRange, formatVnd, minutesToHoursLabel } from "@/common/vnFormat";
import { skillNames } from "@/features/worker-profile/services";
import { useSessionStore } from "@/core/stores/session.store";
import SnAlert from "@/features/sn-shell/components/SnAlert/SnAlert.vue";
import SnStatusBadge from "@/features/sn-shell/components/SnStatusBadge/SnStatusBadge.vue";

export default defineComponent({
  name: "SnShiftPreviewPage",
  compatConfig: { MODE: 3 },
  components: { SnAlert, SnStatusBadge },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const session = useSessionStore();
    const id = route.params.id as string;
    const shift = ref<SnShift | null>(null);
    const skills = ref<Record<string, string>>({});
    const error = ref("");
    const busy = ref(false);
    const load = async () => {
      try {
        if (session.role === "employer") {
          router.replace(`/sn/employer/shifts/${id}`);
          return;
        }
        shift.value = await shiftBoardService.get(id);
        if (shift.value.worker_id && session.user && Number(shift.value.worker_id) === Number(session.user.id)) {
          router.replace(`/sn/my-shifts/${id}`);
        }
      } catch (e) {
        error.value = errorText(e);
      }
    };
    onMounted(async () => {
      skills.value = await skillNames().catch(() => ({}));
      await load();
    });
    const act = async (fn: () => Promise<unknown>, after?: string) => {
      busy.value = true;
      error.value = "";
      try {
        await fn();
        if (after) router.push(after);
        else await load();
      } catch (e) {
        error.value = errorText(e);
      } finally {
        busy.value = false;
      }
    };
    const can = (c: string) => !!shift.value?.available_commands?.includes(c);
    return {
      shift, skills, error, busy, can,
      accept: () => act(() => shiftBoardService.accept(id), `/sn/my-shifts/${id}`),
      decline: () => act(() => shiftBoardService.decline(id), "/sn/offers"),
      formatShiftRange, formatVnd, minutesToHoursLabel
    };
  }
});
