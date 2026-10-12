import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import type Redis from 'ioredis';
import { REDIS_CLIENT } from 'src/shared/redis/redis.module';
import { appRole, ignoreError } from 'src/shared/sn-runtime';

const CHANNEL = 'sn:realtime';

type Listener = (userId: number, event: string, payload: unknown) => void;

/**
 * Bridges notifications to Socket.IO clients. Workers publish on Redis; every api instance relays
 * to its own sockets (so the gateway needs no Redis adapter). Without Redis: in-process.
 */
@Injectable()
export class RealtimeService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RealtimeService.name);
  private listener: Listener | null = null;
  private subscriber: Redis | null = null;

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis | null) {}

  async onModuleInit() {
    if (this.redis && appRole() === 'api') {
      this.subscriber = this.redis.duplicate();
      await this.subscriber.subscribe(CHANNEL);
      this.subscriber.on('message', (_c, raw) => {
        try {
          const m = JSON.parse(raw);
          this.listener?.(m.userId, m.event, m.payload);
        } catch (err) {
          this.logger.warn(`bad realtime message: ${err}`);
        }
      });
    }
  }

  async onModuleDestroy() {
    if (this.subscriber) await this.subscriber.quit().catch(ignoreError);
  }

  onMessage(listener: Listener) {
    this.listener = listener;
  }

  async emit(userId: number, event: string, payload: unknown) {
    if (this.redis) {
      await this.redis.publish(CHANNEL, JSON.stringify({ userId, event, payload }));
      return;
    }
    this.listener?.(userId, event, payload);
  }
}
