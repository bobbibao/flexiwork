import { Provider } from '@nestjs/common';
import { CANDIDATE_SEARCH } from './application/ports/candidate-search.port';
import { FallbackCandidateSearch } from './infrastructure/es-candidate-search';
import { PostgresCandidateSearch } from './infrastructure/postgres-candidate-search';
import { MATCHING_STRATEGIES } from './domain/ranking/matching-strategy';
import { WeightedScoreStrategy } from './domain/ranking/weighted-score.strategy';

export const matchingProvider: Provider[] = [
  PostgresCandidateSearch,
  FallbackCandidateSearch,
  { provide: CANDIDATE_SEARCH, useExisting: FallbackCandidateSearch },
  // Strategy registry: add a provider here to change ranking without touching the handler (OCP).
  { provide: MATCHING_STRATEGIES, useFactory: () => [new WeightedScoreStrategy()] },
];
