import { Inject, Injectable, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ConsumeEvents } from 'src/shared/messaging/consume-events.decorator';
import { TimerService } from 'src/shared/timers/timer.service';
import { TimerHandler } from 'src/shared/timers/timer-handler.decorator';
import { AutonomyPolicyService } from 'src/shared/autonomy/autonomy-policy.service';
import { DECISION_POINTS } from 'src/shared/autonomy/decision-points.constant';
import { causedBy, CommandContext, EventEnvelope } from 'src/shared/events/event-envelope';
import { systemActor } from 'src/shared/events/actor';
import { TOPICS } from 'src/shared/contracts/events/topics';
import { SHIFT_EVENTS as E } from 'src/shared/contracts/events/shift.events';
import { minutes, snConfig } from 'src/shared/sn-runtime';
import { ShiftRepository } from 'src/modules/shift/application/shift.repository';
import { OfferShiftCommand } from 'src/modules/shift/application/commands/shift.commands';
import { ShiftStatus } from 'src/modules/shift/domain/shift-status.enum';
import { ShiftDomainError } from 'src/modules/shift/domain/errors/shift.errors';
import { ShiftForMatching } from '../domain/candidate';
import { defaultEligibility } from '../domain/eligibility/worker.specifications';
import { MATCHING_STRATEGIES, MatchingStrategy } from '../domain/ranking/matching-strategy';
import { DispatchPolicy } from '../domain/dispatch.policy';
import { CANDIDATE_SEARCH, CandidateSearch } from './ports/candidate-search.port';

const MAX_RADIUS_KM = 50;
const RETRY_TIMER = 'matching.retry';
const RETRY_EVERY_MIN = 5;

/**
 * Matching (docs/ARCHITECTURE.md §9.1): on shift.posted / rematch / last decline / offer expiry,
 * search candidates, filter (Specification), rank (Strategy), dispatch (policy), send OfferShift.
 * With nobody eligible it retries every 5 minutes until the shift expires.
 */
@Injectable()
export class MatchShiftHandler {
  private readonly logger = new Logger(MatchShiftHandler.name);

  constructor(
    private readonly commands: CommandBus,
    private readonly shifts: ShiftRepository,
    private readonly timers: TimerService,
    private readonly autonomy: AutonomyPolicyService,
    @Inject(CANDIDATE_SEARCH) private readonly search: CandidateSearch,
    @Inject(MATCHING_STRATEGIES) private readonly strategies: MatchingStrategy[],
  ) {}

  @ConsumeEvents({ group: 'sn-matching', topics: [TOPICS.SHIFT], types: [E.POSTED, E.REMATCH_REQUESTED, E.OFFER_DECLINED, E.OFFER_EXPIRED] })
  async on(env: EventEnvelope): Promise<void> {
    if (env.type === E.OFFER_DECLINED && env.payload.remaining_offers?.length) return;
    await this.match(env.stream_id, causedBy(env, systemActor('matching')));
  }

  @TimerHandler(RETRY_TIMER)
  async onRetry(p: { shift_id: string }) {
    await this.match(p.shift_id, { actor: systemActor('matching'), correlationId: p.shift_id });
  }

  async match(shiftId: string, ctx: CommandContext): Promise<number[]> {
    const shift = await this.shifts.load(shiftId);
    if (!shift || shift.status !== ShiftStatus.POSTED) return [];
    const s = shift.state;
    const policy = await this.autonomy.policy(DECISION_POINTS.MATCHING_DISPATCH);
    if (!policy.enabled || policy.mode !== 'auto') return []; // employers / ops use direct offers

    const target: ShiftForMatching = {
      shiftId,
      companyId: s.companyId,
      skillCode: s.skillCode,
      startAt: s.startAt,
      endAt: s.endAt,
      lat: s.lat,
      lng: s.lng,
      excludedWorkerIds: s.excludedWorkerIds,
      dispatchMode: s.dispatchMode === 'broadcast' ? 'broadcast' : 'sequential',
    };
    const requireVerified = process.env.SN_REQUIRE_VERIFIED_WORKERS !== 'false';
    const eligibility = defaultEligibility(requireVerified);
    const candidates = (await this.search.find(target, MAX_RADIUS_KM, 50)).filter((c) => eligibility.isSatisfiedBy(c, target));
    const ranked = this.strategies[0].rank(target, candidates);
    const picked = new DispatchPolicy(5).pick(target.dispatchMode, ranked);

    if (!picked.length) {
      const retryAt = new Date(Date.now() + minutes(RETRY_EVERY_MIN));
      const deadline = s.startAt.getTime() - minutes(snConfig().SN_SHIFT_MIN_LEAD_MIN);
      if (retryAt.getTime() < deadline) await this.timers.schedule(RETRY_TIMER, retryAt, { shift_id: shiftId }, `${shiftId}:${shift.version}:${Math.floor(Date.now() / 60000)}`);
      this.logger.log(`no eligible worker for shift ${shiftId} (${candidates.length} candidates after filter)`);
      return [];
    }
    try {
      await this.commands.execute(
        new OfferShiftCommand(
          shiftId,
          { kind: 'system' },
          ctx,
          picked.map((p) => p.candidate.workerId),
          target.dispatchMode,
          picked.map((p) => ({ worker_id: p.candidate.workerId, score: p.score, distance_m: p.candidate.distanceM })),
        ),
      );
    } catch (err) {
      if (err instanceof ShiftDomainError) return [];
      throw err;
    }
    return picked.map((p) => p.candidate.workerId);
  }
}
