import { Injectable } from '@nestjs/common';
import { Transaction } from 'sequelize';
import { EventSourcedRepository } from 'src/shared/event-store/event-sourced.repository';
import { EventStoreService } from 'src/shared/event-store/event-store.service';
import { UnitOfWork } from 'src/shared/event-store/unit-of-work';
import { OutboxService } from 'src/shared/messaging/outbox.service';
import { CommandContext, EventEnvelope } from 'src/shared/events/event-envelope';
import { SHIFT_EVENTS } from 'src/shared/contracts/events/shift.events';
import { conflict } from 'src/shared/utils/coded.error';
import { Shift } from '../domain/shift.aggregate';

const RELEASE_RESERVATION = new Set<string>([
  SHIFT_EVENTS.WORKER_WITHDREW,
  SHIFT_EVENTS.NO_SHOW_RECORDED,
  SHIFT_EVENTS.CANCELLED,
  SHIFT_EVENTS.EXPIRED,
]);

/**
 * Event-sourced Shift repository. Every save also maintains worker_shift_reservations in the same
 * transaction (inline projection, docs/ARCHITECTURE.md §9.6): the EXCLUDE constraint makes double booking impossible.
 */
@Injectable()
export class ShiftRepository {
  private readonly inner: EventSourcedRepository<Shift>;

  constructor(
    store: EventStoreService,
    private readonly uow: UnitOfWork,
    outbox: OutboxService,
  ) {
    this.inner = new EventSourcedRepository<Shift>(store, uow, outbox, 'shift', (id) => new Shift(id));
  }

  load(id: string, t?: Transaction | null): Promise<Shift | null> {
    return this.inner.load(id, t);
  }

  async save(shift: Shift, ctx: CommandContext): Promise<EventEnvelope[]> {
    return this.inner.save(shift, ctx, { extraWrites: (t, envs) => this.reservations(t, shift, envs) });
  }

  private async reservations(t: Transaction, shift: Shift, envs: EventEnvelope[]): Promise<void> {
    for (const env of envs) {
      if (env.type === SHIFT_EVENTS.ACCEPTED) {
        try {
          await this.uow.execute(
            `INSERT INTO worker_shift_reservations (shift_id, worker_id, during, active)
             VALUES (:shiftId, :workerId, tstzrange(:start, :end, '[)'), true)
             ON CONFLICT (shift_id) DO UPDATE SET worker_id = EXCLUDED.worker_id, during = EXCLUDED.during, active = true`,
            { shiftId: shift.id, workerId: env.payload.worker_id, start: shift.state.startAt.toISOString(), end: shift.state.endAt.toISOString() },
            t,
          );
        } catch (err: any) {
          if (err?.original?.code === '23P01' || err?.parent?.code === '23P01') {
            throw conflict('WORKER_DOUBLE_BOOKED', 'You already have a shift overlapping this time');
          }
          throw err;
        }
      } else if (RELEASE_RESERVATION.has(env.type)) {
        await this.uow.execute(`UPDATE worker_shift_reservations SET active = false WHERE shift_id = :shiftId`, { shiftId: shift.id }, t);
      }
    }
  }
}
