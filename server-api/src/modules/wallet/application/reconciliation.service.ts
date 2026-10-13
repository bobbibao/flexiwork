/* eslint-disable @typescript-eslint/no-explicit-any -- untyped boundary: raw SQL rows / JSON event payloads */
import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { randomUUID } from 'crypto';
import DecisionRecord from 'src/database/models/decision-records.model';
import AutonomyPolicy from 'src/database/models/autonomy-policies.model';
import { UnitOfWork } from 'src/shared/event-store/unit-of-work';
import { TimerService } from 'src/shared/timers/timer.service';
import { TimerHandler } from 'src/shared/timers/timer-handler.decorator';
import { ExceptionCaseService } from 'src/shared/autonomy/exception-case.service';
import { AutonomyPolicyService } from 'src/shared/autonomy/autonomy-policy.service';
import { DECISION_POINTS } from 'src/shared/autonomy/decision-points.constant';
import { systemActor } from 'src/shared/events/actor';
import { runsBackground } from 'src/shared/sn-runtime';

const TIMER = 'wallet.reconciliation';
const TERMINAL_OR_RELEASED = ['PAID', 'RATED', 'CANCELLED', 'EXPIRED'];

/** Next 02:00 Asia/Ho_Chi_Minh (UTC+7, no DST) = 19:00 UTC. */
const nextRun = (now = new Date()) => {
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 19, 0, 0));
  if (next <= now) next.setUTCDate(next.getUTCDate() + 1);
  return next;
};

/** Daily ledger reconciliation (docs/ARCHITECTURE.md §8.6). Mismatch: critical case + payouts kill switch. */
@Injectable()
export class ReconciliationService implements OnApplicationBootstrap {
  private readonly logger = new Logger(ReconciliationService.name);

  constructor(
    private readonly uow: UnitOfWork,
    private readonly timers: TimerService,
    private readonly exceptions: ExceptionCaseService,
    private readonly autonomy: AutonomyPolicyService,
  ) {}

  async onApplicationBootstrap() {
    if (runsBackground()) await this.scheduleNext();
  }

  private async scheduleNext() {
    const at = nextRun();
    await this.timers.schedule(TIMER, at, {}, at.toISOString().slice(0, 10));
  }

  @TimerHandler(TIMER)
  async onTimer() {
    try {
      await this.run(systemActor('reconciliation'));
    } finally {
      await this.scheduleNext();
    }
  }

  async run(actor = systemActor('reconciliation')) {
    const checks: Record<string, unknown> = {};
    const [total] = await this.uow.select<{ total: string }>(`SELECT COALESCE(SUM(balance_vnd), 0) AS total FROM ledger_balances`);
    checks.total_balance_vnd = Number(total.total);

    const drift = await this.uow.select<any>(
      `SELECT b.account_id, a.code, b.balance_vnd, COALESCE(SUM(e.amount_vnd), 0) AS entries
       FROM ledger_balances b JOIN ledger_accounts a ON a.id = b.account_id
       LEFT JOIN ledger_entries e ON e.account_id = b.account_id
       GROUP BY b.account_id, a.code, b.balance_vnd HAVING b.balance_vnd <> COALESCE(SUM(e.amount_vnd), 0)`,
    );
    checks.balance_drift = drift.map((d) => ({ code: d.code, balance_vnd: Number(d.balance_vnd), entries_vnd: Number(d.entries) }));

    const stuckEscrow = await this.uow.select<any>(
      `SELECT a.code, b.balance_vnd, s.status FROM ledger_balances b JOIN ledger_accounts a ON a.id = b.account_id
       JOIN shift_views s ON a.owner_type = 'shift' AND s.id::text = a.owner_id
       WHERE b.balance_vnd <> 0 AND s.status IN (:statuses)`,
      { statuses: TERMINAL_OR_RELEASED },
    );
    checks.non_zero_terminal_escrow = stuckEscrow.map((r) => ({ code: r.code, balance_vnd: Number(r.balance_vnd), status: r.status }));

    const missingTopups = await this.uow.select<any>(
      `SELECT p.id FROM payment_intents p LEFT JOIN ledger_journals j ON j.idempotency_key = 'topup:' || p.id::text
       WHERE p.kind = 'topup' AND p.status = 'succeeded' AND j.id IS NULL`,
    );
    checks.succeeded_topups_without_journal = missingTopups.map((r) => r.id);

    const ok =
      checks.total_balance_vnd === 0 &&
      !(checks.balance_drift as unknown[]).length &&
      !(checks.non_zero_terminal_escrow as unknown[]).length &&
      !(checks.succeeded_topups_without_journal as unknown[]).length;

    const id = randomUUID();
    await DecisionRecord.create({
      id,
      decision_point: 'ledger.reconciliation',
      subject_type: 'ledger',
      subject_id: 'ledger',
      mode: 'auto',
      outcome: ok ? 'ok' : 'mismatch',
      confidence: 1,
      rationale: ok ? 'All reconciliation checks passed' : 'One or more reconciliation checks failed',
      inputs: checks,
      provider: 'reconciliation',
      executed: !ok,
      created_at: new Date(),
    });
    if (!ok) {
      this.logger.error(`ledger reconciliation mismatch: ${JSON.stringify(checks)}`);
      await AutonomyPolicy.update({ enabled: false, updated_at: new Date() }, { where: { decision_point: DECISION_POINTS.PAYOUTS_ENABLED } });
      this.autonomy.invalidate();
      await this.exceptions.open({
        type: 'ledger_mismatch',
        severity: 'critical',
        subjectType: 'ledger',
        subjectId: id,
        dedupeKey: `ledger_mismatch:${id}`,
        summary: 'Đối soát sổ cái bị lệch: đã tạm dừng rút tiền',
        details: checks,
        suggestedActions: [{ action: 'enable_payouts', label_vi: 'Bật lại rút tiền sau khi đã kiểm tra' }],
        openedBy: actor,
      });
    }
    return { id, ok, checks, ran_at: new Date().toISOString() };
  }

  async latest() {
    const row = await DecisionRecord.findOne({ where: { decision_point: 'ledger.reconciliation' }, order: [['created_at', 'DESC']] });
    return row ? { id: row.id, ok: row.outcome === 'ok', checks: row.inputs, ran_at: row.created_at } : null;
  }
}
