import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { SettingService } from './services/setting.service';
import { settingProvider } from './setting.provider';
import { SettingController } from './controllers/setting.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [SettingController],
  providers: [SettingService, ...settingProvider],
  exports: [SettingService],
})
export class SettingModule {}
