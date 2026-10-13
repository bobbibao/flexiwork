/* eslint-disable @typescript-eslint/no-explicit-any -- untyped boundary: raw SQL rows / JSON event payloads */
import { Inject, Injectable } from '@nestjs/common';
import type Redis from 'ioredis';
import type { Client } from '@elastic/elasticsearch';
import ExceptionCase from 'src/database/models/exception-cases.model';
import DlqMessage from 'src/database/models/dlq-messages.model';
import AutonomyPolicy from 'src/database/models/autonomy-policies.model';
import DecisionRecord from 'src/database/models/decision-records.model';
import { UnitOfWork } from 'src/shared/event-store/unit-of-work';
import { OutboxRelayService } from 'src/shared/messaging/outbox-relay.service';
import { ConsumerRegistryService } from 'src/shared/messaging/consumer-registry.service';
import { MESSAGE_BROKER, MessageBroker } from 'src/shared/messaging/message-broker.port';
import { TimerService } from 'src/shared/timers/timer.service';
import { REDIS_CLIENT } from 'src/shared/redis/redis.module';
import { ES_CLIENT } from 'src/shared/search/search.module';
import { AutonomyPolicyService } from 'src/shared/autonomy/autonomy-policy.service';
import { CodedError, notFound } from 'src/shared/utils/coded.error';
import { WhereOptions } from 'sequelize';

const SEVERITY_ORDER = `CASE severity WHEN 'critical' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END`;

@Injectable()
export class OpsQueryService {
  constructor(
    private readonly uow: UnitOfWork,
    private readonly relay: OutboxRelayService,
    private readonly registry: ConsumerRegistryService,
    private readonly timers: TimerService,
    private readonly autonomy: AutonomyPolicyService,
    @Inject(MESSAGE_BROKER) private readonly broker: MessageBroker,
    @Inject(REDIS_CLIENT) private readonly redis: Redis | null,
    @Inject(ES_CLIENT) private readonly es: Client | null,
  ) {}

  async listCases(q: { status?: string; severity?: string; type?: string; page?: number; page_size?: number }) {
    const size = Math.min(Math.max(q.page_size ?? 20, 1), 100);
    const page = Math.max(q.page ?? 1, 1);
    const where: string[] = ['true'];
    const r: Record<string, unknown> = { limit: size, offset: (page - 1) * size };
    const statuses = q.status ? q.status.split(',') : ['OPEN', 'ACKNOWLEDGED'];
    where.push('status IN (:statuses)');
    r.statuses = statuses;
    if (q.severity) {
      where.push('severity IN (:sev)');
      r.sev = q.severity.split(',');
    }
    if (q.type) {
      where.push('type = :type');
      r.type = q.type;
    }
    const items = await this.uow.select<any>(
      `SELECT *, (sla_due_at < now() AND status IN ('OPEN', 'ACKNOWLEDGED')) AS sla_breached FROM exception_cases
       WHERE ${where.join(' AND ')} ORDER BY ${SEVERITY_ORDER}, created_at ASC LIMIT :limit OFFSET :offset`,
      r,
    );
    const [{ count }] = await this.uow.select<{ count: string }>(`SELECT COUNT(*) AS count FROM exception_cases WHERE ${where.join(' AND ')}`, r);
    const summary = await this.uow.select<any>(`SELECT severity, COUNT(*) AS n FROM exception_cases WHERE status IN ('OPEN', 'ACKNOWLEDGED') GROUP BY severity`);
    return {
      items,
      total_items: Number(count),
      page,
      page_size: size,
      total_pages: Math.ceil(Number(count) / size),
      open_by_severity: Object.fromEntries(summary.map((s) => [s.severity, Number(s.n)])),
    };
  }

  async getCase(id: string) {
    const kase = await ExceptionCase.findByPk(id);
    if (!kase) throw notFound('CASE_NOT_FOUND', 'Case not found');
    const decisions = await DecisionRecord.findAll({ where: { subject_id: kase.subject_id }, order: [['created_at', 'ASC']] });
    return { ...kase.get({ plain: true }), decisions };
  }

  async policies() {
    return AutonomyPolicy.findAll({ order: [['decision_point', 'ASC']] });
  }

