'use strict';

/** Shift Network: ratings (PLAN.md P6). */
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS ratings (
        id         SERIAL PRIMARY KEY,
        shift_id   UUID NOT NULL,
        rater_role TEXT NOT NULL CHECK (rater_role IN ('employer', 'worker')),
        rater_id   INTEGER NOT NULL,
        ratee_role TEXT NOT NULL CHECK (ratee_role IN ('employer', 'worker')),
        ratee_id   INTEGER NOT NULL,
        stars      SMALLINT NOT NULL CHECK (stars BETWEEN 1 AND 5),
        tags       TEXT[] NOT NULL DEFAULT '{}',
        comment    TEXT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT uq_ratings_shift_rater UNIQUE (shift_id, rater_id)
      );
      CREATE INDEX IF NOT EXISTS ix_ratings_ratee ON ratings (ratee_role, ratee_id);
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`DROP TABLE IF EXISTS ratings;`);
  },
};
