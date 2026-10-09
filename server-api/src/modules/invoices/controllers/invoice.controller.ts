import { Response } from 'express';
import User from 'src/database/models/users.model';
import { BaseController } from 'src/shared/controllers/base.controller';
import { AuditModule, CurrentUser, AuditAction } from 'src/shared/decorators';
import { RoleEnum } from 'src/shared/enums';
import { AllowedRoleGuard } from 'src/shared/guards';
import { ApiResponse } from 'src/shared/utils/api-response';
import { Body, Controller, Delete, Get, Logger, Param, Post, Put, Query, Res, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse as ApiResponseDecorator,
  ApiTags,
} from '@nestjs/swagger';
import { CreateInvoiceDto, PaidInvoiceDto, UpdateInvoiceDto, UpdateInvoiceStatusDto } from '../dto';
import { InvoiceService } from '../services/invoice.service';
import { isArray, isNumberString } from 'class-validator';
import { BadRequestError } from 'src/shared/utils';
import { QueryPaginateDto } from 'src/modules/offers/dto';
import { BulkDeleteOffersDto } from 'src/modules/offers/dto/bulk-delete-offers.dto';
import { AuditModuleEnum, AuditActionEnum } from 'src/shared/constants/audit.constants';

@UseGuards(AllowedRoleGuard([RoleEnum.ADMIN, RoleEnum.MANAGER]))
@Controller('api')
@ApiBearerAuth()
@ApiTags('Invoices')
@AuditModule(AuditModuleEnum.INVOICE)
export class InvoiceController extends BaseController {
  constructor(private readonly invoiceService: InvoiceService) {
    super(new Logger(InvoiceController.name));
  }

  @Get('/invoices')
  @ApiOperation({ summary: 'Get List Invoices', operationId: 'invoices' })
  @ApiResponseDecorator({ status: 200, description: 'Return list of invoices', type: ApiResponse, isArray: false })
  @ApiQuery({ name: 'status', type: String, required: false, description: 'Filter by status' })
  @ApiQuery({ name: 'search', type: String, required: false, description: 'Search term' })
  @ApiQuery({ name: 'sort', type: String, required: false, description: 'Sort field:direction (e.g. "name:ASC")' })
  @ApiQuery({ name: 'page', type: Number, required: false, description: 'Page number' })
  @ApiQuery({ name: 'pageSize', type: Number, required: false, description: 'Items per page' })
  async invoices(@Res() res: Response, @CurrentUser() user: User, @Query() filter: QueryPaginateDto) {
    try {
      const result = await this.invoiceService.listInvoice(user.company_id, filter);

      return this.sendApiResponse(res, {
        error: false,
        payload: {
          items: result.items,
          total_items: result.total,
          page: result.page,
          page_size: result.pageSize,
          total_pages: result.pageSize ? Math.ceil(result.total / result.pageSize) : 1,
        },
        count: result.total,
      });
    } catch (error: unknown) {
      return this.throwError('Get List Invoices', res, error);
    }
  }

  @Get('/invoices/stats')
  @ApiOperation({ summary: 'Get Invoices summary stats', operationId: 'invoicesSummary' })
  @ApiResponseDecorator({ status: 200, description: 'Return summary of invoices', type: ApiResponse, isArray: false })
  async invoicesSummary(@Res() res: Response, @CurrentUser() user: User) {
    try {
      const invoices = await this.invoiceService.invoicesStatsSummary(user.company_id);

      return this.sendApiResponse(res, { error: false, payload: invoices });
    } catch (error: unknown) {
      return this.throwError('Get Invoices summary stats', res, error);
    }
  }

  @Get('/invoice/:id')
  @ApiOperation({ summary: `Get Invoice's detail`, operationId: 'detailInvoice' })
  @ApiResponseDecorator({ status: 200, description: 'Return detail of invoice', type: ApiResponse, isArray: false })
  @ApiParam({ name: 'id', description: 'Id of invoice', type: Number, required: true })
  async detailInvoice(@Res() res: Response, @CurrentUser() user: User, @Param('id') id: number) {
    try {
      const invoices = await this.invoiceService.detailInvoice(user.company_id, +id);

      return this.sendApiResponse(res, { error: false, payload: invoices });
    } catch (error: unknown) {
      return this.throwError("Get Invoice's detail", res, error);
    }
  }

