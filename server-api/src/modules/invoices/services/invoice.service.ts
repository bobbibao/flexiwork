import { escape } from 'lodash';
import { Op, Order, OrderItem, Sequelize, WhereOptions } from 'sequelize';
import Company from 'src/database/models/companies.model';
import Customer from 'src/database/models/customers.model';
import Invoice from 'src/database/models/invoices.model';
import Log from 'src/database/models/logs.model';
import NumberEntry from 'src/database/models/numbers.model';
import Project from 'src/database/models/projects.model';
import Setting from 'src/database/models/setting.model';
import CompanyTemplate from 'src/database/models/company-templates.model';
import User from 'src/database/models/users.model';
import { CompanyService } from 'src/modules/company/services/company.service';
import { CustomerService } from 'src/modules/customer/services/customer.service';
import { ExportCreateDto } from 'src/modules/export/dto';
import { ExportFileService } from 'src/modules/export/services/export-file.service';
import { ExportService } from 'src/modules/export/services/export.service';
import { ProjectDetailDto } from 'src/modules/projects/dto';
import { ProjectService } from 'src/modules/projects/services/project.service';
import { InvoiceReportDto } from 'src/modules/report/dto';
import { SettingService } from 'src/modules/setting/services/setting.service';
import { DetailCost } from 'src/shared/dto';
import { ActionEnum, CodeEnum } from 'src/shared/enums';
import { FileTypeEnum } from 'src/shared/enums/file-type.enum';
import {
  addFieldValuesIfNotExisted,
  BadRequestError,
  combinePdfBuffers,
  formatNumber,
  generateNewUUID,
  getCurrency,
  getCustomerTitle,
  getDocument,
  getFinalSum,
  getQRRefNumber,
  getTable,
  getTableSum,
  InternalServerError,
  NotFoundError,
  removeFields,
} from 'src/shared/utils';
import DateFormatter, { formatDateToDotSeparated } from 'src/shared/utils/date-utils';

import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';

import {
  CreateInvoiceDto,
  InvoiceDetailDto,
  InvoiceHistoryDto,
  invoicesSummaryDto,
  PaidInvoiceDto,
  UpdateInvoiceDto,
  UpdateInvoiceStatusDto,
} from '../dto';
import {
  BbitQRBillAddressType,
  BbitQRBillCurrency,
  BbitQRBillLanguage,
  IBbitQRBill,
} from '@bbitgmbh/bbit.swiss-qr-bill';
import InvoiceDetail from 'src/database/models/invoice-details.model';
import InvoiceLabel from 'src/database/models/invoice-labels.model';
import InvoiceProduct from 'src/database/models/invoice-products.model';
import InvoicePayments from 'src/database/models/invoice-payments.model';
import { INVOICE_STATUS, VALID_INVOICE_STATUSES } from '../constants';
import InvoiceAdditionalCost from 'src/database/models/invoice-additional-costs.model';
import { ListInvoicesRequestDto } from '../dto/invoice-query.dto';
import { BulkDeleteOffersDto } from 'src/modules/offers/dto/bulk-delete-offers.dto';

@Injectable()
export class InvoiceService {
  private readonly logger = new Logger(InvoiceService.name);

  constructor(
    @Inject('INVOICE_REPOSITORY')
    private readonly invoiceRepository: typeof Invoice,
    @Inject('LOG_REPOSITORY')
    private readonly logRepository: typeof Log,
    @Inject('TEMPLATE_SERVICE')
    private readonly templateRepository: typeof CompanyTemplate,
    @Inject(forwardRef(() => ProjectService))
    private readonly projectService: ProjectService,
    private readonly companyService: CompanyService,
    private readonly exportService: ExportService,
    private readonly settingService: SettingService,
    private readonly customerService: CustomerService,
    private readonly exportFileService: ExportFileService,
  ) {}

