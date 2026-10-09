import { EventEnvelope } from '../events/event-envelope';

export const MESSAGE_BROKER = 'MESSAGE_BROKER';

export interface BrokerMessage {
  key: string;
  value: EventEnvelope;
  headers?: Record<string, string>;
}

export type BrokerHandler = (envelope: EventEnvelope, topic: string) => Promise<void>;

/** Port over Kafka / in-memory transport (Adapter pattern, docs/ARCHITECTURE.md §14). */
export interface MessageBroker {
  readonly driver: 'kafka' | 'memory';
  connect(): Promise<void>;
  ensureTopics(topics: string[], partitions: number): Promise<void>;
  publish(topic: string, messages: BrokerMessage[]): Promise<void>;
  subscribe(group: string, topics: string[], handler: BrokerHandler): Promise<void>;
  disconnect(): Promise<void>;
}
