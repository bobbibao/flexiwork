import { Inject, Injectable } from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';

import User from 'src/database/models/users.model';
import { RoleEnum } from 'src/shared/enums';
import { ConfigService } from '@nestjs/config';
import { resolveJwtSecret } from 'src/shared/utils/jwt-secret';
import { UnauthorizedError } from 'src/shared/utils';

@Injectable()
export class AuthService {
  private readonly JWT_SECRET_KEY: string;
  private readonly ADMIN_TOKEN_EXPIRES_IN: number;
  private readonly EMPLOYEE_TOKEN_EXPIRES_IN: number;
  constructor(
    @Inject('USER_REPOSITORY')
    private readonly usersRepository: typeof User,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.JWT_SECRET_KEY = resolveJwtSecret(this.configService);
    this.ADMIN_TOKEN_EXPIRES_IN = this.configService.get<number>('ADMIN_TOKEN_EXPIRES_IN', 8 * 60 * 60);
    this.EMPLOYEE_TOKEN_EXPIRES_IN = this.configService.get<number>('EMPLOYEE_TOKEN_EXPIRES_IN', 12 * 60 * 60);
  }

  async findUserById(id: string): Promise<User> {
    return await this.usersRepository.findOne({ where: { id } });
  }

  generateToken(user: User): string {
    const tokenLifetime =
      user.role === RoleEnum.EMPLOYEE || user.role === RoleEnum.MANAGER
        ? this.EMPLOYEE_TOKEN_EXPIRES_IN
        : this.ADMIN_TOKEN_EXPIRES_IN;
    // Create token payload
    const tokenPayload = {
      sub: user.id.toString(),
    };

    // Create token options
    const tokenOptions: JwtSignOptions = {
      algorithm: 'HS256',
      secret: this.JWT_SECRET_KEY,
      expiresIn: tokenLifetime,
    };

    const token = this.jwtService.sign(tokenPayload, tokenOptions);
    return token;
  }

  async decode(token: string): Promise<User> {
    try {
      const payload = this.jwtService.verify(token, {
        algorithms: ['HS256'],
        secret: process.env.JWT_SECRET_KEY,
        ignoreExpiration: false,
      });

      if (payload && payload.sub) {
        const user = await this.findUserById(payload.sub.toString());
        return user.get({ plain: true });
      } else {
        // You can customize error message here
        throw '';
      }
    } catch (error) {
      throw new UnauthorizedError('Invalid code!');
    }
  }
}
