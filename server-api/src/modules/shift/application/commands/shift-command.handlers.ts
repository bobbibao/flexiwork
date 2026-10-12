import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { randomUUID } from 'crypto';
import { GeoPoint } from 'src/shared/domain/geo-point';
import { LockService } from 'src/shared/redis/lock.service';
import { CodedError, conflict, notFound } from 'src/shared/utils/coded.error';
import { minutes, snConfig } from 'src/shared/sn-runtime';
import { Shift } from '../../domain/shift.aggregate';
import { ShiftDomainError } from '../../domain/errors/shift.errors';
import { ShiftRepository } from '../shift.repository';
import { ShiftPolicies } from '../shift-policies';
import { AttendanceChain } from '../check-in/check-in.chain';
import { WORK_LOCATION_READER, WORKER_DIRECTORY, WorkerDirectory, WorkLocationReader } from '../ports/shift.ports';
import { ShiftHandlerBase } from './shift-command.base';
import * as C from './shift.commands';

const MAX_HEADCOUNT = 20;

@CommandHandler(C.PostShiftCommand)
export class PostShiftHandler implements ICommandHandler<C.PostShiftCommand> {
  constructor(
    private readonly repo: ShiftRepository,
    private readonly policies: ShiftPolicies,
    @Inject(WORK_LOCATION_READER) private readonly locations: WorkLocationReader,
  ) {}

  async execute(cmd: C.PostShiftCommand) {
    const { input, access } = cmd;
    if (!access.companyId) throw new CodedError('EMPLOYER_REQUIRED', 'Only employers can post shifts', 403);
    if (!Number.isInteger(input.headcount) || input.headcount < 1 || input.headcount > MAX_HEADCOUNT) {
      throw new CodedError('HEADCOUNT_INVALID', `Headcount must be between 1 and ${MAX_HEADCOUNT}`);
    }
    const location = await this.locations.get(access.companyId, input.workLocationId);
    if (!location || !location.active) throw notFound('WORK_LOCATION_NOT_FOUND', 'Work location not found');
    const urgent = input.startAt.getTime() - Date.now() < 3 * 3_600_000;
    const jobRef = randomUUID();
    const pricing = this.policies.pricing();
    const now = new Date();
    const views = [];
    for (let i = 0; i < input.headcount; i++) {
      const shift = Shift.post(
        randomUUID(),
        {
          jobRef,
          companyId: access.companyId,
          companyName: location.companyName,
          workLocationId: location.id,
          locationName: location.name,
          title: input.title.trim(),
          description: input.description,
          skillCode: input.skillCode,
          startAt: input.startAt,
          endAt: input.endAt,
          hourlyVnd: input.hourlyVnd,
          dispatchMode: input.dispatchMode ?? (urgent ? 'broadcast' : 'sequential'),
          location: GeoPoint.of(location.lat, location.lng),
          address: location.address,
          provinceCode: location.provinceCode,
          wardCode: location.wardCode,
          postedBy: access.userId!,
          platformFeePct: snConfig().SN_PLATFORM_FEE_PCT,
          minLeadMinutes: snConfig().SN_SHIFT_MIN_LEAD_MIN,
          minHourlyVnd: this.policies.minHourlyVnd,
        },
        pricing,
        now,
      );
      await this.repo.save(shift, { ...cmd.ctx, correlationId: shift.id });
      views.push(shift.toView());
    }
    return { job_ref: jobRef, shifts: views };
  }
}

const offerExpiry = (shift: Shift, now: Date) =>
  new Date(Math.min(now.getTime() + minutes(snConfig().SN_OFFER_TTL_MIN), shift.state.startAt.getTime()));

@CommandHandler(C.OfferShiftCommand)
export class OfferShiftHandler extends ShiftHandlerBase implements ICommandHandler<C.OfferShiftCommand> {
  constructor(repo: ShiftRepository) {
    super(repo);
  }
  execute(cmd: C.OfferShiftCommand) {
    return this.mutate(cmd.shiftId, cmd.access, cmd.ctx, (s, now) => s.offer(cmd.workerIds, cmd.mode, offerExpiry(s, now), cmd.access.kind, now, cmd.ranking));
  }
}

