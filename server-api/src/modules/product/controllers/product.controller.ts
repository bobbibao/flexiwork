import { UseGuards, Controller, Get, Res, Query, Param, Post, Body, Put, Delete, Logger } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse as ApiResponseDecorator,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import User from 'src/database/models/users.model';
import { BaseController } from 'src/shared/controllers/base.controller';
import { AuditModule, CurrentUser, AuditAction } from 'src/shared/decorators';
import { RoleEnum } from 'src/shared/enums';
import { AllowedRoleGuard } from 'src/shared/guards';
import { ProductBodyDto, CreateUpdateGroupDto, CreateUnitDto, CreateUpdateRateDto } from '../dto';
import { ProductService } from '../services/product.service';
import { ApiResponse, BadRequestError } from 'src/shared/utils';
import { Response } from 'express';
import { isNumberString } from 'class-validator';
import { QueryPaginateDto } from 'src/modules/offers/dto';
import { AuditModuleEnum, AuditActionEnum } from 'src/shared/constants/audit.constants';

@UseGuards(AllowedRoleGuard([RoleEnum.ADMIN, RoleEnum.MANAGER]))
@Controller('api')
@ApiBearerAuth()
@ApiTags('Product')
@AuditModule(AuditModuleEnum.PRODUCT)
export class ProductController extends BaseController {
  constructor(private readonly productService: ProductService) {
    super(new Logger(ProductController.name));
  }

  @Get('/products')
  @ApiOperation({ summary: 'Get List Product', operationId: 'listProduct' })
  @ApiResponseDecorator({ status: 200, description: 'Return list of Products', type: ApiResponse, isArray: false })
  @ApiQuery({ name: 'folder', type: String, required: false })
  @ApiQuery({ name: 'page', type: Number, required: false })
  @ApiQuery({ name: 'page_size', type: Number, required: false })
  @ApiQuery({ name: 'search', type: String, required: false })
  async listProduct(
    @Res() res: Response,
    @CurrentUser() user: User,
    @Query('folder') folder?: string,
    @Query('page') page?: string,
    @Query('page_size') pageSize?: string,
    @Query('search') search?: string,
  ) {
    try {
      const query: QueryPaginateDto = {
        search: search,
      };

      if (page && pageSize) {
        if (!isNumberString(page)) {
          throw new BadRequestError('Page must be numbers!');
        }
        if (!isNumberString(pageSize)) {
          throw new BadRequestError('Page size must be numbers!');
        }

        query.page = parseInt(page) < 1 ? 1 : parseInt(page);
        query.pageSize = parseInt(pageSize) < 5 ? 5 : parseInt(pageSize);
        query.applyPagination = true;
      }

      const { items, total } = await this.productService.listProducts(user.company_id, folder, query);

      return this.sendApiResponse(res, {
        count: total,
        error: false,
        payload: items,
      });
    } catch (error) {
      return this.throwError('Get List Product', res, error);
    }
  }

  @Get('/product/:id')
  @ApiOperation({ summary: 'Get Detail Product', operationId: 'detailProduct' })
  @ApiResponseDecorator({ status: 200, description: 'Return detail of Products', type: ApiResponse, isArray: false })
  @ApiParam({ name: 'id', description: 'Id of Product', required: true, type: Number })
  async detailProduct(@Res() res: Response, @CurrentUser() user: User, @Param('id') product_id: number) {
    try {
      const product = await this.productService.detailProduct(user.company_id, product_id);

      return this.sendApiResponse(res, { error: false, payload: product });
    } catch (error) {
      return this.throwError('Get Detail Product', res, error);
    }
  }

  @Post('/product')
  @AuditAction(AuditActionEnum.CREATE)
  @ApiOperation({ summary: 'Create a new product', operationId: 'createProduct' })
  @ApiResponseDecorator({ status: 200, type: ApiResponse, isArray: false })
  async createProduct(@Res() res: Response, @CurrentUser() user: User, @Body() createProductDto: ProductBodyDto) {
    try {
      const product = await this.productService.createProduct(user.company_id, createProductDto);
      return this.sendApiResponse(res, { error: false, payload: product });
    } catch (error) {
      return this.throwError('Create Product', res, error);
    }
  }

  @Put('/product/:id')
  @AuditAction(AuditActionEnum.UPDATE)
  @ApiOperation({ summary: 'Update product', operationId: 'updateProduct' })
  @ApiResponseDecorator({ status: 200, type: ApiResponse, isArray: false })
  @ApiParam({ name: 'id', description: 'Id of product' })
  async updateProduct(
    @Res() res: Response,
    @CurrentUser() user: User,
    @Body() dto: ProductBodyDto,
    @Param('id') product_id: number,
  ) {
    try {
      const product = await this.productService.updateProduct(user.company_id, product_id, dto);

      return this.sendApiResponse(res, { error: false, payload: product });
    } catch (error) {
      return this.throwError('Update Product', res, error);
    }
  }

