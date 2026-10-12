import { Module } from '@nestjs/common';
import { RatingController } from './controllers/rating.controller';
import { RatingQueryService } from './services/rating-query.service';
import { ReputationProjector } from './services/reputation.projector';
import Rating from 'src/database/models/ratings.model';

/** Rating & reputation (supporting context, flat convention). */
@Module({
  controllers: [RatingController],
  providers: [RatingQueryService, ReputationProjector, { provide: 'RATING_REPOSITORY', useValue: Rating }],
})
export class RatingModule {}
