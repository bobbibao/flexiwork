import { Transaction } from 'sequelize';
import { AggregateRoot } from './aggregate-root';
import { EventStoreService } from './event-store.service';
import { UnitOfWork } from './unit-of-work';
import { CommandContext, EventEnvelope, StreamType } from '../events/event-envelope';
import { OutboxService } from '../messaging/outbox.service';

export interface SaveOptions {
  /** Inline projections written in the same transaction (e.g. worker_shift_reservations). */
  extraWrites?: (t: Transaction, envelopes: EventEnvelope[]) => Promise<void>;
  transaction?: Transaction | null;
}

const SNAPSHOT_EVERY = 50;

/**
 * Generic event-sourced repository (Repository + Unit of Work, docs/ARCHITECTURE.md §14).
 * save() appends events, writes outbox rows and inline projections in ONE transaction.
 */
export class EventSourcedRepository<T extends AggregateRoot> {
  constructor(
    private readonly store: EventStoreService,
    private readonly uow: UnitOfWork,
    private readonly outbox: OutboxService,
    private readonly streamType: StreamType,
    private readonly factory: (id: string) => T,
  ) {}

  async load(id: string, t?: Transaction | null): Promise<T | null> {
    const aggregate = this.factory(id);
    let after = 0;
    if (aggregate.restoreSnapshot) {
      const [snap] = await this.uow.select<any>(
        `SELECT stream_version, state FROM aggregate_snapshots WHERE stream_id = :id`,
        { id },
        t,
        true,
      );
      if (snap) {
        aggregate.restoreSnapshot(snap.state);
        aggregate.version = snap.stream_version;
        after = snap.stream_version;
      }
    }
    const envelopes = await this.store.readStream(id, after, t);
    if (!envelopes.length && after === 0) return null;
    aggregate.replay(
      envelopes.map((e) => ({ type: e.type, version: e.version, payload: e.payload, occurredAt: new Date(e.occurred_at) })),
    );
    return aggregate;
  }

  async save(aggregate: T, ctx: CommandContext, options: SaveOptions = {}): Promise<EventEnvelope[]> {
    const events = aggregate.pendingEvents;
    if (!events.length) return [];
    const envelopes = await this.uow.run(async (t) => {
      const envs = await this.store.append(t, this.streamType, aggregate.id, aggregate.version, events, ctx, aggregate.tenantId());
      for (const env of envs) await this.outbox.enqueue(t, env);
      if (options.extraWrites) await options.extraWrites(t, envs);
      const newVersion = aggregate.version + events.length;
      if (aggregate.toSnapshot && Math.floor(newVersion / SNAPSHOT_EVERY) > Math.floor(aggregate.version / SNAPSHOT_EVERY)) {
        await this.uow.execute(
          `INSERT INTO aggregate_snapshots (stream_id, stream_type, stream_version, state, created_at)
           VALUES (:id, :type, :version, CAST(:state AS JSONB), now())
           ON CONFLICT (stream_id) DO UPDATE SET stream_version = EXCLUDED.stream_version, state = EXCLUDED.state, created_at = now()`,
          { id: aggregate.id, type: this.streamType, version: newVersion, state: JSON.stringify(aggregate.toSnapshot()) },
          t,
        );
      }
      return envs;
    }, options.transaction);
    aggregate.markCommitted();
    return envelopes;
  }
}
