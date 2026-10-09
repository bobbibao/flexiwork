import { StreamType } from '../../events/event-envelope';

/** Kafka topics (docs/ARCHITECTURE.md §6.4). */
export const TOPICS = {
  SHIFT: 'sn.shift.events.v1',
  WALLET: 'sn.wallet.events.v1',
  IDENTITY: 'sn.identity.events.v1',
  RATING: 'sn.rating.events.v1',
  EXCEPTION: 'sn.exception.events.v1',
  DECISION: 'sn.decision.events.v1',
  DLQ: 'sn.dlq.v1',
} as const;

export const ALL_TOPICS = Object.values(TOPICS);

export const topicForStream = (stream: StreamType): string =>
  ({
    shift: TOPICS.SHIFT,
    wallet: TOPICS.WALLET,
    identity: TOPICS.IDENTITY,
    rating: TOPICS.RATING,
    exception: TOPICS.EXCEPTION,
    decision: TOPICS.DECISION,
  })[stream];
