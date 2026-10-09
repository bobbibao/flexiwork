'use strict';

/**
 * Shift Network: double-entry ledger in integer VND (docs/ARCHITECTURE.md §8).
 * A deferred constraint trigger enforces that every journal balances (sum of entries = 0) at commit.
 */
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS ledger_accounts (
        id           UUID PRIMARY KEY,
        code         TEXT NOT NULL UNIQUE,
        account_type TEXT NOT NULL,
        owner_type   TEXT NULL,
        owner_id     TEXT NULL,
        currency     CHAR(3) NOT NULL DEFAULT 'VND',
        created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS ledger_journals (
        id              UUID PRIMARY KEY,
        journal_type    TEXT NOT NULL,
        idempotency_key TEXT NOT NULL UNIQUE,
        reference_type  TEXT NULL,
        reference_id    TEXT NULL,
        metadata        JSONB NOT NULL DEFAULT '{}',
        created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS ix_ledger_journals_ref ON ledger_journals (reference_type, reference_id);

      CREATE TABLE IF NOT EXISTS ledger_entries (
        id                BIGSERIAL PRIMARY KEY,
        journal_id        UUID NOT NULL REFERENCES ledger_journals(id),
        account_id        UUID NOT NULL REFERENCES ledger_accounts(id),
        amount_vnd        BIGINT NOT NULL CHECK (amount_vnd <> 0),
        balance_after_vnd BIGINT NOT NULL,
        created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS ix_ledger_entries_account ON ledger_entries (account_id, id);
      CREATE INDEX IF NOT EXISTS ix_ledger_entries_journal ON ledger_entries (journal_id);

      CREATE TABLE IF NOT EXISTS ledger_balances (
        account_id   UUID PRIMARY KEY REFERENCES ledger_accounts(id),
        account_type TEXT NOT NULL,
        balance_vnd  BIGINT NOT NULL DEFAULT 0,
        version      INTEGER NOT NULL DEFAULT 0,
        updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT ck_ledger_balance_non_negative CHECK (account_type = 'gateway_clearing' OR balance_vnd >= 0)
      );

      CREATE TABLE IF NOT EXISTS payment_intents (
        id               UUID PRIMARY KEY,
        kind             TEXT NOT NULL,
        account_id       UUID NOT NULL REFERENCES ledger_accounts(id),
        owner_type       TEXT NULL,
        owner_id         TEXT NULL,
        amount_vnd       BIGINT NOT NULL CHECK (amount_vnd > 0),
        provider         TEXT NOT NULL,
        provider_ref     TEXT NULL,
        status           TEXT NOT NULL,
        idempotency_key  TEXT NOT NULL UNIQUE,
        details          JSONB NULL,
        raw_last_webhook JSONB NULL,
        created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS ix_payment_intents_provider_ref ON payment_intents (provider, provider_ref);
      CREATE INDEX IF NOT EXISTS ix_payment_intents_account ON payment_intents (account_id);

      CREATE OR REPLACE FUNCTION sn_ledger_journal_balanced() RETURNS trigger AS $$
      DECLARE total BIGINT;
      BEGIN
        SELECT COALESCE(SUM(amount_vnd), 0) INTO total FROM ledger_entries WHERE journal_id = NEW.journal_id;
        IF total <> 0 THEN
          RAISE EXCEPTION 'Ledger journal % is not balanced (sum = %)', NEW.journal_id, total;
        END IF;
        RETURN NULL;
      END;
      $$ LANGUAGE plpgsql;

      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_ledger_journal_balanced') THEN
          CREATE CONSTRAINT TRIGGER trg_ledger_journal_balanced
            AFTER INSERT ON ledger_entries
            DEFERRABLE INITIALLY DEFERRED
            FOR EACH ROW EXECUTE FUNCTION sn_ledger_journal_balanced();
        END IF;
      END $$;

      CREATE OR REPLACE FUNCTION sn_ledger_append_only() RETURNS trigger AS $$
      BEGIN
        RAISE EXCEPTION 'Ledger tables are append-only (% on %)', TG_OP, TG_TABLE_NAME;
      END;
      $$ LANGUAGE plpgsql;

      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_ledger_entries_append_only') THEN
          CREATE TRIGGER trg_ledger_entries_append_only BEFORE UPDATE OR DELETE ON ledger_entries
            FOR EACH ROW EXECUTE FUNCTION sn_ledger_append_only();
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_ledger_journals_append_only') THEN
          CREATE TRIGGER trg_ledger_journals_append_only BEFORE UPDATE OR DELETE ON ledger_journals
            FOR EACH ROW EXECUTE FUNCTION sn_ledger_append_only();
        END IF;
      END $$;

      INSERT INTO ledger_accounts (id, code, account_type, owner_type, owner_id) VALUES
        ('00000000-0000-4000-8000-000000000001', 'platform:fee_revenue', 'platform_revenue', 'platform', NULL),
        ('00000000-0000-4000-8000-000000000002', 'platform:pit_payable', 'tax_payable', 'platform', NULL),
        ('00000000-0000-4000-8000-000000000003', 'gateway:fake:clearing', 'gateway_clearing', 'platform', 'fake')
      ON CONFLICT (code) DO NOTHING;
      INSERT INTO ledger_balances (account_id, account_type)
        SELECT id, account_type FROM ledger_accounts WHERE owner_type = 'platform'
      ON CONFLICT (account_id) DO NOTHING;
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      DROP TABLE IF EXISTS payment_intents;
      DROP TABLE IF EXISTS ledger_balances;
      DROP TABLE IF EXISTS ledger_entries;
      DROP TABLE IF EXISTS ledger_journals;
      DROP TABLE IF EXISTS ledger_accounts;
      DROP FUNCTION IF EXISTS sn_ledger_journal_balanced();
      DROP FUNCTION IF EXISTS sn_ledger_append_only();
    `);
  },
};
