import { Injectable } from '@nestjs/common';
import { UnitOfWork } from 'src/shared/event-store/unit-of-work';
import { GeoPoint } from 'src/shared/domain/geo-point';
import { ShiftForMatching, WorkerCandidate } from '../domain/candidate';
import { CandidateSearch } from '../application/ports/candidate-search.port';

/** Bounding-box query on worker_profiles + exact haversine; also computes overlap and employer history. */
@Injectable()
export class PostgresCandidateSearch implements CandidateSearch {
  constructor(private readonly uow: UnitOfWork) {}

  async find(shift: ShiftForMatching, maxRadiusKm: number, limit: number): Promise<WorkerCandidate[]> {
    const center = GeoPoint.of(shift.lat, shift.lng);
    const box = center.boundingBox(maxRadiusKm * 1000);
    const rows = await this.uow.select<any>(
      `SELECT w.user_id, w.skill_codes, w.verified, w.suspended, w.dob, w.radius_km, w.reliability_score, w.rating_avg, w.home_lat, w.home_lng
       FROM worker_profiles w
       WHERE w.home_lat BETWEEN :minLat AND :maxLat AND w.home_lng BETWEEN :minLng AND :maxLng
         AND :skill = ANY(w.skill_codes) AND w.suspended = false
       LIMIT :limit`,
      { ...box, skill: shift.skillCode, limit: limit * 4 },
    );
    return enrich(this.uow, shift, rows.map((r) => fromRow(r, center)));
  }
}

export function fromRow(r: any, center: GeoPoint): WorkerCandidate {
  return {
    workerId: Number(r.user_id),
    skills: r.skill_codes ?? [],
    verified: !!r.verified,
    suspended: !!r.suspended,
    dob: r.dob ? String(r.dob).slice(0, 10) : null,
    radiusKm: Number(r.radius_km),
    distanceM: Math.round(center.distanceTo(GeoPoint.of(Number(r.home_lat), Number(r.home_lng)))),
    reliabilityScore: Number(r.reliability_score),
    ratingAvg: r.rating_avg === null || r.rating_avg === undefined ? null : Number(r.rating_avg),
    workedWithEmployerBefore: false,
    hasOverlappingShift: false,
  };
}

/** Adds the two facts that live in other tables: overlapping reservations and past work with this employer. */
export async function enrich(uow: UnitOfWork, shift: ShiftForMatching, candidates: WorkerCandidate[]): Promise<WorkerCandidate[]> {
  if (!candidates.length) return candidates;
  const ids = candidates.map((c) => c.workerId);
  const overlapping = await uow.select<{ worker_id: number }>(
    `SELECT DISTINCT worker_id FROM worker_shift_reservations
     WHERE active AND worker_id IN (:ids) AND during && tstzrange(:start, :end, '[)') AND shift_id <> :shiftId`,
    { ids, start: shift.startAt.toISOString(), end: shift.endAt.toISOString(), shiftId: shift.shiftId },
  );
  const worked = await uow.select<{ worker_id: number }>(
    `SELECT DISTINCT worker_id FROM shift_views WHERE company_id = :companyId AND worker_id IN (:ids) AND status IN ('PAID', 'RATED')`,
    { ids, companyId: shift.companyId },
  );
  const o = new Set(overlapping.map((r) => Number(r.worker_id)));
  const h = new Set(worked.map((r) => Number(r.worker_id)));
  return candidates.map((c) => ({ ...c, hasOverlappingShift: o.has(c.workerId), workedWithEmployerBefore: h.has(c.workerId) }));
}
