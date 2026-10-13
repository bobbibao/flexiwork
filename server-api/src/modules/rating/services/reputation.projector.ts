/* eslint-disable @typescript-eslint/no-explicit-any -- untyped boundary: raw SQL rows / JSON event payloads */
import { Injectable, Logger } from '@nestjs/common';
import { Transaction } from 'sequelize';
import { UnitOfWork } from 'src/shared/event-store/unit-of-work';
import { OutboxService } from 'src/shared/messaging/outbox.service';
import { ConsumeEvents } from 'src/shared/messaging/consume-events.decorator';
import { createEnvelope, EventEnvelope } from 'src/shared/events/event-envelope';
import { systemActor } from 'src/shared/events/actor';
import { TOPICS } from 'src/shared/contracts/events/topics';
import { SHIFT_EVENTS as E } from 'src/shared/contracts/events/shift.events';
import { RATING_EVENTS } from 'src/shared/contracts/events/rating.events';
import { AutonomyPolicyService } from 'src/shared/autonomy/autonomy-policy.service';
import { ExceptionCaseService } from 'src/shared/autonomy/exception-case.service';
import { DECISION_POINTS } from 'src/shared/autonomy/decision-points.constant';
import { snConfig } from 'src/shared/sn-runtime';

/** Reliability score rules (PLAN.md P6; ⚠️ Q7 defaults). Start 80, clamp 0..100. */
export const RELIABILITY = { completed: 2, lateCheckIn: -3, lateWithdrawal: -10, earlyWithdrawal: -2, noShow: -20, lateMinutes: 15 };

/**
 * Rating & reputation projections (docs/ARCHITECTURE.md §4): ratings table, worker/employer averages,
 * worker reliability score, and the worker.suspension suggestion. Runs in the consumer's inbox transaction.
 */
@Injectable()
export class ReputationProjector {
  private readonly logger = new Logger(ReputationProjector.name);

  constructor(
    private readonly uow: UnitOfWork,
    private readonly outbox: OutboxService,
    private readonly autonomy: AutonomyPolicyService,
    private readonly exceptions: ExceptionCaseService,
  ) {}

