import { Body, Controller, Get, Logger, Param, ParseIntPipe, ParseUUIDPipe, Post, Put, Query, Res, UseGuards, UsePipes } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import User from 'src/database/models/users.model';
import { SnBaseController } from 'src/shared/controllers/sn-base.controller';
import { AuditAction, AuditModule, CurrentUser } from 'src/shared/decorators';
import { Idempotent } from 'src/shared/decorators/idempotent.decorator';
import { AuditActionEnum, AuditModuleEnum } from 'src/shared/constants/audit.constants';
import { AllowedRoleGuard } from 'src/shared/guards';
import { RoleEnum } from 'src/shared/enums';
import { snValidationPipe } from 'src/shared/pipes/sn-validation.pipe';
import { userActor } from 'src/shared/events/actor';
import { ShiftDomainError } from 'src/modules/shift/domain/errors/shift.errors';
import { ReconciliationService } from 'src/modules/wallet/application/reconciliation.service';
import { ExceptionResolutionService } from '../services/exception-resolution.service';
import { OpsQueryService } from '../services/ops-query.service';
import { WorkerAdminService } from '../services/worker-admin.service';
import { ListCasesDto, ListDecisionsDto, ListOpsShiftsDto, ListWorkersDto, ResolveCaseDto, UpdatePolicyDto } from '../dto/ops.dto';

/** Ops console API: the human exception queue and autonomy controls (docs/ARCHITECTURE.md §13). */
@Controller('api/sn')
@ApiTags('sn-ops')
@ApiBearerAuth()
@UseGuards(AllowedRoleGuard(RoleEnum.OPS))
@AuditModule(AuditModuleEnum.OPS)
@UsePipes(snValidationPipe)
export class OpsController extends SnBaseController {
  constructor(
    private readonly queries: OpsQueryService,
    private readonly resolution: ExceptionResolutionService,
    private readonly workers: WorkerAdminService,
    private readonly reconciliation: ReconciliationService,
  ) {
    super(new Logger(OpsController.name));
  }

  protected fail(name: string, res: Response, error: unknown) {
    if (error instanceof ShiftDomainError) return res.status(error.kind === 'transition' ? 409 : 422).json({ error: true, code: error.code, message: error.message, details: error.details });
    return super.fail(name, res, error);
  }

  @Get('ops/exceptions')
  @ApiOperation({ summary: 'Exception queue (default: open + acknowledged, severity first)', operationId: 'snOpsListExceptions' })
  async list(@Res() res: Response, @Query() q: ListCasesDto) {
    try {
      return this.ok(res, await this.queries.listCases(q));
    } catch (e) {
      return this.fail('List exceptions', res, e);
    }
  }

  @Get('ops/exceptions/:id')
  @ApiOperation({ summary: 'Case detail with related decisions', operationId: 'snOpsGetException' })
  async get(@Res() res: Response, @Param('id', ParseUUIDPipe) id: string) {
    try {
      return this.ok(res, await this.queries.getCase(id));
    } catch (e) {
      return this.fail('Get exception', res, e);
    }
  }

  @Post('ops/exceptions/:id/acknowledge')
  @Idempotent()
  @AuditAction(AuditActionEnum.UPDATE)
  @ApiOperation({ summary: 'Take a case', operationId: 'snOpsAcknowledgeException' })
  async ack(@Res() res: Response, @CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    try {
      return this.ok(res, await this.resolution.acknowledge(id, user));
    } catch (e) {
      return this.fail('Acknowledge exception', res, e);
    }
  }

  @Post('ops/exceptions/:id/resolve')
  @Idempotent()
  @AuditAction(AuditActionEnum.UPDATE)
  @ApiOperation({ summary: 'Resolve a case by executing a suggested action (or dismiss)', operationId: 'snOpsResolveException' })
  async resolve(@Res() res: Response, @CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string, @Body() dto: ResolveCaseDto) {
    try {
      return this.ok(res, await this.resolution.resolve(id, user, dto));
    } catch (e) {
      return this.fail('Resolve exception', res, e);
    }
  }

  @Get('ops/autonomy-policies')
  @ApiOperation({ summary: 'Decision points and their autonomy mode', operationId: 'snOpsListPolicies' })
  async policies(@Res() res: Response) {
    try {
      return this.ok(res, await this.queries.policies());
    } catch (e) {
      return this.fail('List policies', res, e);
    }
  }

  @Put('ops/autonomy-policies/:point')
  @AuditAction(AuditActionEnum.UPDATE)
  @ApiOperation({ summary: 'Change mode / limits / kill switch of a decision point', operationId: 'snOpsUpdatePolicy' })
  async updatePolicy(@Res() res: Response, @CurrentUser() user: User, @Param('point') point: string, @Body() dto: UpdatePolicyDto) {
    try {
      return this.ok(res, await this.queries.updatePolicy(point, dto, user.id));
    } catch (e) {
      return this.fail('Update policy', res, e);
    }
  }

