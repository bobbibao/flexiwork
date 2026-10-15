/* eslint-disable @typescript-eslint/no-explicit-any -- untyped boundary: raw SQL rows / JSON event payloads */
import { Inject, Injectable, Logger } from '@nestjs/common';
import type { Client } from '@elastic/elasticsearch';
import { ES_CLIENT, indexAlias } from 'src/shared/search/search.module';
import { UnitOfWork } from 'src/shared/event-store/unit-of-work';
import { GeoPoint } from 'src/shared/domain/geo-point';
import { ShiftForMatching, WorkerCandidate } from '../domain/candidate';
import { CandidateSearch } from '../application/ports/candidate-search.port';
import { enrich, PostgresCandidateSearch } from './postgres-candidate-search';

/** Elasticsearch candidate search (workers index), falling back to Postgres on error or when disabled. */
@Injectable()
export class FallbackCandidateSearch implements CandidateSearch {
  private readonly logger = new Logger(FallbackCandidateSearch.name);

  constructor(
    @Inject(ES_CLIENT) private readonly es: Client | null,
    private readonly postgres: PostgresCandidateSearch,
    private readonly uow: UnitOfWork,
  ) {}

  async find(shift: ShiftForMatching, maxRadiusKm: number, limit: number): Promise<WorkerCandidate[]> {
    if (!this.es) return this.postgres.find(shift, maxRadiusKm, limit);
    try {
      const center = GeoPoint.of(shift.lat, shift.lng);
      const result: any = await (this.es as any).search({
        index: indexAlias('workers'),
        size: limit * 4,
        query: {
          bool: {
            filter: [
              { term: { skills: shift.skillCode } },
              { term: { suspended: false } },
              { geo_distance: { distance: `${maxRadiusKm}km`, home: { lat: shift.lat, lon: shift.lng } } },
            ],
          },
        },
      });
      const rows = result.hits.hits.map((h: any) => h._source);
      const candidates: WorkerCandidate[] = rows.map((d: any) => ({
        workerId: Number(d.worker_id),
        skills: d.skills ?? [],
        verified: !!d.verified,
        suspended: !!d.suspended,
        dob: d.dob ?? null,
        radiusKm: Number(d.radius_km ?? 10),
        distanceM: Math.round(center.distanceTo(GeoPoint.of(d.home.lat, d.home.lon))),
        reliabilityScore: Number(d.reliability_score ?? 80),
        ratingAvg: d.rating_avg ?? null,
        workedWithEmployerBefore: false,
        hasOverlappingShift: false,
      }));
      return enrich(this.uow, shift, await this.confirmWithPostgres(candidates));
    } catch (err) {
      this.logger.warn(`CandidateSearch fallback=postgres (${err})`);
      return this.postgres.find(shift, maxRadiusKm, limit);
    }
  }

  /**
   * ES is a derived model and may lag or hold stale documents (e.g. an index from another database). Eligibility
   * fields come from Postgres, the source of truth; candidates without a profile there are dropped.
   */
  private async confirmWithPostgres(candidates: WorkerCandidate[]): Promise<WorkerCandidate[]> {
    if (!candidates.length) return candidates;
    const rows = await this.uow.execute(
      `SELECT user_id, suspended, verified, reliability_score, rating_avg, skill_codes FROM worker_profiles WHERE user_id IN (:ids)`,
      { ids: candidates.map((c) => c.workerId) },
      null,
      true,
    );
    const byId = new Map(rows.map((r: any) => [Number(r.user_id), r]));
    const stale = candidates.length - byId.size;
    if (stale > 0) this.logger.warn(`${stale} worker doc(s) in ES have no profile in Postgres; run sn:reindex-search`);
    return candidates
      .filter((c) => byId.has(c.workerId))
      .map((c) => {
        const r: any = byId.get(c.workerId);
        return {
          ...c,
          suspended: !!r.suspended,
          verified: !!r.verified,
          skills: r.skill_codes ?? c.skills,
          reliabilityScore: Number(r.reliability_score ?? c.reliabilityScore),
          ratingAvg: r.rating_avg === null || r.rating_avg === undefined ? null : Number(r.rating_avg),
        };
      });
  }
}
