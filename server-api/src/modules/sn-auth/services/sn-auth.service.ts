/* eslint-disable @typescript-eslint/no-explicit-any -- untyped boundary: raw SQL rows / JSON event payloads */
import { Inject, Injectable } from '@nestjs/common';
import { Op } from 'sequelize';
import { compareSync, hashSync } from '@node-rs/bcrypt';
import User from 'src/database/models/users.model';
import Company from 'src/database/models/companies.model';
import WorkerProfile from 'src/database/models/worker-profiles.model';
import EmployerProfile from 'src/database/models/employer-profiles.model';
import { AuthService } from 'src/modules/auth/services/auth.service';
import { RoleEnum } from 'src/shared/enums';
import { UnitOfWork } from 'src/shared/event-store/unit-of-work';
import { OutboxService } from 'src/shared/messaging/outbox.service';
import { createEnvelope } from 'src/shared/events/event-envelope';
import { userActor, systemActor } from 'src/shared/events/actor';
import { IDENTITY_EVENTS } from 'src/shared/contracts/events/identity.events';
import { CodedError, conflict } from 'src/shared/utils/coded.error';
import { looksLikeEmail, toE164Vn } from 'src/shared/utils/vn-phone';
import { RegisterEmployerDto, RegisterWorkerDto, SnLoginDto } from '../dto/sn-auth.dto';
import { workerSnapshot } from 'src/modules/worker-profile/services/worker-profile.service';

const EMPLOYER_ROLES: string[] = [RoleEnum.ADMIN, RoleEnum.MANAGER];
const TERMS_VERSION = '2026-10';

export type SnRole = 'worker' | 'employer' | 'ops';

export interface SnSession {
  access_token: string;
  role: SnRole;
  user: Record<string, unknown>;
}

export const publicUser = (user: User) => {
  const u: any = user.get ? user.get({ plain: true }) : { ...user };
  delete u.password;
  delete u.metadata;
  delete u.nickname;
  delete u.deleted_at;
  delete u.timesheet_periods;
  delete u.holiday_periods;
  return u;
};

export const snRoleOf = (role: string | null | undefined): SnRole | null => {
  if (role === RoleEnum.WORKER) return 'worker';
  if (role === RoleEnum.OPS) return 'ops';
  if (role && EMPLOYER_ROLES.includes(role)) return 'employer';
  return null;
};

/** Registration and login for Shift Network users (PLAN.md P2.3). Reuses AuthService.generateToken. */
@Injectable()
export class SnAuthService {
  constructor(
    @Inject('SN_USER_REPOSITORY') private readonly userRepository: typeof User,
    private readonly authService: AuthService,
    private readonly uow: UnitOfWork,
    private readonly outbox: OutboxService,
  ) {}

  async registerWorker(dto: RegisterWorkerDto): Promise<SnSession> {
    if (!dto.accept_terms) throw new CodedError('TERMS_NOT_ACCEPTED', 'Terms must be accepted');
    const phone = toE164Vn(dto.phone);
    if (!phone) throw new CodedError('PHONE_INVALID', 'Invalid Vietnamese phone number');
    const email = dto.email?.trim().toLowerCase() || null;

    const user = await this.uow.run(async (t) => {
      if (await WorkerProfile.findOne({ where: { phone_e164: phone }, transaction: t })) {
        throw conflict('PHONE_ALREADY_REGISTERED', 'Phone number already registered');
      }
      if (email && (await this.userRepository.findOne({ where: { email, role: RoleEnum.WORKER }, transaction: t }))) {
        throw conflict('EMAIL_ALREADY_REGISTERED', 'Email already registered');
      }
      const now = new Date();
      const created = await this.userRepository.create(
        {
          company_id: null,
          email,
          password: hashSync(dto.password, 10),
          role: RoleEnum.WORKER,
          is_active: true,
          name: dto.full_name,
          phone,
          created_at: now,
          updated_at: now,
        } as any,
        { transaction: t },
      );
      const profile = await WorkerProfile.create(
        {
          user_id: created.id,
          full_name: dto.full_name.trim(),
          phone_e164: phone,
          consents: { terms_version: TERMS_VERSION, location_and_id_processing: true, accepted_at: now.toISOString() },
          created_at: now,
          updated_at: now,
        },
        { transaction: t },
      );
      await this.outbox.enqueue(
        t,
        createEnvelope({
          type: IDENTITY_EVENTS.WORKER_REGISTERED,
          streamType: 'identity',
          streamId: `worker:${created.id}`,
          payload: workerSnapshot(profile),
          ctx: { actor: userActor({ id: created.id, role: RoleEnum.WORKER }) },
        }),
      );
      return created;
    });
    return this.session(user);
  }

