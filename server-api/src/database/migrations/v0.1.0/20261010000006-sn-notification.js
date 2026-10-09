'use strict';

/** Shift Network: notifications, deliveries, push subscriptions, preferences (PLAN.md P7). */
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id           UUID PRIMARY KEY,
        user_id      INTEGER NOT NULL,
        event_id     UUID NOT NULL,
        template_key TEXT NOT NULL,
        title        TEXT NOT NULL,
        body         TEXT NOT NULL,
        data         JSONB NOT NULL DEFAULT '{}',
        read_at      TIMESTAMPTZ NULL,
        created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS ix_notifications_user ON notifications (user_id, created_at DESC);

      CREATE TABLE IF NOT EXISTS notification_deliveries (
        id              SERIAL PRIMARY KEY,
        event_id        UUID NOT NULL,
        user_id         INTEGER NOT NULL,
        channel         TEXT NOT NULL,
        notification_id UUID NULL,
        status          TEXT NOT NULL,
        attempts        INTEGER NOT NULL DEFAULT 0,
        last_error      TEXT NULL,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT uq_notification_delivery UNIQUE (event_id, user_id, channel)
      );

      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id           UUID PRIMARY KEY,
        user_id      INTEGER NOT NULL,
        platform     TEXT NOT NULL,
        endpoint     TEXT NOT NULL UNIQUE,
        keys         JSONB NULL,
        user_agent   TEXT NULL,
        created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
        last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS ix_push_subscriptions_user ON push_subscriptions (user_id);

      CREATE TABLE IF NOT EXISTS notification_preferences (
        user_id    INTEGER PRIMARY KEY,
        channels   JSONB NOT NULL DEFAULT '{}',
        templates  JSONB NOT NULL DEFAULT '{}',
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      DROP TABLE IF EXISTS notification_preferences;
      DROP TABLE IF EXISTS push_subscriptions;
      DROP TABLE IF EXISTS notification_deliveries;
      DROP TABLE IF EXISTS notifications;
    `);
  },
};
