export const RATING_EVENTS = {
  REPUTATION_CHANGED: 'rating.reputation_changed',
} as const;

export interface ReputationChangedPayload {
  subject_type: 'worker' | 'employer';
  subject_id: number;
  rating_avg: number | null;
  rating_count: number;
  reliability_score: number | null;
}
