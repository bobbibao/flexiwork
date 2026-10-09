import { forwardRef, Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { CacheService } from 'src/shared/services/cache.service';
import { CompanyModule } from '../company/company.module';
import { ExportModule } from '../export/export.module';
import { SettingModule } from '../setting/setting.module';
import { InvoiceController } from './controllers/invoice.controller';
import { InvoiceProvider } from './invoice.provider';
import { InvoiceService } from './services/invoice.service';
import { OfferModule } from '../offers/offer.module';
import { CustomerModule } from '../customer/customer.module';
import { ProjectModule } from '../projects/project.module';

@Module({
  imports: [
    DatabaseModule,
    CompanyModule,
    SettingModule,
    CustomerModule,
    forwardRef(() => ProjectModule),
    forwardRef(() => ExportModule),
    forwardRef(() => OfferModule),
  ],
  controllers: [InvoiceController],
  providers: [CacheService, InvoiceService, ...InvoiceProvider],
  exports: [InvoiceService],
})
export class InvoiceModule {}
