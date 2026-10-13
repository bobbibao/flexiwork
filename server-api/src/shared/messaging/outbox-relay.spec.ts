/* eslint-disable @typescript-eslint/no-explicit-any -- untyped boundary: raw SQL rows / JSON event payloads */
import DlqMessage from 'src/database/models/dlq-messages.model';
import { ConsumerRegistryService } from './consumer-registry.service';
import { InMemoryMessageBroker } from './in-memory.message-broker';
import { createEnvelope } from '../events/event-envelope';
import { TOPICS } from '../contracts/events/topics';

/**
 * Delivery pipeline: broker -> registry -> inbox -> handler.
 * Verifies: delivered once, duplicate skipped by the inbox, failure dead-lettered after retries.
 */
function setup(handler: (env: any) => Promise<void>) {
  const processed = new Set<string>();
  const inbox: any = {
    async process(group: string, eventId: string, fn: (t: any) => Promise<void>) {
      const key = `${group}:${eventId}`;
      if (processed.has(key)) return false;
      await fn({});
      processed.add(key); // only recorded when the handler succeeded (same transaction)
      return true;
    },
  };
  const broker = new InMemoryMessageBroker();
  class TestConsumer {
    handle(e: any) {
      return handler(e);
    }
  }
  const instance = new TestConsumer();
  const discovery: any = { getProviders: () => [{ instance }] };
  const scanner: any = { getAllMethodNames: () => ['handle'] };
  const reflector: any = { get: (_k: string, fn: any) => (fn === TestConsumer.prototype.handle ? { group: 'test-group', topics: [TOPICS.SHIFT] } : undefined) };
  const relay: any = { start: jest.fn() };
  const registry = new ConsumerRegistryService(discovery, scanner, reflector, inbox, relay, broker);
  return { broker, registry, relay };
}

const env = () =>
  createEnvelope({ type: 'shift.posted', streamType: 'shift', streamId: '00000000-0000-4000-8000-000000000001', payload: {}, ctx: { actor: { type: 'system', id: 't' } } });

describe('Outbox delivery pipeline', () => {
  const OLD = process.env.MESSAGE_BUS_DRIVER;
  beforeAll(() => (process.env.MESSAGE_BUS_DRIVER = 'memory'));
  afterAll(() => (process.env.MESSAGE_BUS_DRIVER = OLD));

  it('delivers once and skips a duplicate delivery', async () => {
    const seen: string[] = [];
    const { broker, registry, relay } = setup(async (e) => {
      seen.push(e.event_id);
    });
    await registry.onApplicationBootstrap();
    expect(relay.start).toHaveBeenCalled();
    const e = env();
    await broker.publish(TOPICS.SHIFT, [{ key: e.stream_id, value: e }]);
    await broker.publish(TOPICS.SHIFT, [{ key: e.stream_id, value: e }]);
    expect(seen).toEqual([e.event_id]);
  });

  it('retries, then dead-letters a failing handler without failing the publisher', async () => {
    const dlq = jest.spyOn(DlqMessage, 'create').mockResolvedValue({} as any);
    let attempts = 0;
    const { broker, registry } = setup(async () => {
      attempts += 1;
      throw new Error('boom');
    });
    await registry.onApplicationBootstrap();
    const e = env();
    await expect(broker.publish(TOPICS.SHIFT, [{ key: e.stream_id, value: e }])).resolves.toBeUndefined();
    expect(attempts).toBe(5);
    expect(dlq).toHaveBeenCalledWith(expect.objectContaining({ event_id: e.event_id, consumer_group: 'test-group', attempts: 5 }));
    dlq.mockRestore();
  }, 20000);
});
