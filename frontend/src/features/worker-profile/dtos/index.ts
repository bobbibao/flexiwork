export interface SkillDto {
  code: string;
  name_vi: string;
}

export interface WorkerProfileDto {
  user_id: number;
  full_name: string;
  phone_e164: string;
  email: string | null;
  dob: string | null;
  skill_codes: string[];
  home_lat: number | null;
  home_lng: number | null;
  home_address: string | null;
  radius_km: number;
  verified: boolean;
  suspended: boolean;
  reliability_score: number;
  rating_avg: number | null;
  rating_count: number;
  completed_shifts: number;
  bank_account: { bank_name: string; account_number: string; account_holder: string } | null;
}
