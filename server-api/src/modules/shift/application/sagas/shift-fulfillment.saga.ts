/* eslint-disable @typescript-eslint/no-explicit-any -- untyped boundary: raw SQL rows / JSON event payloads */
import { Injectable, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ConsumeEvents } from 'src/shared/messaging/consume-events.decorator';
import { TimerService } from 'src/shared/timers/timer.service';
import { TimerHandler } from 'src/shared/timers/timer-handler.decorator';
import { UnitOfWork } from 'src/shared/event-store/unit-of-work';
import { AutonomyPolicyService } from 'src/shared/autonomy/autonomy-policy.service';
import { ExceptionCaseService } from 'src/shared/autonomy/exception-case.service';
import { DECISION_POINTS } from 'src/shared/autonomy/decision-points.constant';
import { causedBy, CommandContext, EventEnvelope } from 'src/shared/events/event-envelope';
import { systemActor } from 'src/shared/events/actor';
import { TOPICS } from 'src/shared/contracts/events/topics';
import { SHIFT_EVENTS as E } from 'src/shared/contracts/events/shift.events';
import { WALLET_EVENTS as W } from 'src/shared/contracts/events/wallet.events';
import { HoldEscrowCommand, RefundEscrowCommand, ReleaseEscrowCommand } from 'src/shared/contracts/commands/wallet.commands';
import { hours, minutes, snConfig } from 'src/shared/sn-runtime';
import { ShiftDomainError } from '../../domain/errors/shift.errors';
import { ShiftStatus, TERMINAL_STATUSES } from '../../domain/shift-status.enum';
import { ShiftRepository } from '../shift.repository';
import { ShiftPolicies } from '../shift-policies';
import * as C from '../commands/shift.commands';

const SAGA = 'shift-saga';
const SYSTEM: C.ShiftAccess = { kind: 'system' };

export const SHIFT_TIMERS = {
  OFFER_EXPIRY: 'shift.offer_expiry',
  SHIFT_EXPIRY: 'shift.expiry',
  ESCROW_DEADLINE: 'shift.escrow_deadline',
  CHECK_IN_REMINDER: 'shift.check_in_reminder',
  NO_SHOW: 'shift.no_show',
  AUTO_CHECKOUT: 'shift.auto_checkout',
  AUTO_CONFIRM: 'shift.auto_confirm',
  RATING_WINDOW: 'shift.rating_window',
} as const;

/**
 * Process manager for one shift (Saga, docs/ARCHITECTURE.md §5.5, §14):
 * reacts to shift.* and wallet.* events, sends wallet / shift commands, schedules timers,
 * and compensates (refund) when a branch fails. The shift stream itself is the saga log.
 * Every handler is idempotent: commands are guarded by state, journals by idempotency keys.
 */
@Injectable()
export class ShiftFulfillmentSaga {
  private readonly logger = new Logger(ShiftFulfillmentSaga.name);

  constructor(
    private readonly commands: CommandBus,
    private readonly timers: TimerService,
    private readonly repo: ShiftRepository,
    private readonly uow: UnitOfWork,
    private readonly autonomy: AutonomyPolicyService,
    private readonly exceptions: ExceptionCaseService,
    private readonly policies: ShiftPolicies,
  ) {}

