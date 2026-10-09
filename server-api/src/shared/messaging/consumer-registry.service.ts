import { Inject, Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { DiscoveryService, MetadataScanner, Reflector } from '@nestjs/core';
import { Transaction } from 'sequelize';
import DlqMessage from 'src/database/models/dlq-messages.model';
import { EventEnvelope } from '../events/event-envelope';
import { ALL_TOPICS, TOPICS } from '../contracts/events/topics';
import { CONSUME_EVENTS_METADATA, ConsumeEventsOptions } from './consume-events.decorator';
import { InboxService } from './inbox.service';
import { MESSAGE_BROKER, MessageBroker } from './message-broker.port';
import { OutboxRelayService } from './outbox-relay.service';
import { runsBackground, snConfig } from '../sn-runtime';

type Handler = (env: EventEnvelope, t: Transaction) => Promise<void>;

interface Registration {
  options: ConsumeEventsOptions;
  name: string;
  handler: Handler;
}

const MAX_ATTEMPTS = 5;

/**
 * Discovers @ConsumeEvents handlers and subscribes them (Observer / Pub-Sub).
 * Each handler runs inside InboxService.process; failures retry with backoff, then go to the DLQ.
 */
@Injectable()
export class ConsumerRegistryService implements OnApplicationBootstrap {
  private readonly logger = new Logger(ConsumerRegistryService.name);
  private readonly byGroup = new Map<string, Registration[]>();

  constructor(
    private readonly discovery: DiscoveryService,
    private readonly scanner: MetadataScanner,
    private readonly reflector: Reflector,
    private readonly inbox: InboxService,
    private readonly relay: OutboxRelayService,
    @Inject(MESSAGE_BROKER) private readonly broker: MessageBroker,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    this.discover();
    if (!runsBackground()) return;
    await this.broker.connect();
    await this.broker.ensureTopics(ALL_TOPICS, snConfig().KAFKA_TOPIC_PARTITIONS);
    for (const [group, regs] of this.byGroup) {
      const topics = [...new Set(regs.flatMap((r) => r.options.topics))];
      await this.broker.subscribe(group, topics, (env, topic) => this.dispatch(group, env, topic));
      this.logger.log(`consumer group ${group} subscribed to ${topics.join(', ')}`);
    }
    this.relay.start();
  }

  groups(): string[] {
    return [...this.byGroup.keys()];
  }

  /** Re-runs one group's handlers for an envelope (DLQ replay). Bypasses the inbox duplicate check only if forced. */
  async replay(group: string, envelope: EventEnvelope, topic: string): Promise<void> {
    await this.dispatch(group, envelope, topic, true);
  }

  private discover(): void {
    if (this.byGroup.size) return;
    for (const wrapper of this.discovery.getProviders()) {
      const instance = wrapper.instance;
      if (!instance || typeof instance !== 'object') continue;
      const proto = Object.getPrototypeOf(instance);
      for (const methodName of this.scanner.getAllMethodNames(proto)) {
        const options = this.reflector.get<ConsumeEventsOptions>(CONSUME_EVENTS_METADATA, proto[methodName]);
        if (!options) continue;
        const list = this.byGroup.get(options.group) ?? [];
        list.push({ options, name: `${proto.constructor.name}.${methodName}`, handler: proto[methodName].bind(instance) });
        this.byGroup.set(options.group, list);
      }
    }
  }

  private async dispatch(group: string, env: EventEnvelope, topic: string, forceReplay = false): Promise<void> {
    const regs = (this.byGroup.get(group) ?? []).filter(
      (r) => r.options.topics.includes(topic) && (!r.options.types || r.options.types.includes(env.type)),
    );
    if (!regs.length) return;
    const baseDelay = this.broker.driver === 'memory' ? 50 : 1000;
    let lastError: unknown;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        const inboxGroup = forceReplay ? `${group}:replay:${Date.now()}` : group;
        await this.inbox.process(inboxGroup, env.event_id, async (t) => {
          for (const r of regs) await r.handler(env, t);
        });
        return;
      } catch (err) {
        lastError = err;
        this.logger.warn(`${group} attempt ${attempt}/${MAX_ATTEMPTS} failed for ${env.type} ${env.event_id}: ${err}`);
        if (attempt < MAX_ATTEMPTS) await sleep(baseDelay * 2 ** (attempt - 1));
      }
    }
    await this.deadLetter(group, env, topic, lastError);
  }

  private async deadLetter(group: string, env: EventEnvelope, topic: string, error: unknown): Promise<void> {
    const message = error instanceof Error ? `${error.message}\n${error.stack ?? ''}` : String(error);
    this.logger.error(`dead-lettered ${env.type} ${env.event_id} for ${group}`);
    try {
      await DlqMessage.create({
        event_id: env.event_id,
        original_topic: topic,
        consumer_group: group,
        error: message.slice(0, 4000),
        attempts: MAX_ATTEMPTS,
        envelope: env,
        status: 'OPEN',
        created_at: new Date(),
      });
      if (this.broker.driver === 'kafka') {
        await this.broker.publish(TOPICS.DLQ, [
          {
            key: env.stream_id,
            value: env,
            headers: { 'x-original-topic': topic, 'x-consumer-group': group, 'x-error': message.slice(0, 500), 'x-attempts': String(MAX_ATTEMPTS) },
          },
        ]);
      }
    } catch (err) {
      this.logger.error(`failed to dead-letter ${env.event_id}: ${err}`);
    }
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
