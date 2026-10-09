import { Global, Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { TimerService } from './timer.service';

@Global()
@Module({
  imports: [DiscoveryModule],
  providers: [TimerService],
  exports: [TimerService],
})
export class TimersModule {}
