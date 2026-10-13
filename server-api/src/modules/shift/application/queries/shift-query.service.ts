/* eslint-disable @typescript-eslint/no-explicit-any -- untyped boundary: raw SQL rows / JSON event payloads */
import { Inject, Injectable } from '@nestjs/common';
import ShiftView from 'src/database/models/shift-views.model';
import { UnitOfWork } from 'src/shared/event-store/unit-of-work';
import { EventStoreService } from 'src/shared/event-store/event-store.service';
import { notFound } from 'src/shared/utils/coded.error';
import { GeoPoint } from 'src/shared/domain/geo-point';
import { ShiftRepository } from '../shift.repository';
import { availableCommands } from '../../domain/shift-state-machine';
import { ShiftStatus } from '../../domain/shift-status.enum';
import { EMPLOYER_STATUS_GROUPS, WORKER_SCOPES } from '../../constants/shift-status-groups.constant';
import { ShiftAccess } from '../commands/shift.commands';
import { WORK_LOCATION_READER, WorkLocationReader } from '../ports/shift.ports';

export interface Page<T> {
  items: T[];
  total_items: number;
  page: number;
  page_size: number;
  total_pages: number;
}

const toPage = <T>(items: T[], total: number, page: number, size: number): Page<T> => ({
  items,
  total_items: total,
  page,
  page_size: size,
  total_pages: Math.ceil(total / size),
});

/** Read side: queries hit projections only, except the timeline which reads the stream on purpose (§7.4). */
@Injectable()
export class ShiftQueryService {
  constructor(
    private readonly uow: UnitOfWork,
    private readonly store: EventStoreService,
    private readonly repo: ShiftRepository,
    @Inject(WORK_LOCATION_READER) private readonly locations: WorkLocationReader,
  ) {}

  async listEmployer(companyId: number, q: { group?: string; from?: string; to?: string; page?: number; page_size?: number }): Promise<Page<ShiftView>> {
    const page = Math.max(1, q.page ?? 1);
    const size = Math.min(Math.max(1, q.page_size ?? 20), 100);
    const where: string[] = ['company_id = :companyId'];
    const r: Record<string, unknown> = { companyId, limit: size, offset: (page - 1) * size };
    if (q.group && EMPLOYER_STATUS_GROUPS[q.group]) {
      where.push('status IN (:statuses)');
      r.statuses = EMPLOYER_STATUS_GROUPS[q.group];
    }
    if (q.from) {
      where.push('start_at >= :from');
      r.from = q.from;
    }
    if (q.to) {
      where.push('start_at < :to');
      r.to = q.to;
    }
    const sql = `FROM shift_views WHERE ${where.join(' AND ')}`;
    const order = q.group === 'paid' || q.group === 'cancelled' ? 'start_at DESC' : 'start_at ASC';
    const items = await this.uow.select<any>(`SELECT * ${sql} ORDER BY ${order} LIMIT :limit OFFSET :offset`, r);
    const [{ count }] = await this.uow.select<{ count: string }>(`SELECT COUNT(*) AS count ${sql}`, r);
    return toPage(items.map(normalize), Number(count), page, size);
  }

  async counts(companyId: number): Promise<Record<string, number>> {
    const rows = await this.uow.select<{ status: string; n: string }>(`SELECT status, COUNT(*) AS n FROM shift_views WHERE company_id = :companyId GROUP BY status`, { companyId });
    const out: Record<string, number> = {};
    for (const [group, statuses] of Object.entries(EMPLOYER_STATUS_GROUPS)) {
      out[group] = rows.filter((r) => statuses.includes(r.status as ShiftStatus)).reduce((s, r) => s + Number(r.n), 0);
    }
    return out;
  }

  async listWorker(workerId: number, scope = 'upcoming', page = 1, pageSize = 20): Promise<Page<any>> {
    const statuses = WORKER_SCOPES[scope] ?? WORKER_SCOPES.upcoming;
    const size = Math.min(Math.max(1, pageSize), 100);
    const r = { workerId, statuses, limit: size, offset: (Math.max(1, page) - 1) * size };
    const order = scope === 'history' ? 'start_at DESC' : 'start_at ASC';
    const items = await this.uow.select<any>(
      `SELECT * FROM shift_views WHERE worker_id = :workerId AND status IN (:statuses) ORDER BY ${order} LIMIT :limit OFFSET :offset`,
      r,
    );
    const [{ count }] = await this.uow.select<{ count: string }>(`SELECT COUNT(*) AS count FROM shift_views WHERE worker_id = :workerId AND status IN (:statuses)`, r);
    return toPage(items.map(normalize), Number(count), page, size);
  }

  async listOffers(workerId: number) {
    const rows = await this.uow.select<any>(
      `SELECT * FROM shift_views WHERE status = 'MATCHED' AND :workerId = ANY(offered_worker_ids) AND offer_expires_at > now() ORDER BY start_at`,
      { workerId },
    );
    return rows.map(normalize);
  }

