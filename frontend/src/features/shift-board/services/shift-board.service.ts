import { snApi } from "@/api/sn-api";
import { SN_SHIFTS } from "@/api/sn-endpoints";
import { SnShift } from "@/common/models/snShift.model";

export interface NearbyQuery {
  lat: number;
  lng: number;
  radius_km: number;
  skill?: string;
  q?: string;
}

export class ShiftBoardService {
  nearby(q: NearbyQuery) {
    const params: Record<string, unknown> = { lat: q.lat, lng: q.lng, radius_km: q.radius_km, limit: 50 };
    if (q.skill) params.skill = q.skill;
    if (q.q) params.q = q.q;
    return snApi.get<SnShift[]>(SN_SHIFTS.NEARBY, params);
  }
  offers() {
    return snApi.get<SnShift[]>(SN_SHIFTS.OFFERS);
  }
  get(id: string) {
    return snApi.get<SnShift>(SN_SHIFTS.DETAIL(id));
  }
  accept(id: string) {
    return snApi.post<SnShift>(SN_SHIFTS.ACCEPT(id));
  }
  decline(id: string) {
    return snApi.post<SnShift>(SN_SHIFTS.DECLINE(id));
  }
}

export const shiftBoardService = new ShiftBoardService();
