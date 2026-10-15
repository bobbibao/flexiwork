import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { resolveJwtSecret } from '../utils/jwt-secret';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from 'src/modules/auth/services/auth.service';
import { IS_PUBLIC_KEY } from '../decorators/public-route.decorator';

@Injectable()
export class JWTAuthGuard extends AuthGuard('jwt') implements CanActivate {
  private readonly JWT_SECRET_KEY: string;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
    private readonly reflector: Reflector,
  ) {
    super();

    this.JWT_SECRET_KEY = resolveJwtSecret(this.configService);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // If route is public, return true
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    // Get token from request
    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization;
    if (!token) {
      throw new UnauthorizedException();
    }

    // Extract token payload
    const accessToken = token.split(' ')[1];
    let payload;
    try {
      payload = this.jwtService.verify(accessToken, {
        algorithms: ['HS256'],
        secret: process.env.JWT_SECRET_KEY,
      });
    } catch {
      throw new UnauthorizedException();
    }

    // Find user
    const userId = payload.sub;
    if (!userId) {
      throw new UnauthorizedException();
    }

    // Validate user
    const user = await this.authService.findUserById(userId);
    if (!user) {
      throw new UnauthorizedException();
    }
    if (!user.is_active) {
      throw new UnauthorizedException('This user is disabled');
    }

    request.user = user;
    return true;
  }
}
