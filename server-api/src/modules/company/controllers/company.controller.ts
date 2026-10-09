import { Response } from 'express';
import User from 'src/database/models/users.model';
import { BaseController } from 'src/shared/controllers/base.controller';
import { AuditModule, CurrentUser, AuditAction } from 'src/shared/decorators';
import { ApiResponse, BadRequestError, formatDateToISOStringWithMachineTimezone } from 'src/shared/utils';

import { Body, Controller, Delete, Get, Logger, Param, Post, Res } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiResponse as ApiResponseDecorator, ApiTags } from '@nestjs/swagger';

import { CompanyConnectDto, CompanyConnectedDto } from '../dto';
import { CompanyService } from '../services/company.service';
import { AuditModuleEnum, AuditActionEnum } from 'src/shared/constants/audit.constants';

@Controller('/api/company')
@ApiTags('Company')
@AuditModule(AuditModuleEnum.COMPANY)
export class CompanyController extends BaseController {
  constructor(private readonly companyService: CompanyService) {
    super(new Logger(CompanyController.name));
  }

  @Get('')
  @ApiOperation({ summary: 'Get Company', operationId: 'company' })
  @ApiResponseDecorator({
    status: 200,
    description: 'Returns of company',
    type: ApiResponse,
    isArray: false,
  })
  async company(@Res() res: Response, @CurrentUser() user: User) {
    try {
      const company = await this.companyService.selectCompany(user.company_id);

      return this.sendApiResponse(res, { error: false, payload: company });
    } catch (error) {
      return this.throwError('Get Company', res, error);
    }
  }

  @Get('/shares')
  @ApiOperation({ summary: 'Get Company Shares', operationId: 'companyShares' })
  @ApiResponseDecorator({
    status: 200,
    description: 'Returns of company shares',
    type: ApiResponse,
    isArray: true,
  })
  async getShares(@Res() res: Response, @CurrentUser() user: User) {
    try {
      const shares = await this.companyService.selectShares(user.company_id);

      return this.sendApiResponse(res, { error: false, payload: shares, count: shares.length });
    } catch (error) {
      return this.throwError('Get Company Shares', res, error);
    }
  }

  @Get('/newsign')
  @ApiOperation({ summary: 'Get New Signature', operationId: 'newSignature' })
  @ApiResponseDecorator({
    status: 200,
    description: 'Returns of new signature',
    type: ApiResponse,
    isArray: false,
  })
  async newSignature(@Res() res: Response, @CurrentUser() user: User) {
    try {
      await this.companyService.newSignature(user.company_id);

      return this.sendApiResponse(res, { error: false });
    } catch (error) {
      return this.throwError('Get New Signature', res, error);
    }
  }

  @Post('/connect')
  @AuditAction(AuditActionEnum.CREATE)
  @ApiOperation({ summary: 'Connect Company', operationId: 'connectCompany' })
  @ApiResponseDecorator({
    status: 200,
    description: 'Returns of company',
    type: ApiResponse,
    isArray: false,
  })
  @ApiBody({ type: CompanyConnectDto })
  async connectCompany(@Res() res: Response, @CurrentUser() user: User, @Body() body: CompanyConnectDto) {
    try {
      if (!body.signature) {
        throw new BadRequestError('EOF');
      }

      const company = await this.companyService.selectCompany(user.company_id);
      if (company.signature === body.signature) {
        throw new BadRequestError('cannot add your company itself');
      }

      const { id, signature, created_at } = await this.companyService.connectCompany(user.company_id, body.signature);

      const data: CompanyConnectedDto = {
        id,
        signature,
        created_at: formatDateToISOStringWithMachineTimezone(created_at),
      };

      return this.sendApiResponse(res, { error: false, payload: data });
    } catch (error) {
      return this.throwError('Connect Company', res, error);
    }
  }

  @Delete('/remove/:sign')
  @AuditAction(AuditActionEnum.DELETE)
  @ApiOperation({ summary: 'Remove Company', operationId: 'removeCompany' })
  @ApiResponseDecorator({
    status: 200,
    description: 'Returns of company',
    type: ApiResponse,
    isArray: false,
  })
  @ApiParam({
    name: 'sign',
    description: 'Signature of company',
    type: String,
  })
  async remove(@Res() res: Response, @CurrentUser() user: User, @Param('sign') signature: string) {
    try {
      const sign = signature.replaceAll(' ', '');
      if (sign.length === 0) {
        throw new BadRequestError('invalid signature');
      }

      await this.companyService.removeCompany(user.company_id, sign);

      return this.sendApiResponse(res, { error: false });
    } catch (error) {
      return this.throwError('Remove Company', res, error);
    }
  }
}
