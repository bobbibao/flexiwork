import { Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { HoldEscrowCommand, RefundEscrowCommand, ReleaseEscrowCommand } from 'src/shared/contracts/commands/wallet.commands';
import { WALLET_EVENTS } from 'src/shared/contracts/events/wallet.events';
import { UnitOfWork } from 'src/shared/event-store/unit-of-work';
import { OutboxService } from 'src/shared/messaging/outbox.service';
import { Money } from 'src/shared/domain/money';
import { snConfig } from 'src/shared/sn-runtime';
import { SequelizeLedgerRepository } from '../../infrastructure/sequelize-ledger.repository';
import { Accounts } from '../../domain/account-code';
import { computeReleaseSplits, JournalTemplates } from '../../domain/journal-templates';
import { InsufficientFundsError } from '../../domain/errors/ledger.errors';
import { PitWithholdingPolicy } from '../../domain/policies/pit-withholding.policy';
import { emitWalletEvent } from '../wallet-events';

const pitPolicy = () => new PitWithholdingPolicy(snConfig().SN_PIT_RATE_PCT, snConfig().SN_PIT_THRESHOLD_VND);

/** Saga participant: hold the shift's estimated cost (docs/ARCHITECTURE.md §8.4 ESCROW_HOLD). Idempotent per shift. */
@CommandHandler(HoldEscrowCommand)
export class HoldEscrowHandler implements ICommandHandler<HoldEscrowCommand> {
  private readonly logger = new Logger(HoldEscrowHandler.name);

  constructor(
    private readonly uow: UnitOfWork,
    private readonly ledger: SequelizeLedgerRepository,
    private readonly outbox: OutboxService,
  ) {}

  async execute(cmd: HoldEscrowCommand): Promise<{ held: boolean; journalId?: string }> {
    const amount = Money.vnd(cmd.amountVnd);
    try {
      return await this.uow.run(async (t) => {
        const existing = await this.ledger.journalByKey(`escrow_hold:${cmd.shiftId}`, t);
        const posted = existing ? { journalId: existing.id, created: false } : await this.ledger.post(JournalTemplates.escrowHold(cmd.shiftId, cmd.companyId, amount), t);
        // Emit escrow_held also on a repeat (e.g. re-accept after a worker withdrew): the shift needs the fact again.
        await emitWalletEvent(this.outbox, t, WALLET_EVENTS.ESCROW_HELD, cmd.shiftId, cmd.companyId, {
          shift_id: cmd.shiftId,
          company_id: cmd.companyId,
          journal_id: posted.journalId,
          amount_vnd: amount.amount,
        }, cmd.ctx);
        return { held: true, journalId: posted.journalId };
      });
    } catch (err) {
      if (!(err instanceof InsufficientFundsError)) throw err;
      await this.uow.run(async (t) => {
        await emitWalletEvent(this.outbox, t, WALLET_EVENTS.ESCROW_HOLD_FAILED, cmd.shiftId, cmd.companyId, {
          shift_id: cmd.shiftId,
          company_id: cmd.companyId,
          amount_vnd: amount.amount,
          available_vnd: err.availableVnd,
          reason: 'insufficient_funds',
        }, cmd.ctx);
      });
      this.logger.warn(`escrow hold failed for shift ${cmd.shiftId}: ${err.message}`);
      return { held: false };
    }
  }
}

/** Saga participant: pay the worker (net of PIT), take the fee, refund the remainder. */
@CommandHandler(ReleaseEscrowCommand)
export class ReleaseEscrowHandler implements ICommandHandler<ReleaseEscrowCommand> {
  constructor(
    private readonly uow: UnitOfWork,
    private readonly ledger: SequelizeLedgerRepository,
    private readonly outbox: OutboxService,
  ) {}

  async execute(cmd: ReleaseEscrowCommand) {
    return this.uow.run(async (t) => {
      const done = await this.ledger.journalByKey(`escrow_release:${cmd.shiftId}`, t);
      let journalId: string;
      let splitsOut: Record<string, number>;
      if (done) {
        journalId = done.id;
        const m = done.metadata;
        splitsOut = {
          gross_vnd: m.gross_vnd,
          fee_vnd: m.fee_vnd,
          pit_vnd: m.pit_vnd,
          worker_net_vnd: m.gross_vnd - m.pit_vnd,
          employer_refund_vnd: m.employer_refund_vnd ?? 0,
        };
      } else {
        const held = await this.ledger.balance(Accounts.escrow(cmd.shiftId).code, t);
        const splits = computeReleaseSplits(held, Money.vnd(cmd.grossVnd), Money.vnd(cmd.feeVnd), pitPolicy());
        const journal = JournalTemplates.escrowRelease(cmd.shiftId, cmd.companyId, cmd.workerId, held, splits);
        journal.metadata.employer_refund_vnd = splits.employerRefund.amount;
        journalId = (await this.ledger.post(journal, t)).journalId;
        splitsOut = {
          gross_vnd: splits.gross.amount,
          fee_vnd: splits.fee.amount,
          pit_vnd: splits.pit.amount,
          worker_net_vnd: splits.workerNet.amount,
          employer_refund_vnd: splits.employerRefund.amount,
        };
      }
      await emitWalletEvent(this.outbox, t, WALLET_EVENTS.ESCROW_RELEASED, cmd.shiftId, cmd.companyId, {
        shift_id: cmd.shiftId,
        company_id: cmd.companyId,
        worker_id: cmd.workerId,
        journal_id: journalId,
        splits: splitsOut,
      }, cmd.ctx);
      return { journalId, splits: splitsOut };
    });
  }
}

/** Saga compensation: return escrow to the employer, optionally paying late-cancellation compensation. */
@CommandHandler(RefundEscrowCommand)
export class RefundEscrowHandler implements ICommandHandler<RefundEscrowCommand> {
  constructor(
    private readonly uow: UnitOfWork,
    private readonly ledger: SequelizeLedgerRepository,
    private readonly outbox: OutboxService,
  ) {}

  async execute(cmd: RefundEscrowCommand) {
    return this.uow.run(async (t) => {
      const done = await this.ledger.journalByKey(`escrow_refund:${cmd.shiftId}`, t);
      if (done) return { journalId: done.id, refunded: false };
      const held = await this.ledger.balance(Accounts.escrow(cmd.shiftId).code, t);
      if (held.isZero()) return { journalId: null, refunded: false };
      const comp = cmd.compensation && cmd.compensation.grossVnd > 0 ? Money.vnd(cmd.compensation.grossVnd) : null;
      const journal = comp
        ? JournalTemplates.cancelCompensation(cmd.shiftId, cmd.companyId, cmd.compensation!.workerId, held, comp, pitPolicy())
        : JournalTemplates.escrowRefund(cmd.shiftId, cmd.companyId, held);
      const { journalId } = await this.ledger.post(journal, t);
      const compGross = comp ? Number(journal.metadata.compensation_gross_vnd) : 0;
      const compPit = comp ? Number(journal.metadata.pit_vnd) : 0;
      await emitWalletEvent(this.outbox, t, WALLET_EVENTS.ESCROW_REFUNDED, cmd.shiftId, cmd.companyId, {
        shift_id: cmd.shiftId,
        company_id: cmd.companyId,
        journal_id: journalId,
        refund_vnd: held.amount - compGross,
        ...(comp && {
          compensation: {
            worker_id: cmd.compensation!.workerId,
            gross_vnd: compGross,
            pit_vnd: compPit,
            worker_net_vnd: compGross - compPit,
            fee_vnd: 0,
            employer_refund_vnd: held.amount - compGross,
          },
        }),
      }, cmd.ctx);
      return { journalId, refunded: true };
    });
  }
}

export const ESCROW_HANDLERS = [HoldEscrowHandler, ReleaseEscrowHandler, RefundEscrowHandler];