  @ConsumeEvents({ group: 'sn-saga-shift', topics: [TOPICS.SHIFT, TOPICS.WALLET] })
  async on(env: EventEnvelope): Promise<void> {
    const ctx = causedBy(env, systemActor(SAGA));
    const p = env.payload;
    const id = env.stream_type === 'shift' ? env.stream_id : p.shift_id;
    switch (env.type) {
      case E.POSTED:
      case E.REMATCH_REQUESTED: {
        const shift = await this.repo.load(id);
        if (!shift) return;
        const at = new Date(shift.state.startAt.getTime() - minutes(snConfig().SN_SHIFT_MIN_LEAD_MIN));
        await this.timers.schedule(SHIFT_TIMERS.SHIFT_EXPIRY, at, { shift_id: id }, `${id}:${env.stream_version}`);
        return;
      }
      case E.OFFERED:
        await this.timers.schedule(SHIFT_TIMERS.OFFER_EXPIRY, new Date(p.expires_at), { shift_id: id, expires_at: p.expires_at }, `${id}:${p.expires_at}`);
        return;
      case E.ACCEPTED: {
        const shift = await this.repo.load(id);
        if (!shift) return;
        await this.holdEscrow(id, shift.state.companyId, shift.state.escrowAmountVnd, ctx);
        const deadline = Math.min(Date.now() + minutes(snConfig().SN_ESCROW_DEADLINE_MIN), shift.state.startAt.getTime() - minutes(30));
        await this.timers.schedule(SHIFT_TIMERS.ESCROW_DEADLINE, new Date(Math.max(deadline, Date.now() + 60_000)), { shift_id: id }, `${id}:${env.stream_version}`);
        return;
      }
      case W.ESCROW_HELD: {
        const shift = await this.repo.load(id);
        if (!shift) return;
        if (shift.status === ShiftStatus.ACCEPTED) {
          await this.run(new C.RecordEscrowFundedCommand(id, SYSTEM, ctx, p.journal_id, p.amount_vnd));
        } else if (TERMINAL_STATUSES.includes(shift.status!)) {
          // Compensation: the hold landed after the shift ended (race with cancel/expiry).
          await this.commands.execute(new RefundEscrowCommand(id, shift.state.companyId, ctx));
        }
        return;
      }
      case W.TOPUP_SUCCEEDED: {
        // Retry holds that failed for lack of funds, while the escrow deadline has not passed.
        const pending = await this.uow.select<{ id: string; escrow_amount_vnd: string }>(
          `SELECT id, escrow_amount_vnd FROM shift_views WHERE company_id = :companyId AND status = 'ACCEPTED' AND escrow_status = 'none' ORDER BY start_at`,
          { companyId: p.company_id },
        );
        for (const s of pending) await this.holdEscrow(s.id, p.company_id, Number(s.escrow_amount_vnd), ctx);
        return;
      }
      case E.ESCROW_FUNDED: {
        const shift = await this.repo.load(id);
        if (!shift) return;
        const start = shift.state.startAt.getTime();
        await this.timers.schedule(SHIFT_TIMERS.CHECK_IN_REMINDER, new Date(start - hours(1)), { shift_id: id }, `${id}:${env.stream_version}`);
        await this.timers.schedule(SHIFT_TIMERS.NO_SHOW, new Date(start + minutes(snConfig().SN_NO_SHOW_GRACE_MIN)), { shift_id: id }, `${id}:${env.stream_version}`);
        return;
      }
      case E.WORKER_CHECKED_IN: {
        const shift = await this.repo.load(id);
        if (!shift) return;
        const at = new Date(shift.state.endAt.getTime() + minutes(snConfig().SN_AUTO_CHECKOUT_AFTER_END_MIN));
        await this.timers.schedule(SHIFT_TIMERS.AUTO_CHECKOUT, at, { shift_id: id }, `${id}:${env.stream_version}`);
        return;
      }
      case E.WORKER_CHECKED_OUT: {
        const at = new Date(new Date(p.at).getTime() + hours(snConfig().SN_AUTO_CONFIRM_HOURS));
        await this.timers.schedule(SHIFT_TIMERS.AUTO_CONFIRM, at, { shift_id: id }, `${id}:${env.stream_version}`);
        if (p.auto) {
          await this.exceptions.open({
            type: 'auto_checkout',
            severity: 'low',
            subjectType: 'shift',
            subjectId: id,
            companyId: env.company_id,
            dedupeKey: `auto_checkout:${id}`,
            summary: 'Người lao động quên check-out; hệ thống tự check-out theo giờ kết thúc ca',
            details: { worker_id: p.worker_id, worked_minutes: p.worked_minutes },
            suggestedActions: [{ action: 'contact_employer', label_vi: 'Nhắc doanh nghiệp xác nhận số giờ làm' }],
            openedBy: systemActor(SAGA),
            correlationId: id,
          });
        }
        return;
      }
      case E.COMPLETED: {
        const shift = await this.repo.load(id);
        if (!shift || !shift.state.workerId) return;
        await this.commands.execute(new ReleaseEscrowCommand(id, shift.state.companyId, shift.state.workerId, p.gross_vnd, p.fee_vnd, ctx));
        return;
      }
      case W.ESCROW_RELEASED: {
        const s = p.splits;
        await this.run(
          new C.RecordPaymentReleasedCommand(id, SYSTEM, ctx, {
            journal_id: p.journal_id,
            gross_vnd: s.gross_vnd,
            pit_vnd: s.pit_vnd,
            net_vnd: s.worker_net_vnd,
            fee_vnd: s.fee_vnd,
            refund_vnd: s.employer_refund_vnd,
          }),
        );
        return;
      }
      case E.PAID:
        await this.timers.schedule(SHIFT_TIMERS.RATING_WINDOW, new Date(Date.now() + hours(snConfig().SN_RATING_WINDOW_HOURS)), { shift_id: id }, `${id}:${env.stream_version}`);
        return;
      case E.CANCELLED:
      case E.EXPIRED: {
        if (env.type === E.CANCELLED && !p.escrow_held) return;
        const shift = await this.repo.load(id);
        if (!shift) return;
        const comp = p.compensation_gross_vnd > 0 && p.worker_id ? { workerId: p.worker_id, grossVnd: p.compensation_gross_vnd } : undefined;
        await this.commands.execute(new RefundEscrowCommand(id, shift.state.companyId, ctx, comp));
        return;
      }
      case E.NO_SHOW_RECORDED:
        await this.handleNoShow(id, p.worker_id, env, ctx);
        return;
      case E.WORKER_WITHDREW:
        if (p.hours_before_start < snConfig().SN_FREE_CANCEL_HOURS) await this.checkRepeated('late_withdrawal', p.worker_id, E.WORKER_WITHDREW, 3, id, env);
        return;
      case E.DISPUTED: {
        const shift = await this.repo.load(id);
        if (!shift) return;
        const s = shift.state;
        await this.exceptions.open({
          type: 'shift_dispute',
          severity: 'high',
          subjectType: 'shift',
          subjectId: id,
          companyId: s.companyId,
          dedupeKey: `shift_dispute:${id}`,
          summary: `Khiếu nại ca "${s.title}": ${p.reason_code}`,
          details: { reason_code: p.reason_code, note: p.note, claimed_minutes: p.claimed_minutes, worked_minutes: s.workedMinutes, scheduled_minutes: s.scheduledMinutes, worker_id: s.workerId },
          suggestedActions: [
            { action: 'resolve_dispute', label_vi: 'Trả đủ theo giờ đã làm', params: { outcome: 'pay', approved_minutes: Math.min(s.workedMinutes ?? 0, s.scheduledMinutes) } },
            ...(p.claimed_minutes !== null && p.claimed_minutes !== undefined
              ? [{ action: 'resolve_dispute', label_vi: 'Trả theo số giờ doanh nghiệp đề xuất', params: { outcome: 'pay', approved_minutes: Math.min(p.claimed_minutes, s.scheduledMinutes) } }]
              : []),
            { action: 'resolve_dispute', label_vi: 'Hoàn tiền cho doanh nghiệp', params: { outcome: 'refund', approved_minutes: 0 } },
          ],
          openedBy: systemActor(SAGA),
          correlationId: id,
        });
        return;
      }
    }
  }

