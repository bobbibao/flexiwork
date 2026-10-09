import { forwardRef, Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { CacheService } from 'src/shared/services';
import { CompanyModule } from '../company/company.module';
import { ExportModule } from '../export/export.module';
import { InvoiceModule } from '../invoices/invoice.module';
import { ProjectController } from './controllers/project.controller';
import { ProjectProvider } from './project.provider';
import { ProjectService } from './services/project.service';
import { SettingModule } from '../setting/setting.module';
import { CustomerModule } from '../customer/customer.module';
import { ExportFileService } from '../export/services/export-file.service';
import { EExportService } from 'src/shared/constants/export.constants';

@Module({
  imports: [
    DatabaseModule,
    CompanyModule,
    SettingModule,
    forwardRef(() => ExportModule),
    forwardRef(() => InvoiceModule),
    forwardRef(() => CustomerModule),
  ],
  controllers: [ProjectController],
  providers: [
    ProjectService,
    CacheService,
    {
      provide: ExportFileService,
      useFactory: () => {
        return new ExportFileService(EExportService.PROJECT);
      },
      inject: [],
    },
    ...ProjectProvider,
  ],
  exports: [ProjectService],
})
export class ProjectModule {}