  @Get('ops/decisions')
  @ApiOperation({ summary: 'Recorded autonomous decisions (explainability)', operationId: 'snOpsListDecisions' })
  async decisions(@Res() res: Response, @Query() q: ListDecisionsDto) {
    try {
      return this.ok(res, await this.queries.decisions(q));
    } catch (e) {
      return this.fail('List decisions', res, e);
    }
  }

  @Get('ops/dlq')
  @ApiOperation({ summary: 'Dead-lettered messages', operationId: 'snOpsListDlq' })
  async dlq(@Res() res: Response, @Query('status') status?: string) {
    try {
      return this.ok(res, await this.queries.dlq(status || 'OPEN'));
    } catch (e) {
      return this.fail('List DLQ', res, e);
    }
  }

  @Post('ops/dlq/:id/replay')
  @Idempotent()
  @AuditAction(AuditActionEnum.UPDATE)
  @ApiOperation({ summary: 'Replay a dead-lettered message to its consumer group', operationId: 'snOpsReplayDlq' })
  async replay(@Res() res: Response, @Param('id', ParseUUIDPipe) id: string) {
    try {
      return this.ok(res, await this.queries.replayDlq(id));
    } catch (e) {
      return this.fail('Replay DLQ', res, e);
    }
  }

  @Post('ops/reconciliation/run')
  @AuditAction(AuditActionEnum.CREATE)
  @ApiOperation({ summary: 'Run ledger reconciliation now', operationId: 'snOpsRunReconciliation' })
  async runRecon(@Res() res: Response, @CurrentUser() user: User) {
    try {
      return this.ok(res, await this.reconciliation.run(userActor(user)));
    } catch (e) {
      return this.fail('Run reconciliation', res, e);
    }
  }

  @Get('ops/reconciliation/latest')
  @ApiOperation({ summary: 'Latest reconciliation result', operationId: 'snOpsLatestReconciliation' })
  async latestRecon(@Res() res: Response) {
    try {
      return this.ok(res, await this.reconciliation.latest());
    } catch (e) {
      return this.fail('Latest reconciliation', res, e);
    }
  }

  @Get('ops/workers')
  @ApiOperation({ summary: 'Workers (verification queue)', operationId: 'snOpsListWorkers' })
  async listWorkers(@Res() res: Response, @Query() q: ListWorkersDto) {
    try {
      return this.ok(res, await this.workers.list(q));
    } catch (e) {
      return this.fail('List workers', res, e);
    }
  }

  @Post('ops/workers/:id/verify')
  @AuditAction(AuditActionEnum.UPDATE)
  @ApiOperation({ summary: 'Mark a worker verified (manual until eKYC)', operationId: 'snOpsVerifyWorker' })
  async verify(@Res() res: Response, @CurrentUser() user: User, @Param('id', ParseIntPipe) id: number) {
    try {
      return this.ok(res, await this.workers.setVerified(id, true, user));
    } catch (e) {
      return this.fail('Verify worker', res, e);
    }
  }

  @Post('ops/workers/:id/suspend')
  @AuditAction(AuditActionEnum.UPDATE)
  @ApiOperation({ summary: 'Suspend a worker', operationId: 'snOpsSuspendWorker' })
  async suspend(@Res() res: Response, @CurrentUser() user: User, @Param('id', ParseIntPipe) id: number) {
    try {
      return this.ok(res, await this.workers.setSuspended(id, true, user));
    } catch (e) {
      return this.fail('Suspend worker', res, e);
    }
  }

  @Post('ops/workers/:id/unsuspend')
  @AuditAction(AuditActionEnum.UPDATE)
  @ApiOperation({ summary: 'Lift a worker suspension', operationId: 'snOpsUnsuspendWorker' })
  async unsuspend(@Res() res: Response, @CurrentUser() user: User, @Param('id', ParseIntPipe) id: number) {
    try {
      return this.ok(res, await this.workers.setSuspended(id, false, user));
    } catch (e) {
      return this.fail('Unsuspend worker', res, e);
    }
  }

  @Get('ops/shifts')
  @ApiOperation({ summary: 'All shifts (ops view)', operationId: 'snOpsListShifts' })
  async shifts(@Res() res: Response, @Query() q: ListOpsShiftsDto) {
    try {
      return this.ok(res, await this.queries.listShifts(q));
    } catch (e) {
      return this.fail('List shifts', res, e);
    }
  }

  @Get('health/deps')
  @ApiOperation({ summary: 'Dependency health and pipeline metrics', operationId: 'snHealthDeps' })
  async health(@Res() res: Response) {
    try {
      return this.ok(res, await this.queries.health());
    } catch (e) {
      return this.fail('Health deps', res, e);
    }
  }
}
