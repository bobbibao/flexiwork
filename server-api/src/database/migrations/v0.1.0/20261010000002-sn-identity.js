'use strict';

/** Shift Network: worker/employer profiles, work locations, skills catalogue (PLAN.md P2.2). */
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS worker_profiles (
        id                SERIAL PRIMARY KEY,
        user_id           INTEGER NOT NULL UNIQUE,
        full_name         TEXT NOT NULL,
        phone_e164        TEXT NOT NULL UNIQUE,
        dob               DATE NULL,
        skill_codes       TEXT[] NOT NULL DEFAULT '{}',
        home_lat          NUMERIC(9,6) NULL,
        home_lng          NUMERIC(9,6) NULL,
        home_address      TEXT NULL,
        radius_km         INTEGER NOT NULL DEFAULT 10,
        verified          BOOLEAN NOT NULL DEFAULT false,
        suspended         BOOLEAN NOT NULL DEFAULT false,
        reliability_score INTEGER NOT NULL DEFAULT 80 CHECK (reliability_score BETWEEN 0 AND 100),
        rating_avg        NUMERIC(3,2) NULL,
        rating_count      INTEGER NOT NULL DEFAULT 0,
        completed_shifts  INTEGER NOT NULL DEFAULT 0,
        consents          JSONB NOT NULL DEFAULT '{}',
        availability      JSONB NOT NULL DEFAULT '{}',
        bank_account      JSONB NULL,
        created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS ix_worker_profiles_geo ON worker_profiles (home_lat, home_lng);

      CREATE TABLE IF NOT EXISTS employer_profiles (
        id            SERIAL PRIMARY KEY,
        company_id    INTEGER NOT NULL UNIQUE,
        legal_name    TEXT NOT NULL,
        tax_code      TEXT NULL,
        business_type TEXT NULL,
        phone_e164    TEXT NULL,
        address       TEXT NULL,
        province_code TEXT NULL,
        ward_code     TEXT NULL,
        lat           NUMERIC(9,6) NULL,
        lng           NUMERIC(9,6) NULL,
        verified      BOOLEAN NOT NULL DEFAULT false,
        rating_avg    NUMERIC(3,2) NULL,
        rating_count  INTEGER NOT NULL DEFAULT 0,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS work_locations (
        id                UUID PRIMARY KEY,
        company_id        INTEGER NOT NULL,
        name              TEXT NOT NULL,
        address           TEXT NULL,
        province_code     TEXT NULL,
        ward_code         TEXT NULL,
        lat               NUMERIC(9,6) NOT NULL,
        lng               NUMERIC(9,6) NOT NULL,
        geofence_radius_m INTEGER NOT NULL DEFAULT 150 CHECK (geofence_radius_m BETWEEN 20 AND 2000),
        qr_required       BOOLEAN NOT NULL DEFAULT false,
        qr_secret         TEXT NOT NULL,
        active            BOOLEAN NOT NULL DEFAULT true,
        created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS ix_work_locations_company ON work_locations (company_id);

      CREATE TABLE IF NOT EXISTS skills (
        code       TEXT PRIMARY KEY,
        name_vi    TEXT NOT NULL,
        sort_order INTEGER NOT NULL DEFAULT 0,
        active     BOOLEAN NOT NULL DEFAULT true
      );

      INSERT INTO skills (code, name_vi, sort_order) VALUES
        ('phuc_vu', 'Phục vụ', 1),
        ('pha_che', 'Pha chế', 2),
        ('phu_bep', 'Phụ bếp', 3),
        ('rua_bat', 'Rửa bát', 4),
        ('thu_ngan', 'Thu ngân', 5),
        ('ban_hang', 'Bán hàng', 6),
        ('boc_xep', 'Bốc xếp', 7),
        ('kho_van', 'Kho vận', 8),
        ('giao_hang', 'Giao hàng', 9),
        ('tap_vu', 'Tạp vụ / Vệ sinh', 10),
        ('le_tan', 'Lễ tân', 11),
        ('su_kien', 'Sự kiện / PG', 12),
        ('bao_ve', 'Bảo vệ', 13)
      ON CONFLICT (code) DO NOTHING;
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      DROP TABLE IF EXISTS skills;
      DROP TABLE IF EXISTS work_locations;
      DROP TABLE IF EXISTS employer_profiles;
      DROP TABLE IF EXISTS worker_profiles;
    `);
  },
};
