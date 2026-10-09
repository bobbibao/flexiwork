import { Global, Inject, Injectable, Logger, Module, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { ignoreError, snConfig } from '../sn-runtime';
import { LockService } from './lock.service';
import { IdempotencyStore } from './idempotency.store';
import { IdempotencyInterceptor } from './idempotency.interceptor';

export const REDIS_CLIENT = 'REDIS_CLIENT';

@Injectable()
class RedisCloser implements OnModuleDestroy {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis | null) {}
  async onModuleDestroy() {
    if (this.redis) await this.redis.quit().catch(ignoreError);
  }
}

/**
 * Redis client (docs/ARCHITECTURE.md §12). With REDIS_URL empty, locks / idempotency fall back to
 * in-process memory: valid only for a single process (dev, unit tests).
 */
@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: () => {
        const url = snConfig().REDIS_URL;
        if (!url) {
          new Logger('RedisModule').warn('REDIS_URL empty: using in-memory locks/idempotency (single process only)');
          return null;
        }
        return new Redis(url, { maxRetriesPerRequest: 3, lazyConnect: false });
      },
    },
    RedisCloser,
    LockService,
    IdempotencyStore,
    IdempotencyInterceptor,
  ],
  exports: [REDIS_CLIENT, LockService, IdempotencyStore, IdempotencyInterceptor],
})
export class RedisModule {}
