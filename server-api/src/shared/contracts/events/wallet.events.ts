export const WALLET_EVENTS = {
  TOPUP_SUCCEEDED: 'wallet.topup_succeeded',
  TOPUP_FAILED: 'wallet.topup_failed',
  ESCROW_HELD: 'wallet.escrow_held',
  ESCROW_HOLD_FAILED: 'wallet.escrow_hold_failed',
  ESCROW_RELEASED: 'wallet.escrow_released',
  ESCROW_REFUNDED: 'wallet.escrow_refunded',
  PAYOUT_REQUESTED: 'wallet.payout_requested',
  PAYOUT_SETTLED: 'wallet.payout_settled',
  PAYOUT_FAILED: 'wallet.payout_failed',
} as const;

export interface EscrowHeldPayload {
  shift_id: string;
  company_id: number;
  journal_id: string;
  amount_vnd: number;
}

export interface EscrowHoldFailedPayload {
  shift_id: string;
  company_id: number;
  amount_vnd: number;
  available_vnd: number;
  reason: 'insufficient_funds';
}

export interface EscrowSplits {
  worker_net_vnd: number;
  pit_vnd: number;
  fee_vnd: number;
  employer_refund_vnd: number;
  gross_vnd: number;
}

export interface EscrowReleasedPayload {
  shift_id: string;
  company_id: number;
  worker_id: number;
  journal_id: string;
  splits: EscrowSplits;
}

export interface EscrowRefundedPayload {
  shift_id: string;
  company_id: number;
  journal_id: string;
  refund_vnd: number;
  compensation?: EscrowSplits & { worker_id: number };
}

export interface TopUpPayload {
  intent_id: string;
  company_id: number;
  amount_vnd: number;
  provider_ref: string | null;
}

export interface PayoutPayload {
  intent_id: string;
  worker_id: number;
  amount_vnd: number;
  provider_ref: string | null;
  error?: string;
}
