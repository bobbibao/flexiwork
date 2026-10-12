import { Module } from '@nestjs/common';
import { ShiftModule } from '../shift/shift.module';
import { MatchShiftHandler } from './application/match-shift.handler';
import { SearchProjectors } from './infrastructure/search.projectors';
import { matchingProvider } from './matching.provider';

/** Matching core context (docs/ARCHITECTURE.md §9). */
@Module({
  imports: [ShiftModule],
  providers: [MatchShiftHandler, SearchProjectors, ...matchingProvider],
  exports: [MatchShiftHandler],
})
export class MatchingModule {}
