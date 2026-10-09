import { Response } from 'express';
import User from 'src/database/models/users.model';
import { BaseController } from 'src/shared/controllers/base.controller';
import { AuditModule, CurrentUser, AuditAction } from 'src/shared/decorators';
import { RoleEnum } from 'src/shared/enums';
import { AllowedRoleGuard } from 'src/shared/guards';
import { ApiResponse } from 'src/shared/utils/api-response';
import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Logger,
  Param,
  Post,
  Put,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse as ApiResponseDecorator,
  ApiTags,
} from '@nestjs/swagger';
import { AcceptOfferDto, CreateOfferDto, GenerateProductDto, UpdateOfferDto } from '../dto';
import { OfferService } from '../services/offer.service';
import { BadRequestError } from 'src/shared/utils';
import { isArray, isNumberString } from 'class-validator';
import { BulkDeleteOffersDto } from '../dto/bulk-delete-offers.dto';
import { AuditModuleEnum, AuditActionEnum } from 'src/shared/constants/audit.constants';

@UseGuards(AllowedRoleGuard([RoleEnum.ADMIN, RoleEnum.MANAGER]))
@Controller('api')
@ApiBearerAuth()
@ApiTags('Offers')
@AuditModule(AuditModuleEnum.OFFER)
export class OfferController extends BaseController {
  constructor(private readonly offerServices: OfferService) {
    super(new Logger(OfferController.name));
  }

  @Get('/offers')
  @ApiOperation({ summary: 'Get List Offers', operationId: 'listOffers' })
  @ApiResponseDecorator({
    status: 200,
    description: 'List of offers',
    type: ApiResponse,
    isArray: true,
  })
  @ApiQuery({ name: 'status', type: String, required: false })
  async listOffers(
    @Res() res: Response,
    @CurrentUser() currentUser: User,
    @Query('status', new DefaultValuePipe('all')) status: string,
    @Query('page') page: string,
    @Query('page_size') pageSize: string,
    @Query('sort') sort: string,
    @Query('search') search: string,
  ) {
    try {
      if (page) {
        if (!isNumberString(page)) {
          throw new BadRequestError('Page must be numbers!');
        }
        if (!isNumberString(pageSize)) {
          throw new BadRequestError('Page size must be numbers!');
        }
      }

      const pageInNumber = parseInt(page) < 1 ? 1 : parseInt(page);
      const pageSizeInNumber = parseInt(pageSize) < 5 ? 5 : parseInt(pageSize);
      const query = {
        page: pageInNumber,
        pageSize: pageSizeInNumber,
        sort: sort,
        search: search,
      };
      const offers = await this.offerServices.listOffers(currentUser, status, query);

      return this.sendApiResponse(res, {
        error: false,
        payload: offers,
        count: offers.detailedOffers.length,
      });
    } catch (error) {
      return this.throwError('Get List Offers', res, error);
    }
  }

  @Get('/offer/:id')
  @ApiOperation({ summary: 'Get Detailed Offer', operationId: 'getOffer' })
  @ApiResponseDecorator({ status: 200, description: 'Return detail of offers', type: ApiResponse, isArray: false })
  @ApiParam({ name: 'id', type: Number, description: 'Id of the offer', required: true })
  async getOffer(@Res() res: Response, @CurrentUser() user: User, @Param('id') offerId: string) {
    try {
      // Validate inputs
      if (!isNumberString(offerId)) {
        throw new BadRequestError('Offer id is not valid');
      }

      // Handle to get offer
      const offerIdInNumber = parseInt(offerId);

      const offer = await this.offerServices.getDetailedOffer(user.company_id, offerIdInNumber);

      return this.sendApiResponse(res, { error: false, payload: offer });
    } catch (error) {
      return this.throwError('Get Detailed Offer', res, error);
    }
  }

  @Post('/offer')
  @AuditAction(AuditActionEnum.CREATE)
  @ApiOperation({ summary: 'Create Offer', operationId: 'createOffer' })
  @ApiResponseDecorator({ status: 200, type: ApiResponse, isArray: false })
  @ApiBody({ type: CreateOfferDto })
  async createOffer(@Res() res: Response, @CurrentUser() user: User, @Body() createOfferDto: CreateOfferDto) {
    try {
      await this.offerServices.createOffer(createOfferDto, user.company_id);
      return this.sendApiResponse(res, { error: false });
    } catch (error) {
      return this.throwError('Create Offer', res, error);
    }
  }

  @Post('/offer/:id/copy')
  @AuditAction(AuditActionEnum.CREATE)
  @ApiOperation({ summary: 'Copy Offer', operationId: 'copyOffer' })
  @ApiResponseDecorator({ status: 200, type: ApiResponse, isArray: false })
  @ApiParam({ name: 'id', type: Number, description: 'Id of the offer', required: true })
  async copyOffer(@Res() res: Response, @CurrentUser() user: User, @Param('id') offerId: number) {
    try {
      await this.offerServices.copyOffer(offerId, user.company_id);

      return this.sendApiResponse(res, { error: false });
    } catch (error) {
      return this.throwError('Copy Offer', res, error);
    }
  }

