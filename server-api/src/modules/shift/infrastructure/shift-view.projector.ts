import { Injectable } from '@nestjs/common';
import { Transaction } from 'sequelize';
import { UnitOfWork } from 'src/shared/event-store/unit-of-work';
import { BaseProjector } from 'src/shared/messaging/base-projector';
import { ConsumeEvents } from 'src/shared/messaging/consume-events.decorator';
import { EventEnvelope } from 'src/shared/events/event-envelope';
import { TOPICS } from 'src/shared/contracts/events/topics';
import { SHIFT_EVENTS as E } from 'src/shared/contracts/events/shift.events';

/**
 * shift_views read model (docs/ARCHITECTURE.md §7.4), eventually consistent.
 * Each update is guarded by version so a replay or duplicate never moves the view backwards.
 */
@Injectable()
export class ShiftViewProjector extends BaseProjector {
  readonly projectionName = 'shift-view';

  constructor(private readonly uow: UnitOfWork) {
    super();
  }

  @ConsumeEvents({ group: 'sn-proj-shift-view', topics: [TOPICS.SHIFT] })
  async onShiftEvent(env: EventEnvelope, t: Transaction): Promise<void> {
    await this.project(env, t);
  }

  async reset(): Promise<void> {
    await this.uow.execute(`TRUNCATE shift_views`);
  }

  protected handlers() {
    const set = (fields: (p: any, env: EventEnvelope) => Record<string, unknown>) => (env: EventEnvelope, t: Transaction | null) =>
      this.update(env, fields(env.payload, env), t);
    return {
      [E.POSTED]: (env: EventEnvelope, t: Transaction | null) => this.insert(env, t),
      [E.OFFERED]: set((p) => ({ status: 'MATCHED', offered_worker_ids: p.worker_ids, offer_expires_at: p.expires_at })),
      [E.OFFER_DECLINED]: set((p) =>
        p.remaining_offers.length ? { offered_worker_ids: p.remaining_offers } : { status: 'POSTED', offered_worker_ids: [], offer_expires_at: null },
      ),
      [E.OFFER_EXPIRED]: set(() => ({ status: 'POSTED', offered_worker_ids: [], offer_expires_at: null })),
      [E.ACCEPTED]: set((p) => ({ status: 'ACCEPTED', worker_id: p.worker_id, offered_worker_ids: [], offer_expires_at: null })),
      [E.ESCROW_FUNDED]: set(() => ({ status: 'ESCROW_FUNDED', escrow_status: 'held' })),
      [E.WORKER_WITHDREW]: set(() => ({})),
      [E.NO_SHOW_RECORDED]: set(() => ({ status: 'NO_SHOW' })),
      [E.REMATCH_REQUESTED]: set(() => ({ status: 'POSTED', worker_id: null, offered_worker_ids: [], offer_expires_at: null })),
      [E.WORKER_CHECKED_IN]: set((p) => ({ status: 'CHECKED_IN', checked_in_at: p.at })),
      [E.WORKER_CHECKED_OUT]: set((p) => ({ status: 'CHECKED_OUT', checked_out_at: p.at, worked_minutes: p.worked_minutes })),
      [E.DISPUTED]: set(() => ({ status: 'DISPUTED' })),
      [E.DISPUTE_RESOLVED]: set(() => ({})),
      [E.COMPLETED]: set((p) => ({ status: 'COMPLETED', approved_minutes: p.approved_minutes, gross_vnd: p.gross_vnd, fee_vnd: p.fee_vnd })),
      [E.PAID]: set((p) => ({ status: 'PAID', escrow_status: 'released', pit_vnd: p.pit_vnd, net_vnd: p.net_vnd, refund_vnd: p.refund_vnd })),
      [E.RATED]: set((p) => (p.rater_role === 'employer' ? { employer_rated: true } : { worker_rated: true })),
      [E.RATINGS_CLOSED]: set(() => ({ status: 'RATED' })),
      [E.CANCELLED]: set((p) => ({ status: 'CANCELLED', cancel_reason: p.reason, ...(p.escrow_held && { escrow_status: 'refunded' }) })),
      [E.EXPIRED]: set(() => ({ status: 'EXPIRED' })),
    };
  }

  private async insert(env: EventEnvelope, t: Transaction | null) {
    const p = env.payload;
    await this.uow.execute(
      `INSERT INTO shift_views (id, job_ref, company_id, company_name, work_location_id, location_name, title, description, skill_code,
         start_at, end_at, hourly_vnd, estimated_gross_vnd, platform_fee_vnd, escrow_amount_vnd, dispatch_mode, status, escrow_status,
         offered_worker_ids, lat, lng, address, province_code, ward_code, version, posted_at, updated_at)
       VALUES (:id, :job_ref, :company_id, :company_name, :work_location_id, :location_name, :title, :description, :skill_code,
         :start_at, :end_at, :hourly_vnd, :estimated_gross_vnd, :platform_fee_vnd, :escrow_amount_vnd, :dispatch_mode, 'POSTED', 'none',
         '{}', :lat, :lng, :address, :province_code, :ward_code, :version, :at, :at)
       ON CONFLICT (id) DO NOTHING`,
      {
        id: env.stream_id,
        job_ref: p.job_ref,
        company_id: p.company_id,
        company_name: p.company_name ?? null,
        work_location_id: p.work_location_id,
        location_name: p.location_name ?? null,
        title: p.title,
        description: p.description ?? null,
        skill_code: p.skill_code,
        start_at: p.start_at,
        end_at: p.end_at,
        hourly_vnd: p.hourly_vnd,
        estimated_gross_vnd: p.estimated_gross_vnd,
        platform_fee_vnd: p.platform_fee_vnd,
        escrow_amount_vnd: p.escrow_amount_vnd,
        dispatch_mode: p.dispatch_mode,
        lat: p.lat,
        lng: p.lng,
        address: p.address ?? null,
        province_code: p.province_code ?? null,
        ward_code: p.ward_code ?? null,
        version: env.stream_version,
        at: env.occurred_at,
      },
      t,
    );
  }

  private async update(env: EventEnvelope, fields: Record<string, unknown>, t: Transaction | null) {
    const sets = Object.keys(fields).map((k) => (k === 'offered_worker_ids' ? `${k} = CAST(:${k} AS INTEGER[])` : `${k} = :${k}`));
    const replacements: Record<string, unknown> = { id: env.stream_id, version: env.stream_version, at: env.occurred_at };
    for (const [k, v] of Object.entries(fields)) replacements[k] = k === 'offered_worker_ids' ? `{${(v as number[]).join(',')}}` : v;
    await this.uow.execute(
      `UPDATE shift_views SET ${[...sets, 'version = :version', 'updated_at = :at'].join(', ')} WHERE id = :id AND version < :version`,
      replacements,
      t,
    );
  }
}
