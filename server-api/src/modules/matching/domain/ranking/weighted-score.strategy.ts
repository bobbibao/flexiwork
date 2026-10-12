import { ShiftForMatching, WorkerCandidate } from '../candidate';
import { MatchingStrategy, ScoredCandidate } from './matching-strategy';

export interface Weights {
  distance: number;
  reliability: number;
  rating: number;
  skill: number;
  history: number;
}

export const DEFAULT_WEIGHTS: Weights = { distance: 0.35, reliability: 0.25, rating: 0.2, skill: 0.1, history: 0.1 };

/** score = 0.35·distance_decay + 0.25·reliability + 0.20·rating + 0.10·skill_match + 0.10·worked_before. */
export class WeightedScoreStrategy implements MatchingStrategy {
  readonly name = 'weighted-score';

  constructor(private readonly weights: Weights = DEFAULT_WEIGHTS) {}

  rank(shift: ShiftForMatching, candidates: WorkerCandidate[]): ScoredCandidate[] {
    return candidates
      .map((c) => {
        const radiusM = Math.max(c.radiusKm * 1000, 1);
        const distanceDecay = Math.max(0, 1 - c.distanceM / radiusM);
        const reliability = c.reliabilityScore / 100;
        const rating = c.ratingAvg === null ? 0.6 : (c.ratingAvg - 1) / 4; // unknown rating: neutral-positive
        const skill = c.skills.includes(shift.skillCode) ? 1 : 0;
        const history = c.workedWithEmployerBefore ? 1 : 0;
        const w = this.weights;
        const score = w.distance * distanceDecay + w.reliability * reliability + w.rating * rating + w.skill * skill + w.history * history;
        return { candidate: c, score: Math.round(score * 1000) / 1000 };
      })
      .sort((a, b) => b.score - a.score || a.candidate.distanceM - b.candidate.distanceM || a.candidate.workerId - b.candidate.workerId);
  }
}
