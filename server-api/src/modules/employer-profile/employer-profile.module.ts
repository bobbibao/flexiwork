import { Module } from '@nestjs/common';
import { EmployerProfileController } from './controllers/employer-profile.controller';
import { EmployerProfileService } from './services/employer-profile.service';
import { employerProfileProvider } from './employer-profile.provider';

@Module({
  controllers: [EmployerProfileController],
  providers: [EmployerProfileService, ...employerProfileProvider],
  exports: [EmployerProfileService],
})
export class EmployerProfileModule {}
