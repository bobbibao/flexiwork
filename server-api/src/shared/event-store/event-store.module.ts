import { Global, Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { UnitOfWork } from './unit-of-work';
import { EventStoreService } from './event-store.service';

@Global()
@Module({
  imports: [DatabaseModule],
  providers: [UnitOfWork, EventStoreService],
  exports: [UnitOfWork, EventStoreService, DatabaseModule],
})
export class EventStoreModule {}
