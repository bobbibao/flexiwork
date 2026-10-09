import { Money } from 'src/shared/domain/money';
import { Accounts } from './account-code';
import { journal, Journal } from './ledger-posting';
import { PitWithholdingPolicy } from './policies/pit-withholding.policy';

/**
 * One factory per journal type (Factory pattern, docs/ARCHITECTURE.md §8.4).
 * Every journal is validated: postings sum to zero.
 */
export interface ReleaseSplits {
  gross: Money;
  fee: Money;
  pit: Money;
  workerNet: Money;
  employerRefund: Money;
}

export function computeReleaseSplits(held: Money, gross: Money, fee: Money, pit: PitWithholdingPolicy): ReleaseSplits {
  const pitAmount = pit.withhold(gross);
  const employerRefund = held.subtract(gross).subtract(fee);
  if (employerRefund.isNegative()) {
    throw new Error(`Release exceeds escrow: held ${held.amount}, gross ${gross.amount}, fee ${fee.amount}`);
  }
  return { gross, fee, pit: pitAmount, workerNet: gross.subtract(pitAmount), employerRefund };
}

export const JournalTemplates = {
  topUp(intentId: string, companyId: number, amount: Money, provider: string): Journal {
    return journal({
      type: 'TOPUP',
      idempotencyKey: `topup:${intentId}`,
      referenceType: 'payment_intent',
      referenceId: intentId,
      metadata: { provider },
      postings: [
        { account: Accounts.clearing(provider), amount: amount.negate() },
        { account: Accounts.employer(companyId), amount },
      ],
    });
  },

  escrowHold(shiftId: string, companyId: number, amount: Money): Journal {
    return journal({
      type: 'ESCROW_HOLD',
      idempotencyKey: `escrow_hold:${shiftId}`,
      referenceType: 'shift',
      referenceId: shiftId,
      metadata: {},
      postings: [
        { account: Accounts.employer(companyId), amount: amount.negate() },
        { account: Accounts.escrow(shiftId), amount },
      ],
    });
  },

  escrowRelease(shiftId: string, companyId: number, workerId: number, held: Money, splits: ReleaseSplits): Journal {
    return journal({
      type: 'ESCROW_RELEASE',
      idempotencyKey: `escrow_release:${shiftId}`,
      referenceType: 'shift',
      referenceId: shiftId,
      metadata: { gross_vnd: splits.gross.amount, fee_vnd: splits.fee.amount, pit_vnd: splits.pit.amount },
      postings: [
        { account: Accounts.escrow(shiftId), amount: held.negate() },
        { account: Accounts.worker(workerId), amount: splits.workerNet },
        { account: Accounts.pitPayable(), amount: splits.pit },
        { account: Accounts.feeRevenue(), amount: splits.fee },
        { account: Accounts.employer(companyId), amount: splits.employerRefund },
      ],
    });
  },

  escrowRefund(shiftId: string, companyId: number, held: Money): Journal {
    return journal({
      type: 'ESCROW_REFUND',
      idempotencyKey: `escrow_refund:${shiftId}`,
      referenceType: 'shift',
      referenceId: shiftId,
      metadata: {},
      postings: [
        { account: Accounts.escrow(shiftId), amount: held.negate() },
        { account: Accounts.employer(companyId), amount: held },
      ],
    });
  },

  cancelCompensation(shiftId: string, companyId: number, workerId: number, held: Money, compensation: Money, pit: PitWithholdingPolicy): Journal {
    const comp = compensation.min(held);
    const pitAmount = pit.withhold(comp);
    return journal({
      type: 'CANCEL_COMPENSATION',
      idempotencyKey: `escrow_refund:${shiftId}`,
      referenceType: 'shift',
      referenceId: shiftId,
      metadata: { compensation_gross_vnd: comp.amount, pit_vnd: pitAmount.amount },
      postings: [
        { account: Accounts.escrow(shiftId), amount: held.negate() },
        { account: Accounts.worker(workerId), amount: comp.subtract(pitAmount) },
        { account: Accounts.pitPayable(), amount: pitAmount },
        { account: Accounts.employer(companyId), amount: held.subtract(comp) },
      ],
    });
  },

  payoutRequest(intentId: string, workerId: number, amount: Money): Journal {
    return journal({
      type: 'PAYOUT_REQUEST',
      idempotencyKey: `payout_request:${intentId}`,
      referenceType: 'payment_intent',
      referenceId: intentId,
      metadata: {},
      postings: [
        { account: Accounts.worker(workerId), amount: amount.negate() },
        { account: Accounts.payoutPending(workerId), amount },
      ],
    });
  },

  payoutSettled(intentId: string, workerId: number, amount: Money, provider: string): Journal {
    return journal({
      type: 'PAYOUT_SETTLED',
      idempotencyKey: `payout_final:${intentId}`,
      referenceType: 'payment_intent',
      referenceId: intentId,
      metadata: { provider },
      postings: [
        { account: Accounts.payoutPending(workerId), amount: amount.negate() },
        { account: Accounts.clearing(provider), amount },
      ],
    });
  },

  payoutFailed(intentId: string, workerId: number, amount: Money): Journal {
    return journal({
      type: 'PAYOUT_FAILED',
      idempotencyKey: `payout_final:${intentId}`,
      referenceType: 'payment_intent',
      referenceId: intentId,
      metadata: {},
      postings: [
        { account: Accounts.payoutPending(workerId), amount: amount.negate() },
        { account: Accounts.worker(workerId), amount },
      ],
    });
  },
};
