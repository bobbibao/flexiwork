/* eslint-disable @typescript-eslint/no-explicit-any -- untyped boundary: raw SQL rows / JSON event payloads */
import { randomUUID } from 'crypto';
import { Actor } from './actor';

export type StreamType = 'shift' | 'wallet' | 'identity' | 'rating' | 'exception' | 'decision';

/** Wire format for every integration event (docs/ARCHITECTURE.md §6.2). */
export interface EventEnvelope<P = any> {
  event_id: string;
  type: string;
  version: number;
  stream_type: StreamType;
  stream_id: string;
  stream_version: number | null;
  occurred_at: string;
  company_id: number | null;
  actor: Actor;
  correlation_id: string;
  causation_id: string | null;
  idempotency_key?: string;
  payload: P;
}

/** Context every command carries; copied into the envelope metadata. */
export interface CommandContext {
  actor: Actor;
  correlationId?: string;
  causationId?: string | null;
  idempotencyKey?: string;
}

export function createEnvelope<P>(input: {
  type: string;
  version?: number;
  streamType: StreamType;
  streamId: string;
  streamVersion?: number | null;
  occurredAt?: Date;
  companyId?: number | null;
  payload: P;
  ctx: CommandContext;
  eventId?: string;
}): EventEnvelope<P> {
  return {
    event_id: input.eventId ?? randomUUID(),
    type: input.type,
    version: input.version ?? 1,
    stream_type: input.streamType,
    stream_id: input.streamId,
    stream_version: input.streamVersion ?? null,
    occurred_at: (input.occurredAt ?? new Date()).toISOString(),
    company_id: input.companyId ?? null,
    actor: input.ctx.actor,
    correlation_id: input.ctx.correlationId ?? input.streamId,
    causation_id: input.ctx.causationId ?? null,
    idempotency_key: input.ctx.idempotencyKey,
    payload: input.payload,
  };
}

/** Context for a command caused by an incoming event (sagas, consumers, timers). */
export const causedBy = (env: EventEnvelope, actor: Actor): CommandContext => ({
  actor,
  correlationId: env.correlation_id,
  causationId: env.event_id,
});
