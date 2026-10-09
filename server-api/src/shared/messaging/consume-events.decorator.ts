import { SetMetadata } from '@nestjs/common';

export const CONSUME_EVENTS_METADATA = 'sn:consume-events';

export interface ConsumeEventsOptions {
  /** Kafka consumer group, e.g. 'sn-saga-shift'. */
  group: string;
  topics: string[];
  /** Only these event types reach the handler (all types if omitted). */
  types?: string[];
}

/**
 * Marks a provider method as an event consumer: `(envelope, t: Transaction) => Promise<void>`.
 * The registry wraps it with the inbox (idempotency), retries and the DLQ.
 */
export const ConsumeEvents = (options: ConsumeEventsOptions) => SetMetadata(CONSUME_EVENTS_METADATA, options);