  @Delete('/product/:id')
  @AuditAction(AuditActionEnum.DELETE)
  @ApiOperation({ summary: 'Delete product', operationId: 'deleteProduct' })
  @ApiResponseDecorator({ status: 200, type: ApiResponse, isArray: false })
  @ApiParam({ name: 'id', description: 'Id of product' })
  async deleteProduct(@Res() res: Response, @CurrentUser() user: User, @Param('id') product_id: number) {
    try {
      const product = await this.productService.deleteProduct(user.company_id, product_id);

      return this.sendApiResponse(res, { error: false, payload: product });
    } catch (error) {
      return this.throwError('Delete Product', res, error);
    }
  }

  @Get('/groups')
  @ApiOperation({ summary: 'Get list groups product', operationId: 'listGroups' })
  @ApiResponseDecorator({ status: 200, type: ApiResponse, isArray: false })
  @ApiQuery({ name: 'page', type: Number, required: false })
  @ApiQuery({ name: 'page_size', type: Number, required: false })
  @ApiQuery({ name: 'search', type: String, required: false })
  async listGroups(
    @Res() res: Response,
    @CurrentUser() user: User,
    @Query('page') page?: string,
    @Query('page_size') pageSize?: string,
    @Query('search') search?: string,
  ) {
    try {
      const query: QueryPaginateDto = {
        search: search,
      };

      if (page && pageSize) {
        if (!isNumberString(page)) {
          throw new BadRequestError('Page must be numbers!');
        }
        if (!isNumberString(pageSize)) {
          throw new BadRequestError('Page size must be numbers!');
        }

        query.page = parseInt(page) < 1 ? 1 : parseInt(page);
        query.pageSize = parseInt(pageSize) < 5 ? 5 : parseInt(pageSize);
        query.applyPagination = true;
      }

      const { items, total } = await this.productService.selectGroups(user.company_id, query);
      return this.sendApiResponse(res, { count: total, error: false, payload: items });
    } catch (error) {
      return this.throwError('Get list groups product', res, error);
    }
  }

  @Get('/group/:id')
  @ApiOperation({ summary: 'Get detail groups product', operationId: 'detailGroups' })
  @ApiResponseDecorator({ status: 200, type: ApiResponse, isArray: false })
  @ApiParam({ name: 'id', description: 'Id of the group product', required: true, type: Number })
  async detailGroups(@Res() res: Response, @CurrentUser() user: User, @Param('id') groupID: number) {
    try {
      const results = await this.productService.selectGroup(user.company_id, groupID);

      return this.sendApiResponse(res, { error: false, payload: results });
    } catch (error) {
      return this.throwError('Get detail groups product', res, error);
    }
  }

  @Post('/group')
  @AuditAction(AuditActionEnum.CREATE)
  @ApiOperation({ summary: 'create groups product', operationId: 'createGroup' })
  @ApiResponseDecorator({ status: 200, type: ApiResponse, isArray: false })
  async createGroup(@Res() res: Response, @CurrentUser() user: User, @Body() dto: CreateUpdateGroupDto) {
    try {
      await this.productService.createGroup(user.company_id, dto);

      return this.sendApiResponse(res, { error: false });
    } catch (error) {
      return this.throwError('create groups product', res, error);
    }
  }

  @Put('/group/:id')
  @AuditAction(AuditActionEnum.UPDATE)
  @ApiOperation({ summary: 'update groups product', operationId: 'updateGroup' })
  @ApiResponseDecorator({ status: 200, type: ApiResponse, isArray: false })
  @ApiParam({ name: 'id', description: 'Group ID', required: true })
  async updateGroup(
    @Res() res: Response,
    @CurrentUser() user: User,
    @Body() dto: CreateUpdateGroupDto,
    @Param('id') groupId: number,
  ) {
    try {
      await this.productService.updateGroup(user.company_id, groupId, dto);

      return this.sendApiResponse(res, { error: false });
    } catch (error) {
      return this.throwError('update groups product', res, error);
    }
  }

  @Delete('/group/:id')
  @AuditAction(AuditActionEnum.DELETE)
  @ApiOperation({ summary: 'delete groups product', operationId: 'deleteGroup' })
  @ApiResponseDecorator({ status: 200, type: ApiResponse, isArray: false })
  @ApiParam({ name: 'id', description: 'Group ID', required: true })
  async deleteGroup(@Res() res: Response, @CurrentUser() user: User, @Param('id') groupId: number) {
    try {
      await this.productService.deleteGroup(user.company_id, groupId);

      return this.sendApiResponse(res, { error: false });
    } catch (error) {
      return this.throwError('delete groups product', res, error);
    }
  }