@CommandHandler(C.DirectOfferCommand)
export class DirectOfferHandler extends ShiftHandlerBase implements ICommandHandler<C.DirectOfferCommand> {
  constructor(
    repo: ShiftRepository,
    @Inject(WORKER_DIRECTORY) private readonly workers: WorkerDirectory,
  ) {
    super(repo);
  }
  async execute(cmd: C.DirectOfferCommand) {
    const worker = await this.workers.get(cmd.workerId);
    if (!worker) throw notFound('WORKER_NOT_FOUND', 'Worker not found');
    if (worker.suspended) throw new CodedError('WORKER_SUSPENDED', 'This worker is suspended', 422);
    return this.mutate(cmd.shiftId, cmd.access, cmd.ctx, (s, now) => s.offer([cmd.workerId], 'direct', offerExpiry(s, now), cmd.access.kind, now));
  }
}

@CommandHandler(C.DeclineOfferCommand)
export class DeclineOfferHandler extends ShiftHandlerBase implements ICommandHandler<C.DeclineOfferCommand> {
  constructor(repo: ShiftRepository) {
    super(repo);
  }
  execute(cmd: C.DeclineOfferCommand) {
    return this.mutate(cmd.shiftId, cmd.access, cmd.ctx, (s, now) => s.declineOffer(cmd.access.userId!, now));
  }
}

@CommandHandler(C.ExpireOfferCommand)
export class ExpireOfferHandler extends ShiftHandlerBase implements ICommandHandler<C.ExpireOfferCommand> {
  constructor(repo: ShiftRepository) {
    super(repo);
  }
  execute(cmd: C.ExpireOfferCommand) {
    return this.mutate(cmd.shiftId, cmd.access, cmd.ctx, (s, now) => s.expireOffer(cmd.expiresAt, now));
  }
}

/** Accept races (broadcast offers) are serialised by a Redis lock; the event store version and EXCLUDE constraint back it up. */
@CommandHandler(C.AcceptShiftCommand)
export class AcceptShiftHandler extends ShiftHandlerBase implements ICommandHandler<C.AcceptShiftCommand> {
  constructor(
    repo: ShiftRepository,
    private readonly locks: LockService,
  ) {
    super(repo);
  }
  async execute(cmd: C.AcceptShiftCommand) {
    const { acquired, result } = await this.locks.withLock(`lock:shift:${cmd.shiftId}`, 5000, () =>
      this.mutate(cmd.shiftId, cmd.access, cmd.ctx, (s, now) => s.accept(cmd.access.userId!, now)),
    );
    if (!acquired) throw conflict('SHIFT_BUSY', 'Another worker is accepting this shift, please retry');
    return result;
  }
}

@CommandHandler(C.RecordEscrowFundedCommand)
export class RecordEscrowFundedHandler extends ShiftHandlerBase implements ICommandHandler<C.RecordEscrowFundedCommand> {
  constructor(repo: ShiftRepository) {
    super(repo);
  }
  execute(cmd: C.RecordEscrowFundedCommand) {
    return this.mutate(cmd.shiftId, cmd.access, cmd.ctx, (s, now) => s.recordEscrowFunded(cmd.journalId, cmd.amountVnd, now));
  }
}

@CommandHandler(C.FailEscrowFundingCommand)
export class FailEscrowFundingHandler extends ShiftHandlerBase implements ICommandHandler<C.FailEscrowFundingCommand> {
  constructor(repo: ShiftRepository) {
    super(repo);
  }
  execute(cmd: C.FailEscrowFundingCommand) {
    return this.mutate(cmd.shiftId, cmd.access, cmd.ctx, (s, now) => s.failEscrowFunding(now));
  }
}

@CommandHandler(C.WithdrawFromShiftCommand)
export class WithdrawFromShiftHandler extends ShiftHandlerBase implements ICommandHandler<C.WithdrawFromShiftCommand> {
  constructor(repo: ShiftRepository) {
    super(repo);
  }
  execute(cmd: C.WithdrawFromShiftCommand) {
    return this.mutate(cmd.shiftId, cmd.access, cmd.ctx, (s, now) => s.withdraw(cmd.access.userId!, now));
  }
}

abstract class AttendanceHandlerBase extends ShiftHandlerBase {
  protected readonly chain = new AttendanceChain();
  constructor(
    repo: ShiftRepository,
    protected readonly locations: WorkLocationReader,
  ) {
    super(repo);
  }

  protected async validate(kind: 'check_in' | 'check_out', shift: Shift, workerId: number, now: Date, pos: { lat: number; lng: number; accuracyM: number; qrToken?: string | null }) {
    const location = await this.locations.getById(shift.state.workLocationId);
    if (!location) throw notFound('WORK_LOCATION_NOT_FOUND', 'Work location not found');
    const c = snConfig();
    this.chain.run({
      kind,
      shift: shift.state,
      workerId,
      now,
      lat: pos.lat,
      lng: pos.lng,
      accuracyM: pos.accuracyM,
      qrToken: pos.qrToken,
      location,
      config: { earlyMinutes: c.SN_CHECKIN_EARLY_MIN, graceMinutes: c.SN_NO_SHOW_GRACE_MIN, maxAccuracyM: c.SN_GPS_MAX_ACCURACY_M, qrSecret: c.QR_TOKEN_SECRET },
    });
  }
}

