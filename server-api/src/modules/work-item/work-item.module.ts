import { DatabaseModule } from 'src/database/database.module';
import { CacheService } from 'src/shared/services/cache.service';

import { forwardRef, Module } from '@nestjs/common';

import { ProductModule } from '../product/product.module';
import { ProjectModule } from '../projects/project.module';
import { SettingModule } from '../setting/setting.module';
import { UsersModule } from '../users/users.module';
import { WorkItemController } from './controllers/work-item.controller';
import { WorkItemService } from './services/work-item.service';
import { WorkSubmitService } from './services/work-submit.service';
import { WorkItemProvider } from './work-item.provider';

@Module({
  imports: [
    DatabaseModule, 
    SettingModule, 
    ProductModule,
    forwardRef(() => UsersModule), 
    forwardRef(() => ProjectModule)
  ],
  controllers: [WorkItemController],
  providers: [
    CacheService, 
    WorkItemService, 
    WorkSubmitService, 
    ...WorkItemProvider
  ],
  exports: [WorkItemService, WorkSubmitService],
})
export class WorkItemModule {}
