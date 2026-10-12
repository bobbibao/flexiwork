import { Money } from 'src/shared/domain/money';
import { ShiftDomainError } from '../errors/shift.errors';

/**
 * Approved minutes -> gross pay (pro-rata of the estimated gross, so premiums stay consistent).
 * v1: no overtime above the scheduled duration, because escrow holds only the estimate.
 */
export class CompletionPolicy {
  validateApprovedMinutes(approved: number, scheduledMinutes: number): void {
    if (!Number.isInteger(approved) || approved < 0 || approved > scheduledMinutes) {
      throw new ShiftDomainError('APPROVED_MINUTES_INVALID', `Approved minutes must be between 0 and ${scheduledMinutes}`, 'rule', {
        scheduled_minutes: scheduledMinutes,
      });
    }
  }

  /** Default when the employer does not specify (or auto-confirm): worked time capped at the schedule. */
  defaultApprovedMinutes(workedMinutes: number, scheduledMinutes: number): number {
    return Math.max(0, Math.min(Math.round(workedMinutes), scheduledMinutes));
  }

  gross(estimatedGross: Money, approved: number, scheduledMinutes: number): Money {
    if (scheduledMinutes <= 0) return Money.zero();
    return estimatedGross.multiply(approved / scheduledMinutes);
  }
}
