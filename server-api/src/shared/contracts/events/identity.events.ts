export const IDENTITY_EVENTS = {
  WORKER_REGISTERED: 'identity.worker_registered',
  WORKER_PROFILE_UPDATED: 'identity.worker_profile_updated',
  EMPLOYER_REGISTERED: 'identity.employer_registered',
  EMPLOYER_PROFILE_UPDATED: 'identity.employer_profile_updated',
  WORK_LOCATION_CREATED: 'identity.work_location_created',
  WORK_LOCATION_UPDATED: 'identity.work_location_updated',
} as const;

export interface WorkerProfileSnapshot {
  user_id: number;
  full_name: string;
  skill_codes: string[];
  home_lat: number | null;
  home_lng: number | null;
  radius_km: number;
  verified: boolean;
  suspended: boolean;
  reliability_score: number;
  rating_avg: number | null;
  dob: string | null;
}

export interface EmployerRegisteredPayload {
  company_id: number;
  user_id: number;
  legal_name: string;
}

export interface WorkLocationPayload {
  id: string;
  company_id: number;
  name: string;
  lat: number;
  lng: number;
  geofence_radius_m: number;
  qr_required: boolean;
}
