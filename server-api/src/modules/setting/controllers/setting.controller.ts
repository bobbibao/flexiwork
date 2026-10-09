import { TabOfSettings } from 'src/database/models/setting.model';
import User from 'src/database/models/users.model';
import { BaseController } from 'src/shared/controllers/base.controller';
import { AuditModule, CurrentUser } from 'src/shared/decorators';
import { ApiResponse, BadRequestError } from 'src/shared/utils';
import { Body, Controller, Get, Logger, Param, Post, Put, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse as ApiResponseDecorator,
  ApiTags,
} from '@nestjs/swagger';
import { SettingService } from '../services/setting.service';
import { Response } from 'express';
import { AuditModuleEnum } from 'src/shared/constants/audit.constants';

@Controller('/api/setting')
@ApiBearerAuth()
@ApiTags('Setting')
@AuditModule(AuditModuleEnum.SETTING)
export class SettingController extends BaseController {
  constructor(private readonly settingService: SettingService) {
    super(new Logger(SettingController.name));
  }

  @Get('')
  @ApiOperation({ summary: 'Get Setting', operationId: 'setting' })
  @ApiResponseDecorator({
    status: 200,
    description: 'Returns of setting',
    type: ApiResponse,
    isArray: false,
  })
  async setting(@Res() res: Response, @CurrentUser() user: User) {
    try {
      if (!user.company_id) {
        throw new BadRequestError('Company ID not found');
      }

      const setting = await this.settingService.selectSetting(user.company_id);
      const { ...data } = setting;

      return this.sendApiResponse(res, { error: false, payload: data });
    } catch (error: unknown) {
      return this.throwError('getSetting', res, error);
    }
  }

  @Put('/logo')
  @ApiOperation({ summary: 'Get Setting', operationId: 'logo' })
  @UseInterceptors(FileInterceptor('file'))
  @ApiResponseDecorator({
    status: 200,
    description: 'Returns of setting',
    type: ApiResponse,
    isArray: false,
  })
  async uploadLogo(@Res() res: Response, @CurrentUser() currentUser: User, @UploadedFile() file?: Express.Multer.File) {
    try {
      // Validate inputs
      if (!file) {
        throw new BadRequestError('Logo is required');
      }

      // Handle to update settings
      await this.settingService.updateSetting(currentUser.company_id, 'pdflayout', { logo: file });

      return this.sendApiResponse(res, { error: false });
    } catch (error: unknown) {
      return this.throwError('updateLogoSetting', res, error);
    }
  }

  @Post('/:tab')
  @ApiOperation({ summary: 'Update Setting', operationId: 'updateSetting' })
  @ApiResponseDecorator({
    status: 200,
    description: 'Returns of setting',
    type: ApiResponse,
    isArray: false,
  })
  @ApiParam({
    name: 'tab',
    description: 'Tab of setting',
    type: String,
  })
  @ApiBody({ type: Object })
  async updateSetting(
    @Res() res: Response,
    @CurrentUser() user: User,
    @Param('tab') tab: TabOfSettings,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    @Body() body: Record<string, any>,
  ) {
    try {
      await this.settingService.updateSetting(user.company_id, tab, body);

      return this.sendApiResponse(res, { error: false });
    } catch (error: unknown) {
      return this.throwError('Update Setting', res, error);
    }
  }
}
