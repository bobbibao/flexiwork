// Shift Network routes (docs/ARCHITECTURE.md §17.5). Everything under /sn uses the Vietnamese SN shell.
import { useSessionStore, HOME_BY_ROLE } from "@/core/stores/session.store";
import { onUnauthorized } from "@/api/sn-api";

const W = ["worker"];
const E = ["employer"];
const O = ["ops"];
const ALL = ["worker", "employer", "ops"];

export const snAuthRoutes = [
  {
    path: "/sn",
    component: () => import("@/features/sn-shell/layouts/SnAuthLayout/SnAuthLayout.vue"),
    children: [
      { path: "login", name: "snLogin", component: () => import("@/features/sn-auth/pages/Login/Login.vue"), meta: { public: true, title: "Đăng nhập" } },
      { path: "register/worker", name: "snRegisterWorker", component: () => import("@/features/sn-auth/pages/WorkerRegister/WorkerRegister.vue"), meta: { public: true, title: "Đăng ký người lao động" } },
      { path: "register/employer", name: "snRegisterEmployer", component: () => import("@/features/sn-auth/pages/EmployerRegister/EmployerRegister.vue"), meta: { public: true, title: "Đăng ký doanh nghiệp" } }
    ]
  }
];

export const snRoutes = [
  {
    path: "/sn",
    component: () => import("@/features/sn-shell/layouts/SnLayout/SnLayout.vue"),
    children: [
      { path: "", name: "snHome", redirect: () => "/sn/login" },
      // worker
      { path: "shift-board", name: "snShiftBoard", component: () => import("@/features/shift-board/pages/ShiftBoard/ShiftBoard.vue"), meta: { roles: W, title: "Ca gần bạn" } },
      { path: "offers", name: "snOffers", component: () => import("@/features/shift-board/pages/Offers/Offers.vue"), meta: { roles: W, title: "Lời mời" } },
      { path: "shifts/:id", name: "snShiftPublic", component: () => import("@/features/shift-board/pages/ShiftPreview/ShiftPreview.vue"), meta: { roles: ALL, title: "Chi tiết ca" } },
      { path: "my-shifts", name: "snMyShifts", component: () => import("@/features/my-shifts/pages/MyShifts/MyShifts.vue"), meta: { roles: W, title: "Ca của tôi" } },
      { path: "my-shifts/:id", name: "snMyShiftDetail", component: () => import("@/features/my-shifts/pages/MyShiftDetail/MyShiftDetail.vue"), meta: { roles: W, title: "Ca của tôi" } },
      { path: "profile", name: "snWorkerProfile", component: () => import("@/features/worker-profile/pages/WorkerProfile/WorkerProfile.vue"), meta: { roles: W, title: "Hồ sơ" } },
      // employer
      { path: "employer/shifts", name: "snEmployerShifts", component: () => import("@/features/shift-posting/pages/EmployerShifts/EmployerShifts.vue"), meta: { roles: E, title: "Ca làm việc" } },
      { path: "employer/shifts/new", name: "snShiftCreate", component: () => import("@/features/shift-posting/pages/ShiftCreate/ShiftCreate.vue"), meta: { roles: E, title: "Đăng ca" } },
      { path: "employer/shifts/:id", name: "snEmployerShiftDetail", component: () => import("@/features/shift-posting/pages/EmployerShiftDetail/EmployerShiftDetail.vue"), meta: { roles: E, title: "Chi tiết ca" } },
      { path: "employer/locations", name: "snLocations", component: () => import("@/features/employer-profile/pages/Locations/Locations.vue"), meta: { roles: E, title: "Địa điểm" } },
      { path: "employer/profile", name: "snEmployerProfile", component: () => import("@/features/employer-profile/pages/EmployerProfile/EmployerProfile.vue"), meta: { roles: E, title: "Doanh nghiệp" } },
      // shared
      { path: "wallet", name: "snWallet", component: () => import("@/features/wallet/pages/Wallet/Wallet.vue"), meta: { roles: ["worker", "employer"], title: "Ví" } },
      { path: "notifications", name: "snNotifications", component: () => import("@/features/notifications/pages/Notifications/Notifications.vue"), meta: { roles: ALL, title: "Thông báo" } },
      // ops
      { path: "ops/exceptions", name: "snOpsExceptions", component: () => import("@/features/ops/pages/Exceptions/Exceptions.vue"), meta: { roles: O, title: "Ngoại lệ" } },
      { path: "ops/exceptions/:id", name: "snOpsException", component: () => import("@/features/ops/pages/ExceptionDetail/ExceptionDetail.vue"), meta: { roles: O, title: "Ngoại lệ" } },
      { path: "ops/policies", name: "snOpsPolicies", component: () => import("@/features/ops/pages/Policies/Policies.vue"), meta: { roles: O, title: "Chính sách tự động" } },
      { path: "ops/dlq", name: "snOpsDlq", component: () => import("@/features/ops/pages/Dlq/Dlq.vue"), meta: { roles: O, title: "Hàng đợi lỗi" } },
      { path: "ops/workers", name: "snOpsWorkers", component: () => import("@/features/ops/pages/Workers/Workers.vue"), meta: { roles: O, title: "Người lao động" } },
      { path: "ops/system", name: "snOpsSystem", component: () => import("@/features/ops/pages/System/System.vue"), meta: { roles: O, title: "Hệ thống" } }
    ]
  }
];

/** Session + role guard for /sn routes (the legacy VERIFY_AUTH guard in main.js skips /sn). */
export function installSnGuards(router) {
  onUnauthorized(() => {
    const session = useSessionStore();
    session.logout();
    if (router.currentRoute.value.path.startsWith("/sn") && !router.currentRoute.value.meta.public) router.push("/sn/login");
  });

  router.beforeEach(to => {
    if (!to.path.startsWith("/sn")) return true;
    const session = useSessionStore();
    if (to.meta.title) document.title = `${to.meta.title} | Flexiwork`;
    if (to.meta.public) return session.isAuthenticated && session.role ? HOME_BY_ROLE[session.role] : true;
    if (!session.isAuthenticated) return { path: "/sn/login", query: to.fullPath !== "/sn" ? { redirect: to.fullPath } : {} };
    if (to.path === "/sn" || to.path === "/sn/") return session.home;
    const roles = to.meta.roles;
    if (roles && session.role && !roles.includes(session.role)) return session.home;
    return true;
  });
}
