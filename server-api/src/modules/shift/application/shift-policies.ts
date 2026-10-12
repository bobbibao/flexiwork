import { Injectable } from '@nestjs/common';
import { snConfig } from 'src/shared/sn-runtime';
import { DEFAULT_PRICING, PricingPolicy } from '../domain/policies/pricing.policy';
import { CompletionPolicy } from '../domain/policies/completion.policy';
import { CancellationPolicy } from '../domain/policies/cancellation.policy';
import { NoShowPolicy } from '../domain/policies/no-show.policy';

/** Builds the domain policies from configuration (Strategy objects; values are ⚠️ Q7 defaults). */
@Injectable()
export class ShiftPolicies {
  pricing(): PricingPolicy {
    const holidays = (process.env.SN_PUBLIC_HOLIDAYS || '')
      .split(',')
      .map((d) => d.trim())
      .filter(Boolean);
    return new PricingPolicy({ ...DEFAULT_PRICING, holidays });
  }

  completion(): CompletionPolicy {
    return new CompletionPolicy();
  }

  cancellation(): CancellationPolicy {
    const c = snConfig();
    return new CancellationPolicy(c.SN_FREE_CANCEL_HOURS, c.SN_LATE_CANCEL_COMP_PCT);
  }

  noShow(): NoShowPolicy {
    return new NoShowPolicy();
  }

  get minHourlyVnd(): number {
    return parseInt(process.env.SN_MIN_HOURLY_VND || '', 10) || 20_000;
  }
}
