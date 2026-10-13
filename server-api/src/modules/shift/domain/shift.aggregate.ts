/* eslint-disable @typescript-eslint/no-explicit-any -- untyped boundary: raw SQL rows / JSON event payloads */
import { AggregateRoot } from 'src/shared/event-store/aggregate-root';
import { DomainEvent } from 'src/shared/events/domain-event';
import { Money } from 'src/shared/domain/money';
import { GeoPoint } from 'src/shared/domain/geo-point';
import {
  CancelReason,
  DispatchMode,
  SHIFT_EVENTS as E,
  ShiftAcceptedPayload,
  ShiftCancelledPayload,
  ShiftCheckedInPayload,
  ShiftCheckedOutPayload,
  ShiftCompletedPayload,
  ShiftDisputedPayload,
  ShiftDisputeResolvedPayload,
  ShiftEscrowFundedPayload,
  ShiftNoShowPayload,
  ShiftOfferDeclinedPayload,
  ShiftOfferedPayload,
  ShiftOfferExpiredPayload,
  ShiftPaidPayload,
  ShiftPostedPayload,
  ShiftRatedPayload,
  ShiftRatingsClosedPayload,
  ShiftRematchPayload,
  ShiftWithdrewPayload,
} from 'src/shared/contracts/events/shift.events';
import { ShiftStatus as S } from './shift-status.enum';
import { ActorKind, assertTransition, ShiftCommandName } from './shift-state-machine';
import { ShiftDomainError } from './errors/shift.errors';
import { PricingPolicy } from './policies/pricing.policy';
import { CompletionPolicy } from './policies/completion.policy';
import { CancellationPolicy } from './policies/cancellation.policy';

export interface PostShiftInput {
  jobRef: string;
  companyId: number;
  companyName: string | null;
  workLocationId: string;
  locationName: string | null;
  title: string;
  description: string | null;
  skillCode: string;
  startAt: Date;
  endAt: Date;
  hourlyVnd: number;
  dispatchMode: 'sequential' | 'broadcast';
  location: GeoPoint;
  address: string | null;
  provinceCode: string | null;
  wardCode: string | null;
  postedBy: number;
  platformFeePct: number;
  minLeadMinutes: number;
  minHourlyVnd: number;
}

export interface ShiftState {
  status: S | null;
  jobRef: string;
  companyId: number;
  companyName: string | null;
  workLocationId: string;
  locationName: string | null;
  title: string;
  description: string | null;
  skillCode: string;
  startAt: Date;
  endAt: Date;
  hourlyVnd: number;
  estimatedGrossVnd: number;
  platformFeeVnd: number;
  escrowAmountVnd: number;
  scheduledMinutes: number;
  dispatchMode: string;
  lat: number;
  lng: number;
  address: string | null;
  provinceCode: string | null;
  wardCode: string | null;
  offeredWorkerIds: number[];
  offerExpiresAt: Date | null;
  excludedWorkerIds: number[];
  workerId: number | null;
  escrowHeld: boolean;
  checkedInAt: Date | null;
  checkedOutAt: Date | null;
  workedMinutes: number | null;
  autoCheckedOut: boolean;
  approvedMinutes: number | null;
  grossVnd: number | null;
  feeVnd: number | null;
  pitVnd: number | null;
  netVnd: number | null;
  refundVnd: number | null;
  employerRated: boolean;
  workerRated: boolean;
  cancelReason: string | null;
  postedAt: Date | null;
}

const MAX_SHIFT_HOURS = 14;
const MAX_ADVANCE_DAYS = 60;

/**
 * Shift aggregate: one worker slot = one transaction (docs/ARCHITECTURE.md §5).
 * Methods validate with the state machine + guards, then raise events; when() only applies facts.
 */
