import { defineComponent, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { opsService } from "../../services";
import { snApi } from "@/api/sn-api";
import { SN_SHIFTS } from "@/api/sn-endpoints";
import { errorText, t } from "@/features/sn-shell/i18n";
import { formatDateTimeVn, formatVnd } from "@/common/vnFormat";
import { SnAlert, SnTimeline } from "@/features/sn-shell/components";

export default defineComponent({
  name: "SnOpsExceptionDetailPage",
  compatConfig: { MODE: 3 },
  components: { SnAlert, SnTimeline },
  setup() {
    const route = useRoute();
    const id = route.params.id as string;
    const kase = ref<any>(null);
    const timeline = ref<any[]>([]);
    const note = ref("");
    const error = ref("");
    const message = ref("");
    const busy = ref(false);

    const load = async () => {
      try {
        kase.value = await opsService.exception(id);
        if (kase.value.subject_type === "shift") timeline.value = await snApi.get<any[]>(SN_SHIFTS.TIMELINE(kase.value.subject_id)).catch(() => []);
      } catch (e) {
        error.value = errorText(e);
      }
    };
    onMounted(load);

    const run = async (fn: () => Promise<unknown>, ok: string) => {
      busy.value = true;
      error.value = "";
      try {
        await fn();
        message.value = ok;
        await load();
      } catch (e) {
        error.value = errorText(e);
      } finally {
        busy.value = false;
      }
    };
    const ack = () => run(() => opsService.acknowledge(id), t("sn.common.success"));
    const resolve = (a: { action: string; params?: Record<string, unknown> }) =>
      run(() => opsService.resolve(id, { action: a.action, params: a.params, ...(note.value && { note: note.value }) }), t("sn.ops.resolvedOk"));
    const dismiss = () => run(() => opsService.resolve(id, { dismiss: true, ...(note.value && { note: note.value }) }), t("sn.ops.resolvedOk"));

    return { kase, timeline, note, error, message, busy, ack, resolve, dismiss, formatDateTimeVn, formatVnd };
  }
});
