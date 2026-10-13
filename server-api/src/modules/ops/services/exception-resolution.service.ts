/* eslint-disable @typescript-eslint/no-explicit-any -- untyped boundary: raw SQL rows / JSON event payloads */
import { Injectable } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import ExceptionCase from 'src/database/models/exception-cases.model';
import AutonomyPolicy from 'src/database/models/autonomy-policies.model';
import User from 'src/database/models/users.model';
import { ExceptionCaseService } from 'src/shared/autonomy/exception-case.service';
import { AutonomyPolicyService } from 'src/shared/autonomy/autonomy-policy.service';
import { DECISION_POINTS } from 'src/shared/autonomy/decision-points.constant';
import { userActor } from 'src/shared/events/actor';
import { CommandContext } from 'src/shared/events/event-envelope';
import { HoldEscrowCommand } from 'src/shared/contracts/commands/wallet.commands';
import { CodedError, notFound } from 'src/shared/utils/coded.error';
import { WalletService } from 'src/modules/wallet/application/wallet.service';
import * as C from 'src/modules/shift/application/commands/shift.commands';
import { ShiftRepository } from 'src/modules/shift/application/shift.repository';
import { WorkerAdminService } from './worker-admin.service';

/** Actions an ops user may execute from a case (docs/ARCHITECTURE.md §13, item 6). Informational actions only record a note. */
const INFO_ONLY = new Set(['contact_employer', 'contact_worker', 'warn_worker']);

/**
 * Resolving a case executes ordinary commands with actor = ops user, then records the resolution.
 * The same entry point is what a future agent would call (with mode/limits enforced by autonomy policies).
 */
@Injectable()
export class ExceptionResolutionService {
  constructor(
    private readonly commands: CommandBus,
    private readonly exceptions: ExceptionCaseService,
    private readonly autonomy: AutonomyPolicyService,
    private readonly wallet: WalletService,
    private readonly shifts: ShiftRepository,
    private readonly workers: WorkerAdminService,
  ) {}

  async acknowledge(caseId: string, user: User) {
    const kase = await ExceptionCase.findByPk(caseId);
    if (!kase) throw notFound('CASE_NOT_FOUND', 'Case not found');
    if (kase.status === 'OPEN') {
      kase.set({ status: 'ACKNOWLEDGED', assignee_id: user.id, updated_at: new Date() } as any);
      await kase.save();
    }
    return kase;
  }

  async resolve(caseId: string, user: User, input: { action?: string; params?: Record<string, any>; note?: string; dismiss?: boolean }) {
    const kase = await ExceptionCase.findByPk(caseId);
    if (!kase) throw notFound('CASE_NOT_FOUND', 'Case not found');
    if (kase.status === 'RESOLVED' || kase.status === 'DISMISSED') throw new CodedError('CASE_ALREADY_CLOSED', 'Case already closed', 409);
    const actor = userActor(user);
    const ctx: CommandContext = { actor, correlationId: kase.subject_id };
    let result: unknown = null;
    if (input.action && !input.dismiss) result = await this.execute(kase, input.action, input.params ?? {}, ctx, user);
    await this.exceptions.markResolved(caseId, { action: input.action ?? null, params: input.params ?? {}, note: input.note ?? null, result }, actor, input.dismiss ? 'DISMISSED' : 'RESOLVED');
    return { case: await ExceptionCase.findByPk(caseId), result };
  }

  private async execute(kase: ExceptionCase, action: string, params: Record<string, any>, ctx: CommandContext, user: User) {
    if (INFO_ONLY.has(action)) return { recorded: true };
    const ops: C.ShiftAccess = { kind: 'ops', userId: user.id };
    const shiftId = kase.subject_type === 'shift' ? kase.subject_id : params.shift_id;
    switch (action) {
      case 'resolve_dispute':
        return this.commands.execute(new C.ResolveDisputeCommand(shiftId, ops, ctx, params.outcome, Number(params.approved_minutes ?? 0), params.note ?? null));
      case 'rematch':
        return this.commands.execute(new C.RematchCommand(shiftId, ops, ctx));
      case 'cancel_shift':
        return this.commands.execute(new C.CancelShiftCommand(shiftId, ops, ctx, 'ops', params.note ?? 'Hủy bởi bộ phận vận hành'));
      case 'confirm_completion':
        return this.commands.execute(new C.ConfirmCompletionCommand(shiftId, ops, ctx, params.approved_minutes === undefined ? null : Number(params.approved_minutes)));
      case 'hold_escrow': {
        const shift = await this.shifts.load(shiftId);
        if (!shift) throw notFound('SHIFT_NOT_FOUND', 'Shift not found');
        return this.commands.execute(new HoldEscrowCommand(shiftId, shift.state.companyId, shift.state.escrowAmountVnd, ctx));
      }
      case 'approve_payout':
        return this.wallet.approvePayout(params.intent_id ?? kase.subject_id, ctx.actor);
      case 'reject_payout':
        return this.wallet.rejectPayout(params.intent_id ?? kase.subject_id, ctx.actor);
      case 'enable_payouts':
        await AutonomyPolicy.update({ enabled: true, updated_by: user.id, updated_at: new Date() }, { where: { decision_point: DECISION_POINTS.PAYOUTS_ENABLED } });
        this.autonomy.invalidate();
        return { payouts_enabled: true };
      case 'suspend_worker':
        return this.workers.setSuspended(Number(params.worker_id ?? kase.subject_id), true, user);
      default:
        throw new CodedError('ACTION_UNKNOWN', `Unknown action ${action}`);
    }
  }
}
