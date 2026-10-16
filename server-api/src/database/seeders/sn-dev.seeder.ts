/**
 * Shift Network development seed (PLAN.md P2.5). Idempotent (upserts by email / phone).
 * Run: yarn seed:sn-dev   (refuses to run unless NODE_ENV=development)
 *
 * Creates: 1 ops user, 2 employers with work locations, 20 verified workers near them,
 * and one legacy Flexiwork company + admin for the legacy smoke test (PLAN.md P9.0).
 */
import { Client } from 'pg';
import { hashSync } from '@node-rs/bcrypt';
import { randomBytes, randomUUID } from 'crypto';

const PASSWORD = 'MatKhau@123';

interface WorkerSeed {
  name: string;
  phone: string;
  lat: number;
  lng: number;
  skills: string[];
  dob: string;
}

const HCMC = { lat: 10.7769, lng: 106.7009 };
const HANOI = { lat: 21.0285, lng: 105.8542 };

const HO = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng'];
const DEM = ['Văn', 'Thị', 'Minh', 'Thu', 'Quốc', 'Ngọc', 'Hữu', 'Thanh'];
const TEN = ['An', 'Bình', 'Châu', 'Dũng', 'Giang', 'Hà', 'Khánh', 'Linh', 'Minh', 'Nam', 'Oanh', 'Phúc', 'Quân', 'Sơn', 'Trang', 'Uyên', 'Việt', 'Xuân', 'Yến', 'Tâm'];
const HCMC_SKILLS = [['phuc_vu', 'pha_che'], ['phuc_vu'], ['phu_bep', 'rua_bat'], ['thu_ngan', 'ban_hang'], ['phuc_vu', 'su_kien'], ['tap_vu']];
const HANOI_SKILLS = [['boc_xep', 'kho_van'], ['kho_van'], ['giao_hang', 'boc_xep'], ['bao_ve']];

function workers(): WorkerSeed[] {
  const list: WorkerSeed[] = [];
  for (let i = 0; i < 20; i++) {
    const inHcmc = i < 12;
    const c = inHcmc ? HCMC : HANOI;
    // deterministic spread within ~6 km
    const angle = (i * 137.5 * Math.PI) / 180;
    const km = 0.3 + (i % 6);
    list.push({
      name: `${HO[i % HO.length]} ${DEM[i % DEM.length]} ${TEN[i]}`,
      phone: `+8490${String(1000000 + i + 1).slice(-7)}`,
      lat: +(c.lat + (km / 111) * Math.sin(angle)).toFixed(6),
      lng: +(c.lng + (km / 111) * Math.cos(angle)).toFixed(6),
      skills: inHcmc ? HCMC_SKILLS[i % HCMC_SKILLS.length] : HANOI_SKILLS[i % HANOI_SKILLS.length],
      dob: `${1995 + (i % 10)}-0${1 + (i % 9)}-15`,
    });
  }
  return list;
}

async function upsertUser(db: Client, u: { email: string | null; phone?: string; name: string; role: string; companyId: number | null }): Promise<number> {
  const existing = u.email
    ? await db.query(`SELECT id FROM users WHERE email = $1 AND role = $2 AND deleted_at IS NULL LIMIT 1`, [u.email, u.role])
    : await db.query(`SELECT u.id FROM users u JOIN worker_profiles w ON w.user_id = u.id WHERE w.phone_e164 = $1`, [u.phone]);
  if (existing.rows.length) return existing.rows[0].id;
  const r = await db.query(
    `INSERT INTO users (company_id, email, password, role, is_active, name, phone, max_work_hours_per_week, max_work_hours_per_day, created_at, updated_at)
     VALUES ($1, $2, $3, $4, true, $5, $6, 42.5, 8.5, now(), now()) RETURNING id`,
    [u.companyId, u.email, hashSync(PASSWORD, 10), u.role, u.name, u.phone ?? null],
  );
  return r.rows[0].id;
}

async function upsertCompany(db: Client, name: string, language: string, currency: string): Promise<number> {
  const existing = await db.query(`SELECT id FROM companies WHERE name = $1 LIMIT 1`, [name]);
  if (existing.rows.length) return existing.rows[0].id;
  const r = await db.query(`INSERT INTO companies (name, language, currency, created_at, updated_at) VALUES ($1, $2, $3, now(), now()) RETURNING id`, [name, language, currency]);
  return r.rows[0].id;
}

