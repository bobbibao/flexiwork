import { Module } from '@nestjs/common';
import { EmployerProfileModule } from '../employer-profile/employer-profile.module';
import { WorkerProfileModule } from '../worker-profile/worker-profile.module';
import { EmployerShiftController } from './controllers/employer-shift.controller';
import { WorkerShiftController } from './controllers/worker-shift.controller';
import { ShiftController } from './controllers/shift.controller';
import { SHIFT_COMMAND_HANDLERS } from './application/commands/shift-command.handlers';
import { ShiftQueryService } from './application/queries/shift-query.service';
import { ShiftFulfillmentSaga } from './application/sagas/shift-fulfillment.saga';
import { ShiftRepository } from './application/shift.repository';
import { ShiftPolicies } from './application/shift-policies';
import { ShiftViewProjector } from './infrastructure/shift-view.projector';
import { ShiftSearchService } from './infrastructure/shift-search.service';
import { shiftProvider } from './shift.provider';

/** Shift core context (docs/ARCHITECTURE.md §5, §15.2). Controller order matters: /shifts/nearby before /shifts/:id. */
@Module({
  imports: [EmployerProfileModule, WorkerProfileModule],
  controllers: [EmployerShiftController, WorkerShiftController, ShiftController],
  providers: [
    ShiftRepository,
    ShiftPolicies,
    ShiftQueryService,
    ShiftSearchService,
    ShiftFulfillmentSaga,
    ShiftViewProjector,
    ...SHIFT_COMMAND_HANDLERS,
    ...shiftProvider,
  ],
  exports: [ShiftRepository, ShiftQueryService, ShiftPolicies],
})
export class ShiftModule {}
