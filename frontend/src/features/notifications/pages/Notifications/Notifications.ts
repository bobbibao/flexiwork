import { defineComponent, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useNotificationsStore, SnNotification } from "@/core/stores/notifications.store";
import { errorText } from "@/features/sn-shell/i18n";
import { formatDateTimeVn } from "@/common/vnFormat";
import SnAlert from "@/features/sn-shell/components/SnAlert/SnAlert.vue";

export default defineComponent({
  name: "SnNotificationsPage",
  compatConfig: { MODE: 3 },
  components: { SnAlert },
  setup() {
    const store = useNotificationsStore();
    const router = useRouter();
    const error = ref("");
    onMounted(async () => {
      await store.load().catch(e => (error.value = errorText(e)));
      await store.detectPush().catch(() => undefined);
    });
    const open = async (n: SnNotification) => {
      if (!n.read_at) await store.markRead(n.id).catch(() => undefined);
      if (n.data?.url) router.push(n.data.url);
    };
    const enablePush = async () => {
      try {
        await store.enablePush();
      } catch (e) {
        error.value = errorText(e);
      }
    };
    return { store, error, open, enablePush, formatDateTimeVn };
  }
});
