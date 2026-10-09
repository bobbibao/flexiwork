import { Injectable } from '@nestjs/common';
import { Transaction } from 'sequelize';
import { UnitOfWork } from '../event-store/unit-of-work';

/** Idempotent consumer (docs/ARCHITECTURE.md §6.5): the side effect and the inbox row commit together. */
@Injectable()
export class InboxService {
  constructor(private readonly uow: UnitOfWork) {}

  /** Runs fn once per (group, eventId). Returns false if it was already processed. */
  async process(group: string, eventId: string, fn: (t: Transaction) => Promise<void>): Promise<boolean> {
    return this.uow.run(async (t) => {
      const rows = await this.uow.execute(
        `INSERT INTO processed_messages (consumer_group, event_id, processed_at) VALUES (:group, :eventId, now())
         ON CONFLICT DO NOTHING RETURNING event_id`,
        { group, eventId },
        t,
        true,
      );
      if (!rows.length) return false;
      await fn(t);
      return true;
    });
  }
}
