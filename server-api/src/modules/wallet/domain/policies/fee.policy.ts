import { Money } from 'src/shared/domain/money';

/** Platform fee charged to the employer on top of gross (⚠️ Q5). */
export class FeePolicy {
  constructor(private readonly pct: number) {}

  fee(gross: Money): Money {
    return gross.percent(this.pct);
  }
}
