import { ShiftForMatching, WorkerCandidate } from '../candidate';

export const MATCHING_STRATEGIES = 'MATCHING_STRATEGIES';

export interface ScoredCandidate {
  candidate: WorkerCandidate;
  score: number;
}

/** Ranking Strategy (docs/ARCHITECTURE.md §9.3). New strategies = new providers (Open/Closed). */
export interface MatchingStrategy {
  readonly name: string;
  rank(shift: ShiftForMatching, candidates: WorkerCandidate[]): ScoredCandidate[];
}
