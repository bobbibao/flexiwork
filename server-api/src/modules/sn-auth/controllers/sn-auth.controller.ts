import { Body, Controller, Get, Logger, Post, Res, UsePipes } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import User from 'src/database/models/users.model';
import { SnBaseController } from 'src/shared/controllers/sn-base.controller';
import { AuditAction, AuditModule, CurrentUser, PublicRoute } from 'src/shared/decorators';
import { AuditActionEnum, AuditModuleEnum } from 'src/shared/constants/audit.constants';
import { snValidationPipe } from 'src/shared/pipes/sn-validation.pipe';
import { RegisterEmployerDto, RegisterWorkerDto, SnLoginDto } from '../dto/sn-auth.dto';
import { SnAuthService } from '../services/sn-auth.service';

@Controller('api/sn')
@ApiTags('sn-auth')
@AuditModule(AuditModuleEnum.SN_AUTH)
@UsePipes(snValidationPipe)
export class SnAuthController extends SnBaseController {
  constructor(private readonly service: SnAuthService) {
    super(new Logger(SnAuthController.name));
  }

  @PublicRoute()
  @Post('auth/worker/register')
  @ApiOperation({ summary: 'Register a worker (người lao động)', operationId: 'snRegisterWorker' })
  async registerWorker(@Res() res: Response, @Body() dto: RegisterWorkerDto) {
    try {
      return this.ok(res, await this.service.registerWorker(dto));
    } catch (error) {
      return this.fail('Register worker', res, error);
    }
  }

  @PublicRoute()
  @Post('auth/employer/register')
  @ApiOperation({ summary: 'Register an employer (doanh nghiệp)', operationId: 'snRegisterEmployer' })
  async registerEmployer(@Res() res: Response, @Body() dto: RegisterEmployerDto) {
    try {
      return this.ok(res, await this.service.registerEmployer(dto));
    } catch (error) {
      return this.fail('Register employer', res, error);
    }
  }

  @PublicRoute()
  @Post('auth/login')
  @ApiOperation({ summary: 'Login with phone (workers) or email', operationId: 'snLogin' })
  async login(@Res() res: Response, @Body() dto: SnLoginDto) {
    try {
      const result = await this.service.login(dto);
      if ('companies' in result) return res.status(409).json({ error: true, code: 'MULTIPLE_ACCOUNTS', ...result });
      return this.ok(res, result);
    } catch (error) {
      return this.fail('Login', res, error);
    }
  }

  @Get('me')
  @ApiBearerAuth()
  @AuditAction(AuditActionEnum.VIEW)
  @ApiOperation({ summary: 'Current Shift Network session', operationId: 'snMe' })
  async me(@Res() res: Response, @CurrentUser() user: User) {
    try {
      return this.ok(res, await this.service.me(user));
    } catch (error) {
      return this.fail('Me', res, error);
    }
  }
}
