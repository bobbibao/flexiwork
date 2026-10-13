import { snApi } from "@/api/sn-api";
import { SN_SHIFTS } from "@/api/sn-endpoints";
import { SnShift } from "@/common/models/snShift.model";

export interface Quote {
  scheduled_minutes: number;
  estimated_gross_vnd: number;
  platform_fee_vnd: number;
  escrow_amount_vnd: number;
  platform_fee_pct: number;
}

export class ShiftPostingService {
  list(group: string, page = 1) {
    return snApi.get<{ items: SnShift[]; total_items: number; total_pages: number; page: number }>(SN_SHIFTS.EMPLOYER_LIST, { group, page, page_size: 20 });
  }
  counts() {
    return snApi.get<Record<string, number>>(SN_SHIFTS.EMPLOYER_COUNTS);
  }
  quote(data: { start_at: string; end_at: string; hourly_vnd: number }) {
    return snApi.post<Quote>(SN_SHIFTS.QUOTE, data);
  }
  create(data: Record<string, unknown>, idempotencyKey: string) {
    return snApi.post<{ job_ref: string; shifts: SnShift[] }>(SN_SHIFTS.CREATE, data, idempotencyKey);
  }
  get(id: string) {
    return snApi.get<SnShift>(SN_SHIFTS.DETAIL(id));
  }
  timeline(id: string) {
    return snApi.get<any[]>(SN_SHIFTS.TIMELINE(id));
  }
  cancel(id: string, note?: string) {
    return snApi.post<SnShift>(SN_SHIFTS.CANCEL(id), note ? { note } : {});
  }
  directOffer(id: string, phone: string) {
    return snApi.post<SnShift>(SN_SHIFTS.DIRECT_OFFER(id), { phone });
  }
  confirm(id: string, approvedMinutes?: number) {
    return snApi.post<SnShift>(SN_SHIFTS.CONFIRM(id), approvedMinutes === undefined ? {} : { approved_minutes: approvedMinutes });
  }
  dispute(id: string, data: { reason_code: string; note?: string; claimed_minutes?: number }) {
    return snApi.post<SnShift>(SN_SHIFTS.DISPUTE(id), data);
  }
  workerCard(workerId: number) {
    return snApi.get<any>(`/workers/${workerId}/card`);
  }
}

export const shiftPostingService = new ShiftPostingService();
