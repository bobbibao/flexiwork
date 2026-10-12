import { ShiftForMatching, WorkerCandidate } from '../../domain/candidate';

export const CANDIDATE_SEARCH = 'CANDIDATE_SEARCH';

/** Port: find workers near a shift (Elasticsearch adapter with Postgres fallback). */
export interface CandidateSearch {
  find(shift: ShiftForMatching, maxRadiusKm: number, limit: number): Promise<WorkerCandidate[]>;
}
