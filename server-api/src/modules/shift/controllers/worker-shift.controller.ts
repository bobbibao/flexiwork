import { Body, Controller, Get, Logger, Param, ParseUUIDPipe, Post, Query, Req, Res, UseGuards, UsePipes } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import User from 'src/database/models/users.model';
import { AuditAction, AuditModule, CurrentUser } from 'src/shared/decorators';
import { Idempotent } from 'src/shared/decorators/idempotent.decorator';
import { AuditActionEnum, AuditModuleEnum } from 'src/shared/constants/audit.constants';
import { AllowedRoleGuard } from 'src/shared/guards';
import { RoleEnum } from 'src/shared/enums';
import { snValidationPipe } from 'src/shared/pipes/sn-validation.pipe';
import * as C from '../application/commands/shift.commands';
import { ShiftQueryService } from '../application/queries/shift-query.service';
import { ShiftSearchService } from '../infrastructure/shift-search.service';
import { ListWorkerShiftsDto, NearbyShiftsDto, PositionDto } from '../dto/shift.dto';
import { ShiftBaseController } from './shift-base.controller';

@Controller('api/sn')
@ApiTags('sn-shifts (worker)')
@ApiBearerAuth()
@UseGuards(AllowedRoleGuard(RoleEnum.WORKER))
@AuditModule(AuditModuleEnum.SHIFT)
@UsePipes(snValidationPipe)
export class WorkerShiftController extends ShiftBaseController {
  constructor(
    private readonly commands: CommandBus,
    private readonly queries: ShiftQueryService,
    private readonly search: ShiftSearchService,
  ) {
    super(new Logger(WorkerShiftController.name));
  }

  @Get('shifts/nearby')
  @ApiOperation({ summary: 'Open shifts near a position (Elasticsearch, Postgres fallback)', operationId: 'snNearbyShifts' })
  async nearby(@Res() res: Response, @Query() q: NearbyShiftsDto) {
    try {
      return this.ok(res, await this.search.nearby({ lat: q.lat, lng: q.lng, radiusKm: q.radius_km ?? 10, skill: q.skill, from: q.from, to: q.to, text: q.q, limit: q.limit ?? 30 }));
    } catch (error) {
      return this.fail('Nearby shifts', res, error);
    }
  }

  @Get('worker/offers')
  @ApiOperation({ summary: 'Shift offers waiting for my answer', operationId: 'snListMyOffers' })
  async offers(@Res() res: Response, @CurrentUser() user: User) {
    try {
      return this.ok(res, await this.queries.listOffers(user.id));
    } catch (error) {
      return this.fail('List offers', res, error);
    }
  }

  @Get('worker/shifts')
  @ApiOperation({ summary: 'My shifts (upcoming, active, history)', operationId: 'snListMyShifts' })
  async mine(@Res() res: Response, @CurrentUser() user: User, @Query() q: ListWorkerShiftsDto) {
    try {
      return this.ok(res, await this.queries.listWorker(user.id, q.scope ?? 'upcoming', q.page ?? 1, q.page_size ?? 20));
    } catch (error) {
      return this.fail('List my shifts', res, error);
    }
  }

  @Post('shifts/:id/accept')
  @Idempotent()
  @AuditAction(AuditActionEnum.UPDATE)
  @ApiOperation({ summary: 'Accept an offered shift', operationId: 'snAcceptShift' })
  async accept(@Res() res: Response, @Req() req: Request, @CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    try {
      return this.ok(res, await this.commands.execute(new C.AcceptShiftCommand(id, this.access(user), this.ctx(user, req))));
    } catch (error) {
      return this.fail('Accept shift', res, error);
    }
  }

  @Post('shifts/:id/decline')
  @Idempotent()
  @AuditAction(AuditActionEnum.UPDATE)
  @ApiOperation({ summary: 'Decline an offer', operationId: 'snDeclineOffer' })
  async decline(@Res() res: Response, @Req() req: Request, @CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    try {
      return this.ok(res, await this.commands.execute(new C.DeclineOfferCommand(id, this.access(user), this.ctx(user, req))));
    } catch (error) {
      return this.fail('Decline offer', res, error);
    }
  }

  @Post('shifts/:id/withdraw')
  @Idempotent()
  @AuditAction(AuditActionEnum.UPDATE)
  @ApiOperation({ summary: 'Withdraw before check-in (affects reliability)', operationId: 'snWithdrawFromShift' })
  async withdraw(@Res() res: Response, @Req() req: Request, @CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    try {
      return this.ok(res, await this.commands.execute(new C.WithdrawFromShiftCommand(id, this.access(user), this.ctx(user, req))));
    } catch (error) {
      return this.fail('Withdraw', res, error);
    }
  }

  @Post('shifts/:id/check-in')
  @Idempotent()
  @AuditAction(AuditActionEnum.UPDATE)
  @ApiOperation({ summary: 'Check in (geofence, time window, optional QR)', operationId: 'snCheckIn' })
  async checkIn(@Res() res: Response, @Req() req: Request, @CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string, @Body() dto: PositionDto) {
    try {
      return this.ok(
        res,
        await this.commands.execute(new C.CheckInCommand(id, this.access(user), this.ctx(user, req), { lat: dto.lat, lng: dto.lng, accuracyM: dto.accuracy_m, qrToken: dto.qr_token })),
      );
    } catch (error) {
      return this.fail('Check in', res, error);
    }
  }

  @Post('shifts/:id/check-out')
  @Idempotent()
  @AuditAction(AuditActionEnum.UPDATE)
  @ApiOperation({ summary: 'Check out', operationId: 'snCheckOut' })
  async checkOut(@Res() res: Response, @Req() req: Request, @CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string, @Body() dto: PositionDto) {
    try {
      return this.ok(res, await this.commands.execute(new C.CheckOutCommand(id, this.access(user), this.ctx(user, req), { lat: dto.lat, lng: dto.lng, accuracyM: dto.accuracy_m })));
    } catch (error) {
      return this.fail('Check out', res, error);
    }
  }
}
