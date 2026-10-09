/**
 * Money value object: integer VND only (docs/ARCHITECTURE.md §8.1).
 * VND has no minor unit in practice; amounts are whole đồng held in a safe JS integer.
 */
export class Money {
  private constructor(readonly amount: number) {}

  static vnd(amount: number): Money {
    if (!Number.isSafeInteger(amount)) {
      throw new Error(`Money must be a safe integer amount of VND, got ${amount}`);
    }
    return new Money(amount);
  }

  static zero(): Money {
    return new Money(0);
  }

  static sum(items: Money[]): Money {
    return items.reduce((acc, m) => acc.add(m), Money.zero());
  }

  add(other: Money): Money {
    return Money.vnd(this.amount + other.amount);
  }

  subtract(other: Money): Money {
    return Money.vnd(this.amount - other.amount);
  }

  negate(): Money {
    return Money.vnd(-this.amount);
  }

  /** Percentage of this amount, rounded half-up (away from zero) to whole đồng. */
  percent(pct: number): Money {
    const raw = (this.amount * pct) / 100;
    return Money.vnd(Math.sign(raw) * Math.round(Math.abs(raw)));
  }

  /** Multiply by a factor (e.g. minutes/60 × rate), rounded half-up to whole đồng. */
  multiply(factor: number): Money {
    const raw = this.amount * factor;
    return Money.vnd(Math.sign(raw) * Math.round(Math.abs(raw)));
  }

  isZero(): boolean {
    return this.amount === 0;
  }

  isNegative(): boolean {
    return this.amount < 0;
  }

  isPositive(): boolean {
    return this.amount > 0;
  }

  gte(other: Money): boolean {
    return this.amount >= other.amount;
  }

  lt(other: Money): boolean {
    return this.amount < other.amount;
  }

  min(other: Money): Money {
    return this.amount <= other.amount ? this : other;
  }

  equals(other: Money): boolean {
    return this.amount === other.amount;
  }

  toJSON(): number {
    return this.amount;
  }

  toString(): string {
    return `${this.amount} VND`;
  }
}
