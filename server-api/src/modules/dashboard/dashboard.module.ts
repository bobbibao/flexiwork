import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { DashboardController } from './controllers/dashboard.controller';
import { DashboardService } from './services/dashboard.service';
import { CacheService } from 'src/shared/services/cache.service';
import { OfferModule } from '../offers/offer.module';
import { InvoiceModule } from '../invoices/invoice.module';
import { ProjectModule } from '../projects/project.module';
import { SettingModule } from '../setting/setting.module';
import { CompanyModule } from '../company/company.module';

@Module({
  imports: [
    DatabaseModule, 
    OfferModule, 
    InvoiceModule, 
    ProjectModule, 
    SettingModule, 
    CompanyModule
  ],
  controllers: [DashboardController],
  providers: [DashboardService, CacheService],
  exports: [DashboardService]
})
export class DashboardModule {}
