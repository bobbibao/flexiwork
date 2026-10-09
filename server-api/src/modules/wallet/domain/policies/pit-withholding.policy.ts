import { Money } from 'src/shared/domain/money';

/**
 * Personal income tax withheld on one payment to a casual worker (docs/ARCHITECTURE.md §8.5).
 * Default reading of Circular 111/2013/TT-BTC: 10 % when one payment is >= 2,000,000 VND. ⚠️ Q6: configurable.
 */
export class PitWithholdingPolicy {
  constructor(
    private readonly ratePct: number,
    private readonly thresholdVnd: number,
  ) {}

  withhold(gross: Money): Money {
    if (gross.amount < this.thresholdVnd || this.ratePct <= 0) return Money.zero();
    return gross.percent(this.ratePct);
  }
}
