import { WorkerCandidate, ShiftForMatching } from './candidate';
import { defaultEligibility, HasSkill, IsAdult, WithinRadius } from './eligibility/worker.specifications';
import { WeightedScoreStrategy } from './ranking/weighted-score.strategy';
import { DispatchPolicy } from './dispatch.policy';

const shift: ShiftForMatching = {
  shiftId: 's',
  companyId: 1,
  skillCode: 'phuc_vu',
  startAt: new Date('2026-10-14T11:00:00Z'),
  endAt: new Date('2026-10-14T15:00:00Z'),
  lat: 10.7769,
  lng: 106.7009,
  excludedWorkerIds: [9],
  dispatchMode: 'broadcast',
};
const w = (over: Partial<WorkerCandidate>): WorkerCandidate => ({
  workerId: 1,
  skills: ['phuc_vu'],
  verified: true,
  suspended: false,
  dob: '2000-01-01',
  radiusKm: 10,
  distanceM: 1000,
  reliabilityScore: 80,
  ratingAvg: null,
  workedWithEmployerBefore: false,
  hasOverlappingShift: false,
  ...over,
});

describe('Matching (ARCHITECTURE §9)', () => {
  const spec = defaultEligibility();

  it('composes eligibility rules', () => {
    expect(spec.isSatisfiedBy(w({}), shift)).toBe(true);
    expect(spec.isSatisfiedBy(w({ skills: ['boc_xep'] }), shift)).toBe(false);
    expect(spec.isSatisfiedBy(w({ verified: false }), shift)).toBe(false);
    expect(spec.isSatisfiedBy(w({ distanceM: 12_000 }), shift)).toBe(false);
    expect(spec.isSatisfiedBy(w({ dob: '2010-01-01' }), shift)).toBe(false);
    expect(spec.isSatisfiedBy(w({ workerId: 9 }), shift)).toBe(false);
    expect(spec.isSatisfiedBy(w({ hasOverlappingShift: true }), shift)).toBe(false);
    expect(defaultEligibility(false).isSatisfiedBy(w({ verified: false }), shift)).toBe(true);
    expect(new HasSkill().and(new WithinRadius()).or(new IsAdult().not()).name).toContain('OR');
  });

  it('ranks closer, more reliable, better rated workers first', () => {
    const ranked = new WeightedScoreStrategy().rank(shift, [
      w({ workerId: 1, distanceM: 8000, reliabilityScore: 60, ratingAvg: 3 }),
      w({ workerId: 2, distanceM: 500, reliabilityScore: 95, ratingAvg: 4.9 }),
      w({ workerId: 3, distanceM: 500, reliabilityScore: 95, ratingAvg: 4.9, workedWithEmployerBefore: true }),
    ]);
    expect(ranked.map((r) => r.candidate.workerId)).toEqual([3, 2, 1]);
  });

  it('dispatches one (sequential) or the top K (broadcast)', () => {
    const p = new DispatchPolicy(5);
    expect(p.pick('sequential', [1, 2, 3])).toEqual([1]);
    expect(p.pick('broadcast', [1, 2, 3, 4, 5, 6, 7])).toEqual([1, 2, 3, 4, 5]);
  });
});
