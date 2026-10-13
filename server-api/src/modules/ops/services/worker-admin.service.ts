/* eslint-disable @typescript-eslint/no-explicit-any -- untyped boundary: raw SQL rows / JSON event payloads */
import { Injectable } from '@nestjs/common';
import WorkerProfile from 'src/database/models/worker-profiles.model';
import User from 'src/database/models/users.model';
import { UnitOfWork } from 'src/shared/event-store/unit-of-work';
import { OutboxService } from 'src/shared/messaging/outbox.service';
import { createEnvelope } from 'src/shared/events/event-envelope';
import { userActor } from 'src/shared/events/actor';
import { IDENTITY_EVENTS } from 'src/shared/contracts/events/identity.events';
import { notFound } from 'src/shared/utils/coded.error';
import { workerSnapshot } from 'src/modules/worker-profile/services/worker-profile.service';

/** Ops actions on worker accounts (manual verification until eKYC exists; suspension). */
@Injectable()
export class WorkerAdminService {
  constructor(
    private readonly uow: UnitOfWork,
    private readonly outbox: OutboxService,
  ) {}

  async list(q: { verified?: boolean; search?: string; page?: number; page_size?: number }) {
    const size = Math.min(Math.max(q.page_size ?? 20, 1), 100);
    const page = Math.max(q.page ?? 1, 1);
    const where: string[] = ['true'];
    const r: Record<string, unknown> = { limit: size, offset: (page - 1) * size };
    if (q.verified !== undefined) {
      where.push('verified = :verified');
      r.verified = q.verified;
    }
    if (q.search) {
      where.push('(full_name ILIKE :s OR phone_e164 ILIKE :s)');
      r.s = `%${q.search}%`;
    }
    const items = await this.uow.select<any>(
      `SELECT user_id, full_name, phone_e164, skill_codes, verified, suspended, reliability_score, rating_avg, rating_count, completed_shifts, created_at
       FROM worker_profiles WHERE ${where.join(' AND ')} ORDER BY created_at DESC LIMIT :limit OFFSET :offset`,
      r,
    );
    const [{ count }] = await this.uow.select<{ count: string }>(`SELECT COUNT(*) AS count FROM worker_profiles WHERE ${where.join(' AND ')}`, r);
    return { items, total_items: Number(count), page, page_size: size, total_pages: Math.ceil(Number(count) / size) };
  }

  async setVerified(workerId: number, verified: boolean, by: User) {
    return this.update(workerId, { verified }, by);
  }

  async setSuspended(workerId: number, suspended: boolean, by: User) {
    return this.update(workerId, { suspended }, by);
  }

  private async update(workerId: number, fields: Partial<WorkerProfile>, by: User) {
    return this.uow.run(async (t) => {
      const p = await WorkerProfile.findOne({ where: { user_id: workerId }, transaction: t, lock: t.LOCK.UPDATE });
      if (!p) throw notFound('WORKER_NOT_FOUND', 'Worker not found');
      p.set({ ...fields, updated_at: new Date() } as any);
      await p.save({ transaction: t });
      await this.outbox.enqueue(
        t,
        createEnvelope({
          type: IDENTITY_EVENTS.WORKER_PROFILE_UPDATED,
          streamType: 'identity',
          streamId: `worker:${workerId}`,
          payload: workerSnapshot(p),
          ctx: { actor: userActor(by) },
        }),
      );
      return workerSnapshot(p);
    });
  }
}
