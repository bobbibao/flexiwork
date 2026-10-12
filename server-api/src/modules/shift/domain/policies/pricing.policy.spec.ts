import { PricingPolicy } from './pricing.policy';

const vn = (s: string) => new Date(`${s}+07:00`);

describe('PricingPolicy (ARCHITECTURE §5.7)', () => {
  const pricing = new PricingPolicy();

  it('day shift on a weekday: base rate', () => {
    // Wednesday 2026-10-14
    const q = pricing.quote(vn('2026-10-14T08:00:00'), vn('2026-10-14T16:00:00'), 40_000);
    expect(q.scheduledMinutes).toBe(480);
    expect(q.estimatedGross.amount).toBe(320_000);
  });

  it('splits night work at 22:00 (+30 %)', () => {
    // 18:00-24:00 weekday: 4 h base + 2 h night
    const q = pricing.quote(vn('2026-10-14T18:00:00'), vn('2026-10-15T00:00:00'), 40_000);
    expect(q.estimatedGross.amount).toBe(4 * 40_000 + 2 * 40_000 * 1.3);
    expect(q.segments).toEqual([
      { minutes: 240, multiplier: 1 },
      { minutes: 120, multiplier: 1.3 },
    ]);
  });

  it('Sunday is the weekly rest day (200 %)', () => {
    const q = pricing.quote(vn('2026-10-18T08:00:00'), vn('2026-10-18T12:00:00'), 40_000);
    expect(q.estimatedGross.amount).toBe(4 * 40_000 * 2);
  });

  it('public holiday (300 %), including configured lunar holidays', () => {
    const q = pricing.quote(vn('2026-09-02T08:00:00'), vn('2026-09-02T10:00:00'), 40_000);
    expect(q.estimatedGross.amount).toBe(2 * 40_000 * 3);
    const tet = new PricingPolicy({ nightMultiplier: 1.3, restDayMultiplier: 2, holidayMultiplier: 3, restDays: [0], holidays: ['2027-02-06'] });
    expect(tet.quote(vn('2027-02-06T08:00:00'), vn('2027-02-06T09:00:00'), 50_000).estimatedGross.amount).toBe(150_000);
  });
});
