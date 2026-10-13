import { snApi } from "@/api/sn-api";
import { SN_OPS } from "@/api/sn-endpoints";

export class OpsService {
  exceptions(params: Record<string, unknown>) {
    return snApi.get<any>(SN_OPS.EXCEPTIONS, params);
  }
  exception(id: string) {
    return snApi.get<any>(SN_OPS.EXCEPTION(id));
  }
  acknowledge(id: string) {
    return snApi.post<any>(SN_OPS.ACK(id));
  }
  resolve(id: string, data: { action?: string; params?: Record<string, unknown>; note?: string; dismiss?: boolean }) {
    return snApi.post<any>(SN_OPS.RESOLVE(id), data);
  }
  policies() {
    return snApi.get<any[]>(SN_OPS.POLICIES);
  }
  updatePolicy(point: string, data: Record<string, unknown>) {
    return snApi.put<any>(SN_OPS.POLICY(point), data);
  }
  dlq() {
    return snApi.get<any[]>(SN_OPS.DLQ);
  }
  replay(id: string) {
    return snApi.post<any>(SN_OPS.DLQ_REPLAY(id));
  }
  workers(params: Record<string, unknown>) {
    return snApi.get<any>(SN_OPS.WORKERS, params);
  }
  verify(id: number) {
    return snApi.post<any>(SN_OPS.WORKER_VERIFY(id));
  }
  suspend(id: number) {
    return snApi.post<any>(SN_OPS.WORKER_SUSPEND(id));
  }
  unsuspend(id: number) {
    return snApi.post<any>(SN_OPS.WORKER_UNSUSPEND(id));
  }
  health() {
    return snApi.get<any>(SN_OPS.HEALTH);
  }
  reconcile() {
    return snApi.post<any>(SN_OPS.RECON_RUN);
  }
  latestReconciliation() {
    return snApi.get<any>(SN_OPS.RECON_LATEST);
  }
}

export const opsService = new OpsService();
