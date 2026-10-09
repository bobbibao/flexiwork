import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { SnAuthController } from './controllers/sn-auth.controller';
import { SnAuthService } from './services/sn-auth.service';
import { snAuthProvider } from './sn-auth.provider';

@Module({
  imports: [AuthModule],
  controllers: [SnAuthController],
  providers: [SnAuthService, ...snAuthProvider],
  exports: [SnAuthService],
})
export class SnAuthModule {}