export class Shift extends AggregateRoot {
  state: ShiftState = {
    status: null,
    jobRef: '',
    companyId: 0,
    companyName: null,
    workLocationId: '',
    locationName: null,
    title: '',
    description: null,
    skillCode: '',
    startAt: new Date(0),
    endAt: new Date(0),
    hourlyVnd: 0,
    estimatedGrossVnd: 0,
    platformFeeVnd: 0,
    escrowAmountVnd: 0,
    scheduledMinutes: 0,
    dispatchMode: 'sequential',
    lat: 0,
    lng: 0,
    address: null,
    provinceCode: null,
    wardCode: null,
    offeredWorkerIds: [],
    offerExpiresAt: null,
    excludedWorkerIds: [],
    workerId: null,
    escrowHeld: false,
    checkedInAt: null,
    checkedOutAt: null,
    workedMinutes: null,
    autoCheckedOut: false,
    approvedMinutes: null,
    grossVnd: null,
    feeVnd: null,
    pitVnd: null,
    netVnd: null,
    refundVnd: null,
    employerRated: false,
    workerRated: false,
    cancelReason: null,
    postedAt: null,
  };

  constructor(id: string) {
    super(id);
  }

  tenantId(): number | null {
    return this.state.companyId || null;
  }

  get status(): S | null {
    return this.state.status;
  }

  private guard(command: ShiftCommandName, actor: ActorKind): void {
    assertTransition(command, this.state.status, actor);
  }

  // ---------------------------------------------------------------- commands

  static post(id: string, input: PostShiftInput, pricing: PricingPolicy, now: Date): Shift {
    const shift = new Shift(id);
    shift.guard('PostShift', 'employer');
    const leadMs = input.minLeadMinutes * 60_000;
    if (input.startAt.getTime() - now.getTime() < leadMs) {
      throw new ShiftDomainError('SHIFT_START_TOO_SOON', `Shift must start at least ${input.minLeadMinutes} minutes from now`);
    }
    if (input.startAt.getTime() - now.getTime() > MAX_ADVANCE_DAYS * 86_400_000) {
      throw new ShiftDomainError('SHIFT_START_TOO_FAR', `Shift must start within ${MAX_ADVANCE_DAYS} days`);
    }
    const hours = (input.endAt.getTime() - input.startAt.getTime()) / 3_600_000;
    if (hours <= 0 || hours > MAX_SHIFT_HOURS) {
      throw new ShiftDomainError('SHIFT_DURATION_INVALID', `Shift duration must be between 0 and ${MAX_SHIFT_HOURS} hours`);
    }
    if (!Number.isSafeInteger(input.hourlyVnd) || input.hourlyVnd < input.minHourlyVnd) {
      throw new ShiftDomainError('SHIFT_RATE_TOO_LOW', `Hourly rate must be at least ${input.minHourlyVnd} VND`);
    }
    const quote = pricing.quote(input.startAt, input.endAt, input.hourlyVnd);
    const fee = quote.estimatedGross.percent(input.platformFeePct);
    const payload: ShiftPostedPayload = {
      job_ref: input.jobRef,
      company_id: input.companyId,
      company_name: input.companyName,
      work_location_id: input.workLocationId,
      location_name: input.locationName,
      title: input.title,
      description: input.description,
      skill_code: input.skillCode,
      start_at: input.startAt.toISOString(),
      end_at: input.endAt.toISOString(),
      hourly_vnd: input.hourlyVnd,
      estimated_gross_vnd: quote.estimatedGross.amount,
      platform_fee_vnd: fee.amount,
      escrow_amount_vnd: quote.estimatedGross.add(fee).amount,
      scheduled_minutes: quote.scheduledMinutes,
      dispatch_mode: input.dispatchMode,
      lat: input.location.lat,
      lng: input.location.lng,
      address: input.address,
      province_code: input.provinceCode,
      ward_code: input.wardCode,
      posted_by: input.postedBy,
    };
    shift.raise(E.POSTED, payload, now);
    return shift;
  }

  offer(workerIds: number[], mode: DispatchMode, expiresAt: Date, actor: ActorKind, now: Date, ranking?: ShiftOfferedPayload['ranking_snapshot']): void {
    this.guard(mode === 'direct' ? 'DirectOffer' : 'OfferShift', actor);
    const ids = [...new Set(workerIds)].filter((w) => !this.state.excludedWorkerIds.includes(w));
    if (!ids.length) throw new ShiftDomainError('OFFER_NO_ELIGIBLE_WORKER', 'No eligible worker to offer');
    if (now >= this.state.startAt) throw new ShiftDomainError('SHIFT_ALREADY_STARTED', 'Shift has already started');
    const payload: ShiftOfferedPayload = { worker_ids: ids, mode, expires_at: expiresAt.toISOString(), ranking_snapshot: ranking };
    this.raise(E.OFFERED, payload, now);
  }

