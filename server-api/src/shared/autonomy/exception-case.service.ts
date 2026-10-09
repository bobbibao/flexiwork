import { Injectable } from '@nestjs/common';
import { Transaction } from 'sequelize';
import { randomUUID } from 'crypto';
import ExceptionCase from 'src/database/models/exception-cases.model';
import { UnitOfWork } from '../event-store/unit-of-work';
import { OutboxService } from '../messaging/outbox.service';
import { Actor } from '../events/actor';
import { createEnvelope } from '../events/event-envelope';
import { EXCEPTION_EVENTS, ExceptionSeverity } from '../contracts/events/exception.events';

export interface SuggestedAction {
  /** Command name the ops UI can execute, e.g. 'resolve_dispute', 'cancel_shift', 'rematch', 'retry_payout'. */
  action: string;
  label_vi: string;
  params?: Record<string, unknown>;
}

export interface OpenCaseInput {
  type: string;
  severity: ExceptionSeverity;
  subjectType: string;
  subjectId: string;
  companyId?: number | null;
  /** Same fact never opens two cases. */
  dedupeKey: string;
  summary: string;
  details?: Record<string, unknown>;
  suggestedActions?: SuggestedAction[];
  openedBy: Actor;
  correlationId?: string;
}

const SLA_HOURS: Record<ExceptionSeverity, number> = { low: 72, medium: 24, high: 4, critical: 1 };

/** The human exception queue (docs/ARCHITECTURE.md §13, item 6). */
@Injectable()
export class ExceptionCaseService {
  constructor(
    private readonly uow: UnitOfWork,
    private readonly outbox: OutboxService,
  ) {}

  /** Opens a case (idempotent by dedupeKey). Returns the case id, or null if it already existed. */
  async open(input: OpenCaseInput, existing?: Transaction | null): Promise<string | null> {
    return this.uow.run(async (t) => {
      const id = randomUUID();
      const rows = await this.uow.execute(
        `INSERT INTO exception_cases
           (id, type, severity, status, subject_type, subject_id, company_id, dedupe_key, summary, details,
            suggested_actions, opened_by, sla_due_at, created_at, updated_at)
         VALUES (:id, :type, :severity, 'OPEN', :subjectType, :subjectId, :companyId, :dedupeKey, :summary,
            CAST(:details AS JSONB), CAST(:actions AS JSONB), CAST(:openedBy AS JSONB),
            now() + (:slaHours || ' hours')::interval, now(), now())
         ON CONFLICT (dedupe_key) DO NOTHING RETURNING id`,
        {
          id,
          type: input.type,
          severity: input.severity,
          subjectType: input.subjectType,
          subjectId: input.subjectId,
          companyId: input.companyId ?? null,
          dedupeKey: input.dedupeKey,
          summary: input.summary,
          details: JSON.stringify(input.details ?? {}),
          actions: JSON.stringify(input.suggestedActions ?? []),
          openedBy: JSON.stringify(input.openedBy),
          slaHours: String(SLA_HOURS[input.severity]),
        },
        t,
      );
      if (!rows.length) return null;
      await this.outbox.enqueue(
        t,
        createEnvelope({
          type: EXCEPTION_EVENTS.CASE_OPENED,
          streamType: 'exception',
          streamId: id,
          companyId: input.companyId ?? null,
          payload: {
            case_id: id,
            type: input.type,
            severity: input.severity,
            subject_type: input.subjectType,
            subject_id: input.subjectId,
            company_id: input.companyId ?? null,
            summary: input.summary,
          },
          ctx: { actor: input.openedBy, correlationId: input.correlationId ?? input.subjectId },
        }),
      );
      return id;
    }, existing);
  }

  async markResolved(caseId: string, resolution: Record<string, unknown>, actor: Actor, status: 'RESOLVED' | 'DISMISSED' = 'RESOLVED'): Promise<void> {
    await this.uow.run(async (t) => {
      const kase = await ExceptionCase.findByPk(caseId, { transaction: t, lock: t.LOCK.UPDATE });
      if (!kase) return;
      kase.status = status;
      kase.resolution = { ...resolution, by: actor, at: new Date().toISOString() };
      kase.updated_at = new Date();
      await kase.save({ transaction: t });
      await this.outbox.enqueue(
        t,
        createEnvelope({
          type: EXCEPTION_EVENTS.CASE_RESOLVED,
          streamType: 'exception',
          streamId: caseId,
          companyId: kase.company_id,
          payload: {
            case_id: caseId,
            type: kase.type,
            severity: kase.severity,
            subject_type: kase.subject_type,
            subject_id: kase.subject_id,
            company_id: kase.company_id,
            status,
          },
          ctx: { actor, correlationId: kase.subject_id },
        }),
      );
    });
  }
}
