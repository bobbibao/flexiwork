import { Body, Controller, Get, Inject, Logger, Param, ParseUUIDPipe, Post, Query, Req, Res, UseGuards, UsePipes } from '@nestjs/common';
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
import { CodedError, notFound } from 'src/shared/utils/coded.error';
import { toE164Vn } from 'src/shared/utils/vn-phone';
import { snConfig } from 'src/shared/sn-runtime';
import * as C from '../application/commands/shift.commands';
import { ShiftQueryService } from '../application/queries/shift-query.service';
import { ShiftPolicies } from '../application/shift-policies';
import { WORKER_DIRECTORY, WorkerDirectory } from '../application/ports/shift.ports';
import { CancelShiftDto, ConfirmCompletionDto, DirectOfferDto, DisputeDto, ListEmployerShiftsDto, PostShiftDto, QuoteShiftDto } from '../dto/shift.dto';
import { ShiftBaseController } from './shift-base.controller';

@Controller('api/sn')
@ApiTags('sn-shifts (employer)')
@ApiBearerAuth()
@UseGuards(AllowedRoleGuard([RoleEnum.ADMIN, RoleEnum.MANAGER]))
@AuditModule(AuditModuleEnum.SHIFT)
@UsePipes(snValidationPipe)
export class EmployerShiftController extends ShiftBaseController {
  constructor(
    private readonly commands: CommandBus,
    private readonly queries: ShiftQueryService,
    private readonly policies: ShiftPolicies,
    @Inject(WORKER_DIRECTORY) private readonly workers: WorkerDirectory,
  ) {
    super(new Logger(EmployerShiftController.name));
  }

  @Post('shifts')
  @Idempotent()
  @AuditAction(AuditActionEnum.CREATE)
  @ApiOperation({ summary: 'Post shift(s): headcount N creates N shifts sharing job_ref', operationId: 'snPostShift' })
  async post(@Res() res: Response, @Req() req: Request, @CurrentUser() user: User, @Body() dto: PostShiftDto) {
    try {
      const result = await this.commands.execute(
        new C.PostShiftCommand(this.access(user), this.ctx(user, req), {
          workLocationId: dto.work_location_id,
          title: dto.title,
          description: dto.description ?? null,
          skillCode: dto.skill_code,
          startAt: new Date(dto.start_at),
          endAt: new Date(dto.end_at),
          hourlyVnd: dto.hourly_vnd,
          headcount: dto.headcount ?? 1,
          dispatchMode: dto.dispatch_mode,
        }),
      );
      return this.ok(res, result);
    } catch (error) {
      return this.fail('Post shift', res, error);
    }
  }

  @Post('shifts/quote')
  @ApiOperation({ summary: 'Price preview: gross, fee, escrow hold (no side effects)', operationId: 'snQuoteShift' })
  async quote(@Res() res: Response, @Body() dto: QuoteShiftDto) {
    try {
      const start = new Date(dto.start_at);
      const end = new Date(dto.end_at);
      if (end <= start) throw new CodedError('SHIFT_DURATION_INVALID', 'End must be after start', 422);
      const q = this.policies.pricing().quote(start, end, dto.hourly_vnd);
      const fee = q.estimatedGross.percent(snConfig().SN_PLATFORM_FEE_PCT);
      return this.ok(res, {
        scheduled_minutes: q.scheduledMinutes,
        estimated_gross_vnd: q.estimatedGross.amount,
        platform_fee_vnd: fee.amount,
        escrow_amount_vnd: q.estimatedGross.add(fee).amount,
        platform_fee_pct: snConfig().SN_PLATFORM_FEE_PCT,
        segments: q.segments,
      });
    } catch (error) {
      return this.fail('Quote shift', res, error);
    }
  }

  @Get('employer/shifts')
  @ApiOperation({ summary: 'List my company shifts by tab', operationId: 'snListEmployerShifts' })
  async list(@Res() res: Response, @CurrentUser() user: User, @Query() q: ListEmployerShiftsDto) {
    try {
      const page = await this.queries.listEmployer(user.company_id, q);
      return this.sendApiResponse(res, { error: false, count: page.total_items, payload: page });
    } catch (error) {
      return this.fail('List employer shifts', res, error);
    }
  }

  @Get('employer/shifts/counts')
  @ApiOperation({ summary: 'Shift counts per tab', operationId: 'snCountEmployerShifts' })
  async counts(@Res() res: Response, @CurrentUser() user: User) {
    try {
      return this.ok(res, await this.queries.counts(user.company_id));
    } catch (error) {
      return this.fail('Count employer shifts', res, error);
    }
  }

  @Post('shifts/:id/direct-offer')
  @Idempotent()
  @AuditAction(AuditActionEnum.UPDATE)
  @ApiOperation({ summary: 'Offer the shift to a specific worker (rehire)', operationId: 'snDirectOffer' })
  async directOffer(@Res() res: Response, @Req() req: Request, @CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string, @Body() dto: DirectOfferDto) {
    try {
      let workerId = dto.worker_id;
      if (!workerId && dto.phone) {
        const phone = toE164Vn(dto.phone);
        const worker = phone ? await this.workers.findByPhone(phone) : null;
        if (!worker) throw notFound('WORKER_NOT_FOUND', 'No worker with this phone number');
        workerId = worker.userId;
      }
      if (!workerId) throw new CodedError('WORKER_REQUIRED', 'worker_id or phone is required');
      return this.ok(res, await this.commands.execute(new C.DirectOfferCommand(id, this.access(user), this.ctx(user, req), workerId)));
    } catch (error) {
      return this.fail('Direct offer', res, error);
    }
  }

  @Post('shifts/:id/cancel')
  @Idempotent()
  @AuditAction(AuditActionEnum.UPDATE)
  @ApiOperation({ summary: 'Cancel a shift (late cancellation compensates the worker)', operationId: 'snCancelShift' })
  async cancel(@Res() res: Response, @Req() req: Request, @CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string, @Body() dto: CancelShiftDto) {
    try {
      return this.ok(res, await this.commands.execute(new C.CancelShiftCommand(id, this.access(user), this.ctx(user, req), 'employer', dto.note ?? null)));
    } catch (error) {
      return this.fail('Cancel shift', res, error);
    }
  }

  @Post('shifts/:id/confirm-completion')
  @Idempotent()
  @AuditAction(AuditActionEnum.UPDATE)
  @ApiOperation({ summary: 'Confirm worked hours; triggers escrow release', operationId: 'snConfirmCompletion' })
  async confirm(@Res() res: Response, @Req() req: Request, @CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string, @Body() dto: ConfirmCompletionDto) {
    try {
      return this.ok(res, await this.commands.execute(new C.ConfirmCompletionCommand(id, this.access(user), this.ctx(user, req), dto.approved_minutes ?? null)));
    } catch (error) {
      return this.fail('Confirm completion', res, error);
    }
  }

  @Post('shifts/:id/dispute')
  @Idempotent()
  @AuditAction(AuditActionEnum.UPDATE)
  @ApiOperation({ summary: 'Dispute the completion (goes to the ops exception queue)', operationId: 'snDisputeCompletion' })
  async dispute(@Res() res: Response, @Req() req: Request, @CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string, @Body() dto: DisputeDto) {
    try {
      return this.ok(
        res,
        await this.commands.execute(new C.DisputeCompletionCommand(id, this.access(user), this.ctx(user, req), dto.reason_code, dto.note ?? null, dto.claimed_minutes ?? null)),
      );
    } catch (error) {
      return this.fail('Dispute completion', res, error);
    }
  }
}
