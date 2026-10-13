import { computed, defineComponent, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import { useRoute } from "vue-router";
import { shiftPostingService } from "../../services";
import { DISPUTE_REASONS, FREE_CANCEL_HOURS, LATE_CANCEL_COMP_PCT } from "../../constants";
import { SnShift, TERMINAL } from "@/common/models/snShift.model";
import { errorText, t } from "@/features/sn-shell/i18n";
import { formatDateTimeVn, formatPhoneVn, formatShiftRange, formatVnd, minutesToHoursLabel } from "@/common/vnFormat";
import { skillNames } from "@/features/worker-profile/services";
import { SnAlert, SnModal, SnStatusBadge, SnTimeline } from "@/features/sn-shell/components";
import RatingDialog from "@/features/ratings/components/RatingDialog/RatingDialog.vue";
import LocationQr from "@/features/employer-profile/components/LocationQr/LocationQr.vue";

export default defineComponent({
  name: "SnEmployerShiftDetailPage",
  compatConfig: { MODE: 3 },
  components: { SnAlert, SnModal, SnStatusBadge, SnTimeline, RatingDialog, LocationQr },
  setup() {
    const route = useRoute();
    const id = route.params.id as string;
    const shift = ref<SnShift | null>(null);
    const timeline = ref<any[]>([]);
    const worker = ref<any>(null);
    const skills = ref<Record<string, string>>({});
    const error = ref("");
    const message = ref("");
    const busy = ref(false);
    const modal = ref<"" | "cancel" | "offer" | "confirm" | "dispute" | "rate" | "qr">("");
    const offerPhone = ref("");
    const approved = ref<number | null>(null);
    const dispute = reactive({ reason_code: "left_early", note: "", claimed_minutes: null as number | null });
    let poll: any;

    const can = (cmd: string) => !!shift.value?.available_commands?.includes(cmd);
    const scheduled = computed(() => shift.value?.scheduled_minutes ?? Math.round((new Date(shift.value!.end_at).getTime() - new Date(shift.value!.start_at).getTime()) / 60000));

    const load = async () => {
      try {
        const [s, tl] = await Promise.all([shiftPostingService.get(id), shiftPostingService.timeline(id)]);
        shift.value = s;
        timeline.value = tl;
        if (s.worker_id && worker.value?.user_id !== s.worker_id) worker.value = await shiftPostingService.workerCard(s.worker_id).catch(() => null);
        if (!s.worker_id) worker.value = null;
        if (TERMINAL.includes(s.status)) clearInterval(poll);
      } catch (e) {
        error.value = errorText(e);
      }
    };
    onMounted(async () => {
      skills.value = await skillNames().catch(() => ({}));
      await load();
      poll = setInterval(load, 4000);
    });
    onBeforeUnmount(() => clearInterval(poll));

    const run = async (fn: () => Promise<unknown>, ok?: string) => {
      busy.value = true;
      error.value = "";
      message.value = "";
      try {
        await fn();
        modal.value = "";
        if (ok) message.value = ok;
        await load();
      } catch (e) {
        error.value = errorText(e);
      } finally {
        busy.value = false;
      }
    };
    const doCancel = () => run(() => shiftPostingService.cancel(id));
    const doOffer = () => run(() => shiftPostingService.directOffer(id, offerPhone.value.trim()));
    const doConfirm = () => run(() => shiftPostingService.confirm(id, approved.value === null || approved.value === ("" as any) ? undefined : Number(approved.value)));
    const doDispute = () =>
      run(
        () => shiftPostingService.dispute(id, { reason_code: dispute.reason_code, ...(dispute.note && { note: dispute.note }), ...(dispute.claimed_minutes !== null && { claimed_minutes: Number(dispute.claimed_minutes) }) }),
        t("sn.shift.disputeSent")
      );
    const openConfirm = () => {
      approved.value = Math.min(shift.value?.worked_minutes ?? 0, scheduled.value);
      modal.value = "confirm";
    };

    return {
      shift, timeline, worker, skills, error, message, busy, modal, offerPhone, approved, dispute, scheduled,
      can, load, doCancel, doOffer, doConfirm, doDispute, openConfirm,
      reasons: DISPUTE_REASONS, freeCancelHours: FREE_CANCEL_HOURS, lateCompPct: LATE_CANCEL_COMP_PCT,
      formatDateTimeVn, formatShiftRange, formatVnd, formatPhoneVn, minutesToHoursLabel
    };
  }
});
