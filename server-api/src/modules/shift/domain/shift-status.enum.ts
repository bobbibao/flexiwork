/** Shift lifecycle states (docs/ARCHITECTURE.md §5.2). */
export enum ShiftStatus {
  POSTED = 'POSTED',
  MATCHED = 'MATCHED',
  ACCEPTED = 'ACCEPTED',
  ESCROW_FUNDED = 'ESCROW_FUNDED',
  CHECKED_IN = 'CHECKED_IN',
  CHECKED_OUT = 'CHECKED_OUT',
  COMPLETED = 'COMPLETED',
  PAID = 'PAID',
  RATED = 'RATED',
  NO_SHOW = 'NO_SHOW',
  DISPUTED = 'DISPUTED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

export const TERMINAL_STATUSES = [ShiftStatus.RATED, ShiftStatus.CANCELLED, ShiftStatus.EXPIRED];
export const OPEN_STATUSES = [ShiftStatus.POSTED, ShiftStatus.MATCHED];
