import { Global, Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { InMemoryMessageBroker } from './in-memory.message-broker';
import { KafkaMessageBroker } from './kafka.message-broker';
import { MESSAGE_BROKER } from './message-broker.port';
import { OutboxService } from './outbox.service';
import { OutboxRelayService } from './outbox-relay.service';
import { InboxService } from './inbox.service';
import { ConsumerRegistryService } from './consumer-registry.service';
import { snConfig } from '../sn-runtime';

@Global()
@Module({
  imports: [DiscoveryModule],
  providers: [
    {
      provide: MESSAGE_BROKER,
      useFactory: () => {
        const cfg = snConfig();
        return cfg.MESSAGE_BUS_DRIVER === 'kafka'
          ? new KafkaMessageBroker(cfg.KAFKA_BROKERS.split(',').map((b) => b.trim()), cfg.KAFKA_CLIENT_ID)
          : new InMemoryMessageBroker();
      },
    },
    OutboxService,
    OutboxRelayService,
    InboxService,
    ConsumerRegistryService,
  ],
  exports: [MESSAGE_BROKER, OutboxService, OutboxRelayService, InboxService, ConsumerRegistryService],
})
export class MessagingModule {}
