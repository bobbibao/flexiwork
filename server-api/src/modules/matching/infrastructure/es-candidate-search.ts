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
      return enrich(this.uow, shift, candidates);
    } catch (err) {
      this.logger.warn(`CandidateSearch fallback=postgres (${err})`);
      return this.postgres.find(shift, maxRadiusKm, limit);
    }
  }
}
