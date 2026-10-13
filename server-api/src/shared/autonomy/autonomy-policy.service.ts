/* eslint-disable @typescript-eslint/no-explicit-any -- untyped boundary: raw SQL rows / JSON event payloads */
import { Inject, Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import AutonomyPolicy from 'src/database/models/autonomy-policies.model';
import DecisionRecord from 'src/database/models/decision-records.model';
import { UnitOfWork } from '../event-store/unit-of-work';
import { OutboxService } from '../messaging/outbox.service';
import { createEnvelope } from '../events/event-envelope';
import { systemActor } from '../events/actor';
import { DECISION_EVENTS } from '../contracts/events/decision.events';
import { AutonomyMode, DecisionPoint } from './decision-points.constant';
import { DECISION_PROVIDER, DecisionContext, DecisionOutcome, DecisionProvider } from './decision-provider.port';

const MIN_CONFIDENCE = 0.8;
const CACHE_MS = 15_000;

export interface Decision extends DecisionOutcome {
  id: string;
  mode: AutonomyMode;
  /** true: the caller may execute the outcome now. false: a human must decide (open an exception case). */
  execute: boolean;
}

/** Reads autonomy_policies and records every decision (decision_records + decision.recorded event). */
@Injectable()
export class AutonomyPolicyService {
  private readonly logger = new Logger(AutonomyPolicyService.name);
  private cache: { at: number; rows: Map<string, AutonomyPolicy> } | null = null;

  constructor(
    private readonly uow: UnitOfWork,
    private readonly outbox: OutboxService,
    @Inject(DECISION_PROVIDER) private readonly provider: DecisionProvider,
  ) {}

  async policy(point: DecisionPoint): Promise<{ mode: AutonomyMode; enabled: boolean; limits: Record<string, any> }> {
    if (!this.cache || Date.now() - this.cache.at > CACHE_MS) {
      const rows = await AutonomyPolicy.findAll({ logging: false });
      this.cache = { at: Date.now(), rows: new Map(rows.map((r) => [r.decision_point, r])) };
    }
    const row = this.cache.rows.get(point);
    if (!row) return { mode: 'manual', enabled: true, limits: {} };
    return { mode: row.mode as AutonomyMode, enabled: row.enabled, limits: row.limits || {} };
  }

  invalidate(): void {
    this.cache = null;
  }

  /** Kill-switch style check (e.g. payouts.enabled). */
  async isEnabled(point: DecisionPoint): Promise<boolean> {
    return (await this.policy(point)).enabled;
  }

  async decide(context: Omit<DecisionContext, 'inputs'> & { inputs: Record<string, unknown>; companyId?: number | null }): Promise<Decision> {
    const policy = await this.policy(context.point);
    const outcome = await this.provider.decide(context);
    const mode: AutonomyMode = policy.enabled ? policy.mode : 'manual';
    const execute = mode === 'auto' && outcome.confidence >= MIN_CONFIDENCE;
    const id = randomUUID();
    await this.uow.run(async (t) => {
      await DecisionRecord.create(
        {
          id,
          decision_point: context.point,
          subject_type: context.subjectType,
          subject_id: context.subjectId,
          mode,
          outcome: outcome.outcome,
          confidence: outcome.confidence,
          rationale: outcome.rationale,
          inputs: { ...context.inputs, limits: policy.limits },
          provider: this.provider.name,
          executed: execute,
          created_at: new Date(),
        },
        { transaction: t },
      );
      await this.outbox.enqueue(
        t,
        createEnvelope({
          type: DECISION_EVENTS.RECORDED,
          streamType: 'decision',
          streamId: id,
          companyId: context.companyId ?? null,
          payload: {
            decision_id: id,
            decision_point: context.point,
            subject_type: context.subjectType,
            subject_id: context.subjectId,
            mode,
            outcome: outcome.outcome,
            confidence: outcome.confidence,
            rationale: outcome.rationale,
            provider: this.provider.name,
            executed: execute,
          },
          ctx: { actor: systemActor('autonomy'), correlationId: context.subjectId },
        }),
      );
    });
    this.logger.log(`decision ${context.point} ${context.subjectId}: ${outcome.outcome} (mode=${mode}, execute=${execute})`);
    return { id, mode, execute, ...outcome };
  }
}