  @Get('/invoice/:id/pdfdetail')
  @ApiBearerAuth()
  @ApiOperation({ summary: `Get Invoice's PDF detail`, operationId: 'getInvoicePDFDetail' })
  async getInvoicePDFDetail(@Res() res: Response, @Param('id') invoiceId: string) {
    try {
      const redirectUrl = `/api/invoice/${invoiceId}`;

      return res.status(301).redirect(redirectUrl);
    } catch (error) {
      return this.throwError("Get Invoice's PDF detail", res, error);
    }
  }

  @Get('/invoice/:id/invoice-history')
  @ApiBearerAuth()
  @ApiOperation({ summary: `Get invoice history`, operationId: 'invoiceHistory' })
  @ApiResponseDecorator({
    status: 200,
    description: 'Invoice history',
    type: ApiResponse,
    isArray: true,
  })
  async invoiceHistory(@Res() res: Response, @CurrentUser() currentUser: User, @Param('id') id: string) {
    try {
      // Validate input
      if (!isNumberString(id)) {
        throw new BadRequestError('Invoice id is invalid!');
      }

      // Handle to get invoice history
      const idInNumber = parseInt(id);
      const invoiceHistory = await this.invoiceService.getInvoiceHistory(currentUser, idInNumber);

      return this.sendApiResponse(res, { error: false, payload: invoiceHistory });
    } catch (error) {
      return this.throwError('Get invoice history', res, error);
    }
  }

  @Put('invoices/status')
  @AuditAction(AuditActionEnum.UPDATE)
  @ApiOperation({ summary: `Update invoices's status`, operationId: 'updateInvoiceStatus' })
  @ApiResponseDecorator({
    status: 200,
    description: 'Return status updated',
    type: ApiResponse,
    isArray: false,
  })
  @ApiBody({ type: UpdateInvoiceStatusDto })
  async updateInvoiceStatus(
    @Res() res: Response,
    @CurrentUser() user: User,
    @Body() updateInvoiceStatusDto: UpdateInvoiceStatusDto,
  ) {
    try {
      const result = await this.invoiceService.updateInvoiceStatus(user.company_id, updateInvoiceStatusDto);

      return this.sendApiResponse(res, { error: false, payload: result });
    } catch (error) {
      return this.throwError("Update invoices's status", res, error);
    }
  }

  @Post('/invoice')
  @AuditAction(AuditActionEnum.CREATE)
  @ApiBody({ type: CreateInvoiceDto })
  @ApiOperation({ summary: `Create an invoice`, operationId: 'createInvoice' })
  @ApiResponseDecorator({ status: 200, type: ApiResponse, isArray: false })
  async createInvoice(@Res() res: Response, @CurrentUser() user: User, @Body() createInvoiceDto: CreateInvoiceDto) {
    try {
      await this.invoiceService.createInvoice(user, createInvoiceDto);

      return this.sendApiResponse(res, { error: false });
    } catch (error) {
      return this.throwError('Create an invoice', res, error);
    }
  }

  @Put('/invoice/:id')
  @AuditAction(AuditActionEnum.UPDATE)
  @ApiBody({ type: UpdateInvoiceDto })
  @ApiOperation({ summary: `Update an invoice`, operationId: 'updateInvoice' })
  @ApiResponseDecorator({ status: 200, type: ApiResponse, isArray: false })
  async updateInvoice(
    @Res() res: Response,
    @CurrentUser() user: User,
    @Param('id') invoiceId: string,
    @Body() updateInvoiceDto: UpdateInvoiceDto,
  ) {
    try {
      await this.invoiceService.updateInvoice(user, +invoiceId, updateInvoiceDto);

      return this.sendApiResponse(res, { error: false });
    } catch (error) {
      return this.throwError('Update an invoice', res, error);
    }
  }

