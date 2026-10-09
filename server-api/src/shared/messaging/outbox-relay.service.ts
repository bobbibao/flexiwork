import { Inject, Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { UnitOfWork } from '../event-store/unit-of-work';
import { MESSAGE_BROKER, MessageBroker } from './message-broker.port';
import { snConfig } from '../sn-runtime';

const RELAY_LOCK_KEY = 727001;

/**
 * Polls outbox_messages and publishes them (docs/ARCHITECTURE.md §6.5).
 * A transaction-scoped advisory lock keeps one active relay, which preserves per-key order.
 * Kafka: publish then mark published in the same transaction (at least once).
 * Memory (dev only): mark, commit, then dispatch in-process, so consumer transactions never nest inside the relay's.
 */
@Injectable()
export class OutboxRelayService implements OnModuleDestroy {
  private readonly logger = new Logger(OutboxRelayService.name);
  private timer: NodeJS.Timeout | null = null;
  private running = false;
  private stopped = false;

  constructor(
    private readonly uow: UnitOfWork,
    @Inject(MESSAGE_BROKER) private readonly broker: MessageBroker,
  ) {}

  start(): void {
    if (this.running) return;
    this.running = true;
    this.logger.log(`outbox relay started (driver=${this.broker.driver})`);
    this.schedule(0);
  }

  onModuleDestroy(): void {
    this.stopped = true;
    if (this.timer) clearTimeout(this.timer);
  }

  private schedule(delay: number): void {
    if (this.stopped) return;
    this.timer = setTimeout(() => void this.loop(), delay);
  }

  private async loop(): Promise<void> {
    const { OUTBOX_POLL_MS, OUTBOX_BATCH_SIZE } = snConfig();
    let processed = 0;
    try {
      processed = await this.tick(OUTBOX_BATCH_SIZE);
    } catch (err) {
      this.logger.error(`relay tick failed: ${err}`);
    }
    this.schedule(processed >= OUTBOX_BATCH_SIZE ? 0 : OUTBOX_POLL_MS);
  }

  /** Publishes one batch. Returns the number of messages handled. */
  async tick(batchSize: number): Promise<number> {
    const dispatchAfterCommit: Array<{ topic: string; rows: any[] }> = [];
    const count = await this.uow.run(async (t) => {
      const [{ locked }] = await this.uow.select<{ locked: boolean }>(
        `SELECT pg_try_advisory_xact_lock(${RELAY_LOCK_KEY}) AS locked`,
        {},
        t,
        true,
      );
      if (!locked) return 0;
      const rows = await this.uow.select<any>(
        `SELECT id, topic, partition_key, headers, payload FROM outbox_messages
         WHERE published_at IS NULL ORDER BY id LIMIT :limit FOR UPDATE SKIP LOCKED`,
        { limit: batchSize },
        t,
        true,
      );
      if (!rows.length) return 0;
      const byTopic = groupConsecutiveByTopic(rows);
      if (this.broker.driver === 'kafka') {
        for (const g of byTopic) await this.broker.publish(g.topic, g.rows.map(toMessage));
      } else {
        dispatchAfterCommit.push(...byTopic);
      }
      await this.uow.execute(
        `UPDATE outbox_messages SET published_at = now(), attempts = attempts + 1 WHERE id IN (:ids)`,
        { ids: rows.map((r) => r.id) },
        t,
        true,
      );
      return rows.length;
    });
    for (const g of dispatchAfterCommit) await this.broker.publish(g.topic, g.rows.map(toMessage));
    return count;
  }

  /** Lag metric: age in seconds of the oldest unpublished message. */
  async lagSeconds(): Promise<number> {
    const [row] = await this.uow.select<{ age: string | null }>(
      `SELECT EXTRACT(EPOCH FROM (now() - MIN(created_at))) AS age FROM outbox_messages WHERE published_at IS NULL`,
      {},
      null,
      true,
    );
    return row?.age ? Number(row.age) : 0;
  }
}

function toMessage(row: any) {
  return { key: row.partition_key, value: row.payload, headers: row.headers };
}

function groupConsecutiveByTopic(rows: any[]): Array<{ topic: string; rows: any[] }> {
  const groups: Array<{ topic: string; rows: any[] }> = [];
  for (const row of rows) {
    const last = groups[groups.length - 1];
    if (last && last.topic === row.topic) last.rows.push(row);
    else groups.push({ topic: row.topic, rows: [row] });
  }
  return groups;
}
