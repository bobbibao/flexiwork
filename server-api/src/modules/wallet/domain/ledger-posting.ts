import { Money } from 'src/shared/domain/money';
import { AccountRef } from './account-code';
import { UnbalancedJournalError } from './errors/ledger.errors';

export type JournalType =
  | 'TOPUP'
  | 'ESCROW_HOLD'
  | 'ESCROW_RELEASE'
  | 'ESCROW_REFUND'
  | 'CANCEL_COMPENSATION'
  | 'PAYOUT_REQUEST'
  | 'PAYOUT_SETTLED'
  | 'PAYOUT_FAILED';

/** Signed amount: positive increases the account balance. */
export interface Posting {
  account: AccountRef;
  amount: Money;
}

export interface Journal {
  type: JournalType;
  idempotencyKey: string;
  referenceType: string | null;
  referenceId: string | null;
  postings: Posting[];
  metadata: Record<string, unknown>;
}

/** Builds a journal, dropping zero postings and asserting double entry (sum = 0). */
export function journal(input: Omit<Journal, 'postings'> & { postings: Posting[] }): Journal {
  const postings = input.postings.filter((p) => !p.amount.isZero());
  const sum = Money.sum(postings.map((p) => p.amount));
  if (!sum.isZero()) throw new UnbalancedJournalError(input.type, sum.amount);
  if (postings.length < 2) throw new UnbalancedJournalError(input.type, sum.amount);
  return { ...input, postings };
}