  declineOffer(workerId: number, now: Date): void {
    this.guard('DeclineOffer', 'worker');
    this.assertOffered(workerId);
    const remaining = this.state.offeredWorkerIds.filter((w) => w !== workerId);
    const payload: ShiftOfferDeclinedPayload = { worker_id: workerId, remaining_offers: remaining };
    this.raise(E.OFFER_DECLINED, payload, now);
  }

  expireOffer(expectedExpiresAt: string, now: Date): void {
    this.guard('ExpireOffer', 'system');
    if (!this.state.offerExpiresAt || this.state.offerExpiresAt.toISOString() !== expectedExpiresAt) {
      throw new ShiftDomainError('OFFER_TIMER_STALE', 'Offer already replaced', 'transition');
    }
    const payload: ShiftOfferExpiredPayload = { worker_ids: this.state.offeredWorkerIds };
    this.raise(E.OFFER_EXPIRED, payload, now);
  }

  accept(workerId: number, now: Date): void {
    this.guard('AcceptShift', 'worker');
    this.assertOffered(workerId);
    if (this.state.offerExpiresAt && now > this.state.offerExpiresAt) throw new ShiftDomainError('OFFER_EXPIRED', 'Offer has expired');
    if (now >= this.state.startAt) throw new ShiftDomainError('SHIFT_ALREADY_STARTED', 'Shift has already started');
    const payload: ShiftAcceptedPayload = { worker_id: workerId, escrow_amount_vnd: this.state.escrowAmountVnd };
    this.raise(E.ACCEPTED, payload, now);
  }

  recordEscrowFunded(journalId: string, amountVnd: number, now: Date): void {
    this.guard('RecordEscrowFunded', 'system');
    const payload: ShiftEscrowFundedPayload = { journal_id: journalId, amount_vnd: amountVnd };
    this.raise(E.ESCROW_FUNDED, payload, now);
  }

  failEscrowFunding(now: Date): void {
    this.guard('FailEscrowFunding', 'system');
    this.raiseCancelled('escrow_funding_failed', null, 0, now);
  }

  withdraw(workerId: number, now: Date): void {
    this.guard('WithdrawFromShift', 'worker');
    this.assertAssigned(workerId);
    const payload: ShiftWithdrewPayload = { worker_id: workerId, hours_before_start: round2((this.state.startAt.getTime() - now.getTime()) / 3_600_000) };
    this.raise(E.WORKER_WITHDREW, payload, now);
    const rematch: ShiftRematchPayload = { reason: 'worker_withdrew', excluded_worker_ids: [...this.state.excludedWorkerIds] };
    this.raise(E.REMATCH_REQUESTED, rematch, now);
  }

  checkIn(workerId: number, data: Omit<ShiftCheckedInPayload, 'worker_id' | 'late_minutes'>, now: Date): void {
    this.guard('CheckIn', 'worker');
    this.assertAssigned(workerId);
    const late = Math.max(0, Math.round((now.getTime() - this.state.startAt.getTime()) / 60_000));
    const payload: ShiftCheckedInPayload = { worker_id: workerId, ...data, late_minutes: late };
    this.raise(E.WORKER_CHECKED_IN, payload, now);
  }

  recordNoShow(now: Date): void {
    this.guard('RecordNoShow', 'system');
    const payload: ShiftNoShowPayload = { worker_id: this.state.workerId! };
    this.raise(E.NO_SHOW_RECORDED, payload, now);
  }

  rematch(actor: ActorKind, now: Date): void {
    this.guard('Rematch', actor);
    if (now >= this.state.endAt) throw new ShiftDomainError('SHIFT_ALREADY_ENDED', 'Shift has already ended');
    const payload: ShiftRematchPayload = { reason: actor === 'ops' ? 'ops' : 'no_show', excluded_worker_ids: [...this.state.excludedWorkerIds] };
    this.raise(E.REMATCH_REQUESTED, payload, now);
  }