  @Post('/offer/:id/accept')
  @AuditAction(AuditActionEnum.UPDATE)
  @ApiOperation({ summary: 'Accept Offer', operationId: 'acceptOffer' })
  @ApiResponseDecorator({ status: 200, type: ApiResponse, isArray: false })
  @ApiParam({ name: 'id', type: Number, description: 'Id of the offer', required: true })
  @ApiBody({ type: AcceptOfferDto })
  async acceptOffer(
    @Res() res: Response,
    @CurrentUser() user: User,
    @Param('id') offerId: number,
    @Body() dto: AcceptOfferDto,
  ) {
    try {
      const result = await this.offerServices.acceptOffer(user.id, user.company_id, offerId, dto);

      return this.sendApiResponse(res, { error: false, payload: result });
    } catch (error) {
      return this.throwError('Accept Offer', res, error);
    }
  }

  @Post('generate-products')
  @AuditAction(AuditActionEnum.CREATE)
  async generateProducts(
    @Res({ passthrough: true }) res: Response,
    @CurrentUser() currentUser: User,
    @Query('type') offerType: string,
    @Body() generateProductDto: GenerateProductDto,
  ) {
    try {
      if (!generateProductDto) {
        throw new BadRequestError('Miss product information');
      }

      const result = await this.offerServices.generateProducts(currentUser.company_id, offerType, generateProductDto);

      return {
        error: false,
        ...result,
      };
    } catch (error) {
      return this.throwError('Generate Products', res, error, true);
    }
  }

  @Put('/offer/:id')
  @AuditAction(AuditActionEnum.UPDATE)
  @ApiOperation({ summary: 'Update Offer', operationId: 'updateOffer' })
  @ApiResponseDecorator({ status: 200, type: ApiResponse, isArray: false })
  @ApiParam({ name: 'id', type: Number, description: 'Id of the offer', required: true })
  @ApiBody({ type: UpdateOfferDto })
  async updateOffer(
    @Res() res: Response,
    @CurrentUser() currentUser: User,
    @Param('id') offerId: string,
    @Body() updateOfferDto: UpdateOfferDto,
  ) {
    try {
      // Validate inputs
      if (!isNumberString(offerId)) {
        throw new BadRequestError('Offer id is not valid');
      }
      if (!updateOfferDto.name) {
        throw new BadRequestError('Offer name is required');
      }
      if (!updateOfferDto.customer) {
        throw new BadRequestError('Customer is required');
      }

      // Handle to update offer
      const offerIdInNumber = parseInt(offerId);
      await this.offerServices.updateOffer(offerIdInNumber, currentUser, updateOfferDto);

      return this.sendApiResponse(res, { error: false });
    } catch (error) {
      return this.throwError('Update Offer', res, error);
    }
  }

  @Put('/offer/:id/toggle')
  @AuditAction(AuditActionEnum.UPDATE)
  @ApiOperation({ summary: 'Toggle Offer', operationId: 'toggleOffer' })
  @ApiResponseDecorator({ status: 200, type: ApiResponse, isArray: false })
  @ApiParam({ name: 'id', type: Number, description: 'Id of the offer', required: true })
  async toggleOffer(@Res() res: Response, @CurrentUser() currentUser: User, @Param('id') offerId: number) {
    try {
      await this.offerServices.toggleOfferStatus(currentUser.company_id, offerId);

      return this.sendApiResponse(res, { error: false });
    } catch (error) {
      return this.throwError('Toggle Offer', res, error);
    }
  }

  @Delete('/offer/:id')
  @AuditAction(AuditActionEnum.DELETE)
  @ApiOperation({ summary: 'Delete Offer', operationId: 'deleteOffer' })
  @ApiResponseDecorator({ status: 200, type: ApiResponse, isArray: false })
  @ApiParam({ name: 'id', type: Number, description: 'Id of the offer', required: true })
  async deleteOffer(@Res() res: Response, @CurrentUser() currentUser: User, @Param('id') offerId: number) {
    try {
      await this.offerServices.deleteOffer(offerId, currentUser);

      return this.sendApiResponse(res, { error: false });
    } catch (error) {
      return this.throwError('Delete Offer', res, error);
    }
  }

  @Delete('/offers/bulk')
  @AuditAction(AuditActionEnum.DELETE)
  @ApiOperation({ summary: 'Bulk Delete Offers', operationId: 'bulkDeleteOffers' })
  @ApiResponseDecorator({ status: 200, description: 'Bulk Delete Offers', type: ApiResponse, isArray: false })
  async bulkDeleteOffers(
    @Res() res: Response,
    @CurrentUser() currentUser: User,
    @Body() bulkDeleteOffersDto: BulkDeleteOffersDto,
  ) {
    try {
      const { ids } = bulkDeleteOffersDto;
      if (!isArray(ids)) {
        throw new BadRequestError('Task ids are invalid!');
      }

      await this.offerServices.bulkDeleteOffers(currentUser, bulkDeleteOffersDto);
      return this.sendApiResponse(res, { error: false });
    } catch (error) {
      return this.throwError('Bulk Delete Offers', res, error);
    }
  }
}
