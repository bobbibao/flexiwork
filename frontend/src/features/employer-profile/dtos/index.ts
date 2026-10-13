export interface WorkLocationDto {
  id: string;
  company_id: number;
  name: string;
  address: string | null;
  province_code: string | null;
  ward_code: string | null;
  lat: number;
  lng: number;
  geofence_radius_m: number;
  qr_required: boolean;
  active: boolean;
}

export interface EmployerProfileDto {
  company_id: number;
  company_name: string;
  legal_name: string;
  tax_code: string | null;
  business_type: string | null;
  phone_e164: string | null;
  address: string | null;
  verified: boolean;
  rating_avg: number | null;
  rating_count: number;
}
