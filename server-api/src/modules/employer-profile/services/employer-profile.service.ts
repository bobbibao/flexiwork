/* eslint-disable @typescript-eslint/no-explicit-any -- untyped boundary: raw SQL rows / JSON event payloads */
import { Injectable } from '@nestjs/common';
import { randomBytes, randomUUID } from 'crypto';
import EmployerProfile from 'src/database/models/employer-profiles.model';
import WorkLocation from 'src/database/models/work-locations.model';
import Company from 'src/database/models/companies.model';
import User from 'src/database/models/users.model';
import { UnitOfWork } from 'src/shared/event-store/unit-of-work';
import { OutboxService } from 'src/shared/messaging/outbox.service';
import { createEnvelope } from 'src/shared/events/event-envelope';
import { userActor } from 'src/shared/events/actor';
import { IDENTITY_EVENTS, WorkLocationPayload } from 'src/shared/contracts/events/identity.events';
import { notFound } from 'src/shared/utils/coded.error';
import { currentQrToken } from 'src/shared/utils/qr-token';
import { snConfig } from 'src/shared/sn-runtime';
import { UpdateEmployerProfileDto, UpsertWorkLocationDto } from '../dto/employer-profile.dto';

const locationPayload = (l: WorkLocation): WorkLocationPayload => ({
  id: l.id,
  company_id: l.company_id,
  name: l.name,
  lat: l.lat,
  lng: l.lng,
  geofence_radius_m: l.geofence_radius_m,
  qr_required: l.qr_required,
});

/** Never expose the per-location QR secret. */
const publicLocation = (l: WorkLocation) => {
  const plain: any = l.get({ plain: true });
  delete plain.qr_secret;
  return plain;
};

/** Employer profile + work locations (supporting context). Also read by the Shift context. */
@Injectable()
export class EmployerProfileService {
  constructor(
    private readonly uow: UnitOfWork,
    private readonly outbox: OutboxService,
  ) {}

  async getMine(user: User) {
    const profile = await EmployerProfile.findOne({ where: { company_id: user.company_id } });
    if (!profile) throw notFound('EMPLOYER_NOT_FOUND', 'Employer profile not found');
    const company = await Company.findByPk(user.company_id, { attributes: ['id', 'name'] });
    return { ...profile.get({ plain: true }), company_name: company?.name ?? profile.legal_name };
  }

  async update(user: User, dto: UpdateEmployerProfileDto) {
    return this.uow.run(async (t) => {
      const profile = await EmployerProfile.findOne({ where: { company_id: user.company_id }, transaction: t, lock: t.LOCK.UPDATE });
      if (!profile) throw notFound('EMPLOYER_NOT_FOUND', 'Employer profile not found');
      profile.set({ ...dto, updated_at: new Date() } as any);
      await profile.save({ transaction: t });
      await this.outbox.enqueue(
        t,
        createEnvelope({
          type: IDENTITY_EVENTS.EMPLOYER_PROFILE_UPDATED,
          streamType: 'identity',
          streamId: `company:${profile.company_id}`,
          companyId: profile.company_id,
          payload: { company_id: profile.company_id, legal_name: profile.legal_name },
          ctx: { actor: userActor(user) },
        }),
      );
      return profile.get({ plain: true });
    });
  }

  async listLocations(companyId: number) {
    const rows = await WorkLocation.findAll({ where: { company_id: companyId }, order: [['created_at', 'ASC']] });
    return rows.map(publicLocation);
  }

  async createLocation(user: User, dto: UpsertWorkLocationDto) {
    return this.uow.run(async (t) => {
      const now = new Date();
      const location = await WorkLocation.create(
        {
          id: randomUUID(),
          company_id: user.company_id,
          name: dto.name.trim(),
          address: dto.address ?? null,
          province_code: dto.province_code ?? null,
          ward_code: dto.ward_code ?? null,
          lat: dto.lat,
          lng: dto.lng,
          geofence_radius_m: dto.geofence_radius_m ?? snConfig().SN_GEOFENCE_DEFAULT_M,
          qr_required: dto.qr_required ?? false,
          qr_secret: randomBytes(24).toString('hex'),
          active: dto.active ?? true,
          created_at: now,
          updated_at: now,
        },
        { transaction: t },
      );
      await this.emitLocation(t, user, location, IDENTITY_EVENTS.WORK_LOCATION_CREATED);
      return publicLocation(location);
    });
  }

  async updateLocation(user: User, id: string, dto: UpsertWorkLocationDto) {
    return this.uow.run(async (t) => {
      const location = await WorkLocation.findOne({ where: { id, company_id: user.company_id }, transaction: t, lock: t.LOCK.UPDATE });
      if (!location) throw notFound('WORK_LOCATION_NOT_FOUND', 'Work location not found');
      location.set({ ...dto, updated_at: new Date() } as any);
      await location.save({ transaction: t });
      await this.emitLocation(t, user, location, IDENTITY_EVENTS.WORK_LOCATION_UPDATED);
      return publicLocation(location);
    });
  }

  async checkInQr(user: User, id: string) {
    const location = await WorkLocation.findOne({ where: { id, company_id: user.company_id } });
    if (!location) throw notFound('WORK_LOCATION_NOT_FOUND', 'Work location not found');
    return { location_id: location.id, ...currentQrToken(snConfig().QR_TOKEN_SECRET, location.qr_secret, location.id) };
  }

  /** Used by the Shift context (WorkLocationReader adapter). Includes the QR secret: internal only. */
  async findLocationInternal(companyId: number, id: string): Promise<WorkLocation | null> {
    return WorkLocation.findOne({ where: { id, company_id: companyId } });
  }

  async findLocationById(id: string): Promise<WorkLocation | null> {
    return WorkLocation.findByPk(id);
  }

  async companyName(companyId: number): Promise<string | null> {
    const company = await Company.findByPk(companyId, { attributes: ['name'] });
    return company?.name ?? null;
  }

  async isEmployerCompany(companyId: number | null): Promise<boolean> {
    if (!companyId) return false;
    return (await EmployerProfile.count({ where: { company_id: companyId } })) > 0;
  }

  private async emitLocation(t: any, user: User, location: WorkLocation, type: string) {
    await this.outbox.enqueue(
      t,
      createEnvelope({
        type,
        streamType: 'identity',
        streamId: `company:${location.company_id}`,
        companyId: location.company_id,
        payload: locationPayload(location),
        ctx: { actor: userActor(user) },
      }),
    );
  }
}
