/* eslint-disable @typescript-eslint/no-explicit-any -- untyped boundary: raw SQL rows / JSON event payloads */
import { Inject, Injectable, Logger } from '@nestjs/common';
import type { Client } from '@elastic/elasticsearch';
import { ES_CLIENT, indexAlias } from 'src/shared/search/search.module';
import { UnitOfWork } from 'src/shared/event-store/unit-of-work';
import { ShiftQueryService } from '../application/queries/shift-query.service';

export interface NearbyQuery {
  lat: number;
  lng: number;
  radiusKm: number;
  skill?: string;
  from?: string;
  to?: string;
  text?: string;
  limit: number;
}

/**
 * Worker "Ca gần bạn" search (docs/ARCHITECTURE.md §9.5): Elasticsearch geo_distance + Vietnamese folding,
 * falling back to a Postgres bounding-box query when ES is disabled or unavailable.
 */
@Injectable()
export class ShiftSearchService {
  private readonly logger = new Logger(ShiftSearchService.name);

  constructor(
    @Inject(ES_CLIENT) private readonly es: Client | null,
    private readonly queries: ShiftQueryService,
    private readonly uow: UnitOfWork,
  ) {}

  async nearby(q: NearbyQuery) {
    if (this.es) {
      try {
        return await this.fromElasticsearch(q);
      } catch (err) {
        this.logger.warn(`ShiftSearch fallback=postgres (${err})`);
      }
    }
    return this.queries.nearbyFromPostgres(q);
  }

  private async fromElasticsearch(q: NearbyQuery) {
    const filter: any[] = [
      { terms: { status: ['POSTED', 'MATCHED'] } },
      { range: { start_at: { gt: 'now', ...(q.from && { gte: q.from }), ...(q.to && { lt: q.to }) } } },
      { geo_distance: { distance: `${q.radiusKm}km`, location: { lat: q.lat, lon: q.lng } } },
    ];
    if (q.skill) filter.push({ term: { skill_code: q.skill } });
    const must = q.text ? [{ multi_match: { query: q.text, fields: ['title^2', 'company_name', 'location_name', 'address', 'description'] } }] : [];
    const result: any = await (this.es as any).search({
      index: indexAlias('shifts'),
      size: q.limit,
      query: { bool: { filter, must } },
      sort: [{ _geo_distance: { location: { lat: q.lat, lon: q.lng }, order: 'asc', unit: 'm' } } as any, { start_at: 'asc' }],
    });
    const hits = result.hits.hits.map((h: any) => ({ ...this.fromDoc(h._source), distance_m: Math.round(h.sort?.[0] ?? 0) }));
    return this.confirmOpen(hits);
  }

  /** ES may lag or hold stale docs; only shifts that are still open in shift_views (the read model of record) are returned. */
  private async confirmOpen<T extends { id: string }>(hits: T[]): Promise<T[]> {
    if (!hits.length) return hits;
    const rows = await this.uow.execute(
      `SELECT id FROM shift_views WHERE id IN (:ids) AND status IN ('POSTED', 'MATCHED')`,
      { ids: hits.map((h) => h.id) },
      null,
      true,
    );
    const open = new Set(rows.map((r: any) => r.id));
    if (open.size < hits.length) this.logger.warn(`${hits.length - open.size} stale shift doc(s) in ES skipped`);
    return hits.filter((h) => open.has(h.id));
  }

  private fromDoc(d: any) {
    return {
      id: d.shift_id,
      job_ref: d.job_ref,
      company_id: d.company_id,
      company_name: d.company_name,
      title: d.title,
      description: d.description,
      skill_code: d.skill_code,
      location_name: d.location_name,
      address: d.address,
      lat: d.location?.lat,
      lng: d.location?.lon,
      start_at: d.start_at,
      end_at: d.end_at,
      hourly_vnd: d.hourly_vnd,
      estimated_gross_vnd: d.estimated_gross_vnd,
      status: d.status,
      employer_rating: d.employer_rating ?? null,
    };
  }
}
