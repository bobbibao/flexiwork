import { Logger } from '@nestjs/common';
import { BrokerHandler, BrokerMessage, MessageBroker } from './message-broker.port';

/**
 * Single-process broker for dev/tests (MESSAGE_BUS_DRIVER=memory). Same contract as Kafka:
 * each consumer group receives every message of its topics, in publish order.
 */
export class InMemoryMessageBroker implements MessageBroker {
  readonly driver = 'memory' as const;
  private readonly logger = new Logger(InMemoryMessageBroker.name);
  private readonly groups = new Map<string, { topics: Set<string>; handler: BrokerHandler }>();

  async connect(): Promise<void> {}

  async ensureTopics(): Promise<void> {}

  async publish(topic: string, messages: BrokerMessage[]): Promise<void> {
    for (const message of messages) {
      for (const [group, sub] of this.groups) {
        if (!sub.topics.has(topic)) continue;
        try {
          await sub.handler(message.value, topic);
        } catch (err) {
          // The consumer registry already retries and dead-letters; never fail the publisher.
          this.logger.error(`group ${group} failed on ${message.value.type}: ${err}`);
        }
      }
    }
  }

  async subscribe(group: string, topics: string[], handler: BrokerHandler): Promise<void> {
    this.groups.set(group, { topics: new Set(topics), handler });
  }

  async disconnect(): Promise<void> {
    this.groups.clear();
  }
}
