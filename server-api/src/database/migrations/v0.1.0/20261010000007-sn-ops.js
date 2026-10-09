'use strict';

/** Shift Network: exception queue, autonomy policies, decision records, DLQ (docs/ARCHITECTURE.md §13). */
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS exception_cases (
        id                UUID PRIMARY KEY,
        type              TEXT NOT NULL,
        severity          TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
        status            TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'ACKNOWLEDGED', 'RESOLVED', 'DISMISSED')),
        subject_type      TEXT NOT NULL,
        subject_id        TEXT NOT NULL,
        company_id        INTEGER NULL,
        dedupe_key        TEXT NOT NULL UNIQUE,
        summary           TEXT NOT NULL,
        details           JSONB NOT NULL DEFAULT '{}',
        suggested_actions JSONB NOT NULL DEFAULT '[]',
        opened_by         JSONB NOT NULL,
        assignee_id       INTEGER NULL,
        sla_due_at        TIMESTAMPTZ NULL,
        resolution        JSONB NULL,
        created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS ix_exception_cases_queue ON exception_cases (status, severity, created_at);
      CREATE INDEX IF NOT EXISTS ix_exception_cases_subject ON exception_cases (subject_type, subject_id);

      CREATE TABLE IF NOT EXISTS autonomy_policies (
        decision_point TEXT PRIMARY KEY,
        mode           TEXT NOT NULL CHECK (mode IN ('manual', 'suggest', 'auto')),
        enabled        BOOLEAN NOT NULL DEFAULT true,
        limits         JSONB NOT NULL DEFAULT '{}',
        description_vi TEXT NULL,
        updated_by     INTEGER NULL,
        updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      INSERT INTO autonomy_policies (decision_point, mode, enabled, limits, description_vi) VALUES
        ('matching.dispatch', 'auto', true, '{}', 'Tự động gửi lời mời ca làm cho người lao động phù hợp'),
        ('escrow.auto_hold', 'auto', true, '{}', 'Tự động tạm giữ tiền ký quỹ khi người lao động nhận ca'),
        ('no_show.handling', 'auto', true, '{"repeat_threshold": 2, "window_days": 30}', 'Xử lý người lao động không đến: tìm người thay hoặc hủy ca'),
        ('completion.auto_confirm', 'auto', true, '{}', 'Tự động xác nhận hoàn thành khi hết thời hạn'),
        ('dispute.resolution', 'manual', true, '{}', 'Giải quyết khiếu nại (luôn cần người duyệt ở v1)'),
        ('payout.approval', 'auto', true, '{"max_amount_vnd": 5000000}', 'Tự động duyệt rút tiền dưới hạn mức'),
        ('worker.suspension', 'suggest', true, '{"reliability_below": 40}', 'Đề xuất tạm khóa người lao động có độ tin cậy thấp'),
        ('payouts.enabled', 'auto', true, '{}', 'Công tắc tổng cho phép rút tiền (tắt khi đối soát lệch)')
      ON CONFLICT (decision_point) DO NOTHING;

      CREATE TABLE IF NOT EXISTS decision_records (
        id             UUID PRIMARY KEY,
        decision_point TEXT NOT NULL,
        subject_type   TEXT NOT NULL,
        subject_id     TEXT NOT NULL,
        mode           TEXT NOT NULL,
        outcome        TEXT NOT NULL,
        confidence     NUMERIC(4,3) NOT NULL,
        rationale      TEXT NOT NULL,
        inputs         JSONB NOT NULL DEFAULT '{}',
        provider       TEXT NOT NULL,
        executed       BOOLEAN NOT NULL,
        created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS ix_decision_records_subject ON decision_records (subject_type, subject_id);
      CREATE INDEX IF NOT EXISTS ix_decision_records_point ON decision_records (decision_point, created_at);

      CREATE TABLE IF NOT EXISTS dlq_messages (
        id             UUID PRIMARY KEY,
        event_id       UUID NOT NULL,
        original_topic TEXT NOT NULL,
        consumer_group TEXT NOT NULL,
        error          TEXT NOT NULL,
        attempts       INTEGER NOT NULL,
        envelope       JSONB NOT NULL,
        status         TEXT NOT NULL DEFAULT 'OPEN',
        created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
        replayed_at    TIMESTAMPTZ NULL
      );
      CREATE INDEX IF NOT EXISTS ix_dlq_messages_status ON dlq_messages (status, created_at);
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      DROP TABLE IF EXISTS dlq_messages;
      DROP TABLE IF EXISTS decision_records;
      DROP TABLE IF EXISTS autonomy_policies;
      DROP TABLE IF EXISTS exception_cases;
    `);
  },
};