  @ConsumeEvents({
    group: 'sn-reputation',
    topics: [TOPICS.SHIFT],
    types: [E.RATED, E.PAID, E.NO_SHOW_RECORDED, E.WORKER_WITHDREW, E.WORKER_CHECKED_IN],
  })
  async on(env: EventEnvelope, t: Transaction): Promise<void> {
    const p = env.payload;
    switch (env.type) {
      case E.RATED:
        await this.uow.execute(
          `INSERT INTO ratings (shift_id, rater_role, rater_id, ratee_role, ratee_id, stars, tags, comment, created_at)
           VALUES (:shiftId, :raterRole, :raterId, :rateeRole, :rateeId, :stars, CAST(:tags AS TEXT[]), :comment, :at)
           ON CONFLICT (shift_id, rater_id) DO NOTHING`,
          {
            shiftId: env.stream_id,
            raterRole: p.rater_role,
            raterId: p.rater_id,
            rateeRole: p.rater_role === 'employer' ? 'worker' : 'employer',
            rateeId: p.ratee_id,
            stars: p.stars,
            tags: `{${(p.tags ?? []).map((x: string) => `"${x.replace(/"/g, '')}"`).join(',')}}`,
            comment: p.comment,
            at: env.occurred_at,
          },
          t,
        );
        if (p.rater_role === 'employer') await this.refreshWorker(p.ratee_id, 0, t, env);
        else await this.refreshEmployer(p.ratee_id, t, env);
        return;
      case E.PAID: {
        const [row] = await this.uow.select<{ worker_id: number }>(`SELECT worker_id FROM shift_views WHERE id = :id`, { id: env.stream_id }, t);
        const workerId = row?.worker_id ?? (await this.workerFromStream(env.stream_id, t));
        if (workerId) await this.refreshWorker(workerId, RELIABILITY.completed, t, env, true);
        return;
      }
      case E.NO_SHOW_RECORDED:
        await this.refreshWorker(p.worker_id, RELIABILITY.noShow, t, env);
        return;
      case E.WORKER_WITHDREW:
        await this.refreshWorker(p.worker_id, p.hours_before_start < snConfig().SN_FREE_CANCEL_HOURS ? RELIABILITY.lateWithdrawal : RELIABILITY.earlyWithdrawal, t, env);
        return;
      case E.WORKER_CHECKED_IN:
        if (p.late_minutes > RELIABILITY.lateMinutes) await this.refreshWorker(p.worker_id, RELIABILITY.lateCheckIn, t, env);
        return;
    }
  }

  private async workerFromStream(shiftId: string, t: Transaction): Promise<number | null> {
    const [row] = await this.uow.select<{ worker_id: string }>(
      `SELECT payload->>'worker_id' AS worker_id FROM event_store WHERE stream_id = :id AND event_type = 'shift.accepted' ORDER BY stream_version DESC LIMIT 1`,
      { id: shiftId },
      t,
    );
    return row ? Number(row.worker_id) : null;
  }

  private async refreshWorker(workerId: number, reliabilityDelta: number, t: Transaction, env: EventEnvelope, completed = false) {
    const [row] = await this.uow.select<any>(
      `UPDATE worker_profiles SET
         reliability_score = LEAST(100, GREATEST(0, reliability_score + :delta)),
         completed_shifts = completed_shifts + :completed,
         rating_avg = (SELECT ROUND(AVG(stars)::numeric, 2) FROM ratings WHERE ratee_role = 'worker' AND ratee_id = :workerId),
         rating_count = (SELECT COUNT(*) FROM ratings WHERE ratee_role = 'worker' AND ratee_id = :workerId),
         updated_at = now()
       WHERE user_id = :workerId
       RETURNING user_id, rating_avg, rating_count, reliability_score`,
      { workerId, delta: reliabilityDelta, completed: completed ? 1 : 0 },
      t,
    );
    if (!row) return;
    await this.outbox.enqueue(
      t,
      createEnvelope({
        type: RATING_EVENTS.REPUTATION_CHANGED,
        streamType: 'rating',
        streamId: `worker:${workerId}`,
        payload: {
          subject_type: 'worker',
          subject_id: workerId,
          rating_avg: row.rating_avg === null ? null : Number(row.rating_avg),
          rating_count: Number(row.rating_count),
          reliability_score: Number(row.reliability_score),
        },
        ctx: { actor: systemActor('reputation'), correlationId: env.correlation_id, causationId: env.event_id },
      }),
    );
    await this.maybeSuggestSuspension(workerId, Number(row.reliability_score), t);
  }

  private async refreshEmployer(companyId: number, t: Transaction, env: EventEnvelope) {
    const [row] = await this.uow.select<any>(
      `UPDATE employer_profiles SET
         rating_avg = (SELECT ROUND(AVG(stars)::numeric, 2) FROM ratings WHERE ratee_role = 'employer' AND ratee_id = :companyId),
         rating_count = (SELECT COUNT(*) FROM ratings WHERE ratee_role = 'employer' AND ratee_id = :companyId),
         updated_at = now()
       WHERE company_id = :companyId RETURNING rating_avg, rating_count`,
      { companyId },
      t,
    );
    if (!row) return;
    await this.outbox.enqueue(
      t,
      createEnvelope({
        type: RATING_EVENTS.REPUTATION_CHANGED,
        streamType: 'rating',
        streamId: `company:${companyId}`,
        companyId,
        payload: { subject_type: 'employer', subject_id: companyId, rating_avg: row.rating_avg === null ? null : Number(row.rating_avg), rating_count: Number(row.rating_count), reliability_score: null },
        ctx: { actor: systemActor('reputation'), correlationId: env.correlation_id, causationId: env.event_id },
      }),
    );
  }

  private async maybeSuggestSuspension(workerId: number, reliability: number, t: Transaction) {
    const policy = await this.autonomy.policy(DECISION_POINTS.WORKER_SUSPENSION);
    const threshold = Number(policy.limits.reliability_below ?? 40);
    if (!policy.enabled || reliability >= threshold) return;
    await this.exceptions.open(
      {
        type: 'worker_suspension_suggested',
        severity: 'medium',
        subjectType: 'worker',
        subjectId: String(workerId),
        dedupeKey: `worker_suspension_suggested:${workerId}:${new Date().toISOString().slice(0, 10)}`,
        summary: `Độ tin cậy của người lao động #${workerId} giảm còn ${reliability}: đề xuất tạm khóa`,
        details: { worker_id: workerId, reliability_score: reliability, threshold },
        suggestedActions: [
          { action: 'suspend_worker', label_vi: 'Tạm khóa tài khoản', params: { worker_id: workerId } },
          { action: 'warn_worker', label_vi: 'Chỉ cảnh báo', params: { worker_id: workerId } },
        ],
        openedBy: systemActor('reputation'),
      },
      t,
    );
  }
}
