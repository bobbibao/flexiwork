import { forwardRef, Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { CacheService } from 'src/shared/services/cache.service';
import { JwtService } from '@nestjs/jwt';
import { CompanyModule } from '../company/company.module';
import { InvoiceModule } from '../invoices/invoice.module';
import { OfferModule } from '../offers/offer.module';
import { ProjectModule } from '../projects/project.module';
import { UsersModule } from '../users/users.module';
import { WorkItemModule } from '../work-item/work-item.module';
import { ReportController } from './controllers/report.controller';
import { ReportService } from './services/report.service';
import { reportProvider } from './report.provider';
import { DashboardModule } from '../dashboard/dashboard.module';
import { SettingModule } from '../setting/setting.module';

@Module({
  imports: [
    DatabaseModule,
    UsersModule,
    InvoiceModule,
    CompanyModule,
    SettingModule,
    forwardRef(() => DashboardModule),
    forwardRef(() => OfferModule),
    forwardRef(() => ProjectModule),
    forwardRef(() => WorkItemModule),
  ],
  controllers: [ReportController],
  providers: [ReportService, CacheService, JwtService, ...reportProvider],
  exports: [ReportService],
})
export class ReportModule {}
