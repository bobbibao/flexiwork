import { DatabaseModule } from 'src/database/database.module';
import { CacheService } from 'src/shared/services/cache.service';

import { forwardRef, Module } from '@nestjs/common';

import { CompanyModule } from '../company/company.module';
import { CustomerModule } from '../customer/customer.module';
import { ExportModule } from '../export/export.module';
import { SettingModule } from '../setting/setting.module';
import { OfferController } from './controllers/offer.controller';
import { OfferProvider } from './offer.provider';
import { OfferService } from './services/offer.service';
import { ExportFileService } from '../export/services/export-file.service';
import { EExportService } from 'src/shared/constants/export.constants';

@Module({
  imports: [DatabaseModule, CompanyModule, forwardRef(() => ExportModule), SettingModule, CustomerModule],
  controllers: [OfferController],
  providers: [
    OfferService,
    CacheService,
    {
      provide: ExportFileService,
      useFactory: () => {
        return new ExportFileService(EExportService.OFFER);
      },
      inject: [],
    },
    ...OfferProvider,
  ],
  exports: [OfferService],
})
export class OfferModule {}