  async registerEmployer(dto: RegisterEmployerDto): Promise<SnSession> {
    if (!dto.accept_terms) throw new CodedError('TERMS_NOT_ACCEPTED', 'Terms must be accepted');
    const email = dto.email.trim().toLowerCase();
    const phone = toE164Vn(dto.phone);
    if (!phone) throw new CodedError('PHONE_INVALID', 'Invalid Vietnamese phone number');

    const user = await this.uow.run(async (t) => {
      const existing = await this.userRepository.findAll({ where: { email, role: { [Op.in]: EMPLOYER_ROLES } }, transaction: t });
      if (existing.length) {
        const employerCompanies = await EmployerProfile.count({ where: { company_id: existing.map((u) => u.company_id) }, transaction: t });
        if (employerCompanies) throw conflict('EMAIL_ALREADY_REGISTERED', 'Email already registered for an employer');
      }
      const now = new Date();
      const company = await Company.create(
        { name: dto.company_name.trim(), language: 'vi', currency: 'VND', created_at: now, updated_at: now } as any,
        { transaction: t },
      );
      const created = await this.userRepository.create(
        {
          company_id: company.id,
          email,
          password: hashSync(dto.password, 10),
          role: RoleEnum.ADMIN,
          is_active: true,
          name: dto.contact_name,
          phone,
          created_at: now,
          updated_at: now,
        } as any,
        { transaction: t },
      );
      await EmployerProfile.create(
        {
          company_id: company.id,
          legal_name: dto.company_name.trim(),
          tax_code: dto.tax_code ?? null,
          business_type: dto.business_type ?? null,
          phone_e164: phone,
          address: dto.address ?? null,
          province_code: dto.province_code ?? null,
          ward_code: dto.ward_code ?? null,
          created_at: now,
          updated_at: now,
        },
        { transaction: t },
      );
      await this.outbox.enqueue(
        t,
        createEnvelope({
          type: IDENTITY_EVENTS.EMPLOYER_REGISTERED,
          streamType: 'identity',
          streamId: `company:${company.id}`,
          companyId: company.id,
          payload: { company_id: company.id, user_id: created.id, legal_name: company.name },
          ctx: { actor: systemActor('sn-auth') },
        }),
      );
      return created;
    });
    return this.session(user);
  }

  async login(dto: SnLoginDto): Promise<SnSession | { error: string; companies: Array<{ id: number; name: string }> }> {
    const identifier = dto.identifier.trim();
    let candidates: User[] = [];
    if (looksLikeEmail(identifier)) {
      const users = await this.userRepository.findAll({ where: { email: identifier.toLowerCase(), deleted_at: null } });
      const employerCompanyIds = new Set(
        (await EmployerProfile.findAll({ attributes: ['company_id'], where: { company_id: users.map((u) => u.company_id).filter(Boolean) } })).map(
          (p) => p.company_id,
        ),
      );
      candidates = users.filter(
        (u) => u.role === RoleEnum.WORKER || u.role === RoleEnum.OPS || (EMPLOYER_ROLES.includes(u.role ?? '') && employerCompanyIds.has(u.company_id)),
      );
    } else {
      const phone = toE164Vn(identifier);
      const profile = phone ? await WorkerProfile.findOne({ where: { phone_e164: phone } }) : null;
      const user = profile ? await this.userRepository.findOne({ where: { id: profile.user_id, deleted_at: null } }) : null;
      candidates = user ? [user] : [];
    }

    if (dto.company_id) candidates = candidates.filter((u) => u.company_id === dto.company_id || u.company_id === null);
    const verified = candidates.filter((u) => u.password && compareSync(dto.password, u.password));
    if (!verified.length) throw new CodedError('INVALID_CREDENTIALS', 'Invalid phone/email or password', 401);
    if (verified.length > 1) {
      const companies = await Company.findAll({ where: { id: verified.map((u) => u.company_id).filter(Boolean) }, attributes: ['id', 'name'] });
      return { error: 'Multiple accounts detected, please choose a company', companies: companies.map((c) => ({ id: c.id, name: c.name })) };
    }
    const user = verified[0];
    if (!user.is_active) throw new CodedError('ACCOUNT_DISABLED', 'This account is disabled', 403);
    return this.session(user);
  }

  async me(user: User) {
    const role = snRoleOf(user.role);
    if (!role) throw new CodedError('SN_ACCOUNT_REQUIRED', 'Not a Shift Network account', 403);
    const result: Record<string, unknown> = { role, user: publicUser(user) };
    if (role === 'worker') result.worker_profile = await WorkerProfile.findOne({ where: { user_id: user.id } });
    if (role === 'employer') {
      const profile = await EmployerProfile.findOne({ where: { company_id: user.company_id } });
      if (!profile) throw new CodedError('SN_ACCOUNT_REQUIRED', 'Not a Shift Network employer', 403);
      result.employer_profile = profile;
      result.company = await Company.findByPk(user.company_id, { attributes: ['id', 'name', 'language', 'currency'] });
    }
    return result;
  }

  private session(user: User): SnSession {
    const role = snRoleOf(user.role);
    if (!role) throw new CodedError('SN_ACCOUNT_REQUIRED', 'Not a Shift Network account', 403);
    return { access_token: this.authService.generateToken(user), role, user: publicUser(user) };
  }
}
