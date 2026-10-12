import { Controller, Get, Logger, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import User from 'src/database/models/users.model';
import { SnBaseController } from 'src/shared/controllers/sn-base.controller';
import { AuditModule, CurrentUser } from 'src/shared/decorators';
import { AuditModuleEnum } from 'src/shared/constants/audit.constants';
import { AllowedRoleGuard } from 'src/shared/guards';
import { RoleEnum } from 'src/shared/enums';
import { RatingQueryService } from '../services/rating-query.service';

@Controller('api/sn')
@ApiTags('sn-ratings')
@ApiBearerAuth()
@AuditModule(AuditModuleEnum.RATING)
export class RatingController extends SnBaseController {
  constructor(private readonly ratings: RatingQueryService) {
    super(new Logger(RatingController.name));
  }

  @Get('ratings/received')
  @UseGuards(AllowedRoleGuard([RoleEnum.WORKER, RoleEnum.ADMIN, RoleEnum.MANAGER]))
  @ApiOperation({ summary: 'Ratings I (or my company) received', operationId: 'snListReceivedRatings' })
  async received(@Res() res: Response, @CurrentUser() user: User) {
    try {
      const result = user.role === RoleEnum.WORKER ? await this.ratings.received('worker', user.id) : await this.ratings.received('employer', user.company_id);
      return this.ok(res, result);
    } catch (error) {
      return this.fail('Received ratings', res, error);
    }
  }
}
