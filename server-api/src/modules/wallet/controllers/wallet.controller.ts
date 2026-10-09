import { Body, Controller, Get, Headers, Logger, Param, ParseUUIDPipe, Post, Query, Req, Res, UseGuards, UsePipes } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import User from 'src/database/models/users.model';
import { SnBaseController } from 'src/shared/controllers/sn-base.controller';
import { AuditAction, AuditModule, CurrentUser, PublicRoute } from 'src/shared/decorators';
import { Idempotent } from 'src/shared/decorators/idempotent.decorator';
import { AuditActionEnum, AuditModuleEnum } from 'src/shared/constants/audit.constants';
import { AllowedRoleGuard } from 'src/shared/guards';
import { RoleEnum } from 'src/shared/enums';
import { snValidationPipe } from 'src/shared/pipes/sn-validation.pipe';
import { WalletService } from '../application/wallet.service';
import { PayoutDto, StatementQueryDto, TopUpDto } from '../dto/wallet.dto';

const SN_WALLET_ROLES = [RoleEnum.WORKER, RoleEnum.ADMIN, RoleEnum.MANAGER];

@Controller('api/sn')
@ApiTags('sn-wallet')
@AuditModule(AuditModuleEnum.WALLET)
@UsePipes(snValidationPipe)
export class WalletController extends SnBaseController {
  constructor(private readonly wallets: WalletService) {
    super(new Logger(WalletController.name));
  }

  @Get('wallets/me')
  @ApiBearerAuth()
  @UseGuards(AllowedRoleGuard(SN_WALLET_ROLES))
  @ApiOperation({ summary: 'My wallet balance', operationId: 'snGetMyWallet' })
  async me(@Res() res: Response, @CurrentUser() user: User) {
    try {
      return this.ok(res, await this.wallets.wallet(user));
    } catch (error) {
      return this.fail('Get wallet', res, error);
    }
  }

  @Get('wallets/me/statement')
  @ApiBearerAuth()
  @UseGuards(AllowedRoleGuard(SN_WALLET_ROLES))
  @ApiOperation({ summary: 'My ledger statement', operationId: 'snGetMyStatement' })
  async statement(@Res() res: Response, @CurrentUser() user: User, @Query() q: StatementQueryDto) {
    try {
      return this.ok(res, await this.wallets.statement(user, q.page ?? 1, q.page_size ?? 20));
    } catch (error) {
      return this.fail('Get statement', res, error);
    }
  }

  @Post('wallets/me/top-ups')
  @ApiBearerAuth()
  @Idempotent()
  @UseGuards(AllowedRoleGuard([RoleEnum.ADMIN, RoleEnum.MANAGER]))
  @AuditAction(AuditActionEnum.CREATE)
  @ApiOperation({ summary: 'Top up the employer wallet (fake gateway in v1)', operationId: 'snCreateTopUp' })
  async topUp(@Res() res: Response, @CurrentUser() user: User, @Body() dto: TopUpDto, @Headers('idempotency-key') key: string) {
    try {
      return this.ok(res, await this.wallets.createTopUp(user, dto.amount_vnd, key));
    } catch (error) {
      return this.fail('Top up', res, error);
    }
  }

  @Post('wallets/me/payouts')
  @ApiBearerAuth()
  @Idempotent()
  @UseGuards(AllowedRoleGuard(RoleEnum.WORKER))
  @AuditAction(AuditActionEnum.CREATE)
  @ApiOperation({ summary: 'Withdraw to bank (worker)', operationId: 'snRequestPayout' })
  async payout(@Res() res: Response, @CurrentUser() user: User, @Body() dto: PayoutDto, @Headers('idempotency-key') key: string) {
    try {
      return this.ok(res, await this.wallets.requestPayout(user, dto.amount_vnd, key, dto.bank_account));
    } catch (error) {
      return this.fail('Request payout', res, error);
    }
  }

  @Get('wallets/me/intents/:id')
  @ApiBearerAuth()
  @UseGuards(AllowedRoleGuard(SN_WALLET_ROLES))
  @ApiOperation({ summary: 'Top-up / payout status', operationId: 'snGetPaymentIntent' })
  async intent(@Res() res: Response, @CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    try {
      return this.ok(res, await this.wallets.intent(user, id));
    } catch (error) {
      return this.fail('Get payment intent', res, error);
    }
  }

  /**
   * Provider webhook. The body is already parsed by the global JSON parser (src/main.ts), so the fake adapter
   * signs JSON.stringify(body). Real providers need the raw body: see PLAN.md P12.
   */
  @PublicRoute()
  @Post('payments/webhooks/:provider')
  @ApiOperation({ summary: 'Payment provider webhook (HMAC-signed)', operationId: 'snPaymentWebhook' })
  async webhook(@Res() res: Response, @Req() req: Request, @Param('provider') provider: string) {
    try {
      const raw = Buffer.from(JSON.stringify(req.body ?? {}));
      return this.ok(res, await this.wallets.handleWebhook(provider, req.headers as Record<string, any>, raw));
    } catch (error) {
      return this.fail('Payment webhook', res, error);
    }
  }
}
