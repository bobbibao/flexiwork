import { Body, Controller, Get, Logger, Param, ParseUUIDPipe, Post, Req, Res, UseGuards, UsePipes } from '@nestjs/common';
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
import { RateShiftDto, ResolveDisputeDto } from '../dto/shift.dto';
import { ShiftBaseController } from './shift-base.controller';

const PARTICIPANTS = [RoleEnum.WORKER, RoleEnum.ADMIN, RoleEnum.MANAGER, RoleEnum.OPS];

/** Endpoints shared by participants, plus the introspection endpoints for future agents (§13, item 3). */
@Controller('api/sn')
@ApiTags('sn-shifts')
@ApiBearerAuth()
@AuditModule(AuditModuleEnum.SHIFT)
@UsePipes(snValidationPipe)
export class ShiftController extends ShiftBaseController {
  constructor(
    private readonly commands: CommandBus,
    private readonly queries: ShiftQueryService,
  ) {
    super(new Logger(ShiftController.name));
  }

  @Get('shifts/:id')
  @UseGuards(AllowedRoleGuard(PARTICIPANTS))
  @ApiOperation({ summary: 'Shift detail (with my available commands)', operationId: 'snGetShift' })
  async get(@Res() res: Response, @CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    try {
      return this.ok(res, await this.queries.getForViewer(id, this.access(user)));
    } catch (error) {
      return this.fail('Get shift', res, error);
    }
  }

  @Get('shifts/:id/available-transitions')
  @UseGuards(AllowedRoleGuard(PARTICIPANTS))
  @ApiOperation({ summary: 'Commands the caller may issue now', operationId: 'snGetAvailableTransitions' })
  async transitions(@Res() res: Response, @CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    try {
      return this.ok(res, await this.queries.availableTransitions(id, this.access(user)));
    } catch (error) {
      return this.fail('Available transitions', res, error);
    }
  }

  @Get('shifts/:id/timeline')
  @UseGuards(AllowedRoleGuard(PARTICIPANTS))
  @ApiOperation({ summary: 'Event history of the shift', operationId: 'snGetShiftTimeline' })
  async timeline(@Res() res: Response, @CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    try {
      return this.ok(res, await this.queries.timeline(id, this.access(user)));
    } catch (error) {
      return this.fail('Shift timeline', res, error);
    }
  }

  @Post('shifts/:id/ratings')
  @Idempotent()
  @UseGuards(AllowedRoleGuard([RoleEnum.WORKER, RoleEnum.ADMIN, RoleEnum.MANAGER]))
  @AuditAction(AuditActionEnum.CREATE)
  @ApiOperation({ summary: 'Rate the other party after payment', operationId: 'snRateShift' })
  async rate(@Res() res: Response, @Req() req: Request, @CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string, @Body() dto: RateShiftDto) {
    try {
      return this.ok(res, await this.commands.execute(new C.RateShiftCommand(id, this.access(user), this.ctx(user, req), dto.stars, dto.tags ?? [], dto.comment ?? null)));
    } catch (error) {
      return this.fail('Rate shift', res, error);
    }
  }

  @Post('shifts/:id/resolve-dispute')
  @Idempotent()
  @UseGuards(AllowedRoleGuard(RoleEnum.OPS))
  @AuditAction(AuditActionEnum.UPDATE)
  @ApiOperation({ summary: 'Ops: resolve a disputed shift', operationId: 'snResolveDispute' })
  async resolve(@Res() res: Response, @Req() req: Request, @CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string, @Body() dto: ResolveDisputeDto) {
    try {
      return this.ok(
        res,
        await this.commands.execute(new C.ResolveDisputeCommand(id, this.access(user), this.ctx(user, req), dto.outcome, dto.approved_minutes ?? 0, dto.note ?? null)),
      );
    } catch (error) {
      return this.fail('Resolve dispute', res, error);
    }
  }
}
