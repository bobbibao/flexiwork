/* eslint-disable @typescript-eslint/no-explicit-any -- untyped boundary: raw SQL rows / JSON event payloads */
import { Injectable } from '@nestjs/common';
import { Transaction, UniqueConstraintError } from 'sequelize';
import EventStoreEntry from 'src/database/models/event-store.model';
import { DomainEvent } from '../events/domain-event';
import { CommandContext, createEnvelope, EventEnvelope, StreamType } from '../events/event-envelope';
import { upcast } from '../events/upcaster';
import { ConcurrencyError } from './concurrency.error';
import { UnitOfWork } from './unit-of-work';

@Injectable()
export class EventStoreService {
  constructor(private readonly uow: UnitOfWork) {}

  /** Appends events with optimistic concurrency on (stream_id, stream_version). */
  async append(
    t: Transaction,
    streamType: StreamType,
    streamId: string,
    expectedVersion: number,
    events: readonly DomainEvent[],
    ctx: CommandContext,
    companyId: number | null,
  ): Promise<EventEnvelope[]> {
    const envelopes = events.map((e, i) =>
      createEnvelope({
        type: e.type,
        version: e.version,
        streamType,
        streamId,
        streamVersion: expectedVersion + i + 1,
        occurredAt: e.occurredAt,
        companyId,
        payload: e.payload,
        ctx,
      }),
    );
    try {
      await EventStoreEntry.bulkCreate(
        envelopes.map((env) => ({
          event_id: env.event_id,
          stream_type: streamType,
          stream_id: streamId,
          stream_version: env.stream_version,
          event_type: env.type,
          event_version: env.version,
          payload: env.payload,
          metadata: {
            actor: env.actor,
            correlation_id: env.correlation_id,
            causation_id: env.causation_id,
            company_id: env.company_id,
            idempotency_key: env.idempotency_key ?? null,
          },
          occurred_at: new Date(env.occurred_at),
        })),
        { transaction: t },
      );
    } catch (err) {
      if (err instanceof UniqueConstraintError) throw new ConcurrencyError(streamId, expectedVersion);
      throw err;
    }
    return envelopes;
  }

  async readStream(streamId: string, afterVersion = 0, t?: Transaction | null): Promise<EventEnvelope[]> {
    const rows = await this.uow.select<any>(
      `SELECT * FROM event_store WHERE stream_id = :streamId AND stream_version > :afterVersion ORDER BY stream_version`,
      { streamId, afterVersion },
      t,
      true,
    );
    return rows.map(toEnvelope);
  }

  async readAll(afterPosition: number, limit: number, streamType?: StreamType): Promise<Array<EventEnvelope & { global_position: number }>> {
    const rows = await this.uow.select<any>(
      `SELECT * FROM event_store WHERE global_position > :afterPosition ${streamType ? 'AND stream_type = :streamType' : ''}
       ORDER BY global_position LIMIT :limit`,
      { afterPosition, limit, streamType },
      null,
      true,
    );
    return rows.map((r) => ({ ...toEnvelope(r), global_position: Number(r.global_position) }));
  }
}

export function toEnvelope(row: any): EventEnvelope {
  const { version, payload } = upcast(row.event_type, row.event_version, row.payload);
  const m = row.metadata || {};
  return {
    event_id: row.event_id,
    type: row.event_type,
    version,
    stream_type: row.stream_type,
    stream_id: row.stream_id,
    stream_version: row.stream_version,
    occurred_at: new Date(row.occurred_at).toISOString(),
    company_id: m.company_id ?? null,
    actor: m.actor,
    correlation_id: m.correlation_id,
    causation_id: m.causation_id ?? null,
    idempotency_key: m.idempotency_key ?? undefined,
    payload,
  };
}