  // ------------------------------------------------------------ timers (each re-checks state via the command guard)

  @TimerHandler(SHIFT_TIMERS.OFFER_EXPIRY)
  async onOfferExpiry(p: { shift_id: string; expires_at: string }) {
    await this.run(new C.ExpireOfferCommand(p.shift_id, SYSTEM, this.timerCtx(p.shift_id), p.expires_at));
  }

  @TimerHandler(SHIFT_TIMERS.SHIFT_EXPIRY)
  async onShiftExpiry(p: { shift_id: string }) {
    const view = await this.run(new C.ExpireShiftCommand(p.shift_id, SYSTEM, this.timerCtx(p.shift_id)));
    if (view) {
      await this.exceptions.open({
        type: 'matching_exhausted',
        severity: 'medium',
        subjectType: 'shift',
        subjectId: p.shift_id,
        companyId: view.company_id,
        dedupeKey: `matching_exhausted:${p.shift_id}`,
        summary: `Không tìm được người lao động cho ca "${view.title}" trước giờ bắt đầu`,
        details: { hourly_vnd: view.hourly_vnd, skill_code: view.skill_code, start_at: view.start_at },
        suggestedActions: [
          { action: 'contact_employer', label_vi: 'Đề xuất tăng mức lương theo giờ' },
          { action: 'contact_employer', label_vi: 'Đề xuất mở rộng bán kính tìm kiếm hoặc đăng lại ca' },
        ],
        openedBy: systemActor(SAGA),
        correlationId: p.shift_id,
      });
    }
  }

