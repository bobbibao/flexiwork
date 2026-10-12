import { ShiftStatus as S } from '../domain/shift-status.enum';

/** Employer list tabs (Vietnamese labels live in the frontend vi.js). */
export const EMPLOYER_STATUS_GROUPS: Record<string, S[]> = {
  open: [S.POSTED, S.MATCHED],
  accepted: [S.ACCEPTED, S.ESCROW_FUNDED],
  in_progress: [S.CHECKED_IN],
  awaiting_confirmation: [S.CHECKED_OUT, S.DISPUTED],
  paid: [S.COMPLETED, S.PAID, S.RATED],
  cancelled: [S.CANCELLED, S.EXPIRED, S.NO_SHOW],
};

export const WORKER_SCOPES: Record<string, S[]> = {
  upcoming: [S.ACCEPTED, S.ESCROW_FUNDED],
  active: [S.CHECKED_IN, S.CHECKED_OUT, S.DISPUTED, S.COMPLETED],
  history: [S.PAID, S.RATED, S.CANCELLED, S.NO_SHOW, S.EXPIRED],
};
