import { Response } from 'express';
import User from 'src/database/models/users.model';
import { BaseController } from 'src/shared/controllers/base.controller';
import { AuditModule, CurrentUser, AuditAction } from 'src/shared/decorators';
import { RoleEnum } from 'src/shared/enums';
import { AllowedRoleGuard } from 'src/shared/guards';
import { ApiResponse, BadRequestError, NotFoundError, saveUploadFile } from 'src/shared/utils';

import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Post,
  Put,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiOperation, ApiParam, ApiResponse as ApiResponseDecorator, ApiTags } from '@nestjs/swagger';

import { ContactInputDto, CustomerInputDto, ListCustomersRequestDto } from '../dto';
import { CustomerService } from '../services/customer.service';
import { AuditModuleEnum, AuditActionEnum } from 'src/shared/constants/audit.constants';

@UseGuards(AllowedRoleGuard([RoleEnum.ADMIN, RoleEnum.MANAGER]))
@Controller('/api')
@ApiTags('Customer')
@AuditModule(AuditModuleEnum.CUSTOMER)
export class CustomerController extends BaseController {
  constructor(private readonly customerService: CustomerService) {
    super(new Logger(CustomerController.name));
  }
  @Get('/customers/list')
  @ApiOperation({ summary: 'List Customers with Search, Pagination and Sort', operationId: 'listCustomers' })
  @ApiResponseDecorator({
    status: 200,
    description: 'Returns paginated list of customers with search and sort functionality',
    type: ApiResponse,
    isArray: false,
  })
  async listCustomers(@Res() res: Response, @CurrentUser() user: User, @Query() filter: ListCustomersRequestDto) {
    try {
      const result = await this.customerService.listCustomers(user.company_id, filter);

      return this.sendApiResponse(res, {
        count: result.total,
        error: false,
        payload: {
          items: result.items,
          total_items: result.total,
          page: result.page,
          page_size: result.pageSize,
          total_pages: Math.ceil(result.total / result.pageSize),
        },
      });
    } catch (error) {
      return this.throwError('List Customers', res, error);
    }
  }

  @Get('/customers')
  @ApiOperation({ summary: 'List Customers', operationId: 'listCustomers' })
  @ApiResponseDecorator({
    status: 200,
    description: 'Returns of customers',
    type: ApiResponse,
    isArray: true,
  })
  async listCustomersSimple(@Res() res: Response, @CurrentUser() user: User) {
    try {
      const customers = await this.customerService.selectCustomers(user.company_id);

      return this.sendApiResponse(res, {
        error: false,
        payload: customers,
        count: customers.length,
      });
    } catch (error) {
      return this.throwError('List Customers', res, error);
    }
  }

  @Get('report/addresses')
  @ApiOperation({ summary: 'List Customers Report', operationId: 'listCustomersReport' })
  @ApiResponseDecorator({
    status: 200,
    description: 'Returns of customers',
    type: ApiResponse,
    isArray: true,
  })
  async listCustomersReport(@Res() res: Response, @CurrentUser() user: User) {
    try {
      const customers = await this.customerService.selectCustomers(user.company_id);

      return this.sendApiResponse(res, {
        error: false,
        payload: customers,
        count: customers.length,
      });
    } catch (error) {
      return this.throwError('List Customers Report', res, error);
    }
  }

  @Get('/customer/:id')
  @ApiOperation({ summary: 'Get Customer', operationId: 'customer' })
  @ApiResponseDecorator({
    status: 200,
    description: 'Returns of customer',
    type: ApiResponse,
    isArray: false,
  })
  @ApiParam({
    name: 'id',
    type: Number,
    required: true,
    description: 'The ID of the customer',
  })
  async detailCustomer(@Res() res: Response, @CurrentUser() user: User, @Param('id') customerId: number) {
    try {
      const customer = await this.customerService.selectCustomerWithContacts(user.company_id, customerId);

      return this.sendApiResponse(res, { error: false, payload: customer });
    } catch (error) {
      return this.throwError('Get Customer', res, error);
    }
  }

  @Get('/customer/:id/contact/:conid')
  @ApiOperation({ summary: 'Get Customer Contact', operationId: 'customerContact' })
  @ApiResponseDecorator({
    status: 200,
    description: 'Returns of customer contact',
    type: ApiResponse,
    isArray: false,
  })
  @ApiParam({
    name: 'id',
    type: Number,
    required: true,
    description: 'The ID of the customer',
  })
  @ApiParam({
    name: 'conid',
    type: Number,
    required: true,
    description: 'The ID of the contact',
  })
  async detailContact(
    @Res() res: Response,
    @CurrentUser() user: User,
    @Param('id') customerId: number,
    @Param('conid') contactId: number,
  ) {
    try {
      const contact = await this.customerService.selectContact(user.company_id, customerId, contactId);

      return this.sendApiResponse(res, { error: false, payload: contact });
    } catch (error) {
      return this.throwError('Get Customer Contact', res, new Error('pg: no rows in result set'));
    }
  }

