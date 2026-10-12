import { Money } from 'src/shared/domain/money';

/**
 * Late employer cancellation compensation (docs/ARCHITECTURE.md §5.6, ⚠️ Q7 defaults):
 * >= freeCancelHours before start: free; later, with a worker assigned: compPct of the estimated gross.
 */
export class CancellationPolicy {
  constructor(
    private readonly freeCancelHours: number,
    private readonly lateCompPct: number,
  ) {}

  compensation(estimatedGross: Money, startAt: Date, now: Date, workerAssigned: boolean, escrowHeld: boolean): Money {
    if (!workerAssigned || !escrowHeld) return Money.zero();
    const hoursBefore = (startAt.getTime() - now.getTime()) / 3_600_000;
    if (hoursBefore >= this.freeCancelHours) return Money.zero();
    return estimatedGross.percent(this.lateCompPct);
  }
}
