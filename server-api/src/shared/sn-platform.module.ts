import { Global, Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { EventStoreModule } from './event-store/event-store.module';
import { MessagingModule } from './messaging/messaging.module';
import { RedisModule } from './redis/redis.module';
import { TimersModule } from './timers/timers.module';
import { SearchModule } from './search/search.module';
import { AutonomyModule } from './autonomy/autonomy.module';

/**
 * Shift Network platform layer (PLAN.md P1): event store, outbox/inbox, broker, Redis, timers, search,
 * autonomy. Global, imported once by ShiftNetworkModule (api role) and WorkerModule (worker role).
 */
@Global()
@Module({
  imports: [
    CqrsModule.forRoot(),
    EventStoreModule,
    MessagingModule,
    RedisModule,
    TimersModule,
    SearchModule,
    AutonomyModule,
  ],
  exports: [CqrsModule, EventStoreModule, MessagingModule, RedisModule, TimersModule, SearchModule, AutonomyModule],
})
export class SnPlatformModule {}
