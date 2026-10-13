import { snApi } from "@/api/sn-api";
import { SN_PROFILE } from "@/api/sn-endpoints";
import { EmployerProfileDto, WorkLocationDto } from "../dtos";

export class EmployerProfileService {
  getProfile() {
    return snApi.get<EmployerProfileDto>(SN_PROFILE.EMPLOYER_ME);
  }
  updateProfile(data: Partial<EmployerProfileDto>) {
    return snApi.put<EmployerProfileDto>(SN_PROFILE.EMPLOYER_ME, data);
  }
  listLocations() {
    return snApi.get<WorkLocationDto[]>(SN_PROFILE.LOCATIONS);
  }
  createLocation(data: Partial<WorkLocationDto>) {
    return snApi.post<WorkLocationDto>(SN_PROFILE.LOCATIONS, data);
  }
  updateLocation(id: string, data: Partial<WorkLocationDto>) {
    return snApi.put<WorkLocationDto>(SN_PROFILE.LOCATION(id), data);
  }
  qr(id: string) {
    return snApi.get<{ location_id: string; token: string; expires_at: string }>(SN_PROFILE.LOCATION_QR(id));
  }
}

export const employerProfileService = new EmployerProfileService();
