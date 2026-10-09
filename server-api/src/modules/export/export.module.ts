import { forwardRef, Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { exportProvider } from './export.provider';
import { ExportService } from './services/export.service';
import { ExcelExportService } from './services/excel-export.service';
import { OfferModule } from '../offers/offer.module';
import { DashboardModule } from '../dashboard/dashboard.module';
import { ReportModule } from '../report/report.module';
import { CompanyModule } from '../company/company.module';
import { SettingModule } from '../setting/setting.module';
import { ExportFileService } from './services/export-file.service';
import { ExportController } from './controllers/export.controller';
import { ProjectModule } from '../projects/project.module';
import { InvoiceModule } from '../invoices/invoice.module';
import { AuthModule } from '../auth/auth.module';
import { EExportService } from 'src/shared/constants/export.constants';

@Module({
  imports: [
    AuthModule,
    DatabaseModule,
    ReportModule,
    CompanyModule,
    SettingModule,
    forwardRef(() => InvoiceModule),
    forwardRef(() => ProjectModule),
    forwardRef(() => OfferModule),
    forwardRef(() => DashboardModule),
  ],
  controllers: [ExportController],
  providers: [
    ExportService,
    {
      provide: ExportFileService,
      useFactory: () => {
        return new ExportFileService(EExportService.DEFAULT);
      },
      inject: [],
    },
    ExcelExportService,
    ...exportProvider,
  ],
  exports: [ExportService, ExportFileService, ExcelExportService],
})
export class ExportModule {}
