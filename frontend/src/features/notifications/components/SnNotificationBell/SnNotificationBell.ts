import { defineComponent, onMounted, onBeforeUnmount, ref } from "vue";
import { useRouter } from "vue-router";
import { useNotificationsStore, SnNotification } from "@/core/stores/notifications.store";
import { formatDateTimeVn } from "@/common/vnFormat";

/** Bell with unread count and live updates over Socket.IO (PLAN P11.8). */
export default defineComponent({
  name: "SnNotificationBell",
  compatConfig: { MODE: 3 },
  setup() {
    const store = useNotificationsStore();
    const router = useRouter();
    const open = ref(false);
    const toast = ref<SnNotification | null>(null);
    let off: (() => void) | null = null;
    let timer: any;

    onMounted(async () => {
      await store.load().catch(() => undefined);
      store.connect();
      off = store.onNotification(n => {
        toast.value = n;
        clearTimeout(timer);
        timer = setTimeout(() => (toast.value = null), 5000);
      });
    });
    onBeforeUnmount(() => {
      off?.();
      clearTimeout(timer);
    });

    const go = async (n: SnNotification) => {
      open.value = false;
      toast.value = null;
      if (!n.read_at) await store.markRead(n.id).catch(() => undefined);
      if (n.data?.url) router.push(n.data.url);
    };

    return { store, open, toast, go, formatDateTimeVn };
  }
});