@CommandHandler(C.CheckInCommand)
export class CheckInHandler extends AttendanceHandlerBase implements ICommandHandler<C.CheckInCommand> {
  constructor(repo: ShiftRepository, @Inject(WORK_LOCATION_READER) locations: WorkLocationReader) {
    super(repo, locations);
  }
  execute(cmd: C.CheckInCommand) {
    return this.mutate(cmd.shiftId, cmd.access, cmd.ctx, async (s, now) => {
      await this.validate('check_in', s, cmd.access.userId!, now, cmd.position);
      s.checkIn(
        cmd.access.userId!,
        { at: now.toISOString(), lat: cmd.position.lat, lng: cmd.position.lng, accuracy_m: cmd.position.accuracyM, method: cmd.position.qrToken ? 'gps+qr' : 'gps' },
        now,
      );
    });
  }
}

@CommandHandler(C.CheckOutCommand)
export class CheckOutHandler extends AttendanceHandlerBase implements ICommandHandler<C.CheckOutCommand> {
  constructor(repo: ShiftRepository, @Inject(WORK_LOCATION_READER) locations: WorkLocationReader) {
    super(repo, locations);
  }
  execute(cmd: C.CheckOutCommand) {
    return this.mutate(cmd.shiftId, cmd.access, cmd.ctx, async (s, now) => {
      await this.validate('check_out', s, cmd.access.userId!, now, cmd.position);
      s.checkOut(cmd.access.userId!, { lat: cmd.position.lat, lng: cmd.position.lng }, false, now);
    });
  }
}

@CommandHandler(C.AutoCheckOutCommand)
export class AutoCheckOutHandler extends ShiftHandlerBase implements ICommandHandler<C.AutoCheckOutCommand> {
  constructor(repo: ShiftRepository) {
    super(repo);
  }
  execute(cmd: C.AutoCheckOutCommand) {
    return this.mutate(cmd.shiftId, cmd.access, cmd.ctx, (s, now) => s.checkOut(null, { lat: null, lng: null }, true, now));
  }
}

@CommandHandler(C.RecordNoShowCommand)
export class RecordNoShowHandler extends ShiftHandlerBase implements ICommandHandler<C.RecordNoShowCommand> {
  constructor(repo: ShiftRepository) {
    super(repo);
  }
  execute(cmd: C.RecordNoShowCommand) {
    return this.mutate(cmd.shiftId, cmd.access, cmd.ctx, (s, now) => s.recordNoShow(now));
  }
}

@CommandHandler(C.RematchCommand)
export class RematchHandler extends ShiftHandlerBase implements ICommandHandler<C.RematchCommand> {
  constructor(repo: ShiftRepository) {
    super(repo);
  }
  execute(cmd: C.RematchCommand) {
    return this.mutate(cmd.shiftId, cmd.access, cmd.ctx, (s, now) => s.rematch(cmd.access.kind, now));
  }
}

@CommandHandler(C.ConfirmCompletionCommand)
export class ConfirmCompletionHandler extends ShiftHandlerBase implements ICommandHandler<C.ConfirmCompletionCommand> {
  constructor(
    repo: ShiftRepository,
    private readonly policies: ShiftPolicies,
  ) {
    super(repo);
  }
  execute(cmd: C.ConfirmCompletionCommand) {
    return this.mutate(cmd.shiftId, cmd.access, cmd.ctx, (s, now) => s.confirmCompletion(cmd.approvedMinutes, false, this.policies.completion(), now));
  }
}

@CommandHandler(C.AutoConfirmCompletionCommand)
export class AutoConfirmCompletionHandler extends ShiftHandlerBase implements ICommandHandler<C.AutoConfirmCompletionCommand> {
  constructor(
    repo: ShiftRepository,
    private readonly policies: ShiftPolicies,
  ) {
    super(repo);
  }
  execute(cmd: C.AutoConfirmCompletionCommand) {
    return this.mutate(cmd.shiftId, cmd.access, cmd.ctx, (s, now) => s.confirmCompletion(null, true, this.policies.completion(), now));
  }
}

