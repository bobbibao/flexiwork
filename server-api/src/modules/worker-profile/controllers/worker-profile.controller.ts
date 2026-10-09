import { Body, Controller, Get, Logger, Param, ParseIntPipe, Put, Res, UseGuards, UsePipes } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import User from 'src/database/models/users.model';
import { SnBaseController } from 'src/shared/controllers/sn-base.controller';
import { AuditAction, AuditModule, CurrentUser } from 'src/shared/decorators';
import { AuditActionEnum, AuditModuleEnum } from 'src/shared/constants/audit.constants';
import { AllowedRoleGuard } from 'src/shared/guards';
import { RoleEnum } from 'src/shared/enums';
import { snValidationPipe } from 'src/shared/pipes/sn-validation.pipe';
import { UpdateWorkerProfileDto } from '../dto/worker-profile.dto';
import { WorkerProfileService } from '../services/worker-profile.service';

@Controller('api/sn')
@ApiTags('sn-workers')
@ApiBearerAuth()
@AuditModule(AuditModuleEnum.WORKER_PROFILE)
@UsePipes(snValidationPipe)
export class WorkerProfileController extends SnBaseController {
  constructor(private readonly service: WorkerProfileService) {
    super(new Logger(WorkerProfileController.name));
  }

  @Get('workers/me')
  @UseGuards(AllowedRoleGuard(RoleEnum.WORKER))
  @ApiOperation({ summary: 'My worker profile', operationId: 'snGetMyWorkerProfile' })
  async getMine(@Res() res: Response, @CurrentUser() user: User) {
    try {
      return this.ok(res, await this.service.getMine(user));
    } catch (error) {
      return this.fail('Get my worker profile', res, error);
    }
  }

  @Put('workers/me')
  @UseGuards(AllowedRoleGuard(RoleEnum.WORKER))
  @AuditAction(AuditActionEnum.UPDATE)
  @ApiOperation({ summary: 'Update my worker profile', operationId: 'snUpdateMyWorkerProfile' })
  async update(@Res() res: Response, @CurrentUser() user: User, @Body() dto: UpdateWorkerProfileDto) {
    try {
      return this.ok(res, await this.service.update(user, dto));
    } catch (error) {
      return this.fail('Update my worker profile', res, error);
    }
  }

  @Get('workers/:id/card')
  @UseGuards(AllowedRoleGuard([RoleEnum.ADMIN, RoleEnum.MANAGER, RoleEnum.OPS]))
  @ApiOperation({ summary: 'Worker card (employer/ops view)', operationId: 'snGetWorkerCard' })
  async card(@Res() res: Response, @Param('id', ParseIntPipe) id: number) {
    try {
      return this.ok(res, await this.service.publicCard(id));
    } catch (error) {
      return this.fail('Get worker card', res, error);
    }
  }

  @Get('skills')
  @ApiOperation({ summary: 'Skill catalogue', operationId: 'snListSkills' })
  async skills(@Res() res: Response) {
    try {
      return this.ok(res, await this.service.skills());
    } catch (error) {
      return this.fail('List skills', res, error);
    }
  }
}
