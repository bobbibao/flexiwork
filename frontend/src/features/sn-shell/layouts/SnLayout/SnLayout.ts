import { defineComponent, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useSessionStore } from "@/core/stores/session.store";
import { useNotificationsStore } from "@/core/stores/notifications.store";
import SnNotificationBell from "@/features/notifications/components/SnNotificationBell/SnNotificationBell.vue";

interface NavItem {
  to: string;
  key: string;
  icon: string;
}

const NAV: Record<string, NavItem[]> = {
  worker: [
    { to: "/sn/shift-board", key: "shiftBoard", icon: "la-map-marker" },
    { to: "/sn/offers", key: "offers", icon: "la-envelope-open" },
    { to: "/sn/my-shifts", key: "myShifts", icon: "la-calendar-check" },
    { to: "/sn/wallet", key: "wallet", icon: "la-wallet" },
    { to: "/sn/profile", key: "profile", icon: "la-user" }
  ],
  employer: [
    { to: "/sn/employer/shifts", key: "employerShifts", icon: "la-list" },
    { to: "/sn/employer/shifts/new", key: "postShift", icon: "la-plus-circle" },
    { to: "/sn/employer/locations", key: "locations", icon: "la-map-marker" },
    { to: "/sn/wallet", key: "wallet", icon: "la-wallet" },
    { to: "/sn/employer/profile", key: "company", icon: "la-building" }
  ],
  ops: [
    { to: "/sn/ops/exceptions", key: "exceptions", icon: "la-exclamation-triangle" },
    { to: "/sn/ops/workers", key: "workers", icon: "la-users" },
    { to: "/sn/ops/policies", key: "policies", icon: "la-robot" },
    { to: "/sn/ops/dlq", key: "dlq", icon: "la-inbox" },
    { to: "/sn/ops/system", key: "system", icon: "la-heartbeat" }
  ]
};

/** Shift Network shell: Vietnamese, mobile-first, role-based navigation (docs/ARCHITECTURE.md §17.5). */
export default defineComponent({
  name: "SnLayout",
  compatConfig: { MODE: 3 },
  components: { SnNotificationBell },
  setup() {
    const session = useSessionStore();
    const notifications = useNotificationsStore();
    const router = useRouter();
    const nav = computed(() => (session.role ? NAV[session.role] : []));
    onMounted(() => session.loadMe().catch(() => router.push("/sn/login")));
    const logout = () => {
      notifications.disconnect();
      session.logout();
      router.push("/sn/login");
    };
    return { session, nav, logout };
  }
});
