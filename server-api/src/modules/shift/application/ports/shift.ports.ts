/** Ports the Shift context needs from other contexts (Interface Segregation; docs/ARCHITECTURE.md §14.2). */
export const WORK_LOCATION_READER = 'WORK_LOCATION_READER';
export const WORKER_DIRECTORY = 'WORKER_DIRECTORY';

export interface WorkLocationInfo {
  id: string;
  companyId: number;
  companyName: string | null;
  name: string;
  address: string | null;
  provinceCode: string | null;
  wardCode: string | null;
  lat: number;
  lng: number;
  geofenceRadiusM: number;
  qrRequired: boolean;
  qrSecret: string;
  active: boolean;
}

export interface WorkLocationReader {
  get(companyId: number, id: string): Promise<WorkLocationInfo | null>;
  getById(id: string): Promise<WorkLocationInfo | null>;
}

export interface WorkerInfo {
  userId: number;
  fullName: string;
  verified: boolean;
  suspended: boolean;
  skillCodes: string[];
}

export interface WorkerDirectory {
  get(userId: number): Promise<WorkerInfo | null>;
  findByPhone(phoneE164: string): Promise<WorkerInfo | null>;
}
