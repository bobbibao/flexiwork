import { Injectable } from '@nestjs/common';
import { Transaction } from 'sequelize';
import OutboxMessage from 'src/database/models/outbox-messages.model';
import { EventEnvelope } from '../events/event-envelope';
import { topicForStream } from '../contracts/events/topics';

/** Writes integration events in the caller's transaction (Transactional Outbox, docs/ARCHITECTURE.md §6.5). */
@Injectable()
export class OutboxService {
  async enqueue(t: Transaction, envelope: EventEnvelope): Promise<void> {
    const key = String(envelope.payload?.shift_id ?? envelope.stream_id);
    await OutboxMessage.create(
      {
        event_id: envelope.event_id,
        topic: topicForStream(envelope.stream_type),
        partition_key: key,
        headers: { type: envelope.type, correlation_id: envelope.correlation_id },
        payload: envelope,
        created_at: new Date(),
      },
      { transaction: t },
    );
  }
}