@CommandHandler(C.DisputeCompletionCommand)
export class DisputeCompletionHandler extends ShiftHandlerBase implements ICommandHandler<C.DisputeCompletionCommand> {
  constructor(repo: ShiftRepository) {
    super(repo);
  }
  execute(cmd: C.DisputeCompletionCommand) {
    return this.mutate(cmd.shiftId, cmd.access, cmd.ctx, (s, now) =>
      s.dispute({ reason_code: cmd.reasonCode, note: cmd.note, claimed_minutes: cmd.claimedMinutes }, now),
    );
  }
}

@CommandHandler(C.ResolveDisputeCommand)
export class ResolveDisputeHandler extends ShiftHandlerBase implements ICommandHandler<C.ResolveDisputeCommand> {
  constructor(
    repo: ShiftRepository,
    private readonly policies: ShiftPolicies,
  ) {
    super(repo);
  }
  execute(cmd: C.ResolveDisputeCommand) {
    return this.mutate(cmd.shiftId, cmd.access, cmd.ctx, (s, now) => s.resolveDispute(cmd.outcome, cmd.approvedMinutes, cmd.note, this.policies.completion(), now));
  }
}

@CommandHandler(C.RecordPaymentReleasedCommand)
export class RecordPaymentReleasedHandler extends ShiftHandlerBase implements ICommandHandler<C.RecordPaymentReleasedCommand> {
  constructor(repo: ShiftRepository) {
    super(repo);
  }
  execute(cmd: C.RecordPaymentReleasedCommand) {
    return this.mutate(cmd.shiftId, cmd.access, cmd.ctx, (s, now) => s.recordPaymentReleased(cmd.payment, now));
  }
}

@CommandHandler(C.RateShiftCommand)
export class RateShiftHandler extends ShiftHandlerBase implements ICommandHandler<C.RateShiftCommand> {
  constructor(repo: ShiftRepository) {
    super(repo);
  }
  execute(cmd: C.RateShiftCommand) {
    return this.mutate(cmd.shiftId, cmd.access, cmd.ctx, (s, now) => {
      const role = cmd.access.kind === 'worker' ? 'worker' : 'employer';
      if (role === 'worker' && s.state.workerId !== cmd.access.userId) throw new ShiftDomainError('NOT_ASSIGNED', 'You are not assigned to this shift', 'forbidden');
      s.rate(role, cmd.access.userId!, cmd.stars, cmd.tags, cmd.comment, now);
    });
  }
}

@CommandHandler(C.CloseRatingWindowCommand)
export class CloseRatingWindowHandler extends ShiftHandlerBase implements ICommandHandler<C.CloseRatingWindowCommand> {
  constructor(repo: ShiftRepository) {
    super(repo);
  }
  execute(cmd: C.CloseRatingWindowCommand) {
    return this.mutate(cmd.shiftId, cmd.access, cmd.ctx, (s, now) => s.closeRatingWindow(now));
  }
}

@CommandHandler(C.CancelShiftCommand)
export class CancelShiftHandler extends ShiftHandlerBase implements ICommandHandler<C.CancelShiftCommand> {
  constructor(
    repo: ShiftRepository,
    private readonly policies: ShiftPolicies,
  ) {
    super(repo);
  }
  execute(cmd: C.CancelShiftCommand) {
    return this.mutate(cmd.shiftId, cmd.access, cmd.ctx, (s, now) => s.cancel(cmd.reason, cmd.access.kind, cmd.note, this.policies.cancellation(), now));
  }
}

@CommandHandler(C.ExpireShiftCommand)
export class ExpireShiftHandler extends ShiftHandlerBase implements ICommandHandler<C.ExpireShiftCommand> {
  constructor(repo: ShiftRepository) {
    super(repo);
  }
  execute(cmd: C.ExpireShiftCommand) {
    return this.mutate(cmd.shiftId, cmd.access, cmd.ctx, (s, now) => s.expire(now));
  }
}

export const SHIFT_COMMAND_HANDLERS = [
  PostShiftHandler,
  OfferShiftHandler,
  DirectOfferHandler,
  DeclineOfferHandler,
  ExpireOfferHandler,
  AcceptShiftHandler,
  RecordEscrowFundedHandler,
  FailEscrowFundingHandler,
  WithdrawFromShiftHandler,
  CheckInHandler,
  CheckOutHandler,
  AutoCheckOutHandler,
  RecordNoShowHandler,
  RematchHandler,
  ConfirmCompletionHandler,
  AutoConfirmCompletionHandler,
  DisputeCompletionHandler,
  ResolveDisputeHandler,
  RecordPaymentReleasedHandler,
  RateShiftHandler,
  CloseRatingWindowHandler,
  CancelShiftHandler,
  ExpireShiftHandler,
];
