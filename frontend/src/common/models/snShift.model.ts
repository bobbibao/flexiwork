/** Shift Network shift as returned by /api/sn (read model or command response). */
export interface SnShift {
  id: string;
  version: number;
  status: string;
  job_ref: string;
  company_id: number;
  company_name: string | null;
  work_location_id: string;
  location_name: string | null;
  title: string;
  description: string | null;
  skill_code: string;
  start_at: string;
  end_at: string;
  hourly_vnd: number;
  estimated_gross_vnd: number;
  platform_fee_vnd: number;
  escrow_amount_vnd: number;
  scheduled_minutes?: number;
  dispatch_mode: string;
  lat: number;
  lng: number;
  address: string | null;
  worker_id: number | null;
  offered_worker_ids: number[];
  offer_expires_at: string | null;
  escrow_status: string;
  checked_in_at: string | null;
  checked_out_at: string | null;
  worked_minutes: number | null;
  approved_minutes: number | null;
  gross_vnd: number | null;
  fee_vnd: number | null;
  pit_vnd: number | null;
  net_vnd: number | null;
  refund_vnd: number | null;
  employer_rated: boolean;
  worker_rated: boolean;
  cancel_reason: string | null;
  distance_m?: number;
  location?: { id: string; name: string; address: string | null; lat: number; lng: number; geofence_radius_m: number; qr_required: boolean } | null;
  available_commands?: string[];
}

export const TERMINAL = ["RATED", "CANCELLED", "EXPIRED"];