  checkOut(workerId: number | null, data: { lat: number | null; lng: number | null }, auto: boolean, now: Date): void {
    this.guard(auto ? 'AutoCheckOut' : 'CheckOut', auto ? 'system' : 'worker');
    if (!auto) this.assertAssigned(workerId!);
    const at = auto ? new Date(Math.min(now.getTime(), this.state.endAt.getTime())) : now;
    const worked = Math.max(0, Math.round((at.getTime() - this.state.checkedInAt!.getTime()) / 60_000));
    const payload: ShiftCheckedOutPayload = { worker_id: this.state.workerId!, at: at.toISOString(), lat: data.lat, lng: data.lng, worked_minutes: worked, auto };
    this.raise(E.WORKER_CHECKED_OUT, payload, now);
  }

  confirmCompletion(approvedMinutes: number | null, auto: boolean, policy: CompletionPolicy, now: Date, actor: ActorKind = 'employer'): void {
    this.guard(auto ? 'AutoConfirmCompletion' : 'ConfirmCompletion', auto ? 'system' : actor);
    const approved = approvedMinutes ?? policy.defaultApprovedMinutes(this.state.workedMinutes ?? 0, this.state.scheduledMinutes);
    policy.validateApprovedMinutes(approved, this.state.scheduledMinutes);
    this.raiseCompleted(approved, auto, policy, now);
  }

  dispute(payload: ShiftDisputedPayload, now: Date): void {
    this.guard('DisputeCompletion', 'employer');
    this.raise(E.DISPUTED, payload, now);
  }

  resolveDispute(outcome: 'pay' | 'refund', approvedMinutes: number, note: string | null, policy: CompletionPolicy, now: Date): void {
    this.guard('ResolveDispute', 'ops');
    if (outcome === 'pay') policy.validateApprovedMinutes(approvedMinutes, this.state.scheduledMinutes);
    const payload: ShiftDisputeResolvedPayload = { outcome, approved_minutes: outcome === 'pay' ? approvedMinutes : 0, note };
    this.raise(E.DISPUTE_RESOLVED, payload, now);
    if (outcome === 'pay') this.raiseCompleted(approvedMinutes, false, policy, now);
    else this.raiseCancelled('dispute_refund', note, 0, now);
  }

  recordPaymentReleased(payload: ShiftPaidPayload, now: Date): void {
    this.guard('RecordPaymentReleased', 'system');
    this.raise(E.PAID, payload, now);
  }

  rate(raterRole: 'employer' | 'worker', raterId: number, stars: number, tags: string[], comment: string | null, now: Date): void {
    this.guard('RateShift', raterRole);
    if (!Number.isInteger(stars) || stars < 1 || stars > 5) throw new ShiftDomainError('RATING_STARS_INVALID', 'Stars must be 1-5');
    if ((raterRole === 'employer' && this.state.employerRated) || (raterRole === 'worker' && this.state.workerRated)) {
      throw new ShiftDomainError('ALREADY_RATED', 'Already rated', 'transition');
    }
    const payload: ShiftRatedPayload = {
      rater_role: raterRole,
      rater_id: raterId,
      ratee_id: raterRole === 'employer' ? this.state.workerId! : this.state.companyId,
      stars,
      tags: [...new Set(tags)].slice(0, 10),
      comment: comment?.slice(0, 1000) ?? null,
    };
    this.raise(E.RATED, payload, now);
    if (this.state.employerRated && this.state.workerRated) {
      const closed: ShiftRatingsClosedPayload = { employer_rated: true, worker_rated: true };
      this.raise(E.RATINGS_CLOSED, closed, now);
    }
  }

  closeRatingWindow(now: Date): void {
    this.guard('CloseRatingWindow', 'system');
    const payload: ShiftRatingsClosedPayload = { employer_rated: this.state.employerRated, worker_rated: this.state.workerRated };
    this.raise(E.RATINGS_CLOSED, payload, now);
  }