  @TimerHandler(SHIFT_TIMERS.ESCROW_DEADLINE)
  async onEscrowDeadline(p: { shift_id: string }) {
    await this.run(new C.FailEscrowFundingCommand(p.shift_id, SYSTEM, this.timerCtx(p.shift_id)));
  }

  @TimerHandler(SHIFT_TIMERS.NO_SHOW)
  async onNoShow(p: { shift_id: string }) {
    await this.run(new C.RecordNoShowCommand(p.shift_id, SYSTEM, this.timerCtx(p.shift_id)));
  }

  @TimerHandler(SHIFT_TIMERS.AUTO_CHECKOUT)
  async onAutoCheckout(p: { shift_id: string }) {
    await this.run(new C.AutoCheckOutCommand(p.shift_id, SYSTEM, this.timerCtx(p.shift_id)));
  }

  @TimerHandler(SHIFT_TIMERS.AUTO_CONFIRM)
  async onAutoConfirm(p: { shift_id: string }) {
    const shift = await this.repo.load(p.shift_id);
    if (!shift || shift.status !== ShiftStatus.CHECKED_OUT) return;
    const decision = await this.autonomy.decide({
      point: DECISION_POINTS.COMPLETION_AUTO_CONFIRM,
      subjectType: 'shift',
      subjectId: p.shift_id,
      companyId: shift.state.companyId,
      inputs: { auto_checked_out: shift.state.autoCheckedOut, worked_minutes: shift.state.workedMinutes, scheduled_minutes: shift.state.scheduledMinutes },
      rule: (i) =>
        i.auto_checked_out
          ? { outcome: 'review', confidence: 0.4, rationale: 'Worker did not check out; hours are uncertain' }
          : { outcome: 'confirm', confidence: 1, rationale: 'Confirmation window passed without a dispute' },
    });
    if (decision.execute && decision.outcome === 'confirm') {
      await this.run(new C.AutoConfirmCompletionCommand(p.shift_id, SYSTEM, this.timerCtx(p.shift_id)));
      return;
    }
    await this.exceptions.open({
      type: 'completion_review',
      severity: 'medium',
      subjectType: 'shift',
      subjectId: p.shift_id,
      companyId: shift.state.companyId,
      dedupeKey: `completion_review:${p.shift_id}`,
      summary: `Ca "${shift.state.title}" cần xác nhận giờ làm thủ công`,
      details: { rationale: decision.rationale, worked_minutes: shift.state.workedMinutes, scheduled_minutes: shift.state.scheduledMinutes },
      suggestedActions: [{ action: 'confirm_completion', label_vi: 'Xác nhận theo giờ đã ghi nhận', params: { approved_minutes: shift.state.workedMinutes } }],
      openedBy: systemActor(SAGA),
      correlationId: p.shift_id,
    });
  }

  @TimerHandler(SHIFT_TIMERS.RATING_WINDOW)
  async onRatingWindow(p: { shift_id: string }) {
    await this.run(new C.CloseRatingWindowCommand(p.shift_id, SYSTEM, this.timerCtx(p.shift_id)));
  }

  // ------------------------------------------------------------ helpers

  private async holdEscrow(shiftId: string, companyId: number, amountVnd: number, ctx: CommandContext) {
    const policy = await this.autonomy.policy(DECISION_POINTS.ESCROW_AUTO_HOLD);
    if (policy.enabled && policy.mode === 'auto') {
      await this.commands.execute(new HoldEscrowCommand(shiftId, companyId, amountVnd, ctx));
      return;
    }
    await this.exceptions.open({
      type: 'escrow_hold_manual',
      severity: 'medium',
      subjectType: 'shift',
      subjectId: shiftId,
      companyId,
      dedupeKey: `escrow_hold_manual:${shiftId}`,
      summary: 'Tạm giữ ký quỹ đang ở chế độ thủ công: cần người duyệt',
      suggestedActions: [{ action: 'hold_escrow', label_vi: 'Tạm giữ ký quỹ', params: { amount_vnd: amountVnd } }],
      openedBy: systemActor(SAGA),
      correlationId: shiftId,
    });
  }

