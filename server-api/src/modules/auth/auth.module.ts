import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './services/auth.service';
import { APP_GUARD } from '@nestjs/core';
import { JWTAuthGuard } from 'src/shared/guards/auth.guard';
import { authProvider } from './auth.provider';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET_KEY,
      signOptions: { expiresIn: '60s' },
    }),
  ],
  providers: [
    ...authProvider,
    AuthService,
    {
      provide: APP_GUARD,
      useClass: JWTAuthGuard,
    },
  ],
  exports: [AuthService],
})
export class AuthModule {}
