import { Money } from 'src/shared/domain/money';
import { computeReleaseSplits, JournalTemplates } from './journal-templates';
import { journal } from './ledger-posting';
import { Accounts } from './account-code';
import { FeePolicy } from './policies/fee.policy';
import { PitWithholdingPolicy } from './policies/pit-withholding.policy';

const pit = new PitWithholdingPolicy(10, 2_000_000);
const fee = new FeePolicy(10);
const sum = (j: { postings: { amount: Money }[] }) => j.postings.reduce((s, p) => s + p.amount.amount, 0);
const amountOf = (j: any, code: string) => j.postings.find((p: any) => p.account.code === code)?.amount.amount ?? 0;

describe('Ledger journals (ARCHITECTURE §8.5 worked examples)', () => {
  it('A. 8 h day shift at 40,000 VND/h: hold 352,000, release without PIT', () => {
    const gross = Money.vnd(8 * 40_000);
    const f = fee.fee(gross);
    const held = gross.add(f);
    expect(held.amount).toBe(352_000);
    const hold = JournalTemplates.escrowHold('s1', 1, held);
    expect(sum(hold)).toBe(0);
    const splits = computeReleaseSplits(held, gross, f, pit);
    const release = JournalTemplates.escrowRelease('s1', 1, 9, held, splits);
    expect(sum(release)).toBe(0);
    expect(amountOf(release, 'worker:9')).toBe(320_000);
    expect(amountOf(release, 'platform:fee_revenue')).toBe(32_000);
    expect(amountOf(release, 'platform:pit_payable')).toBe(0);
    expect(amountOf(release, 'escrow:shift:s1')).toBe(-352_000);
  });

  it('B. partial approval 6 h of 8 h refunds the remainder to the employer', () => {
    const held = Money.vnd(352_000);
    const gross = Money.vnd(240_000);
    const splits = computeReleaseSplits(held, gross, fee.fee(gross), pit);
    const release = JournalTemplates.escrowRelease('s2', 1, 9, held, splits);
    expect(sum(release)).toBe(0);
    expect(amountOf(release, 'worker:9')).toBe(240_000);
    expect(amountOf(release, 'platform:fee_revenue')).toBe(24_000);
    expect(amountOf(release, 'employer:1')).toBe(88_000);
  });

  it('C. 12 h at 200,000 VND/h withholds 10 % PIT', () => {
    const gross = Money.vnd(12 * 200_000);
    const f = fee.fee(gross);
    const held = gross.add(f);
    expect(held.amount).toBe(2_640_000);
    const release = JournalTemplates.escrowRelease('s3', 1, 9, held, computeReleaseSplits(held, gross, f, pit));
    expect(sum(release)).toBe(0);
    expect(amountOf(release, 'worker:9')).toBe(2_160_000);
    expect(amountOf(release, 'platform:pit_payable')).toBe(240_000);
    expect(amountOf(release, 'platform:fee_revenue')).toBe(240_000);
  });

  it('PIT threshold boundary', () => {
    expect(pit.withhold(Money.vnd(1_999_999)).amount).toBe(0);
    expect(pit.withhold(Money.vnd(2_000_000)).amount).toBe(200_000);
  });

  it('every template balances', () => {
    const m = Money.vnd(500_000);
    const all = [
      JournalTemplates.topUp('i1', 1, m, 'fake'),
      JournalTemplates.escrowHold('s', 1, m),
      JournalTemplates.escrowRefund('s', 1, m),
      JournalTemplates.cancelCompensation('s', 1, 9, m, Money.vnd(150_000), pit),
      JournalTemplates.payoutRequest('i2', 9, m),
      JournalTemplates.payoutSettled('i2', 9, m, 'fake'),
      JournalTemplates.payoutFailed('i2', 9, m),
    ];
    for (const j of all) expect(sum(j)).toBe(0);
  });

  it('rejects unbalanced journals and releases larger than escrow', () => {
    expect(() =>
      journal({
        type: 'TOPUP',
        idempotencyKey: 'x',
        referenceType: null,
        referenceId: null,
        metadata: {},
        postings: [
          { account: Accounts.employer(1), amount: Money.vnd(100) },
          { account: Accounts.clearing('fake'), amount: Money.vnd(-99) },
        ],
      }),
    ).toThrow();
    expect(() => computeReleaseSplits(Money.vnd(100), Money.vnd(100), Money.vnd(10), pit)).toThrow();
  });
});