  cancel(reason: CancelReason, actor: ActorKind, note: string | null, policy: CancellationPolicy, now: Date): void {
    this.guard('CancelShift', actor);
    const assigned = this.state.workerId !== null && [S.ACCEPTED, S.ESCROW_FUNDED].includes(this.state.status!);
    const comp = reason === 'employer' ? policy.compensation(Money.vnd(this.state.estimatedGrossVnd), this.state.startAt, now, assigned, this.state.escrowHeld) : Money.zero();
    this.raiseCancelled(reason, note, comp.amount, now);
  }

  expire(now: Date): void {
    this.guard('ExpireShift', 'system');
    this.raise(E.EXPIRED, {}, now);
  }

  // ---------------------------------------------------------------- helpers

  private raiseCompleted(approved: number, auto: boolean, policy: CompletionPolicy, now: Date) {
    const gross = policy.gross(Money.vnd(this.state.estimatedGrossVnd), approved, this.state.scheduledMinutes);
    const fee = this.state.estimatedGrossVnd > 0 ? Money.vnd(this.state.platformFeeVnd).multiply(gross.amount / this.state.estimatedGrossVnd) : Money.zero();
    const payload: ShiftCompletedPayload = { approved_minutes: approved, gross_vnd: gross.amount, fee_vnd: fee.amount, auto };
    this.raise(E.COMPLETED, payload, now);
  }

  private raiseCancelled(reason: CancelReason, note: string | null, compensationGross: number, now: Date) {
    const payload: ShiftCancelledPayload = {
      reason,
      note,
      worker_id: this.state.workerId,
      escrow_held: this.state.escrowHeld,
      compensation_gross_vnd: compensationGross,
    };
    this.raise(E.CANCELLED, payload, now);
  }

  private assertOffered(workerId: number) {
    if (!this.state.offeredWorkerIds.includes(workerId)) throw new ShiftDomainError('NOT_OFFERED', 'This shift was not offered to you', 'forbidden');
  }

  private assertAssigned(workerId: number) {
    if (this.state.workerId !== workerId) throw new ShiftDomainError('NOT_ASSIGNED', 'You are not assigned to this shift', 'forbidden');
  }

  // ---------------------------------------------------------------- event application

