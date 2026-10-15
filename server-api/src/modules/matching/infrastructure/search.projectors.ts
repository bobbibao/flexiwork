/* eslint-disable @typescript-eslint/no-explicit-any -- untyped boundary: raw SQL rows / JSON event payloads */
import { Inject, Injectable, Logger } from '@nestjs/common';
import type { Client } from '@elastic/elasticsearch';
import WorkerProfile from 'src/database/models/worker-profiles.model';
import { ConsumeEvents } from 'src/shared/messaging/consume-events.decorator';
import { EventEnvelope } from 'src/shared/events/event-envelope';
import { TOPICS } from 'src/shared/contracts/events/topics';
import { ES_CLIENT, indexAlias } from 'src/shared/search/search.module';
import { ShiftRepository } from 'src/modules/shift/application/shift.repository';

const OPEN = ['POSTED', 'MATCHED'];

/**
 * Elasticsearch projections (docs/ARCHITECTURE.md §7.4): open shifts and worker candidates.
 * No-ops when SEARCH_DRIVER is not elasticsearch. Each doc is rebuilt from the source of truth,
 * so out-of-order or duplicate events converge to the right document.
 */
@Injectable()
export class SearchProjectors {
  private readonly logger = new Logger(SearchProjectors.name);

  constructor(
    @Inject(ES_CLIENT) private readonly es: Client | null,
    private readonly shifts: ShiftRepository,
  ) {}

  @ConsumeEvents({ group: 'sn-proj-es-shifts', topics: [TOPICS.SHIFT] })
  async onShift(env: EventEnvelope): Promise<void> {
    await this.indexShift(env.stream_id);
  }

  async indexShift(shiftId: string): Promise<void> {
    if (!this.es) return;
    const shift = await this.shifts.load(shiftId);
    if (!shift) return;
    const s = shift.state;
    const es = this.es as any;
    if (!OPEN.includes(s.status ?? '')) {
      await es.delete({ index: indexAlias('shifts'), id: shift.id }, { ignore: [404] });
      return;
    }
    await es.index({
      index: indexAlias('shifts'),
      id: shift.id,
      document: {
        shift_id: shift.id,
        job_ref: s.jobRef,
        company_id: s.companyId,
        company_name: s.companyName,
        title: s.title,
        description: s.description,
        skill_code: s.skillCode,
        location: { lat: s.lat, lon: s.lng },
        location_name: s.locationName,
        address: s.address,
        province: s.provinceCode,
        ward: s.wardCode,
        start_at: s.startAt.toISOString(),
        end_at: s.endAt.toISOString(),
        hourly_vnd: s.hourlyVnd,
        estimated_gross_vnd: s.estimatedGrossVnd,
        status: s.status,
      },
    });
  }

  @ConsumeEvents({
    group: 'sn-proj-es-workers',
    topics: [TOPICS.IDENTITY, TOPICS.RATING],
    types: ['identity.worker_registered', 'identity.worker_profile_updated', 'rating.reputation_changed'],
  })
  async onWorker(env: EventEnvelope): Promise<void> {
    const userId = env.payload.user_id ?? (env.payload.subject_type === 'worker' ? env.payload.subject_id : null);
    if (userId) await this.indexWorker(Number(userId));
  }

  /** Backfill (sn:reindex-search): documents for every worker profile; needed when ES is introduced after data exists. */
  async reindexWorkers(): Promise<number> {
    const rows = await WorkerProfile.findAll({ attributes: ['user_id'] });
    for (const row of rows) await this.indexWorker(row.user_id);
    return rows.length;
  }

  /** Backfill of open shifts; closed ones are never indexed. */
  async reindexOpenShifts(): Promise<number> {
    const [rows] = await WorkerProfile.sequelize!.query(`SELECT id FROM shift_views WHERE status IN (:open)`, { replacements: { open: OPEN } });
    for (const row of rows as { id: string }[]) await this.indexShift(row.id);
    return rows.length;
  }

  async indexWorker(userId: number): Promise<void> {
    if (!this.es) return;
    const p = await WorkerProfile.findOne({ where: { user_id: userId } });
    if (!p) return;
    const es = this.es as any;
    if (p.home_lat === null || p.home_lng === null) {
      await es.delete({ index: indexAlias('workers'), id: String(p.user_id) }, { ignore: [404] });
      return;
    }
    await es.index({
      index: indexAlias('workers'),
      id: String(p.user_id),
      document: {
        worker_id: p.user_id,
        full_name: p.full_name,
        skills: p.skill_codes,
        home: { lat: p.home_lat, lon: p.home_lng },
        radius_km: p.radius_km,
        reliability_score: p.reliability_score,
        rating_avg: p.rating_avg,
        verified: p.verified,
        suspended: p.suspended,
        dob: p.dob,
        last_active_at: p.updated_at,
      },
    });
  }
}