async function outbox(db: Client, type: string, streamId: string, companyId: number | null, payload: Record<string, unknown>) {
  const env = {
    event_id: randomUUID(),
    type,
    version: 1,
    stream_type: 'identity',
    stream_id: streamId,
    stream_version: null as number | null,
    occurred_at: new Date().toISOString(),
    company_id: companyId,
    actor: { type: 'system', id: 'sn-dev-seeder' },
    correlation_id: streamId,
    causation_id: null as string | null,
    payload,
  };
  await db.query(`INSERT INTO outbox_messages (event_id, topic, partition_key, headers, payload) VALUES ($1, 'sn.identity.events.v1', $2, $3, $4)`, [
    env.event_id,
    streamId,
    JSON.stringify({ type, correlation_id: streamId }),
    JSON.stringify(env),
  ]);
}

async function main() {
  if ((process.env.NODE_ENV || 'development') !== 'development') throw new Error('sn-dev seeder only runs with NODE_ENV=development');
  const db = new Client({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
  await db.connect();
  try {
    await db.query('BEGIN');

    // Ops
    await upsertUser(db, { email: 'ops@flexiwork.local', name: 'Vận hành Flexiwork', role: 'ops', companyId: null });

    // Employers + locations
    const employers = [
      { company: 'Nhà hàng Phố Cổ', email: 'employer1@flexiwork.local', contact: 'Trần Thị Bình', phone: '+842838123456', loc: { id: '11111111-1111-4111-8111-111111111111', name: 'Nhà hàng Phố Cổ - Quận 1', address: '12 Lý Tự Trọng, Phường Sài Gòn, TP. Hồ Chí Minh', province: '79', ...HCMC } },
      { company: 'Kho Vận Hà Nội', email: 'employer2@flexiwork.local', contact: 'Lê Văn Cường', phone: '+842439123456', loc: { id: '22222222-2222-4222-8222-222222222222', name: 'Kho Long Biên', address: 'Phường Long Biên, Hà Nội', province: '01', ...HANOI } },
    ];
    for (const e of employers) {
      const companyId = await upsertCompany(db, e.company, 'vi', 'VND');
      const userId = await upsertUser(db, { email: e.email, name: e.contact, role: 'admin', companyId });
      await db.query(
        `INSERT INTO employer_profiles (company_id, legal_name, phone_e164, address, province_code, lat, lng, verified)
         VALUES ($1, $2, $3, $4, $5, $6, $7, true) ON CONFLICT (company_id) DO NOTHING`,
        [companyId, e.company, e.phone, e.loc.address, e.loc.province, e.loc.lat, e.loc.lng],
      );
      await db.query(
        `INSERT INTO work_locations (id, company_id, name, address, province_code, lat, lng, geofence_radius_m, qr_required, qr_secret)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 150, false, $8) ON CONFLICT (id) DO NOTHING`,
        [e.loc.id, companyId, e.loc.name, e.loc.address, e.loc.province, e.loc.lat, e.loc.lng, randomBytes(24).toString('hex')],
      );
      console.log(`employer  ${e.email.padEnd(28)} company=${companyId} user=${userId} location=${e.loc.id}`);
    }

    // Workers
    for (const w of workers()) {
      const userId = await upsertUser(db, { email: null, phone: w.phone, name: w.name, role: 'worker', companyId: null });
      const r = await db.query(
        `INSERT INTO worker_profiles (user_id, full_name, phone_e164, dob, skill_codes, home_lat, home_lng, radius_km, verified, consents, bank_account)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 10, true, $8, $9) ON CONFLICT (user_id) DO NOTHING RETURNING user_id`,
        [
          userId,
          w.name,
          w.phone,
          w.dob,
          w.skills,
          w.lat,
          w.lng,
          JSON.stringify({ terms_version: '2026-10', location_and_id_processing: true, accepted_at: new Date().toISOString() }),
          JSON.stringify({ bank_name: 'Vietcombank', account_number: `00710${String(userId).padStart(8, '0')}`, account_holder: w.name.toUpperCase() }),
        ],
      );
      if (r.rows.length) {
        await outbox(db, 'identity.worker_registered', `worker:${userId}`, null, {
          user_id: userId,
          full_name: w.name,
          skill_codes: w.skills,
          home_lat: w.lat,
          home_lng: w.lng,
          radius_km: 10,
          verified: true,
          suspended: false,
          reliability_score: 80,
          rating_avg: null,
          dob: w.dob,
        });
      }
    }
    console.log(`workers   20 (phones +84901000001 ... +84901000020)`);

    // Legacy Flexiwork company + admin, for the legacy UI smoke test
    const legacyCompany = await upsertCompany(db, 'Legacy Test AG', 'de', 'CHF');
    await upsertUser(db, { email: 'legacy@flexiwork.local', name: 'Legacy Admin', role: 'admin', companyId: legacyCompany });

    await db.query('COMMIT');
    console.log(`ops       ops@flexiwork.local\nlegacy    legacy@flexiwork.local (company ${legacyCompany})\npassword  ${PASSWORD}  (dev only)`);
  } catch (err) {
    await db.query('ROLLBACK');
    throw err;
  } finally {
    await db.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
