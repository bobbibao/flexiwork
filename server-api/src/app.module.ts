import { HealthModule } from './modules/health/health.module';
import { Module, MiddlewareConsumer, RequestMethod, Logger } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import configuration from './shared/utils/configuration';
import { CorsMiddleware } from './shared/middlewares/cors.middleware';
import { CacheControlMiddleware } from './shared/middlewares/cache-control.middleware';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuditInterceptor } from './shared/interceptors/audit.interceptor';
import { CompressionMiddleware } from './shared/middlewares/compression.middleware';
import { PassportModule } from '@nestjs/passport';
import { CacheModule } from '@nestjs/cache-manager';
import { redisCacheStore } from './shared/redis/redis-cache.store';
import { CacheService } from './shared/services/cache.service';
import { AuthModule } from './modules/auth/auth.module';
import { MulterModule } from '@nestjs/platform-express';
import * as multer from 'multer';
import * as path from 'path';
import { SendMailService } from './shared/services/send-mail.service';
import { ScheduleModule } from '@nestjs/schedule';
import { CronService } from './shared/services/cron.service';
import { JwtService } from '@nestjs/jwt';
import { ShiftNetworkModule } from './modules/shift-network/shift-network.module';

const ENV_FOLDER_PATH = process.env.ENV_PATH ? process.env.ENV_PATH : `${process.cwd()}/env`;

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `${ENV_FOLDER_PATH}/${process.env.NODE_ENV}.env`,
      load: [configuration],
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: (): Record<string, unknown> =>
        process.env.CACHE_DRIVER === 'redis' && process.env.REDIS_URL ? { store: redisCacheStore(process.env.REDIS_URL) } : {},
    }),
    MulterModule.register({
      dest: path.resolve(__dirname, 'uploads'),
      storage: multer.memoryStorage(),
    }),
    ScheduleModule.forRoot(),
    PassportModule,
    AuthModule,
    HealthModule,
    // Core Flexiwork application
    ShiftNetworkModule,
  ],
  controllers: [AppController],
  providers: [
    JwtService,
    Logger,
    CacheService,
    AppService,
    SendMailService,
    CronService,
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(CacheControlMiddleware, CorsMiddleware, CompressionMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