  async updatePolicy(point: string, input: { mode?: string; enabled?: boolean; limits?: Record<string, unknown> }, userId: number) {
    const row = await AutonomyPolicy.findByPk(point);
    if (!row) throw notFound('POLICY_NOT_FOUND', 'Unknown decision point');
    if (input.mode && !['manual', 'suggest', 'auto'].includes(input.mode)) throw new CodedError('POLICY_MODE_INVALID', 'mode must be manual, suggest or auto');
    row.set({
      ...(input.mode && { mode: input.mode }),
      ...(input.enabled !== undefined && { enabled: input.enabled }),
      ...(input.limits && { limits: { ...row.limits, ...input.limits } }),
      updated_by: userId,
      updated_at: new Date(),
    } as any);
    await row.save();
    this.autonomy.invalidate();
    return row;
  }

  async decisions(q: { decision_point?: string; subject_id?: string; limit?: number }) {
    const where: WhereOptions = {};
    if (q.decision_point) (where as any).decision_point = q.decision_point;
    if (q.subject_id) (where as any).subject_id = q.subject_id;
    return DecisionRecord.findAll({ where, order: [['created_at', 'DESC']], limit: Math.min(q.limit ?? 50, 200) });
  }

  async dlq(status = 'OPEN') {
    return DlqMessage.findAll({ where: { status: status.split(',') }, order: [['created_at', 'DESC']], limit: 200 });
  }

  async replayDlq(id: string) {
    const msg = await DlqMessage.findByPk(id);
    if (!msg) throw notFound('DLQ_NOT_FOUND', 'DLQ message not found');
    if (msg.status !== 'OPEN') throw new CodedError('DLQ_ALREADY_HANDLED', 'Already replayed or dismissed', 409);
    await this.registry.replay(msg.consumer_group, msg.envelope as any, msg.original_topic);
    msg.set({ status: 'REPLAYED', replayed_at: new Date() } as any);
    await msg.save();
    return msg;
  }

  async health() {
    const check = async (fn: () => Promise<unknown>) => {
      const started = Date.now();
      try {
        const detail = await fn();
        return { ok: true, ms: Date.now() - started, ...(detail && typeof detail === 'object' ? detail : {}) };
      } catch (err) {
        return { ok: false, ms: Date.now() - started, error: String(err) };
      }
    };
    const [openCases] = await this.uow.select<{ n: string }>(`SELECT COUNT(*) AS n FROM exception_cases WHERE status IN ('OPEN', 'ACKNOWLEDGED')`);
    return {
      postgres: await check(() => this.uow.select('SELECT 1')),
      redis: await check(async () => {
        if (!this.redis) return { mode: 'memory' };
        await this.redis.ping();
        return { mode: 'redis' };
      }),
      broker: { driver: this.broker.driver, consumer_groups: this.registry.groups() },
      elasticsearch: await check(async () => {
        if (!this.es) return { mode: 'disabled (postgres search)' };
        await (this.es as any).ping();
        return { mode: 'elasticsearch' };
      }),
      metrics: {
        outbox_lag_seconds: await this.relay.lagSeconds(),
        timer_backlog: await this.timers.backlog(),
        dlq_open: await DlqMessage.count({ where: { status: 'OPEN' } }),
        exception_cases_open: Number(openCases.n),
        unpublished_outbox: await this.uow.select<{ n: string }>(`SELECT COUNT(*) AS n FROM outbox_messages WHERE published_at IS NULL`, {}, null, true).then((r) => Number(r[0].n)),
      },
    };
  }

  async listShifts(q: { status?: string; page?: number; page_size?: number }) {
    const size = Math.min(Math.max(q.page_size ?? 20, 1), 100);
    const page = Math.max(q.page ?? 1, 1);
    const r: Record<string, unknown> = { limit: size, offset: (page - 1) * size };
    const where = q.status ? 'WHERE status IN (:statuses)' : '';
    if (q.status) r.statuses = q.status.split(',');
    const items = await this.uow.select<any>(`SELECT * FROM shift_views ${where} ORDER BY updated_at DESC LIMIT :limit OFFSET :offset`, r);
    const [{ count }] = await this.uow.select<{ count: string }>(`SELECT COUNT(*) AS count FROM shift_views ${where}`, r);
    return { items, total_items: Number(count), page, page_size: size, total_pages: Math.ceil(Number(count) / size) };
  }
}

