import { Money } from './money';

describe('Money', () => {
  it('accepts only safe integers', () => {
    expect(Money.vnd(320000).amount).toBe(320000);
    expect(() => Money.vnd(1.5)).toThrow();
    expect(() => Money.vnd(Number.MAX_SAFE_INTEGER + 1)).toThrow();
  });

  it('adds, subtracts and negates', () => {
    expect(Money.vnd(100).add(Money.vnd(50)).amount).toBe(150);
    expect(Money.vnd(100).subtract(Money.vnd(150)).amount).toBe(-50);
    expect(Money.vnd(100).negate().amount).toBe(-100);
    expect(Money.sum([Money.vnd(1), Money.vnd(2), Money.vnd(3)]).amount).toBe(6);
  });

  it('rounds percentages half-up to whole dong', () => {
    expect(Money.vnd(320000).percent(10).amount).toBe(32000);
    expect(Money.vnd(15).percent(10).amount).toBe(2); // 1.5 -> 2
    expect(Money.vnd(14).percent(10).amount).toBe(1); // 1.4 -> 1
    expect(Money.vnd(-15).percent(10).amount).toBe(-2);
  });
});