  @Post('/customer/:id/contact')
  @AuditAction(AuditActionEnum.CREATE)
  @ApiOperation({ summary: 'Add Customer Contact', operationId: 'addCustomerContact' })
  @ApiResponseDecorator({
    status: 200,
    description: 'Returns of status of adding customer contact',
    type: ApiResponse,
    isArray: false,
  })
  @ApiParam({
    name: 'id',
    type: Number,
    required: true,
    description: 'The ID of the customer',
  })
  @ApiBody({
    type: ContactInputDto,
  })
  async createContact(
    @Res() res: Response,
    @CurrentUser() user: User,
    @Param('id') customerId: number,
    @Body() contact: ContactInputDto,
  ) {
    try {
      if (!contact || Object.keys(contact).length === 0) {
        throw new BadRequestError('EOF');
      }

      await this.customerService.insertContact(user.company_id, customerId, contact);
      return this.sendApiResponse(res, { error: false });
    } catch (error) {
      return this.throwError('Add Customer Contact', res, error);
    }
  }

  @Put('/customer/:id/contact/:conid')
  @AuditAction(AuditActionEnum.UPDATE)
  @ApiOperation({ summary: 'Update Customer Contact', operationId: 'updateCustomerContact' })
  @ApiResponseDecorator({
    status: 200,
    description: 'Returns of status update',
    type: ApiResponse,
    isArray: false,
  })
  @ApiParam({
    name: 'id',
    type: Number,
    required: true,
    description: 'The ID of the customer',
  })
  @ApiParam({
    name: 'conid',
    type: Number,
    required: true,
    description: 'The ID of the contact',
  })
  @ApiBody({
    type: ContactInputDto,
  })
  async putContact(
    @Res() res: Response,
    @CurrentUser() user: User,
    @Param('id') customerId: number,
    @Param('conid') contactId: number,
    @Body() contact: ContactInputDto,
  ) {
    try {
      if (!contact || Object.keys(contact).length === 0) {
        throw new BadRequestError('EOF');
      }

      await this.customerService.updateContact(user.company_id, customerId, contactId, contact);
      return this.sendApiResponse(res, { error: false });
    } catch (error) {
      return this.throwError('Update Customer Contact', res, error);
    }
  }

  @Delete('/customer/:id/contact/:conid')
  @AuditAction(AuditActionEnum.DELETE)
  @ApiOperation({ summary: 'Delete Customer Contact', operationId: 'deleteCustomerContact' })
  @ApiResponseDecorator({
    status: 200,
    description: 'Returns of status of delete',
    type: ApiResponse,
    isArray: false,
  })
  @ApiParam({
    name: 'id',
    type: Number,
    required: true,
    description: 'The ID of the customer',
  })
  @ApiParam({
    name: 'conid',
    type: Number,
    required: true,
    description: 'The ID of the contact',
  })
  async deleteContact(
    @Res() res: Response,
    @CurrentUser() user: User,
    @Param('id') customerId: number,
    @Param('conid') contactId: number,
  ) {
    try {
      await this.customerService.deleteContact(user.company_id, customerId, contactId);

      return this.sendApiResponse(res, { error: false });
    } catch (error) {
      return this.throwError('Delete Customer Contact', res, error);
    }
  }

  @Post('/customer')
  @AuditAction(AuditActionEnum.CREATE)
  @ApiOperation({ summary: 'Add Customer', operationId: 'add Customer' })
  @ApiResponseDecorator({
    status: 200,
    description: 'Returns of status of adding customer',
    type: ApiResponse,
    isArray: false,
  })
  @ApiBody({
    type: CustomerInputDto,
  })
  async createCustomer(@Res() res: Response, @CurrentUser() user: User, @Body() customerInputDto: CustomerInputDto) {
    try {
      if (customerInputDto && Object.keys(customerInputDto).length === 0) {
        throw new BadRequestError('EOF');
      }

      await this.customerService.insertCustomer(user.company_id, customerInputDto);
      return this.sendApiResponse(res, { error: false });
    } catch (error) {
      return this.throwError('Add Customer', res, error);
    }
  }

