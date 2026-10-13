import { snApi } from "@/api/sn-api";
import { SN_SHIFTS } from "@/api/sn-endpoints";
import { SnShift } from "@/common/models/snShift.model";

export class MyShiftsService {
  list(scope: string) {
    return snApi.get<{ items: SnShift[] }>(SN_SHIFTS.WORKER_LIST, { scope, page_size: 50 });
  }
  get(id: string) {
    return snApi.get<SnShift>(SN_SHIFTS.DETAIL(id));
  }
  timeline(id: string) {
    return snApi.get<any[]>(SN_SHIFTS.TIMELINE(id));
  }
  checkIn(id: string, pos: { lat: number; lng: number; accuracy_m: number; qr_token?: string }) {
    return snApi.post<SnShift>(SN_SHIFTS.CHECK_IN(id), pos);
  }
  checkOut(id: string, pos: { lat: number; lng: number; accuracy_m: number }) {
    return snApi.post<SnShift>(SN_SHIFTS.CHECK_OUT(id), pos);
  }
  withdraw(id: string) {
    return snApi.post<SnShift>(SN_SHIFTS.WITHDRAW(id));
  }
}

export const myShiftsService = new MyShiftsService();
