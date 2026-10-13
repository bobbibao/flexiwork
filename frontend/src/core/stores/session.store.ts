/** Shift Network session (Pinia). Separate token key from the legacy app (docs/ARCHITECTURE.md §17.5). */
import { defineStore } from "pinia";
import { snApi, SN_TOKEN_KEY, SnApiError } from "@/api/sn-api";
import { SN_AUTH } from "@/api/sn-endpoints";

export type SnRole = "worker" | "employer" | "ops";

export const HOME_BY_ROLE: Record<SnRole, string> = {
  worker: "/sn/shift-board",
  employer: "/sn/employer/shifts",
  ops: "/sn/ops/exceptions"
};

interface State {
  token: string | null;
  role: SnRole | null;
  user: Record<string, any> | null;
  workerProfile: Record<string, any> | null;
  employerProfile: Record<string, any> | null;
  company: Record<string, any> | null;
  loaded: boolean;
}

export const useSessionStore = defineStore("snSession", {
  state: (): State => ({
    token: localStorage.getItem(SN_TOKEN_KEY),
    role: (localStorage.getItem("sn_role") as SnRole) || null,
    user: null,
    workerProfile: null,
    employerProfile: null,
    company: null,
    loaded: false
  }),
  getters: {
    isAuthenticated: s => !!s.token,
    home: s => (s.role ? HOME_BY_ROLE[s.role] : "/sn/login"),
    displayName: s => s.workerProfile?.full_name || s.user?.name || s.user?.email || "",
    companyName: s => s.company?.name || s.employerProfile?.legal_name || ""
  },
  actions: {
    setSession(token: string, role: SnRole) {
      this.token = token;
      this.role = role;
      localStorage.setItem(SN_TOKEN_KEY, token);
      localStorage.setItem("sn_role", role);
    },
    async login(identifier: string, password: string, companyId?: number) {
      const res = await snApi.post<{ access_token: string; role: SnRole }>(SN_AUTH.LOGIN, { identifier, password, ...(companyId && { company_id: companyId }) });
      this.setSession(res.access_token, res.role);
      await this.loadMe(true);
      return res.role;
    },
    async registerWorker(payload: Record<string, unknown>) {
      const res = await snApi.post<{ access_token: string; role: SnRole }>(SN_AUTH.REGISTER_WORKER, payload);
      this.setSession(res.access_token, res.role);
      await this.loadMe(true);
    },
    async registerEmployer(payload: Record<string, unknown>) {
      const res = await snApi.post<{ access_token: string; role: SnRole }>(SN_AUTH.REGISTER_EMPLOYER, payload);
      this.setSession(res.access_token, res.role);
      await this.loadMe(true);
    },
    async loadMe(force = false) {
      if (!this.token) return;
      if (this.loaded && !force) return;
      try {
        const me = await snApi.get<any>(SN_AUTH.ME);
        this.role = me.role;
        localStorage.setItem("sn_role", me.role);
        this.user = me.user;
        this.workerProfile = me.worker_profile ?? null;
        this.employerProfile = me.employer_profile ?? null;
        this.company = me.company ?? null;
        this.loaded = true;
      } catch (e) {
        if (e instanceof SnApiError && (e.status === 401 || e.status === 403)) this.logout();
        throw e;
      }
    },
    logout() {
      this.token = null;
      this.role = null;
      this.user = null;
      this.workerProfile = null;
      this.employerProfile = null;
      this.company = null;
      this.loaded = false;
      localStorage.removeItem(SN_TOKEN_KEY);
      localStorage.removeItem("sn_role");
    }
  }
});