  private async handleNoShow(id: string, workerId: number, env: EventEnvelope, ctx: CommandContext) {
    const shift = await this.repo.load(id);
    if (!shift || shift.status !== ShiftStatus.NO_SHOW) return;
    const now = new Date();
    const decision = await this.autonomy.decide({
      point: DECISION_POINTS.NO_SHOW_HANDLING,
      subjectType: 'shift',
      subjectId: id,
      companyId: shift.state.companyId,
      inputs: { start_at: shift.state.startAt.toISOString(), end_at: shift.state.endAt.toISOString(), now: now.toISOString(), worker_id: workerId },
      rule: () => {
        const outcome = this.policies.noShow().decide(shift.state.startAt, shift.state.endAt, now);
        return { outcome, confidence: 1, rationale: outcome === 'rematch' ? 'At least half of the shift remains' : 'Too late to find a replacement' };
      },
    });
    if (decision.execute) {
      if (decision.outcome === 'rematch') await this.run(new C.RematchCommand(id, SYSTEM, ctx));
      else await this.run(new C.CancelShiftCommand(id, SYSTEM, ctx, 'no_show', 'Người lao động không đến'));
    } else {
      await this.exceptions.open({
        type: 'no_show',
        severity: 'high',
        subjectType: 'shift',
        subjectId: id,
        companyId: shift.state.companyId,
        dedupeKey: `no_show:${id}:${env.stream_version}`,
        summary: `Người lao động không đến ca "${shift.state.title}"`,
        details: { worker_id: workerId, suggestion: decision.outcome },
        suggestedActions: [
          { action: 'rematch', label_vi: 'Tìm người thay thế' },
          { action: 'cancel_shift', label_vi: 'Hủy ca và hoàn tiền' },
        ],
        openedBy: systemActor(SAGA),
        correlationId: id,
      });
    }
    const threshold = Number((await this.autonomy.policy(DECISION_POINTS.NO_SHOW_HANDLING)).limits.repeat_threshold ?? 2);
    await this.checkRepeated('repeated_no_show', workerId, E.NO_SHOW_RECORDED, threshold, id, env);
  }

  /** Opens a case when a worker repeats a behaviour within 30 days (counted from the event store). */
  private async checkRepeated(type: string, workerId: number, eventType: string, threshold: number, shiftId: string, env: EventEnvelope) {
    const [{ n }] = await this.uow.select<{ n: string }>(
      `SELECT COUNT(*) AS n FROM event_store WHERE event_type = :eventType AND (payload->>'worker_id')::int = :workerId AND occurred_at > now() - interval '30 days'`,
      { eventType, workerId },
    );
    if (Number(n) < threshold) return;
    await this.exceptions.open({
      type,
      severity: 'medium',
      subjectType: 'worker',
      subjectId: String(workerId),
      dedupeKey: `${type}:${workerId}:${new Date().toISOString().slice(0, 10)}`,
      summary: `Người lao động #${workerId} lặp lại hành vi (${n} lần / 30 ngày)`,
      details: { worker_id: workerId, count_30d: Number(n), last_shift_id: shiftId },
      suggestedActions: [
        { action: 'suspend_worker', label_vi: 'Tạm khóa tài khoản người lao động', params: { worker_id: workerId } },
        { action: 'warn_worker', label_vi: 'Gửi cảnh báo', params: { worker_id: workerId } },
      ],
      openedBy: systemActor(SAGA),
      correlationId: env.correlation_id,
    });
  }

  private timerCtx(shiftId: string): CommandContext {
    return { actor: systemActor('shift-timer'), correlationId: shiftId };
  }

  /** Executes a command; a stale timer / repeated event (state already moved on) is a no-op. */
  private async run(cmd: any): Promise<any | null> {
    try {
      return await this.commands.execute(cmd);
    } catch (err) {
      if (err instanceof ShiftDomainError) {
        this.logger.debug(`${cmd.constructor.name} skipped for ${cmd.shiftId}: ${err.code}`);
        return null;
      }
      throw err;
    }
  }
}
