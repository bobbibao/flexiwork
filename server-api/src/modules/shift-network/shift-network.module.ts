import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { SnPlatformModule } from 'src/shared/sn-platform.module';
import { SnLegacyIsolationInterceptor } from 'src/shared/interceptors/sn-legacy-isolation.interceptor';
import { CorrelationIdMiddleware } from 'src/shared/middlewares/correlation-id.middleware';
import { SN_CONTEXT_MODULES } from './sn-context-modules';

/**
 * Aggregator for all Shift Network bounded contexts (docs/ARCHITECTURE.md §4).
 * Imported by AppModule when FEATURE_SHIFT_NETWORK=true, and by WorkerModule.
 */
@Module({
  imports: [SnPlatformModule, ...SN_CONTEXT_MODULES],
  providers: [{ provide: APP_INTERCEPTOR, useClass: SnLegacyIsolationInterceptor }],
})
export class ShiftNetworkModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(CorrelationIdMiddleware).forRoutes({ path: 'api/sn/*', method: RequestMethod.ALL });
  }
}
