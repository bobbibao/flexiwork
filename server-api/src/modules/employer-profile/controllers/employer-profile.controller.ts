import { Body, Controller, Get, Logger, Param, ParseUUIDPipe, Post, Put, Res, UseGuards, UsePipes } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import User from 'src/database/models/users.model';
import { SnBaseController } from 'src/shared/controllers/sn-base.controller';
import { AuditAction, AuditModule, CurrentUser } from 'src/shared/decorators';
import { AuditActionEnum, AuditModuleEnum } from 'src/shared/constants/audit.constants';
import { AllowedRoleGuard } from 'src/shared/guards';
import { RoleEnum } from 'src/shared/enums';
import { snValidationPipe } from 'src/shared/pipes/sn-validation.pipe';
import { UpdateEmployerProfileDto, UpsertWorkLocationDto } from '../dto/employer-profile.dto';
import { EmployerProfileService } from '../services/employer-profile.service';

@Controller('api/sn')
@ApiTags('sn-employers')
@ApiBearerAuth()
@UseGuards(AllowedRoleGuard([RoleEnum.ADMIN, RoleEnum.MANAGER]))
@AuditModule(AuditModuleEnum.EMPLOYER_PROFILE)
@UsePipes(snValidationPipe)
export class EmployerProfileController extends SnBaseController {
  constructor(private readonly service: EmployerProfileService) {
    super(new Logger(EmployerProfileController.name));
  }

  @Get('employers/me')
  @ApiOperation({ summary: 'My employer profile', operationId: 'snGetMyEmployerProfile' })
  async getMine(@Res() res: Response, @CurrentUser() user: User) {
    try {
      return this.ok(res, await this.service.getMine(user));
    } catch (error) {
      return this.fail('Get employer profile', res, error);
    }
  }

  @Put('employers/me')
  @AuditAction(AuditActionEnum.UPDATE)
  @ApiOperation({ summary: 'Update my employer profile', operationId: 'snUpdateMyEmployerProfile' })
  async update(@Res() res: Response, @CurrentUser() user: User, @Body() dto: UpdateEmployerProfileDto) {
    try {
      return this.ok(res, await this.service.update(user, dto));
    } catch (error) {
      return this.fail('Update employer profile', res, error);
    }
  }

  @Get('work-locations')
  @ApiOperation({ summary: 'List work locations', operationId: 'snListWorkLocations' })
  async list(@Res() res: Response, @CurrentUser() user: User) {
    try {
      return this.ok(res, await this.service.listLocations(user.company_id));
    } catch (error) {
      return this.fail('List work locations', res, error);
    }
  }

  @Post('work-locations')
  @AuditAction(AuditActionEnum.CREATE)
  @ApiOperation({ summary: 'Create a work location', operationId: 'snCreateWorkLocation' })
  async create(@Res() res: Response, @CurrentUser() user: User, @Body() dto: UpsertWorkLocationDto) {
    try {
      return this.ok(res, await this.service.createLocation(user, dto));
    } catch (error) {
      return this.fail('Create work location', res, error);
    }
  }

  @Put('work-locations/:id')
  @AuditAction(AuditActionEnum.UPDATE)
  @ApiOperation({ summary: 'Update a work location', operationId: 'snUpdateWorkLocation' })
  async updateLocation(
    @Res() res: Response,
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpsertWorkLocationDto,
  ) {
    try {
      return this.ok(res, await this.service.updateLocation(user, id, dto));
    } catch (error) {
      return this.fail('Update work location', res, error);
    }
  }

  @Get('work-locations/:id/check-in-qr')
  @ApiOperation({ summary: 'Current rotating check-in QR token', operationId: 'snGetCheckInQr' })
  async qr(@Res() res: Response, @CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    try {
      return this.ok(res, await this.service.checkInQr(user, id));
    } catch (error) {
      return this.fail('Get check-in QR', res, error);
    }
  }
}
