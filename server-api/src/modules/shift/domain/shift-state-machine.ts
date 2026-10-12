import { ShiftStatus as S } from './shift-status.enum';
import { ShiftTransitionError } from './errors/shift.errors';

/** Who may issue a command (docs/ARCHITECTURE.md §5.4, §13). */
export type ActorKind = 'employer' | 'worker' | 'system' | 'ops';

export type ShiftCommandName =
  | 'PostShift'
  | 'OfferShift'
  | 'DirectOffer'
  | 'DeclineOffer'
  | 'ExpireOffer'
  | 'AcceptShift'
  | 'RecordEscrowFunded'
  | 'FailEscrowFunding'
  | 'WithdrawFromShift'
  | 'CheckIn'
  | 'RecordNoShow'
  | 'Rematch'
  | 'CheckOut'
  | 'AutoCheckOut'
  | 'ConfirmCompletion'
  | 'AutoConfirmCompletion'
  | 'DisputeCompletion'
  | 'ResolveDispute'
  | 'RecordPaymentReleased'
  | 'RateShift'
  | 'CloseRatingWindow'
  | 'CancelShift'
  | 'ExpireShift';

interface Transition {
  from: S[];
  /** Resulting state(s); several when a guard or the payload decides. */
  to: S[];
  actors: ActorKind[];
}

/**
 * Table-driven State pattern: the single source of truth for which command is allowed in which state.
 * Any (state, command, actor) not listed is rejected with ShiftTransitionError (HTTP 409).
 */
export const SHIFT_TRANSITIONS: Record<ShiftCommandName, Transition> = {
  PostShift: { from: [], to: [S.POSTED], actors: ['employer'] },
  OfferShift: { from: [S.POSTED], to: [S.MATCHED], actors: ['system'] },
  DirectOffer: { from: [S.POSTED], to: [S.MATCHED], actors: ['employer', 'ops'] },
  DeclineOffer: { from: [S.MATCHED], to: [S.MATCHED, S.POSTED], actors: ['worker'] },
  ExpireOffer: { from: [S.MATCHED], to: [S.POSTED], actors: ['system'] },
  AcceptShift: { from: [S.MATCHED], to: [S.ACCEPTED], actors: ['worker'] },
  RecordEscrowFunded: { from: [S.ACCEPTED], to: [S.ESCROW_FUNDED], actors: ['system'] },
  FailEscrowFunding: { from: [S.ACCEPTED], to: [S.CANCELLED], actors: ['system'] },
  WithdrawFromShift: { from: [S.ACCEPTED, S.ESCROW_FUNDED], to: [S.POSTED], actors: ['worker'] },
  CheckIn: { from: [S.ESCROW_FUNDED], to: [S.CHECKED_IN], actors: ['worker'] },
  RecordNoShow: { from: [S.ESCROW_FUNDED], to: [S.NO_SHOW], actors: ['system'] },
  Rematch: { from: [S.NO_SHOW], to: [S.POSTED], actors: ['system', 'ops'] },
  CheckOut: { from: [S.CHECKED_IN], to: [S.CHECKED_OUT], actors: ['worker'] },
  AutoCheckOut: { from: [S.CHECKED_IN], to: [S.CHECKED_OUT], actors: ['system'] },
  ConfirmCompletion: { from: [S.CHECKED_OUT], to: [S.COMPLETED], actors: ['employer', 'ops'] },
  AutoConfirmCompletion: { from: [S.CHECKED_OUT], to: [S.COMPLETED], actors: ['system'] },
  DisputeCompletion: { from: [S.CHECKED_OUT], to: [S.DISPUTED], actors: ['employer'] },
  ResolveDispute: { from: [S.DISPUTED], to: [S.COMPLETED, S.CANCELLED], actors: ['ops'] },
  RecordPaymentReleased: { from: [S.COMPLETED], to: [S.PAID], actors: ['system'] },
  RateShift: { from: [S.PAID], to: [S.PAID, S.RATED], actors: ['employer', 'worker'] },
  CloseRatingWindow: { from: [S.PAID], to: [S.RATED], actors: ['system'] },
  CancelShift: {
    from: [S.POSTED, S.MATCHED, S.ACCEPTED, S.ESCROW_FUNDED, S.NO_SHOW],
    to: [S.CANCELLED],
    actors: ['employer', 'system', 'ops'],
  },
  ExpireShift: { from: [S.POSTED, S.MATCHED], to: [S.EXPIRED], actors: ['system'] },
};

/** Employers may not cancel a no-show shift themselves (the system/ops decide after the no-show policy). */
const EMPLOYER_CANCEL_FROM = [S.POSTED, S.MATCHED, S.ACCEPTED, S.ESCROW_FUNDED];

export function canTransition(command: ShiftCommandName, status: S | null, actor: ActorKind): boolean {
  const t = SHIFT_TRANSITIONS[command];
  if (!t.actors.includes(actor)) return false;
  if (command === 'PostShift') return status === null;
  if (status === null || !t.from.includes(status)) return false;
  if (command === 'CancelShift' && actor === 'employer') return EMPLOYER_CANCEL_FROM.includes(status);
  return true;
}

export function assertTransition(command: ShiftCommandName, status: S | null, actor: ActorKind): void {
  if (!canTransition(command, status, actor)) throw new ShiftTransitionError(command, status ?? 'NONE', actor);
}

/** Commands this actor could issue now (introspection endpoint; guards may still reject). */
export function availableCommands(status: S, actor: ActorKind): ShiftCommandName[] {
  return (Object.keys(SHIFT_TRANSITIONS) as ShiftCommandName[]).filter((c) => c !== 'PostShift' && canTransition(c, status, actor));
}
