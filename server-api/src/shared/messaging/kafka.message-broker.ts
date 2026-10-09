import { ignoreError } from '../sn-runtime';
import { Logger } from '@nestjs/common';
import { Consumer, Kafka, logLevel, Producer } from 'kafkajs';
import { BrokerHandler, BrokerMessage, MessageBroker } from './message-broker.port';

/** kafkajs adapter (docs/ARCHITECTURE.md §6.4). Ordering is per partition key. */
export class KafkaMessageBroker implements MessageBroker {
  readonly driver = 'kafka' as const;
  private readonly logger = new Logger(KafkaMessageBroker.name);
  private readonly kafka: Kafka;
  private producer: Producer | null = null;
  private readonly consumers: Consumer[] = [];

  constructor(brokers: string[], clientId: string) {
    this.kafka = new Kafka({ clientId, brokers, logLevel: logLevel.WARN });
  }

  async connect(): Promise<void> {
    if (this.producer) return;
    this.producer = this.kafka.producer({ idempotent: true, maxInFlightRequests: 1 });
    await this.producer.connect();
  }

  async ensureTopics(topics: string[], partitions: number): Promise<void> {
    const admin = this.kafka.admin();
    await admin.connect();
    try {
      const existing = new Set(await admin.listTopics());
      const missing = topics.filter((t) => !existing.has(t));
      if (missing.length) {
        await admin.createTopics({ topics: missing.map((topic) => ({ topic, numPartitions: partitions })), waitForLeaders: true });
        this.logger.log(`created topics: ${missing.join(', ')}`);
      }
    } finally {
      await admin.disconnect();
    }
  }

  async publish(topic: string, messages: BrokerMessage[]): Promise<void> {
    await this.connect();
    await this.producer!.send({
      topic,
      messages: messages.map((m) => ({ key: m.key, value: JSON.stringify(m.value), headers: m.headers })),
    });
  }

  async subscribe(group: string, topics: string[], handler: BrokerHandler): Promise<void> {
    const consumer = this.kafka.consumer({ groupId: group });
    await consumer.connect();
    for (const topic of topics) await consumer.subscribe({ topic, fromBeginning: false });
    await consumer.run({
      eachMessage: async ({ topic, message }) => {
        if (!message.value) return;
        await handler(JSON.parse(message.value.toString()), topic);
      },
    });
    this.consumers.push(consumer);
  }

  async disconnect(): Promise<void> {
    await Promise.all(this.consumers.map((c) => c.disconnect().catch(ignoreError)));
    if (this.producer) await this.producer.disconnect().catch(ignoreError);
  }
}