  protected when(event: DomainEvent): void {
    const s = this.state;
    const p: any = event.payload;
    switch (event.type) {
      case E.POSTED:
        Object.assign(s, {
          status: S.POSTED,
          jobRef: p.job_ref,
          companyId: p.company_id,
          companyName: p.company_name ?? null,
          workLocationId: p.work_location_id,
          locationName: p.location_name ?? null,
          title: p.title,
          description: p.description,
          skillCode: p.skill_code,
          startAt: new Date(p.start_at),
          endAt: new Date(p.end_at),
          hourlyVnd: p.hourly_vnd,
          estimatedGrossVnd: p.estimated_gross_vnd,
          platformFeeVnd: p.platform_fee_vnd,
          escrowAmountVnd: p.escrow_amount_vnd,
          scheduledMinutes: p.scheduled_minutes,
          dispatchMode: p.dispatch_mode,
          lat: p.lat,
          lng: p.lng,
          address: p.address,
          provinceCode: p.province_code,
          wardCode: p.ward_code,
          postedAt: event.occurredAt,
        });
        break;
      case E.OFFERED:
        s.status = S.MATCHED;
        s.offeredWorkerIds = p.worker_ids;
        s.offerExpiresAt = new Date(p.expires_at);
        break;
      case E.OFFER_DECLINED:
        s.offeredWorkerIds = p.remaining_offers;
        s.excludedWorkerIds = [...s.excludedWorkerIds, p.worker_id];
        if (!p.remaining_offers.length) {
          s.status = S.POSTED;
          s.offerExpiresAt = null;
        }
        break;
      case E.OFFER_EXPIRED:
        s.status = S.POSTED;
        s.excludedWorkerIds = [...new Set([...s.excludedWorkerIds, ...p.worker_ids])];
        s.offeredWorkerIds = [];
        s.offerExpiresAt = null;
        break;
      case E.ACCEPTED:
        s.status = S.ACCEPTED;
        s.workerId = p.worker_id;
        s.offeredWorkerIds = [];
        s.offerExpiresAt = null;
        break;
      case E.ESCROW_FUNDED:
        s.status = S.ESCROW_FUNDED;
        s.escrowHeld = true;
        break;
      case E.WORKER_WITHDREW:
        s.excludedWorkerIds = [...s.excludedWorkerIds, p.worker_id];
        break;
      case E.NO_SHOW_RECORDED:
        s.status = S.NO_SHOW;
        s.excludedWorkerIds = [...s.excludedWorkerIds, p.worker_id];
        break;
      case E.REMATCH_REQUESTED:
        s.status = S.POSTED;
        s.workerId = null;
        s.offeredWorkerIds = [];
        s.offerExpiresAt = null;
        break;
      case E.WORKER_CHECKED_IN:
        s.status = S.CHECKED_IN;
        s.checkedInAt = new Date(p.at);
        break;
      case E.WORKER_CHECKED_OUT:
        s.status = S.CHECKED_OUT;
        s.checkedOutAt = new Date(p.at);
        s.workedMinutes = p.worked_minutes;
        s.autoCheckedOut = !!p.auto;
        break;
      case E.DISPUTED:
        s.status = S.DISPUTED;
        break;
      case E.DISPUTE_RESOLVED:
        break;
      case E.COMPLETED:
        s.status = S.COMPLETED;
        s.approvedMinutes = p.approved_minutes;
        s.grossVnd = p.gross_vnd;
        s.feeVnd = p.fee_vnd;
        break;
      case E.PAID:
        s.status = S.PAID;
        s.pitVnd = p.pit_vnd;
        s.netVnd = p.net_vnd;
        s.refundVnd = p.refund_vnd;
        break;
      case E.RATED:
        if (p.rater_role === 'employer') s.employerRated = true;
        else s.workerRated = true;
        break;
      case E.RATINGS_CLOSED:
        s.status = S.RATED;
        break;
      case E.CANCELLED:
        s.status = S.CANCELLED;
        s.cancelReason = p.reason;
        break;
      case E.EXPIRED:
        s.status = S.EXPIRED;
        break;
    }
  }

  /** Read-your-writes view returned by command endpoints (same field names as shift_views). */
  toView() {
    const s = this.state;
    return {
      id: this.id,
      version: this.version + this.pendingEvents.length,
      status: s.status,
      job_ref: s.jobRef,
      company_id: s.companyId,
      company_name: s.companyName,
      work_location_id: s.workLocationId,
      location_name: s.locationName,
      title: s.title,
      description: s.description,
      skill_code: s.skillCode,
      start_at: s.startAt.toISOString(),
      end_at: s.endAt.toISOString(),
      hourly_vnd: s.hourlyVnd,
      estimated_gross_vnd: s.estimatedGrossVnd,
      platform_fee_vnd: s.platformFeeVnd,
      escrow_amount_vnd: s.escrowAmountVnd,
      scheduled_minutes: s.scheduledMinutes,
      dispatch_mode: s.dispatchMode,
      lat: s.lat,
      lng: s.lng,
      address: s.address,
      worker_id: s.workerId,
      offered_worker_ids: s.offeredWorkerIds,
      offer_expires_at: s.offerExpiresAt?.toISOString() ?? null,
      escrow_status: !s.escrowHeld
        ? 'none'
        : [S.PAID, S.RATED].includes(s.status!)
          ? 'released'
          : s.status === S.CANCELLED
            ? 'refunded'
            : 'held',
      checked_in_at: s.checkedInAt?.toISOString() ?? null,
      checked_out_at: s.checkedOutAt?.toISOString() ?? null,
      worked_minutes: s.workedMinutes,
      approved_minutes: s.approvedMinutes,
      gross_vnd: s.grossVnd,
      fee_vnd: s.feeVnd,
      pit_vnd: s.pitVnd,
      net_vnd: s.netVnd,
      refund_vnd: s.refundVnd,
      employer_rated: s.employerRated,
      worker_rated: s.workerRated,
      cancel_reason: s.cancelReason,
    };
  }
}

const round2 = (n: number) => Math.round(n * 100) / 100;
