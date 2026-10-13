/* eslint-disable @typescript-eslint/no-explicit-any -- untyped boundary: raw SQL rows / JSON event payloads */
import { EventSourcedRepository } from './event-sourced.repository';
import { AggregateRoot } from './aggregate-root';
import { ConcurrencyError } from './concurrency.error';
import { DomainEvent } from '../events/domain-event';
import { createEnvelope, EventEnvelope } from '../events/event-envelope';

class Counter extends AggregateRoot {
  value = 0;
  constructor(id: string) {
    super(id);
  }
  tenantId() {
    return 1;
  }
  increment(by: number) {
    this.raise('counter.incremented', { by });
  }
  protected when(e: DomainEvent) {
    if (e.type === 'counter.incremented') this.value += (e.payload as any).by;
  }
}

/** In-memory stand-ins for the event store, outbox and unit of work. */
function fakes() {
  const streams = new Map<string, EventEnvelope[]>();
  const outbox: EventEnvelope[] = [];
  const store: any = {
    async append(_t: any, streamType: any, streamId: string, expected: number, events: DomainEvent[], ctx: any) {
      const current = streams.get(streamId) ?? [];
      if (current.length !== expected) throw new ConcurrencyError(streamId, expected);
      const envs = events.map((e, i) =>
        createEnvelope({ type: e.type, streamType, streamId, streamVersion: expected + i + 1, payload: e.payload, ctx, occurredAt: e.occurredAt }),
      );
      streams.set(streamId, [...current, ...envs]);
      return envs;
    },
    async readStream(streamId: string, after = 0) {
      return (streams.get(streamId) ?? []).filter((e) => (e.stream_version ?? 0) > after);
    },
  };
  const uow: any = { run: (fn: any) => fn({}), select: async (): Promise<any[]> => [], execute: async (): Promise<any[]> => [] };
  const outboxService: any = { enqueue: async (_t: any, env: EventEnvelope) => outbox.push(env) };
  const repo = new EventSourcedRepository<Counter>(store, uow, outboxService, 'shift', (id) => new Counter(id));
  return { repo, outbox, streams };
}

const ctx = { actor: { type: 'system' as const, id: 'test' } };

describe('EventSourcedRepository', () => {
  it('saves events with versions, writes the outbox, and rebuilds state on load', async () => {
    const { repo, outbox } = fakes();
    const c = new Counter('c1');
    c.increment(2);
    c.increment(3);
    const envs = await repo.save(c, ctx);
    expect(envs.map((e) => e.stream_version)).toEqual([1, 2]);
    expect(outbox).toHaveLength(2);
    expect(c.version).toBe(2);
    expect(c.pendingEvents).toHaveLength(0);
    const loaded = await repo.load('c1');
    expect(loaded!.value).toBe(5);
    expect(loaded!.version).toBe(2);
  });

  it('returns null for an unknown stream', async () => {
    expect(await fakes().repo.load('missing')).toBeNull();
  });

  it('rejects a concurrent writer with ConcurrencyError', async () => {
    const { repo } = fakes();
    const first = new Counter('c2');
    first.increment(1);
    await repo.save(first, ctx);
    const a = (await repo.load('c2'))!;
    const b = (await repo.load('c2'))!;
    a.increment(1);
    b.increment(1);
    await repo.save(a, ctx);
    await expect(repo.save(b, ctx)).rejects.toBeInstanceOf(ConcurrencyError);
  });
});
