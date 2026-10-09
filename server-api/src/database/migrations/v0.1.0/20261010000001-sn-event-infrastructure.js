'use strict';

/**
 * Shift Network: event store, snapshots, outbox, inbox, projection checkpoints.
 * Idempotent on purpose: database.provider.ts runs sequelize.sync() on boot (docs/ARCHITECTURE.md §16).
 */
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS event_store (
        global_position BIGSERIAL PRIMARY KEY,
        event_id        UUID        NOT NULL UNIQUE,
        stream_type     TEXT        NOT NULL,
        stream_id       UUID        NOT NULL,
        stream_version  INTEGER     NOT NULL,
        event_type      TEXT        NOT NULL,
        event_version   SMALLINT    NOT NULL DEFAULT 1,
        payload         JSONB       NOT NULL,
        metadata        JSONB       NOT NULL,
        occurred_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT uq_event_store_stream_version UNIQUE (stream_id, stream_version)
      );
      CREATE INDEX IF NOT EXISTS ix_event_store_type ON event_store (stream_type, global_position);

      CREATE TABLE IF NOT EXISTS aggregate_snapshots (
        stream_id      UUID PRIMARY KEY,
        stream_type    TEXT NOT NULL,
        stream_version INTEGER NOT NULL,
        state          JSONB NOT NULL,
        created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS outbox_messages (
        id            BIGSERIAL PRIMARY KEY,
        event_id      UUID NOT NULL UNIQUE,
        topic         TEXT NOT NULL,
        partition_key TEXT NOT NULL,
        headers       JSONB NOT NULL DEFAULT '{}',
        payload       JSONB NOT NULL,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
        published_at  TIMESTAMPTZ NULL,
        attempts      INTEGER NOT NULL DEFAULT 0,
        last_error    TEXT NULL
      );
      CREATE INDEX IF NOT EXISTS ix_outbox_unpublished ON outbox_messages (id) WHERE published_at IS NULL;

      CREATE TABLE IF NOT EXISTS processed_messages (
        consumer_group TEXT NOT NULL,
        event_id       UUID NOT NULL,
        processed_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
        PRIMARY KEY (consumer_group, event_id)
      );

      CREATE TABLE IF NOT EXISTS projection_checkpoints (
        projection_name      TEXT PRIMARY KEY,
        last_global_position BIGINT NOT NULL DEFAULT 0,
        updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      DROP TABLE IF EXISTS projection_checkpoints;
      DROP TABLE IF EXISTS processed_messages;
      DROP TABLE IF EXISTS outbox_messages;
      DROP TABLE IF EXISTS aggregate_snapshots;
      DROP TABLE IF EXISTS event_store;
    `);
  },
};
