import { defineComponent, onBeforeUnmount, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { shiftBoardService } from "../../services";
import { SnShift } from "@/common/models/snShift.model";
import { useNotificationsStore } from "@/core/stores/notifications.store";
import { errorText, t } from "@/features/sn-shell/i18n";
import { formatShiftRange, formatVnd } from "@/common/vnFormat";
import SnAlert from "@/features/sn-shell/components/SnAlert/SnAlert.vue";

/** "Lời mời": offers waiting for an answer, live-updated (PLAN P11.5). */
export default defineComponent({
  name: "SnOffersPage",
  compatConfig: { MODE: 3 },
  components: { SnAlert },
  setup() {
    const router = useRouter();
    const notifications = useNotificationsStore();
    const items = ref<SnShift[]>([]);
    const now = ref(Date.now());
    const error = ref("");
    const message = ref("");
    const busy = ref("");
    let tick: any;
    let poll: any;
    let off: (() => void) | null = null;

    const load = async () => {
      try {
        items.value = await shiftBoardService.offers();
      } catch (e) {
        error.value = errorText(e);
      }
    };
    onMounted(() => {
      load();
      tick = setInterval(() => (now.value = Date.now()), 15000);
      poll = setInterval(load, 10000);
      off = notifications.onNotification(n => n.template_key === "shift_offered" && load());
    });
    onBeforeUnmount(() => {
      clearInterval(tick);
      clearInterval(poll);
      off?.();
    });

    const minutesLeft = (s: SnShift) => Math.max(0, Math.round((new Date(s.offer_expires_at!).getTime() - now.value) / 60000));
    const accept = async (s: SnShift) => {
      busy.value = s.id;
      error.value = "";
      try {
        await shiftBoardService.accept(s.id);
        message.value = t("sn.shift.accepted");
        router.push(`/sn/my-shifts/${s.id}`);
      } catch (e) {
        error.value = errorText(e);
        await load();
      } finally {
        busy.value = "";
      }
    };
    const decline = async (s: SnShift) => {
      busy.value = s.id;
      try {
        await shiftBoardService.decline(s.id);
        await load();
      } catch (e) {
        error.value = errorText(e);
      } finally {
        busy.value = "";
      }
    };
    return { items, error, message, busy, minutesLeft, accept, decline, formatShiftRange, formatVnd };
  }
});
