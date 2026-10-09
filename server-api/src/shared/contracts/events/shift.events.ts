/** Shift integration events (docs/ARCHITECTURE.md §6.6). Domain events use the same types and payloads. */
export const SHIFT_EVENTS = {
  POSTED: 'shift.posted',
  OFFERED: 'shift.offered',
  OFFER_DECLINED: 'shift.offer_declined',
  OFFER_EXPIRED: 'shift.offer_expired',
  ACCEPTED: 'shift.accepted',
  ESCROW_FUNDED: 'shift.escrow_funded',
  WORKER_WITHDREW: 'shift.worker_withdrew',
  REMATCH_REQUESTED: 'shift.rematch_requested',
  WORKER_CHECKED_IN: 'shift.worker_checked_in',
  NO_SHOW_RECORDED: 'shift.no_show_recorded',
  WORKER_CHECKED_OUT: 'shift.worker_checked_out',
  DISPUTED: 'shift.disputed',
  DISPUTE_RESOLVED: 'shift.dispute_resolved',
  COMPLETED: 'shift.completed',
  PAID: 'shift.paid',
  RATED: 'shift.rated',
  RATINGS_CLOSED: 'shift.ratings_closed',
  CANCELLED: 'shift.cancelled',
  EXPIRED: 'shift.expired',
} as const;

export type DispatchMode = 'sequential' | 'broadcast' | 'direct';

export interface ShiftPostedPayload {
  job_ref: string;
  company_id: number;
  work_location_id: string;
  title: string;
  description: string | null;
  skill_code: string;
  start_at: string;
  end_at: string;
  hourly_vnd: number;
  estimated_gross_vnd: number;
  platform_fee_vnd: number;
  escrow_amount_vnd: number;
  dispatch_mode: 'sequential' | 'broadcast';
  lat: number;
  lng: number;
  address: string | null;
  province_code: string | null;
  ward_code: string | null;
  posted_by: number;
}

export interface ShiftOfferedPayload {
  worker_ids: number[];
  mode: DispatchMode;
  expires_at: string;
  ranking_snapshot?: Array<{ worker_id: number; score: number; distance_m?: number }>;
}

export interface ShiftWorkerPayload {
  worker_id: number;
}

export interface ShiftAcceptedPayload {
  worker_id: number;
  escrow_amount_vnd: number;
}

export interface ShiftEscrowFundedPayload {
  journal_id: string;
  amount_vnd: number;
}

export interface ShiftWithdrewPayload {
  worker_id: number;
  hours_before_start: number;
}

export interface ShiftCheckedInPayload {
  worker_id: number;
  at: string;
  lat: number;
  lng: number;
  accuracy_m: number;
  late_minutes: number;
  method: 'gps' | 'gps+qr';
}

export interface ShiftCheckedOutPayload {
  worker_id: number;
  at: string;
  lat: number | null;
  lng: number | null;
  worked_minutes: number;
  auto: boolean;
}

export interface ShiftDisputedPayload {
  reason_code: string;
  note: string | null;
  claimed_minutes: number | null;
}

export interface ShiftDisputeResolvedPayload {
  outcome: 'pay' | 'refund';
  approved_minutes: number;
  note: string | null;
}

export interface ShiftCompletedPayload {
  approved_minutes: number;
  gross_vnd: number;
  fee_vnd: number;
  auto: boolean;
}

export interface ShiftPaidPayload {
  journal_id: string;
  gross_vnd: number;
  pit_vnd: number;
  net_vnd: number;
  fee_vnd: number;
  refund_vnd: number;
}

export interface ShiftRatedPayload {
  rater_role: 'employer' | 'worker';
  rater_id: number;
  ratee_id: number;
  stars: number;
  tags: string[];
  comment: string | null;
}

export interface ShiftRatingsClosedPayload {
  employer_rated: boolean;
  worker_rated: boolean;
}

export type CancelReason = 'employer' | 'escrow_funding_failed' | 'no_show' | 'dispute_refund' | 'ops';

export interface ShiftCancelledPayload {
  reason: CancelReason;
  note: string | null;
  worker_id: number | null;
  escrow_held: boolean;
  compensation_gross_vnd: number;
}