  @Delete('/invoice/:id')
  @AuditAction(AuditActionEnum.DELETE)
  @ApiOperation({ summary: `Delete an invoice`, operationId: 'deleteInvoice' })
  @ApiParam({ name: 'id', description: 'Id of invoice', required: true, type: Number })
  @ApiResponseDecorator({ status: 200, type: ApiResponse, isArray: false })
  async deleteInvoice(@Res() res: Response, @CurrentUser() user: User, @Param('id') invoiceId: number) {
    try {
      await this.invoiceService.deleteInvoice(user.company_id, invoiceId, user.id);

      return this.sendApiResponse(res, { error: false });
    } catch (error) {
      return this.throwError('Delete an invoice', res, error);
    }
  }

  @Delete('/invoices/bulk')
  @AuditAction(AuditActionEnum.DELETE)
  @ApiOperation({ summary: 'Bulk Delete Invoices', operationId: 'bulkDeleteInvoices' })
  @ApiResponseDecorator({ status: 200, description: 'Bulk Delete Invoices', type: ApiResponse, isArray: false })
  async bulkDeleteInvoices(
    @Res() res: Response,
    @CurrentUser() currentUser: User,
    @Body() bulkDeleteInvoicesDto: BulkDeleteOffersDto,
  ) {
    try {
      const { ids } = bulkDeleteInvoicesDto;
      if (!isArray(ids)) {
        throw new BadRequestError('Invoice ids are invalid!');
      }

      await this.invoiceService.bulkDeleteInvoices(currentUser, bulkDeleteInvoicesDto);
      return this.sendApiResponse(res, { error: false });
    } catch (error) {
      return this.throwError('Bulk Delete Invoices', res, error);
    }
  }

  @Post('/invoice/:id/copy')
  @AuditAction(AuditActionEnum.CREATE)
  @ApiOperation({ summary: 'Copy an invoice', operationId: 'copyInvoice' })
  @ApiParam({ name: 'id', description: 'Id of invoice', required: true, type: Number })
  @ApiResponseDecorator({ status: 200, type: ApiResponse, isArray: false })
  async copyInvoice(@Res() res: Response, @CurrentUser() user: User, @Param('id') invoiceId: number) {
    try {
      await this.invoiceService.copyInvoice(invoiceId, user);

      return this.sendApiResponse(res, { error: false });
    } catch (error) {
      return this.throwError('Copy an invoice', res, error);
    }
  }

  @Post('/invoice/:id/paid')
  @AuditAction(AuditActionEnum.UPDATE)
  @ApiOperation({ summary: 'Mark an invoice as paid' })
  @ApiParam({ name: 'id', description: 'The ID of the invoice to be marked as paid' })
  @ApiResponseDecorator({ status: 200, description: 'The invoice was successfully marked as paid' })
  async paidInvoice(
    @Res() res: Response,
    @CurrentUser() user: User,
    @Param('id') invoiceID: number,
    @Body() paidInvoiceDto: PaidInvoiceDto,
  ) {
    try {
      await this.invoiceService.paidInvoice(invoiceID, paidInvoiceDto, user);

      return this.sendApiResponse(res, { error: false });
    } catch (error) {
      return this.throwError('Mark an invoice as paid', res, error);
    }
  }

  @Post('/invoice/:id/cancel')
  @AuditAction(AuditActionEnum.UPDATE)
  @ApiOperation({ summary: 'Cancel an invoice' })
  @ApiParam({ name: 'id', description: 'The ID of the invoice to be cancelled' })
  @ApiResponseDecorator({ status: 200, description: 'The invoice was successfully cancelled' })
  async cancelInvoice(@Res() res: Response, @CurrentUser() user: User, @Param('id') invoiceID: number) {
    try {
      await this.invoiceService.cancelInvoice(invoiceID, user.company_id);

      return this.sendApiResponse(res, { error: false });
    } catch (error) {
      return this.throwError('Cancel an invoice', res, error);
    }
  }
}