  async listInvoice(
    companyId: number,
    filter: ListInvoicesRequestDto,
  ): Promise<{
    items: InvoiceDetailDto[];
    total: number;
    page: number | null;
    pageSize: number | null;
  }> {
    const whereOptions: WhereOptions<Invoice> = {
      company_id: companyId,
      deleted_at: null,
    };

    // Handle status filtering
    if (filter.status) {
      const statuses = filter.status.split(',');
      if (filter.status === 'deleted') {
        whereOptions.deleted_at = { [Op.ne]: null };
      } else if (statuses.length > 1) {
        whereOptions.status = { [Op.in]: statuses };
      } else {
        whereOptions.status = statuses[0];
      }
    } else {
      whereOptions.status = { [Op.notIn]: ['cancelled'] };
    }

    // Handle search
    if (filter.search) {
      const searchTerm = `%${filter.search}%`;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (whereOptions as any)[Op.or] = [
        { name: { [Op.iLike]: searchTerm } },
        { '$customer.name$': { [Op.iLike]: searchTerm } },
        { '$customer.first_name$': { [Op.iLike]: searchTerm } },
        { '$customer.last_name$': { [Op.iLike]: searchTerm } },
        { '$number.custom_id$': { [Op.iLike]: searchTerm } },
      ];
    }

    // Build order options
    let orderOptions: Order = [['id', 'DESC']]; // Default sorting
    if (filter.sort) {
      const [field, direction] = filter.sort.split(':');

      // Map frontend field names to database columns
      const fieldMapping: Record<string, string[]> = {
        id: ['id'],
        companyName: ['customer', 'name'],
        projectName: ['name'],
        status: ['status'],
        rgDate: ['charged_on'],
        dueOn: ['due_on'],
        invoiceNbr: ['number', 'custom_id'],
        customerName: ['customer', 'name'],
        createdAt: ['created_at'],
      };

      if (fieldMapping[field]) {
        orderOptions = [fieldMapping[field].concat([direction || 'ASC']) as OrderItem];
      }
    }

    // Handle pagination
    const usePagination = filter.page !== undefined && filter.page_size !== undefined;
    const page = filter.page || null;
    const pageSize = filter.page_size || null;
    const offset = usePagination ? (page - 1) * pageSize : undefined;
    const limit = usePagination ? pageSize : undefined;

    // Get total count
    const totalCount = await Invoice.count({
      where: whereOptions,
      distinct: true,
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: [],
        },
        {
          model: NumberEntry,
          as: 'number',
          attributes: [],
        },
      ],
    });

    // Get invoices with pagination
    const invoices = await Invoice.findAll({
      where: whereOptions,
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'name', 'first_name', 'last_name', 'type'],
        },
        {
          model: NumberEntry,
          as: 'number',
          attributes: ['id', 'custom_id'],
        },
        {
          model: InvoiceDetail,
          as: 'details',
          attributes: [[Sequelize.fn('COALESCE', Sequelize.col('location'), ''), 'location'], 'paid_on', 'slip_number'],
        },
      ],
      order: orderOptions,
      limit,
      offset,
    });

    const invoiceDetails = await Promise.all(
      invoices.map(async (invoice) => {
        // Convert to plain object
        const plainInvoice = invoice.get({ plain: true }) as InvoiceDetailDto;

        // Type cast details as InvoiceDetail or create an empty object with the expected structure
        const details = (plainInvoice.details as InvoiceDetail) || {
          paid_histories: [] as InvoicePayments[],
          date: null as Date | null,
          internal_desc_custom: null as string | null,
          location: null as string | null,
        };

        // Initialize detail_cost with default values
        plainInvoice.detail_cost = {
          total_gross: 0.0,
          total_gross_nk: 0.0,
          total_net: 0.0,
          total_net_nk: 0.0,
        };

        // Get cost details
        const detailCost = await this.getDetailInvoiceCost(plainInvoice.id);
        plainInvoice.detail_cost = detailCost;
        plainInvoice.amount = detailCost.total_gross + detailCost.total_gross_nk;

        // Set default values for required fields
        plainInvoice.type ||= '';
        plainInvoice.created_at ||= '0001-01-01T00:00:00Z';
        plainInvoice.updated_at ||= '0001-01-01T00:00:00Z';
        plainInvoice.project_id ||= 0;
        plainInvoice.total_amount ||= 0;
        plainInvoice.invoiced ||= 0;
        plainInvoice.is_connected = plainInvoice.is_connected || false;
        plainInvoice.remaining ||= 0;
        plainInvoice.date = details.date || '0001-01-01T00:00:00Z';

        // Format customer dates if customer exists
        if (plainInvoice.customer) {
          DateFormatter.formatDTO(plainInvoice.customer);
        }

        return plainInvoice;
      }),
    );

    return {
      items: invoiceDetails,
      total: totalCount,
      page,
      pageSize,
    };
  }

  async getInvoicesSummary(companyId: number): Promise<InvoiceDetailDto[]> {
    // Use Sequelize to get the invoices with proper associations
    const invoices = await this.invoiceRepository.findAll({
      where: {
        company_id: companyId,
        status: 'open',
        deleted_at: null,
      },
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: [
            'id',
            ['name', 'company'],
            'first_name',
            'last_name',
            'category',
            'type',
            'created_at',
            'updated_at',
          ],
        },
        {
          model: InvoiceDetail,
          as: 'details',
        },
      ],
      order: [['id', 'DESC']],
    });

    // Process and transform each invoice with all required details
    const invoiceDetails = await Promise.all(
      invoices.map(async (invoice) => {
        const plainInvoice = invoice.get({ plain: true }) as InvoiceDetailDto;

        // Get cost details - this is now using the new model-based approach
        const detailCost = await this.getDetailInvoiceCost(plainInvoice.id);

        // Populate required fields
        plainInvoice.detail_cost = detailCost;
        plainInvoice.amount = detailCost.total_gross + detailCost.total_gross_nk;
        plainInvoice.type ||= '';
        plainInvoice.created_at ||= '0001-01-01T00:00:00Z';
        plainInvoice.updated_at ||= '0001-01-01T00:00:00Z';
        plainInvoice.project_id ||= 0;
        plainInvoice.total_amount ||= 0;
        plainInvoice.invoiced ||= 0;
        plainInvoice.is_connected = plainInvoice.is_connected || false;
        plainInvoice.remaining ||= 0;

        // Set date from details model if it exists
        if (plainInvoice.details && plainInvoice.details.date) {
          plainInvoice.date = plainInvoice.details.date;
        } else {
          plainInvoice.date = '0001-01-01T00:00:00Z';
        }

        // Format customer dates
        if (plainInvoice.customer) {
          DateFormatter.formatDTO(plainInvoice.customer);
        }

        // Remove details from the response
        delete plainInvoice.details;

        return plainInvoice;
      }),
    );

    return invoiceDetails;
  }

  async getInvoicesByProject(company_id: number, project_id: number): Promise<InvoiceDetailDto[]> {
    const invoices = (await Invoice.findAll({
      where: { company_id: company_id, project_id: project_id, deleted_at: null },
      raw: true,
    })) as InvoiceDetailDto[];

    if (!invoices) {
      throw new NotFoundError('Invoices not found');
    }

    return invoices;
  }

  async getDetailInvoiceCost(invoiceId: number): Promise<DetailCost> {
    // Get invoice products (quote items) from the database
    const quoteItems = await InvoiceProduct.findAll({
      where: {
        invoice_id: invoiceId,
        type: {
          [Op.ne]: 'title',
        },
        optional: false,
      },
      raw: true,
    });

    // Get discount percentage from invoice details
    const discountPercent: number = await InvoiceDetail.findOne({
      attributes: ['discount_percent'],
      where: {
        invoice_id: invoiceId,
      },
      raw: true,
    }).then((res) => res?.discount_percent || 0);

    // Calculate totals using reduce
    const { totalNet, totalGross, totalNetNk, totalGrossNk } = quoteItems.reduce(
      (acc, quote) => {
        const cost = Number(quote.cost) || 0;
        const vatRate = Number(quote.vat_rate) || 0;
        const applyDiscount = quote.apply_discount; // Default to true if not specified
        const isNk = quote.is_nk; // Is nebenkosten quote_item

        let finalCost = cost;

        // Apply discount if applicable
        if ((applyDiscount || !isNk) && discountPercent > 0) {
          finalCost -= (finalCost * discountPercent) / 100;
        }

        // Calculate VAT
        const vatValue = (finalCost * vatRate) / 100;

        // Update the appropriate totals based on whether it's an NK item
        if (isNk) {
          acc.totalNetNk += finalCost;
          acc.totalGrossNk += finalCost + vatValue;
        } else {
          acc.totalNet += finalCost;
          acc.totalGross += finalCost + vatValue;
        }

        return acc;
      },
      { totalNet: 0, totalGross: 0, totalNetNk: 0, totalGrossNk: 0 },
    );

    // Return an object conforming to the DetailCost interface
    return {
      total_gross: totalGross,
      total_gross_nk: totalGrossNk,
      total_net: totalNet,
      total_net_nk: totalNetNk,
    };
  }

  async getInvoiceHistory(currentUser: User, invoiceId: number): Promise<InvoiceHistoryDto[]> {
    const invoice = await this.selectInvoice(currentUser.company_id, invoiceId);
    if (!invoice) {
      throw new NotFoundError('Invoice not found');
    }

    // Retrieve the invoice history
    const existingInvoices = await this.invoiceRepository.findAll({
      where: {
        project_id: invoice.project_id,
        company_id: currentUser.company_id,
        deleted_at: null,
      },
      order: [['created_at', 'ASC']],
    });
    if (existingInvoices.length === 0) {
      throw new BadRequestError('Invoice history not found');
    }

    const invoiceHistories: InvoiceHistoryDto[] = [];
    for (const existingInvoice of existingInvoices) {
      const detailCost = await this.getDetailInvoiceCost(existingInvoice.id);
      const invoiceHistory: InvoiceHistoryDto = {
        id: existingInvoice.id,
        name: existingInvoice.name,
        charged_on: existingInvoice.charged_on as Date,
        created_at: existingInvoice.created_at as Date,
        amount: detailCost.total_net + detailCost.total_net_nk,
      };
      invoiceHistories.push(invoiceHistory);
    }

    return invoiceHistories;
  }

  async invoicesStatsSummary(companyId: number): Promise<invoicesSummaryDto> {
    // Retrieve the invoices summary
    const invoices = await this.getInvoicesSummary(companyId);

    // Calculate total open amounts
    let totalOpenAmount = 0.0;
    let totalOpenAmountGross = 0.0;

    for (const invoice of invoices) {
      if (invoice.status === 'open') {
        totalOpenAmountGross += invoice.amount;
        totalOpenAmount += invoice.detail_cost.total_net + invoice.detail_cost.total_net_nk;
      }
    }

    // Count invoices with status 'offset'
    const cntInvsOffset = await Invoice.count({
      where: {
        company_id: companyId,
        status: 'offset',
        deleted_at: null,
      },
    });

    // Count invoices with reminder statuses ('reminder1', 'reminder2')
    const cntInvsReminder = await Invoice.count({
      where: {
        company_id: companyId,
        status: ['reminder1', 'reminder2'],
        deleted_at: null,
      },
    });

    // Return the summary result
    return {
      total_offset_invoices: cntInvsOffset,
      total_reminder_invoices: cntInvsReminder,
      total_open_invoices: invoices.length,
      total_open_net_amount: totalOpenAmount,
      total_open_gross_amount: totalOpenAmountGross,
    } as invoicesSummaryDto;
  }

  async detailInvoice(companyId: number, invoiceId: number): Promise<InvoiceDetailDto> {
    const invoice = (await this.selectInvoice(companyId, invoiceId)) as InvoiceDetailDto;

    if (!invoice) {
      throw new NotFoundError(`Invoice with ID ${invoiceId} not found`);
    }

    // Fetch additional cost details for the invoice
    invoice.detail_cost = await this.getDetailInvoiceCost(invoiceId);

    // Ensure default values for numeric and boolean fields
    invoice.amount ||= 0;
    invoice.remaining ||= 0;
    invoice.is_connected = invoice.is_connected || false;
    invoice.total_amount ||= 0;
    invoice.invoiced ||= 0;
    invoice.date ||= '0001-01-01T00:00:00Z';

    // Safely format the dates in the invoice object
    DateFormatter.formatDTO(invoice);

    // Safely format project details if present
    if (invoice.project as ProjectDetailDto) {
      const project = invoice.project as ProjectDetailDto;
      project.amount ||= 0;
      project.date ||= '0001-01-01T00:00:00Z';
      project.is_connected ||= false;
      DateFormatter.formatDTO(invoice.project);
    }

    // Safely format customer details if present
    if (invoice.customer) {
      DateFormatter.formatDTO(invoice.customer);
    }

    return invoice;
  }

  async selectInvoice(companyId: number, invoiceId: number): Promise<InvoiceDetailDto | null> {
    try {
      const invoice = await this.invoiceRepository
        .findOne({
          where: {
            id: invoiceId,
            company_id: companyId,
            deleted_at: {
              [Op.is]: null,
            },
          },
          include: [
            {
              model: Customer,
              as: 'customer',
              attributes: [
                'type',
                ['name', 'company'],
                [Sequelize.fn('COALESCE', Sequelize.col('customer.first_name'), ''), 'first_name'],
                [Sequelize.fn('COALESCE', Sequelize.col('customer.last_name'), ''), 'last_name'],
                ['metadata', 'details'],
              ],
              required: false,
            },
            {
              model: NumberEntry,
              as: 'number',
              attributes: ['id', 'custom_id'],
              required: false,
            },
            {
              model: Project,
              as: 'project',
              attributes: [],
              required: false,
            },
            {
              model: InvoiceDetail,
              as: 'details',
              include: [
                {
                  model: InvoiceAdditionalCost,
                  as: 'additional_costs',
                },
                {
                  model: InvoiceLabel,
                  as: 'internal_descs',
                },
                {
                  model: InvoiceProduct,
                  as: 'quote_items',
                },
                {
                  model: InvoicePayments,
                  as: 'paid_histories',
                },
              ],
            },
            {
              model: this.logRepository,
              as: 'log',
              attributes: ['created_at'],
              where: {
                type: 'invoice',
              },
              limit: 1,
              order: [
                ['created_at', 'DESC'],
                ['id', 'DESC'],
              ],
              separate: true,
            },
          ],
          subQuery: false,
        })
        .then((item) => item?.get({ plain: true }));

      if (!invoice) {
        throw new NotFoundError(`Invoice with ID ${invoiceId} not found`);
      }

      // Assign the last generated date from the log
      Object.assign(invoice, { last_generated: invoice.log.length ? invoice.log[0].created_at : 'N/A' });

      return invoice as InvoiceDetailDto;
    } catch (error) {
      this.logger.error('Error selecting invoice:', error);
      return null;
    }
  }

  async updateInvoiceStatus(companyId: number, dto: UpdateInvoiceStatusDto): Promise<void> {
    // Manual validation: Check if the status is valid
    if (!VALID_INVOICE_STATUSES.includes(dto.status as INVOICE_STATUS)) {
      throw new BadRequestError('Invalid status');
    }

    // Start a transaction using Sequelize
    const transaction = await Invoice.sequelize.transaction();

    try {
      for (const invoiceDto of dto.id) {
        // Find the invoice for the company
        const invoice = await Invoice.findOne({
          where: { id: invoiceDto.id, company_id: companyId },
          transaction,
        });

        if (!invoice) {
          throw new NotFoundError(`Invoice with ID ${invoiceDto.id} not found`);
        }

        // Update the status
        invoice.status = dto.status;
        await invoice.save({ transaction });
      }

      // Commit the transaction if everything succeeds
      await transaction.commit();
      return;
    } catch (error) {
      // Rollback the transaction if something goes wrong
      await transaction.rollback();
      throw error;
    }
  }

  async createInvoice(user: Partial<User>, createInvoiceDto: CreateInvoiceDto): Promise<void> {
    const transaction = await Invoice.sequelize.transaction();

    try {
      // Ensure customer exists
      if (!createInvoiceDto.customer || !createInvoiceDto.customer.id) {
        throw new BadRequestError('Customer ID is required.');
      }

      // Create a new invoice instance
      const invoice = new Invoice();
      invoice.company_id = user.company_id;
      invoice.customer_id = createInvoiceDto.customer.id;
      invoice.name = createInvoiceDto.name;
      invoice.status = INVOICE_STATUS.OFFSET; // Default status
      invoice.type = 'invoice'; // Default type

      // If a number is provided, create a new NumberEntry instance
      const newNumber = new NumberEntry();
      newNumber.company_id = user.company_id;
      newNumber.created_at = new Date();
      newNumber.type = 'invoice';
      const numberInstant = await NumberEntry.create(newNumber, { transaction });
      if (!numberInstant) {
        await transaction.rollback();
        throw new BadRequestError('Failed to create Number');
      }
      invoice.number_id = numberInstant.id;

      // Parse charged_on and due_on if provided
      if (createInvoiceDto.charged_on) {
        invoice.charged_on = new Date(createInvoiceDto.charged_on);
      }

      if (createInvoiceDto.due_on) {
        invoice.due_on = new Date(createInvoiceDto.due_on);
      }

      // Set project_id if provided
      if (createInvoiceDto.project_id) {
        invoice.project_id = createInvoiceDto.project_id;
      }

      // Save the invoice in the database
      const listRemoveFields = ['name', 'status', 'number', 'customer'];
      const details = removeFields(createInvoiceDto, listRemoveFields);
      const createdAt: Date = new Date();

      const createdInvoice = await Invoice.create(
        {
          company_id: invoice.company_id,
          offer_id: invoice.offer_id,
          project_id: invoice.project_id,
          customer_id: invoice.customer_id,
          type: invoice.type,
          name: invoice.name,
          number_id: invoice.number_id,
          charged_on: invoice.charged_on,
          due_on: invoice.due_on,
          status: invoice.status,
          created_at: createdAt,
          created_by: user.id,
        },
        { transaction },
      );

      const {
        additional_cost: additional_costs = [],
        internal_desc: internal_descs = [],
        paid_history: paid_histories = [],
        km_dropdown = { label: '', value: 0 },
        quote_items = [],
      } = details;

      await InvoiceDetail.create(
        {
          ...details,
          invoice_id: createdInvoice.id,
          project_id: invoice.project_id,
          selected_km_label: km_dropdown.label,
          selected_km_value: km_dropdown.value,
          created_at: createdAt,
          created_by: user.id,
        },
        {
          fields: [
            'invoice_id',
            'project_id',
            'date',
            'currency',
            'duration',
            'begin_desc',
            'end_desc',
            'location',
            'discount_percent',
            'internal_desc_custom',
            'address',
            'selected_km_label',
            'selected_km_value',
            'payment_deadline',
            'paid_on',
            'invoice_value_date',
            'invoice_comment',
            'slip_number',
            'is_final',
            'is_custom_date',
            'is_custom_title',
            'start_date_inv',
            'end_date_inv',
            'is_included_external_hour_report',
            'is_included_internal_hour_report',
            'created_at',
            'created_by',
          ],
          transaction,
        },
      );

      await Promise.all([
        InvoiceAdditionalCost.bulkCreate(
          additional_costs.map((ac_item: Partial<InvoiceAdditionalCost>) => ({
            invoice_id: createdInvoice.id,
            ...ac_item,
            created_at: createdAt,
            created_by: user.id,
          })),
          { transaction },
        ),
        InvoiceLabel.bulkCreate(
          internal_descs.map((label: Partial<InvoiceLabel>) => ({
            invoice_id: createdInvoice.id,
            ...label,
            created_at: createdAt,
            created_by: user.id,
          })),
          { transaction },
        ),
        InvoicePayments.bulkCreate(
          paid_histories.map((history) => {
            return {
              invoice_id: createdInvoice.id,
              date: history.date ? new Date(history.date) : null,
              percent: history.percent ? history.percent : null,
              amount: history.value ? history.value : null,
              created_at: createdAt,
              created_by: user.id,
            } as InvoicePayments;
          }),
          { transaction },
        ),
        InvoiceProduct.bulkCreate(
          quote_items.map((item: Partial<InvoiceProduct>) => {
            const invProductDto = item as InvoiceProduct;
            Object.assign(invProductDto, {
              id: null,
              product_id: item.id,
              invoice_id: createdInvoice.id,
              created_at: createdAt,
              created_by: user.id,
            });
            return invProductDto;
          }),
          { transaction },
        ),
      ]);

      // Commit the transaction
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw new BadRequestError('Failed to create invoice!');
    }
  }

  private excludedFields = [
    'name', // INVOICE_FIELD_NAME equivalent
    'status', // INVOICE_FIELD_STATUS equivalent
    'number', // INVOICE_FIELD_NUMBER equivalent
    'customer', // INVOICE_FIELD_CUSTOMER equivalent
    'offer', // INVOICE_FIELD_OFFER equivalent
    'user', // INVOICE_FIELD_USER equivalent
  ];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cleanMetadata(metadata: Record<string, any>): Record<string, any> {
    const cleanedMetadata = { ...metadata };

    // Iterate over excluded fields and delete them from the metadata
    this.excludedFields.forEach((field) => {
      if (field in cleanedMetadata) {
        delete cleanedMetadata[field];
      }
    });

    return cleanedMetadata;
  }

  async updateInvoice(user: User, invoiceId: number, updateInvoiceDto: UpdateInvoiceDto): Promise<void> {
    const transaction = await this.invoiceRepository.sequelize.transaction();
    const now = new Date(),
      createdAt = now,
      updatedAt = now,
      companyId: number = user.company_id;

    try {
      // Find the invoice by ID and company
      const invoice = await this.invoiceRepository.findOne({
        where: { id: invoiceId, company_id: companyId },
        include: [
          {
            model: InvoiceDetail,
            as: 'details',
            include: [
              {
                model: InvoiceAdditionalCost,
                as: 'additional_costs',
              },
              {
                model: InvoiceLabel,
                as: 'internal_descs',
              },
              {
                model: InvoiceProduct,
                as: 'quote_items',
              },
              {
                model: InvoicePayments,
                as: 'paid_histories',
              },
            ],
          },
        ],
        transaction,
      });

      if (!invoice) {
        throw new NotFoundError(`Invoice with ID ${invoiceId} not found`);
      }

      // Handle metadata.quote_items validation if related to project or offer
      if (invoice.offer_id || invoice.project_id) {
        if (updateInvoiceDto.quote_items && updateInvoiceDto.quote_items.length > 0) {
          for (const item of updateInvoiceDto.quote_items) {
            if (!item.uuid) {
              throw new BadRequestError('Invalid quote item UUID');
            }
          }
        }
      }

      // Update name and status if present
      if (updateInvoiceDto.name) {
        invoice.name = updateInvoiceDto.name;
      }

      if (updateInvoiceDto.status) {
        invoice.status = updateInvoiceDto.status as INVOICE_STATUS;
      }

      // Handle paid history logic
      if (updateInvoiceDto.paid_history) {
        let totalPercent = 0;
        const paidDates: Date[] = [];

        for (const history of updateInvoiceDto.paid_history) {
          if (history.percent) {
            totalPercent += history.percent;
          }

          if (history.date) {
            const paidDate = new Date(history.date);
            paidDates.push(paidDate);
          }
        }

        // Sort the dates to find the most recent
        paidDates.sort((a, b) => b.getTime() - a.getTime());

        // If the total percentage is >= 100, mark the invoice as paid
        if (totalPercent >= 100) {
          // Mark the invoice as paid
          invoice.status = INVOICE_STATUS.PAID;
          if (paidDates.length > 0) {
            updateInvoiceDto.paid_on = paidDates[0].toISOString().split('T')[0]; // YYYY-MM-DD format
          }
        }
      }

      // Update charged_on if present
      if (updateInvoiceDto.charged_on) {
        const chargedOn = new Date(updateInvoiceDto.charged_on);
        invoice.charged_on = chargedOn;
      }

      // Update due_on if present
      if (updateInvoiceDto.due_on) {
        const dueOn = new Date(updateInvoiceDto.due_on);
        invoice.due_on = dueOn;
      } else {
        invoice.due_on = null; // Clear due_on if not provided
      }

      // Update customer ID if provided
      if (updateInvoiceDto.customer) {
        const customer = updateInvoiceDto.customer;
        invoice.customer_id = customer.id;
      }

      // Update project_id if provided
      if (updateInvoiceDto.project_id) {
        invoice.project_id = updateInvoiceDto.project_id;
      }

      invoice.updated_at = updatedAt; // Manually set updated_at
      invoice.updated_by = user.id; // Set the user who updated the invoice

      // Update invoice details
      await InvoiceDetail.update(
        {
          ...this.cleanMetadata(updateInvoiceDto),
          updated_at: updatedAt,
          updated_by: user.id,
          selected_km_label: updateInvoiceDto.km_dropdown?.label,
          selected_km_value: updateInvoiceDto.km_dropdown?.value,
          is_included_external_hour_report: updateInvoiceDto.is_include_external_hour_report,
          is_included_internal_hour_report: updateInvoiceDto.is_include_internal_hour_report,
        },
        {
          where: { invoice_id: invoice.id },
          fields: [
            'project_id',
            'date',
            'currency',
            'duration',
            'begin_desc',
            'end_desc',
            'location',
            'discount_percent',
            'internal_desc_custom',
            'address',
            'selected_km_label',
            'selected_km_value',
            'payment_deadline',
            'slip_number',
            'is_final',
            'is_custom_date',
            'is_custom_title',
            'start_date_inv',
            'end_date_inv',
            'is_included_external_hour_report',
            'is_included_internal_hour_report',
            'updated_at',
            'updated_by',
          ],
          transaction,
        },
      );

      // Remove quote_items, additional_costs, and internal_descriptions and paid_histories that are not in the updateInvoiceDto
      await Promise.all([
        InvoiceAdditionalCost.destroy({
          where: {
            invoice_id: invoice.id,
            id: {
              [Op.notIn]: updateInvoiceDto.additional_cost?.map((ac) => ac.id) || [],
            },
          },
          transaction,
        }),
        InvoiceLabel.destroy({
          where: {
            invoice_id: invoice.id,
            id: {
              [Op.notIn]: updateInvoiceDto.internal_desc?.map((id) => id.id) || [],
            },
          },
          transaction,
        }),
        InvoiceProduct.destroy({
          where: {
            invoice_id: invoice.id,
            id: {
              [Op.notIn]: updateInvoiceDto.quote_items?.map((qi) => qi.id) || [],
            },
          },
          transaction,
        }),
        InvoicePayments.destroy({
          where: {
            invoice_id: invoice.id,
            id: {
              [Op.notIn]: updateInvoiceDto.paid_history?.map((ph) => ph.id) || [],
            },
          },
          transaction,
        }),
      ]);

      const creatingPromises = [],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        updatingPromises: Promise<any>[] = [];

      if (Array.isArray(updateInvoiceDto.additional_cost) && updateInvoiceDto.additional_cost.length) {
        updateInvoiceDto.additional_cost
          .filter((item) => item.id)
          .forEach((item) => {
            updatingPromises.push(
              InvoiceAdditionalCost.update(
                {
                  label: item.label,
                  value: item.value,
                  is_active: item.is_active,
                  updated_at: updatedAt,
                  updated_by: user.id,
                },
                {
                  where: { id: item.id, invoice_id: invoice.id },
                  transaction,
                },
              ),
            );
          });

        creatingPromises.push(
          InvoiceAdditionalCost.bulkCreate(
            updateInvoiceDto.additional_cost
              .filter((item) => !item.id)
              .map((item) => {
                const additionalCost = { ...item } as InvoiceAdditionalCost;
                Object.assign(additionalCost, {
                  invoice_id: invoice.id,
                  created_at: createdAt,
                  created_by: user.id,
                });
                return additionalCost;
              }),
          ),
          {
            fields: ['invoice_id', 'label', 'value', 'is_active', 'created_at', 'created_by'],
            transaction,
          },
        );
      }

      if (Array.isArray(updateInvoiceDto.internal_desc) && updateInvoiceDto.internal_desc.length) {
        updateInvoiceDto.internal_desc
          .filter((item) => item.id)
          .forEach((item) => {
            updatingPromises.push(
              InvoiceLabel.update(
                {
                  label: item.label,
                  is_active: item.is_active,
                  updated_at: updatedAt,
                  updated_by: user.id,
                },
                {
                  where: { id: item.id, invoice_id: invoice.id },
                  transaction,
                },
              ),
            );
          });

        creatingPromises.push(
          InvoiceLabel.bulkCreate(
            updateInvoiceDto.internal_desc
              .filter((item) => !item.id)
              .map((item) => {
                const internalDesc = { ...item } as InvoiceLabel;
                Object.assign(internalDesc, {
                  invoice_id: invoice.id,
                  created_at: createdAt,
                  created_by: user.id,
                });
                return internalDesc;
              }),
          ),
          {
            fields: ['invoice_id', 'label', 'is_active', 'created_at', 'created_by'],
            transaction,
          },
        );
      }

      if (Array.isArray(updateInvoiceDto.paid_history) && updateInvoiceDto.paid_history.length) {
        updateInvoiceDto.paid_history
          .filter((history) => history.id)
          .forEach((history) => {
            updatingPromises.push(
              InvoicePayments.update(
                {
                  date: history.date ? new Date(history.date) : null,
                  percent: history.percent ? history.percent : null,
                  amount: history.value ? history.value : null,
                  updated_at: updatedAt,
                  updated_by: user.id,
                },
                {
                  where: { id: history.id, invoice_id: invoice.id },
                  transaction,
                },
              ),
            );
          });

        creatingPromises.push(
          InvoicePayments.bulkCreate(
            updateInvoiceDto.paid_history
              .filter((history) => !history.id)
              .map((history) => {
                return {
                  invoice_id: invoice.id,
                  date: history.date ? new Date(history.date) : null,
                  percent: history.percent ? history.percent : null,
                  amount: history.value ? history.value : null,
                  created_at: createdAt,
                  created_by: user.id,
                } as InvoicePayments;
              }),
          ),
          {
            fields: ['invoice_id', 'date', 'percent', 'amount', 'created_at', 'created_by'],
            transaction,
          },
        );
      }

      if (Array.isArray(updateInvoiceDto.quote_items) && updateInvoiceDto.quote_items.length) {
        updateInvoiceDto.quote_items
          .filter((item) => item.id) // Only update existing items
          .forEach((item) => {
            updatingPromises.push(
              InvoiceProduct.update(
                {
                  product_id: item.product_id,
                  name: item.name,
                  cost: item.cost,
                  description: item.description,
                  type: item.type,
                  unit: item.unit,
                  price: item.price,
                  amount: item.amount,
                  optional: item.optional,
                  vat_rate: item.vat_rate,
                  apply_discount: item.apply_discount,
                  updated_at: updatedAt,
                  updated_by: user.id,
                },
                {
                  where: { id: item.id, invoice_id: invoice.id },
                  transaction,
                },
              ),
            );
          });

        creatingPromises.push(
          InvoiceProduct.bulkCreate(
            updateInvoiceDto.quote_items
              .filter((item) => !item.id) // Only create new items
              .map((item) => {
                const invProduct = { ...item } as InvoiceProduct;
                Object.assign(invProduct, {
                  invoice_id: invoice.id,
                  uuid: generateNewUUID(),
                  created_at: createdAt,
                  created_by: user.id,
                });
                return invProduct;
              }),
          ),
          {
            fields: [
              'invoice_id',
              'product_id',
              'name',
              'cost',
              'description',
              'type',
              'unit',
              'quarter',
              'year',
              'uuid',
              'price',
              'invoice_rate',
              'amount',
              'remaining',
              'break_page',
              'optional',
              'vat_rate',
              'is_nk',
              'apply_discount',
              'selected',
              'created_at',
              'created_by',
            ],
            transaction,
          },
        );
      }

      // Execute all update and create operations
      await Promise.all([...updatingPromises, ...creatingPromises, invoice.save({ transaction })]);

      // Commit transaction
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw new BadRequestError('Failed to update invoice!');
    }
  }

  async deleteInvoice(companyId: number, invoiceId: number, userId: number): Promise<void> {
    const user = await User.findOne({ where: { id: userId, company_id: companyId } });
    if (!user) {
      throw new NotFoundError(`User with ID ${userId} not found in company ${companyId}`);
    }
    const result = await this.invoiceRepository.update(
      { deleted_by: userId, deleted_at: new Date() },
      {
        where: {
          id: invoiceId,
          company_id: companyId,
        },
        returning: true,
      },
    );

    if (!result[0]) {
      throw new NotFoundError(`Invoice with ID ${invoiceId} not found`);
    }
  }

  async bulkDeleteInvoices(currentUser: User, bulkDeleteInvoicesDto: BulkDeleteOffersDto): Promise<void> {
    const { ids } = bulkDeleteInvoicesDto;
    const transaction = await Invoice.sequelize.transaction();
    try {
      for (const invoiceId of ids) {
        const existingInvoices = await Invoice.findAll({
          where: {
            [Op.or]: [{ id: invoiceId }],
          },
        });
        if (!existingInvoices) {
          continue;
        }

        for (const invoice of existingInvoices) {
          await this.invoiceRepository.update(
            {
              status: 'deleted',
              deleted_by: currentUser.id,
              deleted_at: new Date(),
            },
            {
              where: { id: invoice.id },
              transaction,
            },
          );
        }
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw new InternalServerError(`Failed to delete invoices`);
    }
  }

  async copyInvoice(invoiceId: number, user: User): Promise<void> {
    // Get the company details from the request or JWT
    const company = await Company.findOne({ where: { id: user.company_id } });
    if (!company) {
      throw new NotFoundError('Company not found');
    }

    // Fetch the invoice by ID
    const invoice = await this.invoiceRepository.findOne({
      where: { id: invoiceId, company_id: company.id },
      include: [
        {
          model: InvoiceDetail,
          as: 'details',
          include: [
            {
              model: InvoiceAdditionalCost,
              as: 'additional_costs',
            },
            {
              model: InvoiceLabel,
              as: 'internal_descs',
            },
            {
              model: InvoiceProduct,
              as: 'quote_items',
            },
            {
              model: InvoicePayments,
              as: 'paid_histories',
            },
          ],
        },
      ],
    });

    if (!invoice) {
      throw new NotFoundError('Invoice not found');
    }

    const plainInvoice = invoice.get({ plain: true }),
      currentTimestamp: Date = new Date();

    // Start a transaction
    const transaction = await this.invoiceRepository.sequelize.transaction();

    try {
      // Create a new invoice based on the existing one
      const newInvoice = await this.invoiceRepository.create(
        {
          ...plainInvoice,
          created_at: currentTimestamp,
          created_by: plainInvoice.created_by,
          name: `${plainInvoice.name} (Kopie)`,
          status: INVOICE_STATUS.OFFSET, // Default status for copied invoice
        },
        {
          fields: [
            'company_id',
            'offer_id',
            'project_id',
            'customer_id',
            'type',
            'name',
            'number_id',
            'status',
            'charged_on',
            'due_on',
            'created_at',
            'created_by',
          ],
          transaction,
          returning: true,
          raw: true,
        },
      );

      if (!newInvoice) {
        throw new BadRequestError('Failed to create copied invoice');
      }

      // Create a new InvoiceDetail for the copied invoice
      await InvoiceDetail.create(
        {
          ...plainInvoice.details,
          date: currentTimestamp,
          created_at: currentTimestamp,
          created_by: user.id,
          invoice_id: newInvoice.id,
        },
        {
          fields: [
            'invoice_id',
            'project_id',
            'date',
            'currency',
            'duration',
            'begin_desc',
            'end_desc',
            'location',
            'discount_percent',
            'internal_desc_custom',
            'address',
            'selected_km_label',
            'selected_km_value',
            'payment_deadline',
            'paid_on',
            'invoice_value_date',
            'invoice_comment',
            'slip_number',
            'is_final',
            'is_custom_date',
            'is_custom_title',
            'start_date_inv',
            'end_date_inv',
            'is_included_external_hour_report',
            'is_included_internal_hour_report',
          ],
          transaction,
        },
      );

      // Copy additional costs, internal descriptions, paid histories, and quote items (after regenerating UUIDs)
      await Promise.all([
        InvoiceAdditionalCost.bulkCreate(
          plainInvoice.details.additional_costs.map((ac) => ({
            ...ac,
            invoice_id: newInvoice.id,
            created_at: currentTimestamp,
            created_by: user.id,
          })),
          { fields: ['invoice_id', 'label', 'value', 'is_active', 'created_at', 'created_by'], transaction },
        ),
        InvoiceLabel.bulkCreate(
          plainInvoice.details.internal_descs.map((id) => ({
            ...id,
            invoice_id: newInvoice.id,
            created_at: currentTimestamp,
            created_by: user.id,
          })),
          { fields: ['invoice_id', 'label', 'is_active', 'created_at', 'created_by'], transaction },
        ),
        InvoicePayments.bulkCreate(
          plainInvoice.details.paid_histories.map((ph) => ({
            ...ph,
            invoice_id: newInvoice.id,
            created_at: currentTimestamp,
            created_by: user.id,
          })),
          { fields: ['invoice_id', 'date', 'amount', 'percent', 'created_at', 'created_by'], transaction },
        ),
        InvoiceProduct.bulkCreate(
          plainInvoice.details.quote_items.map((qi) => {
            const invProduct = { ...qi };
            Object.assign(invProduct, {
              invoice_id: newInvoice.id,
              uuid: generateNewUUID(),
              created_at: currentTimestamp,
              created_by: user.id,
            });
            return invProduct;
          }),
          {
            fields: [
              'invoice_id',
              'product_id',
              'name',
              'cost',
              'description',
              'type',
              'unit',
              'quarter',
              'year',
              'uuid',
              'price',
              'invoice_rate',
              'amount',
              'remaining',
              'break_page',
              'optional',
              'vat_rate',
              'is_nk',
              'apply_discount',
              'selected',
              'created_at',
              'created_by',
            ],
            transaction,
          },
        ),
      ]);

      // Insert a new number for the copied invoice
      const newNumber = await NumberEntry.create(
        {
          company_id: company.id,
          type: invoice.type,
          ref_id: newInvoice.id,
          created_at: currentTimestamp,
        },
        { transaction },
      );

      // Update the copied invoice with the new number ID
      newInvoice.number_id = newNumber.id;
      await newInvoice.save({ transaction });

      // Commit the transaction
      await transaction.commit();
    } catch (error) {
      // Rollback the transaction in case of an error
      await transaction.rollback();
      throw new BadRequestError('Failed to copy invoice');
    }
  }

  async paidInvoice(invoiceID: number, paidInvoiceDto: PaidInvoiceDto, user: User): Promise<void> {
    const { value_date: valueDate, comment } = paidInvoiceDto;
    const currentTimestamp = new Date();
    const transaction = await this.invoiceRepository.sequelize.transaction();

    try {
      // Fetch the invoice by ID
      const invoice = await this.invoiceRepository.findOne({
        where: { id: invoiceID, company_id: user.company_id },
        include: [
          {
            model: InvoiceDetail,
            as: 'details',
          },
        ],
        transaction,
      });
      const invDetails = invoice.get('details');

      if (!invoice) {
        throw new NotFoundError('Invoice not found');
      }

      invoice.status = INVOICE_STATUS.PAID;
      invoice.updated_at = currentTimestamp;
      invoice.updated_by = user.id;
      Object.assign(invDetails, {
        paid_on: new Date(valueDate),
        invoice_value_date: new Date(valueDate),
        invoice_comment: comment,
      });

      const asyncActions = [];

      // Archive the project if it's the final invoice
      if (invDetails.get('is_final')) {
        asyncActions.push(Project.update({ status: 'archive' }, { where: { id: invoice.project_id }, transaction }));
      }

      // Push all needed asynchronous actions to the array
      asyncActions.push(
        invoice.save({ transaction }),
        invDetails.save({ fields: ['paid_on', 'invoice_value_date', 'invoice_comment'], transaction }),
        this.logRepository.create(
          {
            company_id: user.company_id,
            ref_id: invoiceID,
            type: 'invoice',
            action: INVOICE_STATUS.PAID,
            metadata: {
              invoice_value_date: valueDate,
              invoice_comment: comment,
            },
          },
          { transaction },
        ),
      );

      // Run all asynchronous actions
      await Promise.all(asyncActions);

      // Commit the transaction
      await transaction.commit();
    } catch (error: Error | unknown) {
      // Rollback in case of error
      await transaction.rollback();
      throw new BadRequestError('Failed to mark invoice as paid');
    }
  }

  async cancelInvoice(invoiceID: number, companyID: number): Promise<void> {
    const transaction = await this.invoiceRepository.sequelize.transaction();

    // Fetch the invoice by ID and companyID
    const invoice = await this.invoiceRepository.findOne({
      where: { id: invoiceID, company_id: companyID },
      transaction,
    });

    if (!invoice) {
      throw new BadRequestError('Invoice not found');
    }

    // Update invoice status to 'cancelled'
    invoice.status = INVOICE_STATUS.CANCELLED;

    try {
      // Save the updated invoice
      await invoice.save({ transaction });

      // Commit the transaction
      await transaction.commit();
    } catch (error) {
      // Rollback in case of error
      await transaction.rollback();
      throw new BadRequestError('Failed to cancel invoice');
    }
  }

  async getInvoiceAmount(invoiceID: number): Promise<number> {
    return await InvoiceProduct.sum('cost', {
      where: {
        invoice_id: invoiceID,
        type: { [Op.not]: 'title' }, // Exclude title type products
        optional: false, // Exclude optional products
      },
    });
  }

  async listInvoiceReport(companyId: number, invoiceReportDto: InvoiceReportDto): Promise<InvoiceDetailDto[]> {
    const { status, customer, start, end } = invoiceReportDto;

    let handledStatus = status;
    if (status.includes('reminders')) {
      handledStatus = status
        .filter((s) => s !== 'reminders')
        .concat([INVOICE_STATUS.REMINDER_LEVEL_1, INVOICE_STATUS.REMINDER_LEVEL_2]);
    }

    // Filter by date range
    const submitStartDate = new Date(start);
    const submitEndDate = new Date(end);

    // Define the where options for the invoice query
    const whereOptions: WhereOptions<Invoice> = {
      company_id: companyId,
      deleted_at: {
        [Op.is]: null,
      },
      charged_on: {
        [Op.between]: [submitStartDate, submitEndDate],
      },
    };

    if (customer.length === 1 && customer[0] !== 'all') {
      whereOptions.customer_id = customer[0];
    } else if (customer.length > 1 && customer[0] !== 'all') {
      whereOptions.customer_id = {
        [Op.in]: customer,
      };
    }

    if (handledStatus.length === 1 && handledStatus[0] !== 'all') {
      whereOptions.status = handledStatus[0];
    } else if (handledStatus.length > 1) {
      whereOptions.status = {
        [Op.in]: handledStatus,
      };
    }

    const invoices = await this.invoiceRepository
      .findAll({
        attributes: ['id', 'project_id', 'type', 'name', 'status', 'charged_on', 'due_on', 'created_at', 'updated_at'],
        where: whereOptions,
        order: [['id', 'DESC']],
        include: [
          {
            model: Customer,
            as: 'customer',
            attributes: [
              'id',
              ['name', 'company'],
              'first_name',
              'last_name',
              'type',
              'metadata',
              'category',
              'created_at',
              'updated_at',
            ],
          },
          {
            model: NumberEntry,
            as: 'number',
            attributes: ['id', 'custom_id'],
          },
          {
            model: InvoiceDetail,
            as: 'details',
            attributes: ['discount_percent'],
          },
        ],
      })
      .then((result) => result.map((inv) => inv.get({ plain: true }) as InvoiceDetailDto));

    if (!invoices) {
      throw new BadRequestError('Failed to get invoice report');
    }

    for (const invoice of invoices) {
      invoice.invoiced = invoice.invoiced || 0;
      invoice.is_connected = invoice.is_connected || false;
      invoice.date = new Date(invoice.date);
      invoice.remaining = invoice.remaining || 0;
      invoice.total_amount = invoice.total_amount || 0;
      invoice.detail_cost = await this.getDetailInvoiceCost(invoice.id);
      invoice.amount = await this.getInvoiceAmount(invoice.id);
      if (invoice.details && invoice.details.discount_percent) {
        invoice.amount -= (invoice.amount * invoice.details.discount_percent) / 100;
      }
    }

    return invoices;
  }

  async exportFileInvoice(companyId: number, invoiceId: number, type: string, preview: string): Promise<Buffer> {
    if (['docx', 'pdf'].indexOf(type) === -1) {
      throw new BadRequestError('Invalid file type');
    }
    const com = await this.companyService.selectCompany(companyId);
    const inv = await this.selectInvoice(companyId, invoiceId);

    // Get invoice template
    const invoiceTemplate = await this.templateRepository.findOne({
      where: {
        company_id: companyId,
        type: FileTypeEnum.Invoice,
      },
    });

    if (!invoiceTemplate) {
      throw new BadRequestError('No invoice template found, please contact development team');
    }

    const typeExport = type === 'pdf' ? CodeEnum.PDFTypeInvoice : CodeEnum.DOCXTypeInvoice;

    const exportDto: ExportCreateDto = {
      created_at: new Date(),
      company_id: companyId,
      type: FileTypeEnum.Invoice,
      document_id: invoiceId,
      template_id: invoiceTemplate.id,
    };

    // search or insert new record in exports table
    const [exported] = await this.exportService.selectOrCreateExport(exportDto);
    if (!exported) {
      throw new BadRequestError('Export failed');
    }

    const code = generateNewUUID();

    if (inv.status === INVOICE_STATUS.OFFSET && preview == 'false' && type == 'pdf') {
      inv.status = INVOICE_STATUS.OPEN;
      await this.invoiceRepository.update(
        { status: INVOICE_STATUS.OPEN, updated_at: new Date() },
        { where: { id: invoiceId } },
      );
    }

    let bufferFile: Buffer = await this.generateInvoiceFile(invoiceId, com, typeExport, invoiceTemplate.path, type);

    await this.logRepository.create({
      company_id: companyId,
      ref_id: invoiceId,
      type: FileTypeEnum.Invoice,
      action: type === 'pdf' ? ActionEnum.ExportPDF : ActionEnum.ExportDOCX,
      created_at: new Date(),
      metadata: {
        invoice_pdf_code: code,
        invoice_status: inv.status,
      },
    });

    // Generate Swiss QR code and merge it with PDF in `plan4` and `plan4you` company
    if (type == 'pdf') {
      const merges: Buffer[] = [];
      if (com.id === 3 || com.id === 27) {
        const setting = await this.settingService.selectSetting(companyId);

        if (setting.invoice?.include_qr) {
          const masterData: Record<string, string | number> = (setting?.master_data ?? {}) as Record<
            string,
            string | number
          >;
          const doc = (await getDocument(invoiceId, companyId, typeExport)) as Invoice;
          const customer = await this.customerService.selectCustomer(doc.company_id, doc.customer_id);
          const costData = await this.getDetailInvoiceCost(invoiceId);

          let cusTitle = customer.name;
          if (customer.type === 'person') {
            cusTitle = [
              customer.first_name?.trim() || customer.metadata.first_name?.trim(),
              customer.last_name?.trim() || customer.metadata.last_name?.trim(),
            ]
              .filter(Boolean)
              .join(' ');
          }

          const generatedQrIban = getQRRefNumber(String(invoiceId + 101).padStart(5, '0'));

          const qrData: IBbitQRBill = {
            amount: Number(formatNumber(costData.total_gross + costData.total_gross_nk, 0.05, 0, 2, '.', '')),
            account: masterData.iban as string,
            creditor: {
              type: BbitQRBillAddressType.UNSTRUCTURED,
              address: masterData.address as string,
              street: '', // Default value
              buildingNumber: '', // Default value
              locality: masterData.place as string,
              country: masterData.country as string,
              name: masterData.company as string,
              postalCode: masterData.postcode as string,
            },
            currency: masterData.currency as 'CHF' | 'EUR' as BbitQRBillCurrency,
            debtor: {
              type: BbitQRBillAddressType.STRUCTURED,
              address: customer.metadata.address as string,
              street: customer.metadata.address as string, // Default value
              buildingNumber: '', // Default value
              name: cusTitle,
              postalCode: customer.metadata.postcode as string,
              locality: customer.metadata.place as string,
              country: 'CH',
            },
            reference: generatedQrIban.padStart(27, '0'),
            language: BbitQRBillLanguage.DE,
          };
          // Handle zero amount to avoid verification error in @bbitgmbh/bbit.swiss-qr-bill
          // It will not affect the figures in the QR code
          if (!qrData.amount) {
            qrData.amount = Number('0.001');
          }
          const qrPdfBuffer = await this.exportFileService.generateQrCodePdf(qrData);
          merges.push(qrPdfBuffer);
        }
      }

      const effortTypes: string[] = [];
      if (inv.details.is_included_internal_hour_report) {
        effortTypes.push('list-effort-internal');
      }
      if (inv.details.is_included_external_hour_report) {
        effortTypes.push('list-effort-external');
      }

      // Include internal hour report and external hour report if they are enabled in Invoice metadata
      if (inv.project_id !== 0 && effortTypes.length > 0) {
        // for (const v of effortTypes) {
        //   // Generate internal hour report
        //   const hourFileName = `${27}-${inv.project_id}-${code}-${v}`;
        //   const hourFileJsonPath = path.join(currentPath, PATH_UPLOAD, 'pdfs', `${hourFileName}.json`);
        //   const hourFilePath = path.join(currentPath, PATH_UPLOAD, 'pdfs', `${hourFileName}.pdf`);
        //   const [startDate, endDate] = [parseDate(inv.metadata.start_date_inv), parseDate(inv.metadata.end_date_inv)];
        //   if (!startDate || !endDate) {
        //     throw new BadRequestError('Invalid start or end date');
        //   }
        //   const inputRenderer = {
        //     url: `${process.env.FRONTEND_URL}/#/report/${v}/${inv.project_id}?start=${formatDateToYYYYMMDD(startDate)}&end=${formatDateToYYYYMMDD(endDate)}`,
        //     token: `Bearer ${token}`,
        //     options: {
        //       format: 'A4',
        //       path: hourFilePath,
        //       landscape: false,
        //     },
        //   };
        //   const dat = JSON.stringify(inputRenderer);
        //   fs.writeFileSync(hourFileJsonPath, dat, { mode: 0o777 });
        //   // Generate the PDF using Puppeteer service
        //   try {
        //     await this.puppeteerService.generatePdfFromHtml(inputRenderer.url, token, filepath);
        //   } catch (err) {
        //     throw new BadRequestError(`Error generating PDF`);
        //   }
        //   merges.push(`${currentPath}/${PATH_UPLOAD_PDF}/${hourFileName}.pdf`);
        // }
      }

      if (merges.length > 0) {
        // Merge all the PDF buffers
        bufferFile = await combinePdfBuffers([bufferFile, ...merges]);
      }
    }

    return bufferFile;
  }

  private async generateInvoiceFile(
    invoiceId: number,
    company: Company,
    typeExport: string,
    templatePath: string,
    fileType: string,
  ): Promise<Buffer> {
    const doc = (await getDocument(invoiceId, company.id, typeExport)) as Invoice;
    const customer = await this.customerService.selectCustomer(doc.company_id, doc.customer_id);
    const setting = await this.settingService.selectSetting(company.id);
    const invoices = (await this.projectService.detailProject(doc.company_id, doc.project_id)).invoices;

    const contentKeys = [
      'customer',
      'other_address',
      'address_other',
      'customer_address',
      'postcode',
      'place',
      'date',
      'name',
      'location',
      'address',
      'begin_desc',
      'paid_info',
      'services',
      'service_sum',
      'history',
      'payment_info',
      'end_desc',
    ];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const details: any = doc.details || {};
    const breakPageKeys = ['inv_begin_break', 'inv_quote_break'];
    let invoiceData: Record<string, string> = addFieldValuesIfNotExisted(contentKeys, breakPageKeys, details);

    let number = '';
    let name = doc.name;
    if (doc.project_id) {
      const getProject = (await getDocument(doc.project_id, company.id, 'project')) as Project;
      if (getProject) {
        number = getProject.number.custom_id || String(getProject.number.id);
      }
    }

    // Trim the number to remove any leading or trailing spaces
    number = number.trim();

    if (number && !this.isCustomTitle(doc)) {
      name = this.getCleanName(doc.name);
      const prefix = this.getInvoicePrefixType(doc);
      name = name.includes(number) ? prefix + name : `${prefix}${number} ${name}`;
    }

    let cusTitle = customer.name;
    if (customer.type === 'person') {
      cusTitle = [
        getCustomerTitle(customer.metadata.title),
        customer.first_name?.trim() || customer.metadata.first_name?.trim(),
        customer.last_name?.trim() || customer.metadata.last_name?.trim(),
      ]
        .filter(Boolean)
        .join(' ');
    }

    // Handle invoice slip_number like the legacy
    let needToGenRef = false;
    if ('slip_number' in details) {
      const check = details['slip_number'] as string;
      if (!check || check.length === 0) {
        needToGenRef = true;
      }
    } else {
      needToGenRef = true;
    }

    // Generate slip_number if it doesn't exist or is empty. Then update the invoice metadata.
    if (needToGenRef) {
      const slipNumber = getQRRefNumber(String(invoiceId + 101).padStart(5, '0'));
      details['slip_number'] = slipNumber;
      await InvoiceDetail.update(
        {
          slip_number: slipNumber,
        },
        {
          where: { invoice_id: invoiceId },
        },
      );
    }

    const strChargedOn: string = doc.charged_on ? new Date(doc.charged_on).toISOString().split('T')[0] : ''; // YYYY-MM-DD format

    invoiceData = {
      ...invoiceData,
      date: strChargedOn ? formatDateToDotSeparated(strChargedOn) : '',
      customer: cusTitle,
      customer_address: customer.metadata?.address || '',
      address_other: customer.metadata?.other_address || '',
      postcode: customer.metadata?.postcode || '',
      place: customer.metadata?.place || '',
      name,
      address: details?.address || '',
      services: '',
      service_sum: '',
      history: '',
      paid_info: '',
      payment_info: '',
    };

    if (details?.is_final && doc.type !== 'hour') {
      const project = (await getDocument(doc.project_id, company.id, 'project')) as Project;
      const prjDetails = project.details as unknown as Record<string, string | Record<string, string | number>[]>;
      invoiceData.services = getTable(prjDetails, company);
      invoiceData.service_sum = getFinalSum(prjDetails, invoices, this.isValidPaidHistory(details));
    } else {
      invoiceData.services = getTable(details, company);
      invoiceData.service_sum = getTableSum(details);
    }

    if (this.isValidPaidHistory(details)) {
      invoiceData.history = this.getInvoicePaidHistory(details, company);
    }

    invoiceData.paid_info = this.getInvoicePaidInfo(details, company);
    invoiceData.payment_info = this.getInvoicePaymentInfo(setting, company, details);

    //  generate the PDF or DOCX
    const bufferFile = await this.exportFileService.exportFileFromTemplate(invoiceData, templatePath, '.' + fileType);

    if (!bufferFile) {
      throw new BadRequestError('Generate invoice file failed!');
    }

    return bufferFile;
  }

  private getInvoicePaidHistory(dummy: Record<string, string | Record<string, string | number>[]>, company: Company) {
    const vatArr = [];
    let totalCost = 0.0;
    let totalApplyDiscount = 0.0;
    let vat = 0.0;
    let remaining = 0.0;

    // Total cost
    const quote_items = dummy.quote_items as Record<string, string | number>[];

    for (const val of quote_items) {
      if (val.type === 'individual' && !val.optional) {
        totalCost += Number(val.cost);

        // Group VAT
        const object = {
          vat: val.vat_rate,
          cost: 0.0,
          total: 0.0,
        };
        vatArr.push(object);

        // Exclude not applied discount items to calculate discount for invoice
        if ('apply_discount' in val) {
          if (val.apply_discount) {
            totalApplyDiscount += Number(val.cost);
          }
        } else {
          totalApplyDiscount += Number(val.cost);
        }
      }
    }

    // Discount
    const discountPercent = Number(dummy.discount_percent);
    const discount = (totalApplyDiscount * discountPercent) / 100;

    // Total net
    const totalNet = totalCost - discount;

    // VAT list
    const uniqueVatArr = Array.from(new Set(vatArr.map((item) => JSON.stringify(item)))).map((item) =>
      JSON.parse(item),
    );
    let vatTotal = 0.0;
    let vatApplyDiscount = 0.0;

    for (const val of uniqueVatArr) {
      for (const val2 of dummy.quote_items) {
        if (typeof val2 !== 'string' && !val2.vat_rate) {
          continue;
        }
        if (
          typeof dummy.discount_percent === 'number' &&
          dummy.discount_percent > 0 &&
          typeof val2 !== 'string' &&
          val.vat === val2.vat_rate &&
          !val2.optional
        ) {
          let cost = val2.cost;
          if (typeof val2.is_nk === 'string' ? val2.is_nk === 'true' : val2.is_nk) {
            cost = val2.price;
          }
          if ('apply_discount' in val2) {
            if (val2.apply_discount) {
              vatApplyDiscount += Number(cost);
            }
          } else {
            vatApplyDiscount += Number(cost);
          }
          vatTotal += Number(cost);
        } else if (typeof val2 !== 'string' && val?.vat && val.vat === val2.vat_rate && !val2.optional) {
          vatTotal += Number(val2.cost);
          vatApplyDiscount += Number(val2.cost);
        }
      }
      vatTotal -= (vatApplyDiscount * Number(dummy.discount_percent)) / 100;
      val.total = vatTotal;
      val.cost = (vatTotal * val.vat) / 100;
      vatTotal = 0.0;
      vatApplyDiscount = 0.0;
    }

    // Total gross
    for (const val of uniqueVatArr) {
      vat += val.cost;
    }
    const totalGross = totalNet + vat;

    // Remaining
    let totalPaid = 0.0;
    const paid_history = (dummy.paid_history as { date: string | number | Date; value: string | number }[]) || [];

    paid_history.forEach((val) => {
      totalPaid += Number(val.value);
    });
    remaining = totalGross - totalPaid;

    const table: string[][] = [];

    for (const val of paid_history) {
      const dt = new Date(val.date);
      table.push([
        `<table:table-cell table:style-name="TableCell">
          <text:p text:style-name="Standard">Bezahlt am ${dt.toLocaleDateString('de-DE')}</text:p>
        </table:table-cell>`,
        `<table:table-cell table:style-name="TableCell">
          <text:p text:style-name="Standard">-${formatNumber(val.value)}</text:p>
        </table:table-cell>`,
      ]);
    }

    table.push([
      `<table:table-cell table:style-name="TableCell">
        <text:p text:style-name="Standard"><text:span text:style-name="Bold">Noch offen</text:span></text:p>
      </table:table-cell>`,
      `<table:table-cell table:style-name="TableCell">
        <text:p text:style-name="Standard">${getCurrency(dummy, company)} ${formatNumber(remaining)}</text:p>
      </table:table-cell>`,
    ]);

    const tablePaidHis = `
    <table:table table:name="TableDefault" table:style-name="Table">
    <table:table-column table:style-name="TableColumn" table:number-columns-repeated="2"/>
      ${table.map((row) => `<table:table-row>${row.map((cell) => cell).join('')}</table:table-row>`).join('')}
    </table:table>
    `;
    return tablePaidHis;
  }

  public getInvoicePaymentInfo(
    setting: Setting,
    company: Company,
    dummy: Record<string, number | string | Record<string, string | number>[]>,
  ): string {
    const masterData = setting.master_data as Record<string, string>;
    const invoiceData = setting.invoice;
    let reminder1PaymentDeadline = invoiceData.reminder1_payment_deadline;
    let reminder2PaymentDeadline = invoiceData.reminder2_payment_deadline;
    let paymentDeadline = invoiceData.payment_deadline;

    // Check exists data
    if ('reminder1_payment_deadline' in dummy) {
      reminder1PaymentDeadline = dummy.reminder1_payment_deadline as number;
    }
    if ('reminder2_payment_deadline' in dummy) {
      reminder2PaymentDeadline = dummy.reminder2_payment_deadline as number;
    }
    if ('payment_deadline' in dummy) {
      paymentDeadline = dummy.payment_deadline as number;
    }

    let html = `<p>MwSt.-Nummer: ${masterData.mwst}`;
    if (dummy.status === 'reminder1') {
      html += ` | zahlbar innert ${reminder1PaymentDeadline} tagen</p>`;
    } else if (dummy.status === 'reminder2') {
      html += ` | zahlbar innert ${reminder2PaymentDeadline} tagen</p>`;
    } else {
      html += ` | zahlbar innert ${paymentDeadline} Tagen</p>`;
    }

    html += `<br/><p>Name des Begünstigten: ${escape(company.name)}</p><br/>`;
    html += '<p>';
    if ('bank' in masterData) {
      html += `Bankname: ${masterData.bank}`;
    }
    if ('bank' in masterData && 'konto' in masterData) {
      html += ` | `;
    }
    if ('iban' in masterData) {
      html += `IBAN: ${masterData.iban}`;
    }
    html += `</p><br/>`;
    if ('slip_number' in dummy) {
      html += `<p>Einzahlungsschein-Referenznummer: ${dummy.slip_number}</p>`;
    }

    return html;
  }

  public getInvoicePaidInfo(
    dummy: Record<string, string | Record<string, string | number>[]>,
    company: Company,
  ): string {
    const dummyType = 'invoice';
    let html = '';

    if (dummyType !== 'invoice') {
      const totalAmount =
        typeof dummy.total_amount === 'number' || typeof dummy.total_amount === 'string' ? dummy.total_amount : 0;
      const remaining =
        typeof dummy.remaining === 'number' || typeof dummy.remaining === 'string' ? dummy.remaining : 0;
      html += `<p>Gesamtbetrag ${getCurrency(dummy, company)}: ${formatNumber(totalAmount)}</p>`;
      html += `<p>Restbetrag ${getCurrency(dummy, company)}: ${formatNumber(remaining)}</p>`;
    }

    return html;
  }

  public isValidPaidHistory(dummy: Record<string, string | Record<string, string | number>[]>): boolean {
    if (!dummy?.paid_history) {
      return false;
    }

    let total = 0;
    let percent = 0;
    const paid_history =
      (dummy.paid_history as { date: string | number | Date; value: string | number; percent: string | number }[]) ||
      [];
    for (const val of paid_history) {
      if (val.value == 0 && val.percent == 0) {
        return false;
      }
      total += Number(val.value);
      percent += Number(val.percent);
    }

    return !(total === 0 && percent === 0);
  }

  private isCustomTitle(document: Invoice): boolean {
    if (!document || !document.type || !document.details) {
      return false;
    }

    if (
      typeof document.details === 'object' &&
      'is_custom_title' in document.details &&
      document.details.is_custom_title
    ) {
      return true;
    }

    return false;
  }

  private getCleanName(name: string): string {
    return name.replace(/(Teilrechnung |Rechnung |Schlussrechnung )/g, '');
  }

  private getInvoicePrefixType(document: Invoice): string {
    if (!document?.type || !document?.details) {
      return ''; // If includes just return empty
    }

    if (document.details.is_final) {
      return 'Schlussrechnung ';
    }

    if (document.type === 'invoice') {
      return 'Rechnung ';
    }

    return 'Teilrechnung ';
  }
}
