import { ShiftForMatching, WorkerCandidate } from '../candidate';
import { Specification } from './specification';

type Spec = Specification<WorkerCandidate, ShiftForMatching>;

export class IsVerifiedWorker extends Specification<WorkerCandidate, ShiftForMatching> {
  readonly name = 'IsVerifiedWorker';
  isSatisfiedBy(w: WorkerCandidate) {
    return w.verified;
  }
}

export class NotSuspended extends Specification<WorkerCandidate, ShiftForMatching> {
  readonly name = 'NotSuspended';
  isSatisfiedBy(w: WorkerCandidate) {
    return !w.suspended;
  }
}

export class HasSkill extends Specification<WorkerCandidate, ShiftForMatching> {
  readonly name = 'HasSkill';
  isSatisfiedBy(w: WorkerCandidate, s: ShiftForMatching) {
    return w.skills.includes(s.skillCode);
  }
}

/** Within the worker's own travel radius. */
export class WithinRadius extends Specification<WorkerCandidate, ShiftForMatching> {
  readonly name = 'WithinRadius';
  isSatisfiedBy(w: WorkerCandidate) {
    return w.distanceM <= w.radiusKm * 1000;
  }
}

/**
 * Adults only (⚠️ minors excluded by default). A missing date of birth is accepted because adulthood is
 * attested when accepting the terms; a known date under 18 is rejected.
 */
export class IsAdult extends Specification<WorkerCandidate, ShiftForMatching> {
  readonly name = 'IsAdult';
  isSatisfiedBy(w: WorkerCandidate, s: ShiftForMatching) {
    if (!w.dob) return true;
    const dob = new Date(w.dob);
    const eighteen = new Date(dob.getFullYear() + 18, dob.getMonth(), dob.getDate());
    return eighteen <= s.startAt;
  }
}

export class NotExcludedForShift extends Specification<WorkerCandidate, ShiftForMatching> {
  readonly name = 'NotExcludedForShift';
  isSatisfiedBy(w: WorkerCandidate, s: ShiftForMatching) {
    return !s.excludedWorkerIds.includes(w.workerId);
  }
}

export class NoOverlappingReservation extends Specification<WorkerCandidate, ShiftForMatching> {
  readonly name = 'NoOverlappingReservation';
  isSatisfiedBy(w: WorkerCandidate) {
    return !w.hasOverlappingShift;
  }
}

/** Default eligibility (docs/ARCHITECTURE.md §9.2). */
export function defaultEligibility(requireVerified = true): Spec {
  let spec: Spec = new NotSuspended()
    .and(new HasSkill())
    .and(new WithinRadius())
    .and(new IsAdult())
    .and(new NotExcludedForShift())
    .and(new NoOverlappingReservation());
  if (requireVerified) spec = new IsVerifiedWorker().and(spec);
  return spec;
}
