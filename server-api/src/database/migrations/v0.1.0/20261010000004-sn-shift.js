'use strict';

/** Shift Network: shift read model and the double-booking guard (docs/ARCHITECTURE.md §7.4, §9.6). */
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      CREATE EXTENSION IF NOT EXISTS btree_gist;

      CREATE TABLE IF NOT EXISTS shift_views (
        id                  UUID PRIMARY KEY,
        job_ref             UUID NOT NULL,
        company_id          INTEGER NOT NULL,
        company_name        TEXT NULL,
        work_location_id    UUID NOT NULL,
        location_name       TEXT NULL,
        title               TEXT NOT NULL,
        description         TEXT NULL,
        skill_code          TEXT NOT NULL,
        start_at            TIMESTAMPTZ NOT NULL,
        end_at              TIMESTAMPTZ NOT NULL,
        hourly_vnd          BIGINT NOT NULL,
        estimated_gross_vnd BIGINT NOT NULL,
        platform_fee_vnd    BIGINT NOT NULL,
        escrow_amount_vnd   BIGINT NOT NULL,
        dispatch_mode       TEXT NOT NULL,
        status              TEXT NOT NULL,
        escrow_status       TEXT NOT NULL DEFAULT 'none',
        worker_id           INTEGER NULL,
        offered_worker_ids  INTEGER[] NOT NULL DEFAULT '{}',
        offer_expires_at    TIMESTAMPTZ NULL,
        lat                 NUMERIC(9,6) NOT NULL,
        lng                 NUMERIC(9,6) NOT NULL,
        address             TEXT NULL,
        province_code       TEXT NULL,
        ward_code           TEXT NULL,
        checked_in_at       TIMESTAMPTZ NULL,
        checked_out_at      TIMESTAMPTZ NULL,
        worked_minutes      INTEGER NULL,
        approved_minutes    INTEGER NULL,
        gross_vnd           BIGINT NULL,
        fee_vnd             BIGINT NULL,
        pit_vnd             BIGINT NULL,
        net_vnd             BIGINT NULL,
        refund_vnd          BIGINT NULL,
        cancel_reason       TEXT NULL,
        employer_rated      BOOLEAN NOT NULL DEFAULT false,
        worker_rated        BOOLEAN NOT NULL DEFAULT false,
        version             INTEGER NOT NULL,
        posted_at           TIMESTAMPTZ NOT NULL,
        updated_at          TIMESTAMPTZ NOT NULL
      );
      CREATE INDEX IF NOT EXISTS ix_shift_views_company ON shift_views (company_id, status, start_at);
      CREATE INDEX IF NOT EXISTS ix_shift_views_worker ON shift_views (worker_id, start_at);
      CREATE INDEX IF NOT EXISTS ix_shift_views_job ON shift_views (job_ref);
      CREATE INDEX IF NOT EXISTS ix_shift_views_open_geo ON shift_views (lat, lng) WHERE status IN ('POSTED', 'MATCHED');
      CREATE INDEX IF NOT EXISTS ix_shift_views_offered ON shift_views USING gin (offered_worker_ids);

      CREATE TABLE IF NOT EXISTS worker_shift_reservations (
        shift_id  UUID PRIMARY KEY,
        worker_id INTEGER NOT NULL,
        during    TSTZRANGE NOT NULL,
        active    BOOLEAN NOT NULL DEFAULT true
      );

      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ex_worker_no_overlap') THEN
          ALTER TABLE worker_shift_reservations
            ADD CONSTRAINT ex_worker_no_overlap EXCLUDE USING gist (worker_id WITH =, during WITH &&) WHERE (active);
        END IF;
      END $$;
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      DROP TABLE IF EXISTS worker_shift_reservations;
      DROP TABLE IF EXISTS shift_views;
    `);
  },
};