  @Post('/uploadxlsx')
  @AuditAction(AuditActionEnum.CREATE)
  @ApiOperation({ summary: 'Upload Excel File', operationId: 'uploadExcel' })
  @ApiResponseDecorator({
    status: 200,
    description: 'Returns of status of upload',
    type: ApiResponse,
    isArray: false,
  })
  @UseInterceptors(FileInterceptor('file'))
  async importFromExcel(@Res() res: Response, @UploadedFile() file: Express.Multer.File) {
    try {
      if (!file) {
        throw new NotFoundError('File not found');
      }

      await this.customerService.importFromExcel(file);
      return this.sendApiResponse(res, { error: false });
    } catch (error) {
      return this.throwError('Upload Excel File', res, error);
    }
  }

  @Post('/uploadvcf')
  @AuditAction(AuditActionEnum.CREATE)
  @ApiOperation({ summary: 'Upload VCF File', operationId: 'uploadVCF' })
  @UseInterceptors(FileInterceptor('file'))
  @ApiResponseDecorator({
    status: 200,
    description: 'Returns of status of upload',
    type: ApiResponse,
    isArray: false,
  })
  async uploadVCF(@Res() res: Response, @CurrentUser() user: User, @UploadedFile() file: Express.Multer.File) {
    try {
      if (!file) {
        throw new NotFoundError('File not found');
      }

      const dateTime = (new Date().getTime() / 1000).toFixed(0);
      const fileSave = await saveUploadFile(file, `${user.company_id}-${dateTime}`);

      await this.customerService.importFromVCF(user.company_id, fileSave);
      return this.sendApiResponse(res, { error: false });
    } catch (error) {
      return this.throwError('Upload VCF File', res, error);
    }
  }

  @Put('/customer/:id')
  @AuditAction(AuditActionEnum.UPDATE)
  @ApiOperation({ summary: 'Update Customer', operationId: 'updateCustomer' })
  @ApiResponseDecorator({
    status: 200,
    description: 'Returns of status update',
    type: ApiResponse,
    isArray: false,
  })
  @ApiParam({
    name: 'id',
    type: Number,
    required: true,
    description: 'The ID of the customer',
  })
  @ApiBody({
    type: CustomerInputDto,
  })
  async putCustomer(
    @Res() res: Response,
    @CurrentUser() user: User,
    @Param('id') customerId: number,
    @Body() customer: CustomerInputDto,
  ) {
    try {
      if (customer && Object.keys(customer).length === 0) {
        throw new BadRequestError('EOF');
      }

      await this.customerService.updateCustomer(user.company_id, customerId, customer);
      return this.sendApiResponse(res, { error: false });
    } catch (error) {
      return this.throwError('Update Customer', res, error);
    }
  }

  @Delete('/customer/:id')
  @AuditAction(AuditActionEnum.DELETE)
  @ApiOperation({ summary: 'Delete Customer', operationId: 'deleteCustomer' })
  @ApiResponseDecorator({
    status: 200,
    description: 'Returns of status of delete',
    type: ApiResponse,
    isArray: false,
  })
  @ApiParam({
    name: 'id',
    type: Number,
    required: true,
    description: 'The ID of the customer',
  })
  async deleteCustomerHandler(@Res() res: Response, @CurrentUser() user: User, @Param('id') customerId: number) {
    try {
      await this.customerService.deleteCustomer(user.id, user.company_id, customerId);
      return this.sendApiResponse(res, { error: false });
    } catch (error) {
      return this.throwError('Delete Customer', res, error);
    }
  }

  @Post('/customers/bulk')
  @ApiOperation({ summary: 'Bulk Delete Customers', operationId: 'bulkDeleteCustomers' })
  @ApiResponseDecorator({
    status: 200,
    description: 'Returns status of bulk delete operation',
    type: ApiResponse,
    isArray: false,
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        ids: {
          type: 'array',
          items: { type: 'number' },
          description: 'Array of customer IDs to delete',
        },
      },
      required: ['ids'],
    },
  })
  async bulkDeleteCustomers(@Res() res: Response, @CurrentUser() user: User, @Body() body: { ids: number[] }) {
    try {
      if (!body.ids || !Array.isArray(body.ids) || body.ids.length === 0) {
        throw new BadRequestError('Invalid or empty customer IDs array');
      }

      // Delete each customer
      for (const customerId of body.ids) {
        await this.customerService.deleteCustomer(user.id, user.company_id, customerId);
      }
      return this.sendApiResponse(res, {
        error: false,
        payload: { message: `Successfully deleted ${body.ids.length} customers` },
      });
    } catch (error) {
      return this.throwError('Bulk Delete Customers', res, error);
    }
  }
}
