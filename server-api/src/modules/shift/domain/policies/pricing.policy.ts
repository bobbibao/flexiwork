import { Money } from 'src/shared/domain/money';

/**
 * Estimated gross for a shift (docs/ARCHITECTURE.md §5.7, Strategy chain).
 * Minimum premiums per Vietnam Labour Code 2019 (⚠️ verify with counsel; all configurable):
 * night work 22:00-06:00 +30 %, weekly rest day (Sunday) 200 %, public holiday 300 %.
 * Computed in 15-minute steps in Vietnam local time (UTC+7, no DST).
 */
export interface PricingConfig {
  nightMultiplier: number;
  restDayMultiplier: number;
  holidayMultiplier: number;
  /** 0 = Sunday */
  restDays: number[];
  /** 'YYYY-MM-DD' in Vietnam local time */
  holidays: string[];
}

export const DEFAULT_PRICING: PricingConfig = {
  nightMultiplier: 1.3,
  restDayMultiplier: 2,
  holidayMultiplier: 3,
  restDays: [0],
  // Fixed-date holidays; lunar holidays (Tết, Giỗ Tổ) come from SN_PUBLIC_HOLIDAYS.
  holidays: [],
};

const FIXED_HOLIDAYS_MMDD = ['01-01', '04-30', '05-01', '09-01', '09-02'];
const VN_OFFSET_MS = 7 * 3600_000;
const STEP_MIN = 15;

export interface PriceSegment {
  minutes: number;
  multiplier: number;
}

export interface PriceQuote {
  scheduledMinutes: number;
  hourlyVnd: number;
  estimatedGross: Money;
  segments: PriceSegment[];
}

export class PricingPolicy {
  constructor(private readonly config: PricingConfig = DEFAULT_PRICING) {}

  multiplierAt(utc: Date): number {
    const local = new Date(utc.getTime() + VN_OFFSET_MS);
    const ymd = local.toISOString().slice(0, 10);
    const mmdd = ymd.slice(5);
    const hour = local.getUTCHours();
    let day = 1;
    if (FIXED_HOLIDAYS_MMDD.includes(mmdd) || this.config.holidays.includes(ymd)) day = this.config.holidayMultiplier;
    else if (this.config.restDays.includes(local.getUTCDay())) day = this.config.restDayMultiplier;
    const night = hour >= 22 || hour < 6 ? this.config.nightMultiplier : 1;
    return Math.round(day * night * 100) / 100;
  }

  quote(start: Date, end: Date, hourlyVnd: number): PriceQuote {
    const segments: PriceSegment[] = [];
    let cursor = start.getTime();
    const stop = end.getTime();
    while (cursor < stop) {
      const next = Math.min(cursor + STEP_MIN * 60_000, stop);
      const minutes = (next - cursor) / 60_000;
      const multiplier = this.multiplierAt(new Date(cursor));
      const last = segments[segments.length - 1];
      if (last && last.multiplier === multiplier) last.minutes += minutes;
      else segments.push({ minutes, multiplier });
      cursor = next;
    }
    const raw = segments.reduce((sum, s) => sum + (s.minutes / 60) * hourlyVnd * s.multiplier, 0);
    return {
      scheduledMinutes: Math.round((stop - start.getTime()) / 60_000),
      hourlyVnd,
      estimatedGross: Money.vnd(Math.round(raw)),
      segments,
    };
  }
}
