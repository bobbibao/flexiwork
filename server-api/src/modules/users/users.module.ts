import { forwardRef, Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { UsersController } from './controllers/users.controller';
import { UsersService } from './services/user.service';
import { userProvider } from './users.provider';
import { AuthModule } from '../auth/auth.module';
import { CacheService } from 'src/shared/services/cache.service';
import { CompanyModule } from '../company/company.module';
import { SendMailService } from 'src/shared/services';
import { WorkItemModule } from '../work-item/work-item.module';

@Module({
  imports: [
    DatabaseModule, 
    AuthModule, 
    CompanyModule, 
    forwardRef(() => WorkItemModule)
  ],
  controllers: [UsersController],
  providers: [
    UsersService, 
    CacheService, 
    SendMailService, 
    ...userProvider
  ],
  exports: [UsersService],
})
export class UsersModule {}
