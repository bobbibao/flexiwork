import { Module } from '@nestjs/common';
import { ShiftModule } from '../shift/shift.module';
import { WalletModule } from '../wallet/wallet.module';
import { OpsController } from './controllers/ops.controller';
import { ExceptionResolutionService } from './services/exception-resolution.service';
import { OpsQueryService } from './services/ops-query.service';
import { WorkerAdminService } from './services/worker-admin.service';
import ExceptionCase from 'src/database/models/exception-cases.model';

/** Ops / Exceptions / Autonomy (supporting context, flat convention). */
@Module({
  imports: [ShiftModule, WalletModule],
  controllers: [OpsController],
  providers: [ExceptionResolutionService, OpsQueryService, WorkerAdminService, { provide: 'EXCEPTION_CASE_REPOSITORY', useValue: ExceptionCase }],
})
export class OpsModule {}
