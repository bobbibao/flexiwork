import { computed, defineComponent, onBeforeUnmount, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { myShiftsService } from "../../services";
import { SnShift, TERMINAL } from "@/common/models/snShift.model";
import { currentPosition, distanceM } from "@/features/sn-shell/composables/geolocation";
import { errorText, t } from "@/features/sn-shell/i18n";
import { formatDateTimeVn, formatDistance, formatShiftRange, formatTimeVn, formatVnd, minutesToHoursLabel } from "@/common/vnFormat";
import { SnAlert, SnModal, SnStatusBadge, SnTimeline } from "@/features/sn-shell/components";
import RatingDialog from "@/features/ratings/components/RatingDialog/RatingDialog.vue";

const EARLY_MIN = 30;

/** Worker shift detail with check-in / check-out (PLAN P11.6). */
export default defineComponent({
  name: "SnMyShiftDetailPage",
  compatConfig: { MODE: 3 },
  components: { SnAlert, SnModal, SnStatusBadge, SnTimeline, RatingDialog },
  setup() {
    const route = useRoute();
    const id = route.params.id as string;
    const shift = ref<SnShift | null>(null);
    const timeline = ref<any[]>([]);
    const error = ref("");
    const message = ref("");
    const busy = ref(false);
    const distance = ref<number | null>(null);
    const qrToken = ref("");
    const modal = ref<"" | "withdraw" | "rate">("");
    const canScan = typeof window !== "undefined" && "BarcodeDetector" in window;
    let poll: any;

    const can = (c: string) => !!shift.value?.available_commands?.includes(c);
    const opensAt = computed(() => (shift.value ? new Date(new Date(shift.value.start_at).getTime() - EARLY_MIN * 60000) : null));

    const load = async () => {
      try {
        const [s, tl] = await Promise.all([myShiftsService.get(id), myShiftsService.timeline(id)]);
        shift.value = s;
        timeline.value = tl;
        if (TERMINAL.includes(s.status)) clearInterval(poll);
      } catch (e) {
        error.value = errorText(e);
      }
    };
    onMounted(async () => {
      await load();
      poll = setInterval(load, 5000);
    });
    onBeforeUnmount(() => clearInterval(poll));

    const attend = async (kind: "in" | "out") => {
      busy.value = true;
      error.value = "";
      message.value = "";
      try {
        message.value = t("sn.shift.locating");
        const p = await currentPosition();
        if (shift.value?.location) distance.value = Math.round(distanceM(p, shift.value.location));
        const body = { lat: p.lat, lng: p.lng, accuracy_m: p.accuracyM };
        if (kind === "in") await myShiftsService.checkIn(id, { ...body, ...(qrToken.value.trim() && { qr_token: qrToken.value.trim() }) });
        else await myShiftsService.checkOut(id, body);
        message.value = kind === "in" ? t("sn.shift.checkedInOk") : t("sn.shift.checkedOutOk");
        await load();
      } catch (e) {
        message.value = "";
        error.value = errorText(e);
      } finally {
        busy.value = false;
      }
    };

    /** Native QR scanning where available (Chrome on Android); manual entry otherwise. */
    const scan = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        const video = document.createElement("video");
        video.srcObject = stream;
        await video.play();
        const detector = new (window as any).BarcodeDetector({ formats: ["qr_code"] });
        const started = Date.now();
        while (Date.now() - started < 15000) {
          const codes = await detector.detect(video);
          if (codes.length) {
            qrToken.value = codes[0].rawValue;
            break;
          }
          await new Promise(r => setTimeout(r, 300));
        }
        stream.getTracks().forEach(tr => tr.stop());
      } catch (e) {
        error.value = errorText(e);
      }
    };

    const withdraw = async () => {
      busy.value = true;
      try {
        await myShiftsService.withdraw(id);
        modal.value = "";
        await load();
      } catch (e) {
        error.value = errorText(e);
      } finally {
        busy.value = false;
      }
    };

    return {
      shift, timeline, error, message, busy, distance, qrToken, modal, canScan, opensAt, can, load, attend, scan, withdraw,
      formatDateTimeVn, formatDistance, formatShiftRange, formatTimeVn, formatVnd, minutesToHoursLabel
    };
  }
});