  @Get('/units')
  @ApiOperation({ summary: 'Get units product', operationId: 'listUnits' })
  @ApiResponseDecorator({ status: 200, type: ApiResponse, isArray: false })
  async listUnits(@Res() res: Response, @CurrentUser() user: User) {
    try {
      const result = await this.productService.listUnits(user.company_id);

      return this.sendApiResponse(res, { count: result.length, error: false, payload: result });
    } catch (error) {
      return this.throwError('Get units product', res, error);
    }
  }

  @Post('/unit')
  @AuditAction(AuditActionEnum.CREATE)
  @ApiOperation({ summary: 'Create unit product', operationId: 'createUnit' })
  @ApiResponseDecorator({ status: 200, type: ApiResponse, isArray: false })
  async createUnit(@Res() res: Response, @CurrentUser() user: User, @Body() createUnitDto: CreateUnitDto) {
    try {
      await this.productService.createUnit(user.company_id, createUnitDto);

      return this.sendApiResponse(res, { error: false });
    } catch (error) {
      return this.throwError('Create unit product', res, error);
    }
  }

  @Put('/unit/:id')
  @AuditAction(AuditActionEnum.UPDATE)
  @ApiOperation({ summary: 'update unit product', operationId: 'updateUnit' })
  @ApiResponseDecorator({ status: 200, type: ApiResponse, isArray: false })
  @ApiParam({ name: 'id', description: 'Unit ID', required: true })
  async updateUnit(
    @Res() res: Response,
    @CurrentUser() user: User,
    @Body() createUnitDto: CreateUnitDto,
    @Param('id') unitId: number,
  ) {
    try {
      await this.productService.updateUnit(user.company_id, unitId, createUnitDto);

      return this.sendApiResponse(res, { error: false });
    } catch (error) {
      return this.throwError('update unit product', res, error);
    }
  }

  @Get('/vatrates')
  @ApiOperation({ summary: 'Get list vat rate', operationId: 'listVatRate' })
  @ApiResponseDecorator({ status: 200, type: ApiResponse, isArray: false })
  async listVatRate(@Res() res: Response, @CurrentUser() user: User) {
    try {
      const result = await this.productService.listRates(user.company_id);

      return this.sendApiResponse(res, { count: result.length, error: false, payload: result });
    } catch (error) {
      return this.throwError('Get list vat rate', res, error);
    }
  }

  @Post('/vatrate')
  @AuditAction(AuditActionEnum.CREATE)
  @ApiOperation({ summary: 'create vat rate', operationId: 'createRate' })
  @ApiResponseDecorator({ status: 200, type: ApiResponse, isArray: false })
  async createRate(@Res() res: Response, @CurrentUser() user: User, @Body() createUpdateRateDto: CreateUpdateRateDto) {
    try {
      await this.productService.createRate(user.company_id, createUpdateRateDto);

      return this.sendApiResponse(res, { error: false });
    } catch (error) {
      return this.throwError('create vat rate', res, error);
    }
  }

  @Put('/vatrate/:id')
  @AuditAction(AuditActionEnum.UPDATE)
  @ApiOperation({ summary: 'update vatrate product', operationId: 'updateRate' })
  @ApiResponseDecorator({ status: 200, type: ApiResponse, isArray: false })
  @ApiParam({ name: 'id', description: 'Unit ID', required: true })
  async updateRate(
    @Res() res: Response,
    @CurrentUser() user: User,
    @Body() createUpdateRateDto: CreateUpdateRateDto,
    @Param('id') rateId: number,
  ) {
    try {
      await this.productService.updateRate(rateId, user.company_id, createUpdateRateDto);

      return this.sendApiResponse(res, { error: false });
    } catch (error) {
      return this.throwError('update vatrate product', res, error);
    }
  }

  @Get('/products/project/:id')
  @ApiOperation({ summary: 'Get list product by project', operationId: 'listProductByProject' })
  @ApiResponseDecorator({
    status: 200,
    description: 'Returns of products',
    type: ApiResponse,
    isArray: true,
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the project',
    type: Number,
  })
  async listProductByProject(@Res() res: Response, @CurrentUser() user: User, @Param('id') projectId: number) {
    try {
      const lst = await this.productService.getProjectProducts(user.company_id, projectId);
      return this.sendApiResponse(res, { error: false, payload: lst, count: lst.length });
    } catch (error: unknown) {
      return this.throwError('listProductByProject', res, error);
    }
  }
}
