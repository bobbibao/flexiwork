/* eslint-disable @typescript-eslint/no-explicit-any -- untyped boundary: raw SQL rows / JSON event payloads */
import { Injectable } from '@nestjs/common';
import WorkerProfile from 'src/database/models/worker-profiles.model';
import Skill from 'src/database/models/skills.model';
import User from 'src/database/models/users.model';
import { UnitOfWork } from 'src/shared/event-store/unit-of-work';
import { OutboxService } from 'src/shared/messaging/outbox.service';
import { createEnvelope } from 'src/shared/events/event-envelope';
import { userActor } from 'src/shared/events/actor';
import { IDENTITY_EVENTS, WorkerProfileSnapshot } from 'src/shared/contracts/events/identity.events';
import { CodedError, notFound } from 'src/shared/utils/coded.error';
import { UpdateWorkerProfileDto } from '../dto/worker-profile.dto';

export const workerSnapshot = (p: WorkerProfile): WorkerProfileSnapshot => ({
  user_id: p.user_id,
  full_name: p.full_name,
  skill_codes: p.skill_codes ?? [],
  home_lat: p.home_lat,
  home_lng: p.home_lng,
  radius_km: p.radius_km,
  verified: p.verified,
  suspended: p.suspended,
  reliability_score: p.reliability_score,
  rating_avg: p.rating_avg,
  dob: p.dob,
});

/** Worker profile (supporting context, flat convention). Also the directory other contexts read. */
@Injectable()
export class WorkerProfileService {
  constructor(
    private readonly uow: UnitOfWork,
    private readonly outbox: OutboxService,
  ) {}

  async getByUserId(userId: number): Promise<WorkerProfile> {
    const profile = await WorkerProfile.findOne({ where: { user_id: userId } });
    if (!profile) throw notFound('WORKER_NOT_FOUND', 'Worker profile not found');
    return profile;
  }

  async getMine(user: User) {
    const profile = await this.getByUserId(user.id);
    return { ...profile.get({ plain: true }), email: user.email };
  }

  /** Card an employer may see for a worker on their shift. */
  async publicCard(userId: number) {
    const p = await this.getByUserId(userId);
    return {
      user_id: p.user_id,
      full_name: p.full_name,
      phone_e164: p.phone_e164,
      skill_codes: p.skill_codes,
      rating_avg: p.rating_avg,
      rating_count: p.rating_count,
      reliability_score: p.reliability_score,
      completed_shifts: p.completed_shifts,
      verified: p.verified,
    };
  }

  async update(user: User, dto: UpdateWorkerProfileDto) {
    if (dto.skill_codes) {
      const known = await Skill.count({ where: { code: dto.skill_codes, active: true } });
      if (known !== new Set(dto.skill_codes).size) throw new CodedError('SKILL_UNKNOWN', 'Unknown skill code');
    }
    if ((dto.home_lat === undefined) !== (dto.home_lng === undefined)) {
      throw new CodedError('LOCATION_INCOMPLETE', 'home_lat and home_lng must be provided together');
    }
    const updated = await this.uow.run(async (t) => {
      const profile = await WorkerProfile.findOne({ where: { user_id: user.id }, transaction: t, lock: t.LOCK.UPDATE });
      if (!profile) throw notFound('WORKER_NOT_FOUND', 'Worker profile not found');
      profile.set({
        ...(dto.full_name !== undefined && { full_name: dto.full_name.trim() }),
        ...(dto.dob !== undefined && { dob: dto.dob }),
        ...(dto.skill_codes !== undefined && { skill_codes: [...new Set(dto.skill_codes)] }),
        ...(dto.home_lat !== undefined && { home_lat: dto.home_lat, home_lng: dto.home_lng }),
        ...(dto.home_address !== undefined && { home_address: dto.home_address }),
        ...(dto.radius_km !== undefined && { radius_km: dto.radius_km }),
        ...(dto.availability !== undefined && { availability: dto.availability }),
        ...(dto.bank_account !== undefined && { bank_account: { ...dto.bank_account } }),
        updated_at: new Date(),
      } as any);
      await profile.save({ transaction: t });
      await this.outbox.enqueue(
        t,
        createEnvelope({
          type: IDENTITY_EVENTS.WORKER_PROFILE_UPDATED,
          streamType: 'identity',
          streamId: `worker:${user.id}`,
          payload: workerSnapshot(profile),
          ctx: { actor: userActor(user) },
        }),
      );
      return profile;
    });
    return updated.get({ plain: true });
  }

  async skills() {
    return Skill.findAll({ where: { active: true }, order: [['sort_order', 'ASC']], attributes: ['code', 'name_vi'] });
  }
}
