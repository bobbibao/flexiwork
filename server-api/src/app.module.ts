import { HealthModule } from './modules/health/health.module';
import { Module, MiddlewareConsumer, RequestMethod, Logger } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConditionalModule, ConfigModule } from '@nestjs/config';
import configuration from './shared/utils/configuration';
import { CorsMiddleware } from './shared/middlewares/cors.middleware';
import { CacheControlMiddleware } from './shared/middlewares/cache-control.middleware';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuditInterceptor } from './shared/interceptors/audit.interceptor';
import { CompressionMiddleware } from './shared/middlewares/compression.middleware';
import { PassportModule } from '@nestjs/passport';
import { CacheModule } from '@nestjs/cache-manager';
import { redisCacheStore } from './shared/redis/redis-cache.store';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { UsersModule } from './modules/users/users.module';
import { CacheService } from './shared/services/cache.service';
import { AuthModule } from './modules/auth/auth.module';
import { InvoiceModule } from './modules/invoices/invoice.module';
import { SettingModule } from './modules/setting/setting.module';
import { OfferModule } from './modules/offers/offer.module';
import { ExpenseModule } from './modules/expense/expense.module';
import { MulterModule } from '@nestjs/platform-express';
import * as multer from 'multer';
import * as path from 'path';
import { CompanyModule } from './modules/company/company.module';
import { ProjectModule } from './modules/projects/project.module';
import { CustomerModule } from './modules/customer/customer.module';
import { ProductModule } from './modules/product/product.module';
import { WorkItemModule } from './modules/work-item/work-item.module';
import { ReportModule } from './modules/report/report.module';
import { SendMailService } from './shared/services/send-mail.service';
import { ExportModule } from './modules/export/export.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { ScheduleModule } from '@nestjs/schedule';
import { CronService } from './shared/services/cron.service';
import { JwtService } from '@nestjs/jwt';
import { ShiftNetworkModule } from './modules/shift-network/shift-network.module';

const APP_MODULES = [
  DashboardModule,
  UsersModule,
  InvoiceModule,
  OfferModule,
  PassportModule,
  AuthModule,
  SettingModule,
  ExpenseModule,
  CompanyModule,
  ProjectModule,
  CustomerModule,
  ProductModule,
  WorkItemModule,
  ReportModule,
  ExportModule,
  TasksModule,
  HealthModule,
];
const ENV_FOLDER_PATH = process.env.ENV_PATH ? process.env.ENV_PATH : `${process.cwd()}/env`;

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `${ENV_FOLDER_PATH}/${process.env.NODE_ENV}.env`,
      load: [configuration],
    }),
    // CACHE_DRIVER=redis (PLAN.md P12.2) shares the cache across instances; default stays in-memory (unchanged behaviour).
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
    ...APP_MODULES,
    // Shift Network (docs/PLAN.md P1.9): loaded only when FEATURE_SHIFT_NETWORK=true
    ConditionalModule.registerWhen(ShiftNetworkModule, (env: NodeJS.ProcessEnv) => env.FEATURE_SHIFT_NETWORK === 'true'),
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
