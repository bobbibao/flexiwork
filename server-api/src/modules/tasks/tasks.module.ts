import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { TasksController } from './controllers/tasks.controller';
import { TasksService } from './services/tasks.service';
import { tasksProvider } from './tasks.provider';
import { ProjectModule } from '../projects/project.module';
import { SettingModule } from '../setting/setting.module';
import { ProductModule } from '../product/product.module';

@Module({
  imports: [DatabaseModule, ProjectModule, SettingModule, ProductModule],
  controllers: [TasksController],
  providers: [TasksService, ...tasksProvider],
  exports: [TasksService],
})
export class TasksModule {}
