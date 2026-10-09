import { Module } from '@nestjs/common';
import { WorkerProfileController } from './controllers/worker-profile.controller';
import { WorkerProfileService } from './services/worker-profile.service';
import { workerProfileProvider } from './worker-profile.provider';

@Module({
  controllers: [WorkerProfileController],
  providers: [WorkerProfileService, ...workerProfileProvider],
  exports: [WorkerProfileService],
})
export class WorkerProfileModule {}
