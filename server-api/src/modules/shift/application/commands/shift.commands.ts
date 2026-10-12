import { CommandContext } from 'src/shared/events/event-envelope';
import { DispatchMode } from 'src/shared/contracts/events/shift.events';
import { ActorKind } from '../../domain/shift-state-machine';

/** Who is calling, resolved by the controller (or 'system' for sagas/timers). */
export interface ShiftAccess {
  kind: ActorKind;
  companyId?: number | null;
  userId?: number | null;
}

abstract class ShiftCommand {
  constructor(
    readonly shiftId: string,
    readonly access: ShiftAccess,
    readonly ctx: CommandContext,
  ) {}
}

export class PostShiftCommand {
  constructor(
    readonly access: ShiftAccess,
    readonly ctx: CommandContext,
    readonly input: {
      workLocationId: string;
      title: string;
      description: string | null;
      skillCode: string;
      startAt: Date;
      endAt: Date;
      hourlyVnd: number;
      headcount: number;
      dispatchMode?: 'sequential' | 'broadcast';
    },
  ) {}
}

export class OfferShiftCommand extends ShiftCommand {
  constructor(
    shiftId: string,
    access: ShiftAccess,
    ctx: CommandContext,
    readonly workerIds: number[],
    readonly mode: DispatchMode,
    readonly ranking?: Array<{ worker_id: number; score: number; distance_m?: number }>,
  ) {
    super(shiftId, access, ctx);
  }
}

export class DirectOfferCommand extends ShiftCommand {
  constructor(shiftId: string, access: ShiftAccess, ctx: CommandContext, readonly workerId: number) {
    super(shiftId, access, ctx);
  }
}

export class DeclineOfferCommand extends ShiftCommand {}
export class AcceptShiftCommand extends ShiftCommand {}
export class WithdrawFromShiftCommand extends ShiftCommand {}
export class RecordNoShowCommand extends ShiftCommand {}
export class RematchCommand extends ShiftCommand {}
export class FailEscrowFundingCommand extends ShiftCommand {}
export class CloseRatingWindowCommand extends ShiftCommand {}
export class ExpireShiftCommand extends ShiftCommand {}

export class ExpireOfferCommand extends ShiftCommand {
  constructor(shiftId: string, access: ShiftAccess, ctx: CommandContext, readonly expiresAt: string) {
    super(shiftId, access, ctx);
  }
}

export class RecordEscrowFundedCommand extends ShiftCommand {
  constructor(shiftId: string, access: ShiftAccess, ctx: CommandContext, readonly journalId: string, readonly amountVnd: number) {
    super(shiftId, access, ctx);
  }
}

export class CheckInCommand extends ShiftCommand {
  constructor(
    shiftId: string,
    access: ShiftAccess,
    ctx: CommandContext,
    readonly position: { lat: number; lng: number; accuracyM: number; qrToken?: string | null },
  ) {
    super(shiftId, access, ctx);
  }
}

export class CheckOutCommand extends ShiftCommand {
  constructor(shiftId: string, access: ShiftAccess, ctx: CommandContext, readonly position: { lat: number; lng: number; accuracyM: number }) {
    super(shiftId, access, ctx);
  }
}

export class AutoCheckOutCommand extends ShiftCommand {}

export class ConfirmCompletionCommand extends ShiftCommand {
  constructor(shiftId: string, access: ShiftAccess, ctx: CommandContext, readonly approvedMinutes: number | null) {
    super(shiftId, access, ctx);
  }
}

export class AutoConfirmCompletionCommand extends ShiftCommand {}

export class DisputeCompletionCommand extends ShiftCommand {
  constructor(shiftId: string, access: ShiftAccess, ctx: CommandContext, readonly reasonCode: string, readonly note: string | null, readonly claimedMinutes: number | null) {
    super(shiftId, access, ctx);
  }
}

export class ResolveDisputeCommand extends ShiftCommand {
  constructor(shiftId: string, access: ShiftAccess, ctx: CommandContext, readonly outcome: 'pay' | 'refund', readonly approvedMinutes: number, readonly note: string | null) {
    super(shiftId, access, ctx);
  }
}

export class RecordPaymentReleasedCommand extends ShiftCommand {
  constructor(
    shiftId: string,
    access: ShiftAccess,
    ctx: CommandContext,
    readonly payment: { journal_id: string; gross_vnd: number; pit_vnd: number; net_vnd: number; fee_vnd: number; refund_vnd: number },
  ) {
    super(shiftId, access, ctx);
  }
}

export class RateShiftCommand extends ShiftCommand {
  constructor(shiftId: string, access: ShiftAccess, ctx: CommandContext, readonly stars: number, readonly tags: string[], readonly comment: string | null) {
    super(shiftId, access, ctx);
  }
}

export class CancelShiftCommand extends ShiftCommand {
  constructor(
    shiftId: string,
    access: ShiftAccess,
    ctx: CommandContext,
    readonly reason: 'employer' | 'no_show' | 'ops',
    readonly note: string | null,
  ) {
    super(shiftId, access, ctx);
  }
}
