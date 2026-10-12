import { Injectable } from '@nestjs/common';
import WorkerProfile from 'src/database/models/worker-profiles.model';
import { EmployerProfileService } from 'src/modules/employer-profile/services/employer-profile.service';
import { WorkerDirectory, WorkerInfo, WorkLocationInfo, WorkLocationReader } from '../application/ports/shift.ports';

/** Adapter: Employer Profile context -> WorkLocationReader port. */
@Injectable()
export class EmployerWorkLocationReader implements WorkLocationReader {
  constructor(private readonly employers: EmployerProfileService) {}

  async get(companyId: number, id: string): Promise<WorkLocationInfo | null> {
    const l = await this.employers.findLocationInternal(companyId, id);
    return l ? this.map(l, await this.employers.companyName(companyId)) : null;
  }

  async getById(id: string): Promise<WorkLocationInfo | null> {
    const l = await this.employers.findLocationById(id);
    return l ? this.map(l, await this.employers.companyName(l.company_id)) : null;
  }

  private map(l: any, companyName: string | null): WorkLocationInfo {
    return {
      id: l.id,
      companyId: l.company_id,
      companyName,
      name: l.name,
      address: l.address,
      provinceCode: l.province_code,
      wardCode: l.ward_code,
      lat: Number(l.lat),
      lng: Number(l.lng),
      geofenceRadiusM: l.geofence_radius_m,
      qrRequired: l.qr_required,
      qrSecret: l.qr_secret,
      active: l.active,
    };
  }
}

/** Adapter: Worker Profile context -> WorkerDirectory port. */
@Injectable()
export class ProfileWorkerDirectory implements WorkerDirectory {
  async get(userId: number): Promise<WorkerInfo | null> {
    return this.map(await WorkerProfile.findOne({ where: { user_id: userId } }));
  }

  async findByPhone(phoneE164: string): Promise<WorkerInfo | null> {
    return this.map(await WorkerProfile.findOne({ where: { phone_e164: phoneE164 } }));
  }

  private map(p: WorkerProfile | null): WorkerInfo | null {
    return p ? { userId: p.user_id, fullName: p.full_name, verified: p.verified, suspended: p.suspended, skillCodes: p.skill_codes ?? [] } : null;
  }
}