  /** Detail for an authorised viewer: the read model plus location and the caller's available commands. */
  async getForViewer(id: string, access: ShiftAccess) {
    const shift = await this.repo.load(id);
    if (!shift || !this.canView(shift.state, access)) throw notFound('SHIFT_NOT_FOUND', 'Shift not found');
    const view = shift.toView();
    const location = await this.locations.getById(shift.state.workLocationId);
    return {
      ...view,
      location: location && { id: location.id, name: location.name, address: location.address, lat: location.lat, lng: location.lng, geofence_radius_m: location.geofenceRadiusM, qr_required: location.qrRequired },
      available_commands: shift.status ? availableCommands(shift.status, access.kind).filter((c) => this.commandVisible(c, shift.state, access)) : [],
    };
  }

  async availableTransitions(id: string, access: ShiftAccess) {
    const detail = await this.getForViewer(id, access);
    return { shift_id: id, status: detail.status, version: detail.version, available_commands: detail.available_commands };
  }

  async timeline(id: string, access: ShiftAccess) {
    const shift = await this.repo.load(id);
    if (!shift || !this.canView(shift.state, access)) throw notFound('SHIFT_NOT_FOUND', 'Shift not found');
    const events = await this.store.readStream(id);
    return events.map((e) => ({
      version: e.stream_version,
      type: e.type,
      occurred_at: e.occurred_at,
      actor: { type: e.actor?.type, role: e.actor?.role, id: access.kind === 'worker' && e.actor?.type === 'user' && e.actor?.role !== 'worker' ? undefined : e.actor?.id },
      payload: access.kind === 'worker' ? redactForWorker(e.payload) : e.payload,
    }));
  }

  /** Postgres fallback for nearby search (also used when Elasticsearch is disabled or down). */
  async nearbyFromPostgres(q: { lat: number; lng: number; radiusKm: number; skill?: string; from?: string; to?: string; text?: string; limit: number }) {
    const center = GeoPoint.of(q.lat, q.lng);
    const box = center.boundingBox(q.radiusKm * 1000);
    const where = [`status IN ('POSTED', 'MATCHED')`, 'start_at > now()', 'lat BETWEEN :minLat AND :maxLat', 'lng BETWEEN :minLng AND :maxLng'];
    const r: Record<string, unknown> = { ...box, limit: q.limit * 3 };
    if (q.skill) {
      where.push('skill_code = :skill');
      r.skill = q.skill;
    }
    if (q.from) {
      where.push('start_at >= :from');
      r.from = q.from;
    }
    if (q.to) {
      where.push('start_at < :to');
      r.to = q.to;
    }
    if (q.text) {
      where.push(`(title ILIKE :text OR company_name ILIKE :text OR location_name ILIKE :text)`);
      r.text = `%${q.text}%`;
    }
    const rows = await this.uow.select<any>(`SELECT * FROM shift_views WHERE ${where.join(' AND ')} ORDER BY start_at LIMIT :limit`, r);
    return rows
      .map(normalize)
      .map((s: any) => ({ ...s, distance_m: Math.round(center.distanceTo(GeoPoint.of(s.lat, s.lng))) }))
      .filter((s: any) => s.distance_m <= q.radiusKm * 1000)
      .sort((a: any, b: any) => a.distance_m - b.distance_m || new Date(a.start_at).getTime() - new Date(b.start_at).getTime())
      .slice(0, q.limit);
  }

  async getView(id: string): Promise<any | null> {
    const row = await ShiftView.findByPk(id);
    return row ? normalize(row.get({ plain: true })) : null;
  }

  private canView(s: { companyId: number; workerId: number | null; offeredWorkerIds: number[]; status: ShiftStatus | null }, access: ShiftAccess): boolean {
    if (access.kind === 'ops' || access.kind === 'system') return true;
    if (access.kind === 'employer') return s.companyId === access.companyId;
    // workers: assigned, offered, or any open shift (public listing)
    return s.workerId === access.userId || s.offeredWorkerIds.includes(access.userId!) || s.status === ShiftStatus.POSTED;
  }

  /** Hide commands the caller cannot actually use (e.g. AcceptShift when not offered). */
  private commandVisible(command: string, s: any, access: ShiftAccess): boolean {
    if (access.kind !== 'worker') return true;
    if (command === 'AcceptShift' || command === 'DeclineOffer') return s.offeredWorkerIds.includes(access.userId);
    return s.workerId === access.userId;
  }
}

const NUMERIC_FIELDS = ['hourly_vnd', 'estimated_gross_vnd', 'platform_fee_vnd', 'escrow_amount_vnd', 'gross_vnd', 'fee_vnd', 'pit_vnd', 'net_vnd', 'refund_vnd', 'lat', 'lng'];

function normalize(row: any) {
  const out = { ...row };
  for (const f of NUMERIC_FIELDS) if (out[f] !== null && out[f] !== undefined) out[f] = Number(out[f]);
  return out;
}

/** Workers do not see the employer's internal dispute notes or other workers' ids. */
function redactForWorker(payload: any) {
  if (!payload || typeof payload !== 'object') return payload;
  const rest = { ...payload };
  delete rest.ranking_snapshot;
  delete rest.worker_ids;
  delete rest.remaining_offers;
  return rest;
}
