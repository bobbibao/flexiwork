import { Op, Sequelize, WhereOptions } from 'sequelize';
import Company from 'src/database/models/companies.model';
import Customer from 'src/database/models/customers.model';
import Invoice from 'src/database/models/invoices.model';
import Log from 'src/database/models/logs.model';
import NumberEntry from 'src/database/models/numbers.model';
import Offer from 'src/database/models/offers.model';
import Product from 'src/database/models/products.model';
import Project from 'src/database/models/projects.model';
import Unit from 'src/database/models/units.model';
import User from 'src/database/models/users.model';
import VatRate from 'src/database/models/vat-rates.model';
import { CompanyService } from 'src/modules/company/services/company.service';
import { CustomerService } from 'src/modules/customer/services/customer.service';
import { ExportCreateDto } from 'src/modules/export/dto/export-create.dto';
import { ExportService } from 'src/modules/export/services/export.service';
import { SettingService } from 'src/modules/setting/services/setting.service';
import { DetailCost } from 'src/shared/dto';
import { ActionEnum, CodeEnum, FileTypeEnum } from 'src/shared/enums';
import {
  addFieldValuesIfNotExisted,
  BadRequestError,
  generateNewUUID,
  getCustomerTitle,
  getDocument,
  getEventTable,
  getTable,
  getTableSum,
  InternalServerError,
  NotFoundError,
} from 'src/shared/utils';
import { formatDateToDotSeparated } from 'src/shared/utils/date-utils';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { ExportFileService } from '../../export/services/export-file.service';
import { OfferGeneratorType } from '../constants';
import { DEFAULT_ARCHITECTURE_GROUP_NAME } from 'src/shared/constants/company-group-defaults.constant';
import {
  AcceptOfferDto,
  CreateOfferDto,
  GeneratedProductResponse,
  GenerateProductDto,
  OfferDetailDto,
  ProductQuoteItem,
  QueryPaginateDto,
  UpdateOfferDto,
} from '../dto';
import CompanyTemplate from 'src/database/models/company-templates.model';
import OfferAdditionalCost from 'src/database/models/offer-additional-cost.model';
import OfferCostEstimate from 'src/database/models/offer-cost-estimate.model';
import OfferDetail from 'src/database/models/offer-details.model';
import OfferEvent from 'src/database/models/offer-event.model';
import OfferInternalDesc from 'src/database/models/offer-internal-desc.model';
import OfferQuoteItem from 'src/database/models/offer-quote-item.model';
import { isDateString } from 'class-validator';
import { OfferOverViewResponseDto } from '../dto/offer-overview.dto';
import { getOrderOptions } from 'src/shared/utils/generate-ORM-options';
import { BulkDeleteOffersDto } from '../dto/bulk-delete-offers.dto';
import ProjectProducts from 'src/database/models/project-products.model';
import ProjectCostEstimates from 'src/database/models/project-cost-estimates.model';
import ProjectLabels from 'src/database/models/project-labels.model';
import ProjectAdditionalCosts from 'src/database/models/project-additional-costs.model';
import ProjectEvents from 'src/database/models/project-events.model';
import ProjectDetails from 'src/database/models/project-details.model';
import InvoiceDetail from 'src/database/models/invoice-details.model';
import InvoiceProduct from 'src/database/models/invoice-products.model';
import { InvoiceAdditionalCost, InvoiceLabel } from 'src/database/models';
import CompanyGroup from 'src/database/models/company-groups.model';

@Injectable()
export class OfferService {
  constructor(
    @Inject('LOG_REPOSITORY')
    private readonly logRepository: typeof Log,
    @Inject('OFFER_REPOSITORY')
    private readonly offerRepository: typeof Offer,
    @Inject('COMPANY_TEMPLATE_REPOSITORY')
    private readonly companyTemplateRepository: typeof CompanyTemplate,
    @Inject('COMPANY_GROUP_REPOSITORY')
    private readonly companyGroupRepository: typeof CompanyGroup,
    @Inject('OFFER_ADDITIONAL_COST_REPOSITORY')
    private readonly offerAdditionalCostRepository: typeof OfferAdditionalCost,
    @Inject('OFFER_COST_ESTIMATE_REPOSITORY')
    private readonly offerCostEstimateRepository: typeof OfferCostEstimate,
    @Inject('OFFER_DETAIL_REPOSITORY')
    private readonly offerDetailRepository: typeof OfferDetail,
    @Inject('OFFER_EVENT_REPOSITORY')
    private readonly offerEventRepository: typeof OfferEvent,
    @Inject('OFFER_INTERNAL_DESC_REPOSITORY')
    private readonly offerInternalDescRepository: typeof OfferInternalDesc,
    @Inject('OFFER_QUOTE_ITEM_REPOSITORY')
    private readonly offerQuoteItemRepository: typeof OfferQuoteItem,
    @Inject(forwardRef(() => ExportService))
    private readonly exportService: ExportService,
    private readonly settingService: SettingService,
    private readonly companyService: CompanyService,
    private readonly customerService: CustomerService,
    private readonly exportFileService: ExportFileService,
    @Inject('INVOICE_DETAIL_REPOSITORY')
    private readonly invoiceDetailRepository: typeof InvoiceDetail,
    @Inject('INVOICE_PRODUCT_REPOSITORY')
    private readonly invoiceProductRepository: typeof InvoiceProduct,
    @Inject('INVOICE_ADDITIONAL_COST_REPOSITORY')
    private readonly invoiceAdditionalCostRepository: typeof InvoiceAdditionalCost,
    @Inject('INVOICE_LABEL_REPOSITORY')
    private readonly invoiceLabelRepository: typeof InvoiceLabel,
  ) {}

  async getOfferSummary(companyId: number): Promise<OfferDetailDto[]> {
    // Refactor from OFFER_SUMMARY_SQL query, need to test carefully
    // Get all offer_ids belonging to the company, excluding deleted ones
    const activeOfferIds: number[] = await this.offerRepository
      .findAll({
        where: {
          company_id: companyId,
          status: 'active',
        },
        attributes: ['id'],
        raw: true,
      })
      .then((list) => list.map((item) => item.id));

    // Calculate the total amount for satisfied offers
    const filteredOffers = (await this.offerQuoteItemRepository.findAll({
      attributes: ['offer_id', [Sequelize.fn('SUM', Sequelize.cast(Sequelize.col('cost'), 'FLOAT')), 'total_amount']],
      where: {
        type: { [Op.ne]: 'title' },
        optional: false,
        offer_id: {
          [Op.in]: activeOfferIds,
        },
      },
      group: ['offer_id'],
      raw: true,
    })) as unknown as { offer_id: number; total_amount: number }[];

    // Filter out offers with a total amount of 0
    const filteredOfferIds = filteredOffers.filter((item) => item.total_amount > 0).map((item) => item.offer_id);

    // Get all offers with the filtered offer IDs
    const offers = await this.offerRepository
      .findAll({
        where: {
          company_id: companyId,
          status: 'active',
          id: {
            [Op.in]: filteredOfferIds,
          },
        },
        attributes: ['id', 'name', [Sequelize.col('"details"."date"'), 'date']],
        include: [
          {
            model: Customer,
            as: 'customer',
            attributes: [
              'type',
              ['name', 'company'],
              [Sequelize.fn('COALESCE', Sequelize.col('first_name'), ''), 'first_name'],
              [Sequelize.fn('COALESCE', Sequelize.col('last_name'), ''), 'last_name'],
            ],
          },
          {
            model: NumberEntry,
            as: 'number',
            attributes: ['id', 'custom_id'],
          },
          {
            model: OfferDetail,
            as: 'details',
            attributes: ['date'],
          },
        ],
      })
      .then((list) => list.map((item) => item.get({ plain: true }) as OfferDetailDto));

    for (const offer of offers) {
      offer.amount = filteredOffers.find((item) => item.offer_id === offer.id)?.total_amount || 0;
      offer.detail_cost = await this.getDetailOfferCost(offer.id);
      offer.amount = offer.detail_cost.total_gross + offer.detail_cost.total_gross_nk;
    }

    return offers as OfferDetailDto[];
  }

  async listOffers(currentUser: User, status: string, query?: QueryPaginateDto): Promise<OfferOverViewResponseDto> {
    // Build where options
    const whereOptions: WhereOptions<Offer> = {
      company_id: currentUser.company_id,
    };

    if (status === 'all') {
      // No additional where options needed
    } else if (status === 'deleted') {
      whereOptions.status = 'deleted';
      whereOptions.deleted_at = {
        [Op.not]: null,
      };
    } else {
      whereOptions.status = status;
      whereOptions.deleted_at = {
        [Op.is]: null,
      };
    }

    if (query?.search) {
      if (isNaN(Number(query.search))) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (whereOptions as any)[Op.or] = [
          { name: { [Op.iLike]: `%${query.search}%` } },
          { '$customer.name$': { [Op.iLike]: `%${query.search}%` } },
          { '$customer.first_name$': { [Op.iLike]: `%${query.search}%` } },
          { '$customer.last_name$': { [Op.iLike]: `%${query.search}%` } },
          { '$details.location$': { [Op.iLike]: `%${query.search}%` } },
        ];
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (whereOptions as any)[Op.or] = [
          Sequelize.where(Sequelize.cast(Sequelize.col('number.id'), 'TEXT'), { [Op.iLike]: `%${query.search}%` }),
        ];
      }
    }
    // Get total count of all matching offers
    const total_items = await this.offerRepository.count({
      where: whereOptions,
      include: [
        {
          model: NumberEntry,
          as: 'number',
          attributes: [],
        },
        {
          model: Customer,
          as: 'customer',
          attributes: [],
        },
        {
          model: this.offerDetailRepository,
          as: 'details',
          attributes: [],
        },
      ],
    });
    // Calculate total sums from all offers
    let total_sum_net = 0;
    let total_sum_gross = 0;

    // Get all offer IDs first to calculate totals
    const allOfferIds = await this.offerRepository.findAll({
      where: whereOptions,
      attributes: ['id', 'status'],
      include: [
        {
          model: NumberEntry,
          as: 'number',
          attributes: [],
        },
        {
          model: Customer,
          as: 'customer',
          attributes: [],
        },
        {
          model: this.offerDetailRepository,
          as: 'details',
          attributes: [],
        },
      ],
      raw: true,
    });

    // Calculate totals from all offers
    for (const offer of allOfferIds) {
      if (offer.status === 'active') {
        const detailCost = await this.getDetailOfferCost(offer.id);
        total_sum_net += detailCost.total_net + detailCost.total_net_nk;
        total_sum_gross += detailCost.total_gross + detailCost.total_gross_nk;
      }
    }

    // Calculate offset for pagination
    let offset, limit, page, orderOptions;

    if (query?.page) {
      page = query.page;
      offset = (query.page - 1) * query.pageSize;
      limit = query.pageSize;
    } else {
      offset = null;
      limit = null;
    }

    // Handle sorting
    if (query?.sort) {
      if (query.sort.split(':')[0] === 'companyName') {
        const direction = query.sort.split(':')[1];
        orderOptions = [
          ['customer', 'name', direction],
          ['customer', 'first_name', direction],
        ] as [string, string, string][];
      } else {
        orderOptions = getOrderOptions<Offer>(query.sort, ['id', 'name', 'status'], {
          date: ['details', 'date'],
        });
      }
    } else {
      orderOptions = [
        ['status', 'ASC'],
        ['id', 'DESC'],
      ] as [string, string][];
    }

    // Get offers
    const offers = await this.offerRepository.findAll({
      where: whereOptions,
      attributes: {
        exclude: ['company_id', 'number_id', 'customer_id', 'deleted_at', 'deleted_by'],
      },
      include: [
        {
          model: NumberEntry,
          as: 'number',
          attributes: ['id', [Sequelize.fn('COALESCE', Sequelize.col('custom_id'), ''), 'custom_id']],
        },
        {
          model: Customer,
          as: 'customer',
          attributes: {
            include: [
              [Sequelize.fn('COALESCE', Sequelize.col('customer.name'), ''), 'company'],
              'first_name',
              'last_name',
              [Sequelize.fn('COALESCE', Sequelize.col('customer.created_at'), '0001-01-01T00:00:00Z'), 'created_at'],
              [Sequelize.fn('COALESCE', Sequelize.col('customer.updated_at'), '0001-01-01T00:00:00Z'), 'updated_at'],
            ],
            exclude: ['name', 'company_id', 'deleted_at', 'deleted_by'],
          },
        },
        {
          model: this.offerDetailRepository,
          as: 'details',
          attributes: ['date', 'location'],
        },
      ],
      order: orderOptions,
      limit: limit,
      offset: offset,
      raw: true,
      nest: true,
    });

    // Handle to detailed offers
    const detailedOffers: OfferDetailDto[] = [];

    for (const offer of offers) {
      const offerDetail: OfferDetailDto = Object.assign(
        OfferDetailDto.build().get({ plain: true }) as OfferDetailDto,
        offer,
      );

      // Set status if find deleted offers
      if (status && status === 'deleted') {
        offer.status = 'deleted';
      }

      offerDetail.detail_cost = await this.getDetailOfferCost(offer.id);
      const detailCost = offerDetail.detail_cost;
      offerDetail.amount = detailCost.total_gross + detailCost.total_gross_nk;
      offerDetail.date = offerDetail.details?.date || '0001-01-01T00:00:00Z';

      detailedOffers.push(offerDetail);
    }

    return {
      current_page: page,
      total_items,
      total_pages: Math.ceil(total_items / (query?.pageSize || 10)),
      total_sum_net,
      total_sum_gross,
      detailedOffers: detailedOffers,
    };
  }

  async getDetailOfferCost(offerId: number): Promise<DetailCost> {
    // Get all quotes items for the offer
    const quotes = await this.offerQuoteItemRepository.findAll({
      where: {
        offer_id: offerId,
        optional: false,
        type: {
          [Op.ne]: 'title',
        },
      },
      raw: true,
    });

    const discountPercent = await this.offerDetailRepository
      .findOne({
        where: {
          offer_id: offerId,
        },
        attributes: [[Sequelize.fn('COALESCE', Sequelize.col('discount_percent'), 0), 'discount_percent']],
        raw: true,
      })
      .then((result) => Number(result?.discount_percent ?? 0));

    // Calculate the detailed cost for the offer
    const detailCost = quotes.reduce(
      (acc, quote) => {
        const applyDiscount: boolean = quote.apply_discount;
        const isNk: boolean = quote.is_nk;
        const quoteVatRate: number = Number(quote.vat_rate ?? 0);
        let quoteCost: number = Number(quote.cost ?? 0);

        // Apply discount for the quote
        if (applyDiscount || !isNk) {
          quoteCost -= (quoteCost * discountPercent) / 100;
        }

        // Calculate VAT cost
        const vatValue = (quoteCost * quoteVatRate) / 100;

        if (isNk) {
          acc.total_net_nk += quoteCost;
          acc.total_gross_nk += quoteCost + vatValue;
        } else {
          acc.total_net += quoteCost;
          acc.total_gross += quoteCost + vatValue;
        }

        return acc;
      },
      {
        total_net: 0,
        total_gross: 0,
        total_net_nk: 0,
        total_gross_nk: 0,
      },
    );

    return detailCost;
  }

  async getDetailedOffer(companyId: number, offerId: number): Promise<OfferDetailDto> {
    // Get offer
    const offer = await this.offerRepository
      .findOne({
        where: {
          id: offerId,
          company_id: companyId,
        },
        attributes: {
          exclude: ['company_id', 'number_id', 'customer_id', 'deleted_at', 'deleted_by'],
        },
        include: [
          {
            model: NumberEntry,
            as: 'number',
            attributes: ['id', [Sequelize.fn('COALESCE', Sequelize.col('number.custom_id'), ''), 'custom_id']],
          },
          {
            model: Customer,
            as: 'customer',
            attributes: {
              include: [
                [Sequelize.fn('COALESCE', Sequelize.col('customer.name'), ''), 'company'],
                [Sequelize.fn('COALESCE', Sequelize.col('customer.first_name'), ''), 'first_name'],
                [Sequelize.fn('COALESCE', Sequelize.col('customer.last_name'), ''), 'last_name'],
                [Sequelize.fn('COALESCE', Sequelize.col('customer.created_at'), '0001-01-01T00:00:00Z'), 'created_at'],
                [Sequelize.fn('COALESCE', Sequelize.col('customer.updated_at'), '0001-01-01T00:00:00Z'), 'updated_at'],
                ['metadata', 'details'],
              ],
              exclude: ['name', 'company_id', 'deleted_at', 'deleted_by'],
            },
          },
          {
            model: this.offerDetailRepository,
            as: 'details',
            include: [
              {
                model: this.offerAdditionalCostRepository,
                as: 'additional_cost',
              },
              {
                model: this.offerEventRepository,
                as: 'events',
              },
              {
                model: this.offerCostEstimateRepository,
                as: 'cost_estimate',
                separate: true,
                order: ['order'],
              },
              {
                model: this.offerQuoteItemRepository,
                as: 'quote_items',
              },
              {
                model: this.offerInternalDescRepository,
                as: 'internal_desc',
              },
            ],
          },
        ],
        raw: false, // prevent Sequelize flat data, keep the array of objects,
      })
      .then((data) => {
        return data?.toJSON();
      });

    if (!offer) {
      throw new NotFoundError('Offer not found');
    }

    // Handle to detailed offer
    const detailedOffer: OfferDetailDto = Object.assign(
      OfferDetailDto.build().get({ plain: true }) as OfferDetailDto,
      offer,
    );

    detailedOffer.amount = 0;
    detailedOffer.date = '0001-01-01T00:00:00Z';

    return detailedOffer;
  }

  async createOffer(createOfferDto: CreateOfferDto, companyId: number): Promise<{ error: boolean }> {
    const transaction = await this.offerRepository.sequelize.transaction();

    try {
      const { name, customer, quote_items, cost_estimate, events, internal_desc, additional_cost, ...details } =
        createOfferDto;

      // Fix date format to YYYY-MM-DD
      createOfferDto.date = new Date(createOfferDto.date).toISOString().split('T')[0];

      // Create new offer
      const offer = await this.offerRepository.create(
        {
          company_id: companyId,
          customer_id: customer.id,
          name,
          created_at: new Date(),
          status: 'active',
        },
        { transaction },
      );

      // Insert the offer into the database
      await offer.save({ transaction });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const addOfferId = (items?: any[]) => items?.map((item) => ({ ...item, offer_id: offer.id }));

      const preparedData = {
        quote_items: addOfferId(quote_items),
        cost_estimates: addOfferId(cost_estimate),
        events: addOfferId(events),
        internal_desc: addOfferId(internal_desc),
        additional_costs: addOfferId(additional_cost),
      };

      await this.offerDetailRepository.create(
        {
          offer_id: offer.id,
          selected_km_label: details.km_dropdown.label,
          selected_km_value: details.km_dropdown.value,
          ...details,
        } as unknown as OfferDetail,
        { transaction },
      );

      if (preparedData.quote_items?.length) {
        await this.offerQuoteItemRepository.bulkCreate(preparedData.quote_items, { transaction });
      }

      if (preparedData.cost_estimates?.length) {
        await this.offerCostEstimateRepository.bulkCreate(preparedData.cost_estimates, { transaction });
      }

      if (preparedData.events?.length) {
        await this.offerEventRepository.bulkCreate(preparedData.events, { transaction });
      }

      if (preparedData.internal_desc?.length) {
        await this.offerInternalDescRepository.bulkCreate(preparedData.internal_desc, { transaction });
      }

      if (preparedData.additional_costs?.length) {
        await this.offerAdditionalCostRepository.bulkCreate(preparedData.additional_costs, { transaction });
      }

      // Generate a number for the offer
      const number = new NumberEntry();
      number.company_id = companyId;
      number.type = 'offer';
      number.ref_id = offer.id;
      number.created_at = new Date();

      // Insert the number and retrieve the ID
      await number.save({ transaction });

      // Update the offer with the number ID
      offer.number_id = number.id;
      await offer.save({ transaction });

      // Commit the transaction
      await transaction.commit();

      return { error: false };
    } catch (error) {
      // Rollback the transaction in case of error
      await transaction.rollback();
      throw new BadRequestError('Offer not created');
    }
  }

  async copyOffer(offerId: number, companyId: number): Promise<{ error: boolean }> {
    const transaction = await this.offerRepository.sequelize.transaction();

    // Retrieve the existing offer
    const offer = await this.offerRepository.findOne({
      where: {
        id: offerId,
        company_id: companyId,
      },
      transaction,
      include: [
        {
          model: this.offerDetailRepository,
          as: 'details',
          include: [
            {
              model: this.offerAdditionalCostRepository,
              as: 'additional_cost',
            },
            {
              model: this.offerEventRepository,
              as: 'events',
            },
            {
              model: this.offerCostEstimateRepository,
              as: 'cost_estimate',
              separate: true,
              order: ['order'],
            },
            {
              model: this.offerQuoteItemRepository,
              as: 'quote_items',
            },
            {
              model: this.offerInternalDescRepository,
              as: 'internal_desc',
            },
          ],
        },
      ],
    });

    if (!offer) {
      throw new NotFoundError('Offer not found');
    }

    try {
      // Prepare the offer for copying
      const newOffer = offer.prepareToCopy();

      // Insert the new offer
      const createdOffer = await newOffer.save({ transaction });

      // Insert the new offer details
      const newOfferDetail = {
        ...offer.get('details', { plain: true }),
        offer_id: createdOffer.get('id', { plain: true }),
      };
      if (newOfferDetail && newOfferDetail.name) {
        newOfferDetail.name = createdOffer.name;
      }
      if (newOfferDetail && newOfferDetail.date) {
        newOfferDetail.date = new Date();
      }
      // Only use the fields that are needed for creating the new offer detail
      await this.offerDetailRepository.create(newOfferDetail, {
        fields: [
          'offer_id',
          'name',
          'begin',
          'end',
          'date',
          'event',
          'offer',
          'title',
          'category',
          'currency',
          'end_desc',
          'location',
          'parameter',
          'additional',
          'begin_desc',
          'offer_desc',
          'begin_break',
          'event_break',
          'offer_break',
          'performance',
          'cost_generate',
          'estimate_cost',
          'parameter_desc',
          'additional_desc',
          'parameter_break',
          'additional_break',
          'discount_percent',
          'performance_desc',
          'offer_quote_break',
          'performance_break',
          'internal_desc_custom',
          'selected_km_label',
          'selected_km_value',
        ],
        transaction,
      });

      const bulkCreatePromises = [];

      if (newOfferDetail.additional_cost?.length) {
        const newAdditionalCosts = newOfferDetail.additional_cost.map((additionalCost: OfferAdditionalCost) => ({
          ...additionalCost,
          offer_id: createdOffer.id,
          id: null as number | null,
        }));
        bulkCreatePromises.push(this.offerAdditionalCostRepository.bulkCreate(newAdditionalCosts, { transaction }));
      }

      if (newOfferDetail.cost_estimate?.length) {
        const newCostEstimates = newOfferDetail.cost_estimate.map((estimate: OfferCostEstimate) => ({
          ...estimate,
          offer_id: createdOffer.id,
          id: null as number | null,
        }));
        bulkCreatePromises.push(this.offerCostEstimateRepository.bulkCreate(newCostEstimates, { transaction }));
      }

      if (newOfferDetail.events?.length) {
        const newEvents = newOfferDetail.events.map((event: OfferEvent) => ({
          ...event,
          offer_id: createdOffer.id,
          id: null as number | null,
        }));
        bulkCreatePromises.push(this.offerEventRepository.bulkCreate(newEvents, { transaction }));
      }

      if (newOfferDetail.internal_desc?.length) {
        const newInternalDescs = newOfferDetail.internal_desc.map((desc: OfferInternalDesc) => ({
          ...desc,
          offer_id: createdOffer.id,
          id: null as number | null,
        }));
        bulkCreatePromises.push(this.offerInternalDescRepository.bulkCreate(newInternalDescs, { transaction }));
      }

      if (newOfferDetail.quote_items?.length) {
        const newQuoteItems = newOfferDetail.quote_items.map((item: OfferQuoteItem) => ({
          ...item,
          offer_id: createdOffer.id,
          id: null as number | null,
          uuid: generateNewUUID(),
        }));
        bulkCreatePromises.push(this.offerQuoteItemRepository.bulkCreate(newQuoteItems, { transaction }));
      }

      await Promise.all(bulkCreatePromises);

      // Create a new number for the copied offer
      const newNumber = await NumberEntry.create(
        {
          company_id: companyId,
          type: 'offer',
          ref_id: createdOffer.get('id', { plain: true }),
          createdAt: new Date(),
        },
        { transaction },
      );

      // Update the copied offer with the new number ID
      createdOffer.number_id = newNumber.id;
      // Reset the status of the copied offer
      createdOffer.status = 'active';
      createdOffer.deleted_at = null;
      createdOffer.deleted_by = null;
      await createdOffer.save({ transaction });

      // Commit the transaction
      await transaction.commit();

      return { error: false };
    } catch (error) {
      // Rollback the transaction in case of error
      await transaction.rollback();
      throw new BadRequestError('Offer not copied');
    }
  }

  async acceptOffer(
    userId: number,
    companyId: number,
    offerId: number,
    dto: AcceptOfferDto,
  ): Promise<{ project_id: number }> {
    const transaction = await this.offerRepository.sequelize.transaction();
    // Find the offer using the Offer model
    const offer = await this.offerRepository.findOne({
      where: {
        id: offerId,
        company_id: companyId,
      },
      transaction,
      include: [
        {
          model: this.offerDetailRepository,
          as: 'details',
          include: [
            {
              model: this.offerAdditionalCostRepository,
              as: 'additional_cost',
            },
            {
              model: this.offerEventRepository,
              as: 'events',
            },
            {
              model: this.offerCostEstimateRepository,
              as: 'cost_estimate',
              separate: true,
              order: ['order'],
            },
            {
              model: this.offerQuoteItemRepository,
              as: 'quote_items',
            },
            {
              model: this.offerInternalDescRepository,
              as: 'internal_desc',
            },
          ],
        },
      ],
    });

    if (!offer) {
      throw new NotFoundError('Offer not found');
    }

    // Find the company and its settings
    const setting = await this.settingService.selectSetting(companyId);

    if (!setting) {
      throw new NotFoundError('Setting not found');
    }

    try {
      const offerDetails = offer.get('details', { plain: true });

      // Create a project entry using the Project model
      const project = await Project.create(
        {
          company_id: companyId,
          status: 'active',
          number_id: offer.number_id,
          customer_id: offer.customer_id,
          offer_id: offerId,
          created_at: new Date(),
          assignee_id: userId,
          end_on: new Date(dto.end_on),
          name: offer.name,
        },
        { transaction, returning: true },
      );

      // Create project details directly from offer details
      await ProjectDetails.create(
        {
          project_id: project.id,
          name: offer.name,
          begin: offerDetails.begin,
          end: offerDetails.end,
          date: new Date(),
          event: offerDetails.event,
          offer: offerDetails.offer,
          title: offerDetails.title,
          category: offerDetails.category,
          currency: offerDetails.currency,
          end_desc: offerDetails.end_desc,
          location: offerDetails.location,
          parameter: offerDetails.parameter,
          additional: offerDetails.additional,
          begin_desc: offerDetails.begin_desc,
          offer_desc: offerDetails.offer_desc,
          begin_break: offerDetails.begin_break,
          event_break: offerDetails.event_break,
          offer_break: offerDetails.offer_break,
          performance: offerDetails.performance,
          estimate_cost: offerDetails.estimate_cost,
          parameter_desc: offerDetails.parameter_desc,
          additional_desc: offerDetails.additional_desc,
          parameter_break: offerDetails.parameter_break,
          additional_break: offerDetails.additional_break,
          discount_percent: offerDetails.discount_percent,
          performance_desc: offerDetails.performance_desc,
          offer_quote_break: offerDetails.offer_quote_break,
          performance_break: offerDetails.performance_break,
          internal_desc_custom: offerDetails.internal_desc_custom,
          selected_km_label: offerDetails.selected_km_label,
          selected_km_value: Number(offerDetails.selected_km_value),
          end_on: new Date(dto.end_on),
          cost_generation: offerDetails.cost_generate || {},
          ...setting.project,
        },
        { transaction },
      );

      const quote_items = offerDetails.quote_items || [],
        cost_estimate = offerDetails.cost_estimate || [],
        internal_desc = offerDetails.internal_desc || [],
        additional_cost = offerDetails.additional_cost || [],
        events = offerDetails.events || [];

      await Promise.all([
        ProjectProducts.bulkCreate(
          quote_items.map((item: OfferQuoteItem) => {
            const product_id = item.product_id || item.id || null;
            return {
              project_id: project.id,
              product_id,
              name: item.name || null,
              cost: item.cost || null,
              type: item.type || null,
              unit: item.unit || null,
              uuid: item.uuid || generateNewUUID(),
              price: item.price || null,
              year: item.year || null,
              description: item.description || null,
              amount: item.amount || null,
              quarter: item.quarter || null,
              optional: item.optional || false,
              vat_rate: item.vat_rate || null,
              break_page: item.break_page,
              is_nk: item.is_nk,
              apply_discount: item.apply_discount,
            };
          }),
          { transaction },
        ),
        ProjectCostEstimates.bulkCreate(
          cost_estimate.map((item: OfferCostEstimate) => {
            return {
              project_id: project.id,
              label: item.label,
              value: Number(item.value),
            };
          }),
          { transaction },
        ),
        ProjectLabels.bulkCreate(
          internal_desc.map((item: OfferInternalDesc) => {
            return {
              project_id: project.id,
              label: item.label,
              is_active: item.is_active,
            };
          }),
          { transaction },
        ),
        ProjectAdditionalCosts.bulkCreate(
          additional_cost.map((item: OfferAdditionalCost) => {
            return {
              project_id: project.id,
              label: item.label,
              value: Number(item.value),
              is_active: item.is_active,
            };
          }),
          { transaction },
        ),
        ProjectEvents.bulkCreate(
          events.map((item: OfferEvent) => {
            return {
              project_id: project.id,
              label: item.label,
              value: item.value,
            };
          }),
          { transaction },
        ),
      ]);

      // Update the offer status
      await this.offerRepository.update({ status: 'archive' }, { where: { id: offerId }, transaction });

      // Update the number
      const number = await NumberEntry.findOne({
        where: { id: offer.number_id },
      });

      if (number) {
        number.type = 'project';
        number.updated_at = new Date();
        number.ref_id = offerId;
        await number.save({ transaction });
      }

      // Commit the transaction
      await transaction.commit();

      return { project_id: project.id };
    } catch (error) {
      await transaction.rollback();
      throw new BadRequestError('Offer accepted failed!');
    }
  }

  async updateOffer(offerId: number, currentUser: User, updateOfferDto: UpdateOfferDto): Promise<void> {
    // Find existing offer and offer details
    const existingOffer = await Offer.findOne({
      where: {
        id: offerId,
        company_id: currentUser.company_id,
        deleted_at: null,
      },
    });
    if (!existingOffer) {
      throw new NotFoundError('Offer not found');
    }

    // Update existing offer
    const transaction = await this.offerRepository.sequelize.transaction();
    const { name, customer, events, internal_desc, cost_estimate, additional_cost, quote_items } = updateOfferDto;

    // Fix date format to YYYY-MM-DD
    updateOfferDto.date = new Date(updateOfferDto.date).toISOString().split('T')[0];
    existingOffer.name = name;
    existingOffer.customer_id = customer.id;
    existingOffer.updated_at = new Date();

    try {
      // Prepare for insert/update offer events
      const newOfferEvents = events.map((event) => {
        return {
          id: event.id,
          offer_id: offerId,
          label: event.label,
          value: event.value,
        };
      });

      // Prepare for insert/update offer internal desc
      const newOfferInternalDesc = internal_desc.map((item) => {
        return {
          id: item.id,
          offer_id: offerId,
          label: item.label,
          is_active: item.is_active,
        };
      });

      // Prepare for insert/update offer cost estimates
      const newOfferCostEstimates = cost_estimate.map((cost) => {
        return {
          id: cost.id,
          offer_id: offerId,
          order: cost.order,
          label: cost.label,
          value: Number(cost.value),
        };
      });

      // Prepare for insert/update offer additional costs
      const newOfferAdditionalCosts = additional_cost.map((cost) => {
        return {
          id: cost.id,
          offer_id: offerId,
          label: cost.label,
          value: Number(cost.value),
          is_active: cost.is_active,
        };
      });

      // Prepare for insert/update offer quote items
      const newOfferQuoteItems = quote_items.map((item) => {
        return {
          id: item.id,
          offer_id: offerId,
          product_id: item.product_id || null,
          name: item.name || null,
          cost: item.cost || null,
          type: item.type || null,
          unit: item.unit || null,
          uuid: item.uuid || null,
          price: item.price || null,
          year: item.year || null,
          description: item.description || null,
          amount: item.amount || null,
          quarter: item.quarter || null,
          optional: item.optional || false,
          vat_rate: item.vat_rate || null,
          break_page: item.break_page,
          is_nk: item.is_nk,
          apply_discount: item.apply_discount,
        };
      });

      // Remove offer details that are not given in the request
      await Promise.all([
        this.offerEventRepository.destroy({
          where: {
            id: {
              [Op.notIn]: newOfferEvents.map((event) => event.id).filter((id) => id),
            },
            offer_id: offerId,
          },
          transaction,
        }),
        this.offerQuoteItemRepository.destroy({
          where: {
            id: {
              [Op.notIn]: newOfferQuoteItems.map((item) => item.id).filter((id) => id),
            },
            offer_id: offerId,
          },
          transaction,
        }),
      ]);

      // Update offer details
      await Promise.all([
        this.offerEventRepository.bulkCreate(newOfferEvents, {
          transaction,
          updateOnDuplicate: ['label', 'value'],
        }),
        this.offerInternalDescRepository.bulkCreate(newOfferInternalDesc, {
          transaction,
          updateOnDuplicate: ['label', 'is_active'],
        }),
        this.offerCostEstimateRepository.bulkCreate(newOfferCostEstimates, {
          transaction,
          updateOnDuplicate: ['order', 'label', 'value'],
        }),
        this.offerAdditionalCostRepository.bulkCreate(newOfferAdditionalCosts, {
          transaction,
          updateOnDuplicate: ['label', 'value', 'is_active'],
        }),
        this.offerQuoteItemRepository.bulkCreate(newOfferQuoteItems, {
          transaction,
          updateOnDuplicate: [
            'name',
            'cost',
            'type',
            'unit',
            'uuid',
            'price',
            'year',
            'description',
            'amount',
            'quarter',
            'vat_rate',
            'break_page',
            'is_nk',
            'apply_discount',
            'optional',
          ],
        }),
        this.offerDetailRepository.upsert(
          {
            offer_id: offerId,
            ...updateOfferDto,
            date: isDateString(updateOfferDto.date) ? new Date(updateOfferDto.date) : null,
            selected_km_label: updateOfferDto.km_dropdown.label,
            selected_km_value: updateOfferDto.km_dropdown.value,
            internal_desc: null,
            cost_estimate: null,
            additional_cost: null,
            quote_items: null,
            events: null,
          },
          {
            transaction,
          },
        ),
        existingOffer.save({ transaction }),
      ]);

      // Commit the transaction
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw new InternalServerError('Failed to update offer');
    }
  }

  async toggleOfferStatus(companyId: number, offerId: number) {
    // Find existing offer
    const existingOffer = await Offer.findOne({
      where: {
        id: offerId,
        company_id: companyId,
      },
    });
    if (!existingOffer) {
      throw new NotFoundError('Offer not found');
    }

    // Toggle status
    existingOffer.updated_at = new Date();
    if (existingOffer.status === 'deleted') {
      // Clear deleted status of the offer
      existingOffer.deleted_at = null;
      existingOffer.deleted_by = null;
    }
    existingOffer.status = existingOffer.status === 'active' ? 'archive' : 'active';

    // Save the updated offer
    await existingOffer.save();

    return {
      error: false,
    };
  }

  async bulkDeleteOffers(currentUser: User, bulkDeleteOffersDto: BulkDeleteOffersDto): Promise<void> {
    const { ids } = bulkDeleteOffersDto;
    const transaction = await Offer.sequelize.transaction();
    try {
      for (const offerId of ids) {
        const existingOffers = await Offer.findAll({
          where: {
            [Op.or]: [{ id: offerId }],
          },
        });
        if (!existingOffers) {
          continue;
        }

        for (const offer of existingOffers) {
          await this.offerRepository.update(
            {
              status: 'deleted',
              deleted_by: currentUser.id,
              deleted_at: new Date(),
            },
            {
              where: { id: offer.id },
              transaction,
            },
          );
        }
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw new InternalServerError(`Failed to delete offers`);
    }
  }

  async deleteOffer(offerId: number, currentUser: User) {
    // Find existing offer
    const existingOffer = await Offer.findOne({
      where: {
        id: offerId,
        company_id: currentUser.company_id,
        deleted_at: null,
      },
    });
    if (!existingOffer) {
      throw new NotFoundError('Offer not found');
    }

    // Check if the user exists (you can define your own method for getting the user)
    const user = await User.findOne({
      where: { id: currentUser.id, deleted_at: null, company_id: currentUser.company_id },
    });
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Mark the offer as deleted
    existingOffer.deleted_at = new Date();
    existingOffer.deleted_by = currentUser.id;
    existingOffer.status = 'deleted';

    await existingOffer.save();

    return {
      error: false,
    };
  }

  async getAdditionalCostInvoiceNameLocalization(lang: string, name: string): Promise<string> {
    if (lang.toLowerCase() === 'de') {
      // Assuming 'de' is the language code for German
      return `Nebenkostenrechnung ${name}`;
    }

    return `Additional costs ${name}`;
  }

  async exportFileOffer(companyId: number, offerId: number, type: string): Promise<Buffer> {
    if (['pdf', 'docx'].indexOf(type) === -1) {
      throw new BadRequestError('Invalid file type');
    }

    const com = await this.companyService.selectCompany(companyId);
    const offer = await this.getDetailedOffer(companyId, offerId);

    // Get offer template
    const offerTemplate = await this.companyTemplateRepository.findOne({
      where: {
        company_id: companyId,
        type: FileTypeEnum.Offer,
      },
    });

    if (!offerTemplate) {
      throw new BadRequestError('No offer template found, please contact development team');
    }

    const typeExport = type === 'pdf' ? CodeEnum.PDFTypeOffer : CodeEnum.DOCXTypeOffer;

    const expt: ExportCreateDto = {
      created_at: new Date(),
      company_id: companyId,
      type: typeExport,
      document_id: offerId,
      template_id: offerTemplate.id,
    };

    const [exported] = await this.exportService.selectOrCreateExport(expt);
    if (!exported) {
      throw new BadRequestError('Export failed');
    }

    // Generate the offer file
    const code = generateNewUUID();
    const bufferFile = await this.generateOfferFile(offerId, com, exported.type, offerTemplate.path, type);

    // Metadata for the log entry based on the type of document exported (PDF or DOCX)
    const metadata =
      type === 'pdf'
        ? { offer_pdf_code: code, offer_status: offer.status }
        : { offer_docx_code: code, offer_status: offer.status };
    await this.logRepository.create({
      company_id: companyId,
      ref_id: offerId,
      type: FileTypeEnum.Offer,
      action: type === 'pdf' ? ActionEnum.ExportPDF : ActionEnum.ExportDOCX,
      created_at: new Date(),
      metadata,
    });

    return bufferFile;
  }

  private async generateOfferFile(
    offerId: number,
    company: Company,
    typeExport: string,
    templatePath: string,
    fileType: string,
  ): Promise<Buffer> {
    const doc = (await getDocument(offerId, company.id, typeExport)) as Offer;
    const customer = await this.customerService.selectCustomer(doc.company_id, doc.customer_id);

    const contentKeys = [
      'title',
      'category',
      'name',
      'location',
      'customer',
      'other_address',
      'address',
      'postcode',
      'place',
      'date',
      'begin',
      'begin_desc',
      'performance',
      'performance_desc',
      'parameter',
      'parameter_desc',
      'offer',
      'offer_desc',
      'services',
      'service_sum',
      'additional',
      'additional_desc',
      'event',
      'events',
      'end_desc',
    ];

    const breakPageKeys = [
      'begin_break',
      'performance_break',
      'parameter_break',
      'offer_break',
      'offer_quote_break',
      'additional_break',
      'event_break',
    ];
    let offerData: Record<string, string> = addFieldValuesIfNotExisted(contentKeys, breakPageKeys, doc.details);
    offerData.date = formatDateToDotSeparated(new Date(doc.details.date).toISOString().split('T')[0]);
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

    type MetadataType = Record<string, string | Record<string, string | number>[]>;

    offerData = {
      ...offerData,
      customer: cusTitle,
      address: customer.metadata?.address || '',
      address_other: customer.metadata?.other_address || '',
      postcode: customer.metadata?.postcode || '',
      place: customer.metadata?.place || '',
      name: doc.name,
      services: getTable(doc.details as unknown as MetadataType, company),
      service_sum: getTableSum(doc.details as unknown as MetadataType),
      events: getEventTable(doc.details as unknown as MetadataType),
    };

    // generate the PDF or DOCX
    const bufferFile = await this.exportFileService.exportFileFromTemplate(offerData, templatePath, '.' + fileType);

    if (!bufferFile) {
      throw new BadRequestError('Export failed');
    }

    return bufferFile;
  }

  async generateProducts(
    companyId: number,
    offerType: string,
    generateProductDto: GenerateProductDto,
  ): Promise<GeneratedProductResponse> {
    if (!offerType || (offerType !== OfferGeneratorType.HOURS && offerType !== OfferGeneratorType.FULL_PRICE)) {
      offerType = OfferGeneratorType.HOURS;
    }

    const offerDesc = `<p><strong>Gerne offerieren wir Ihnen folgende Architekturleistungen:</strong></p><p><strong>BASIS:</strong></p><p><strong>Baukostenberechnung nach Vorgabe Bauherr oder Grobkostenschätzung des Architekten.</strong></p><ul><li><em>Kostengenauigkeit +-25%</em></li><li><em>Baukostenannahme exkl. HO und MWST = CHF 120</em></li><li><em>Schwierigkeitsgrad n = ${generateProductDto.difficulty_lv.value.toFixed(1)} </em></li><li><em>Faktor für Sonderleistungen = ${generateProductDto.special_service_factor.value.toFixed(1)}</em></li><li><em>Anpassungsfaktor = ${generateProductDto.adjustment_factor.value}</em></li><li><em>Teamfaktor = ${generateProductDto.team_factor.value}</em></li><li><em>Zuschlag für Umbauten = ${generateProductDto.u_factor.value}</em></li><li><em>Angebotener durchschnittlicher Stundenansatz = CHF ${generateProductDto.advertised.value}</em></ul><p></p><p><em>Basis bildet die SIA Norm 102 Architekturleistungen und darin in erster Linie die Grundleistungen.</em></p>`;

    let totalCost = 0;

    // Factors
    const percent = 100;
    const p =
      generateProductDto.coefficients_z1.value +
      generateProductDto.coefficients_z2.value / Math.pow(generateProductDto.construction_cost.value, 1 / 3);
    const tm =
      (((generateProductDto.construction_cost.value * p) / 100) *
        generateProductDto.difficulty_lv.value *
        generateProductDto.u_factor.value *
        percent) /
      100;
    const baseAmount =
      (tm / 100) * generateProductDto.special_service_factor.value * generateProductDto.team_factor.value;

    const quotes: ProductQuoteItem[] = [];

    interface ProductWithPercent {
      name: string;
      percent: number;
    }

    const defaultServices: ProductWithPercent[] = [
      { name: 'A 31 Vorprojekt - 9.0%', percent: 9 },
      { name: 'A 32 Bauprojekt - 21.0%', percent: 21.0 },
      { name: 'A 33 Baubewilligungsverfahren - 2.5%', percent: 2.5 },
      { name: 'A 41 Ausschreibung, Offertvergleich, Vergabeantrag - 18.0%', percent: 18.0 },
      { name: 'A 51 Ausführungsprojekt - 16.0%', percent: 16.0 },
      { name: 'A 52 Ausführung - 29.0%', percent: 29.0 },
      { name: 'A 53 Inbetriebnahme, Abschluss - 4.5%', percent: 4.5 },
    ];

    // Custom for plan4 and plan4you
    const customServices: ProductWithPercent[] = [
      { name: 'A 31 Vorprojekt', percent: 9.0 },
      { name: 'A 32 Bauprojekt', percent: 21.0 },
      { name: 'A 33 Baubewilligungsverfahren', percent: 2.5 },
      { name: 'A 41 Ausschreibung, Offertvergleich, Vergabeantrag', percent: 18.0 },
      { name: 'A 51 Ausführungsprojekt', percent: 16.0 },
      { name: 'A 52 Ausführung', percent: 29.0 },
      { name: 'A 53 Inbetriebnahme, Abschluss', percent: 4.5 },
    ];

    const services = companyId === 3 || companyId === 27 ? customServices : defaultServices;

    for (const service of services) {
      const product = await Product.findOne({
        where: {
          name: service.name,
          company_id: companyId,
        },
        include: [
          {
            model: Unit,
            as: 'unit',
          },
          {
            model: VatRate,
            as: 'vat_rate',
          },
        ],
        raw: true,
      });

      if (!product) {
        throw new BadRequestError('Invalid product data, please contact technical team');
      }

      const amount = Math.ceil(service.percent * baseAmount);
      const cost = amount * generateProductDto.advertised.value;
      totalCost += cost;

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const unitDescription = product['unit.description'] || '';

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const vat_rate = product['vat_rate_id.rate'] || 0;

      const tmpQuote: ProductQuoteItem = {
        id: product.id,
        amount,
        description: product.description,
        name: product.name,
        optional: false,
        price: generateProductDto.advertised.value,
        cost,
        type: CodeEnum.ItemTypeIndividual,
        unit: unitDescription,
        vat_rate: vat_rate,
        uuid: generateNewUUID(),
        break_page: false,
      };

      if (offerType === OfferGeneratorType.FULL_PRICE) {
        tmpQuote['amount'] = 1;
        tmpQuote['price'] = tmpQuote['cost'];
        tmpQuote['unit'] = 'Architekturhonorar';
      }
      quotes.push(tmpQuote);
    }

    let group: CompanyGroup;

    // Get default group using is_default flag instead of company metadata
    group = await this.companyGroupRepository.findOne({
      where: {
        company_id: companyId,
        is_default: true,
      },
      plain: true,
    });

    if (!group) {
      // Fallback to group with default name if no default group found
      group = await this.companyGroupRepository.findOne({
        where: {
          name: DEFAULT_ARCHITECTURE_GROUP_NAME,
          company_id: companyId,
        },
        plain: true,
      });

      if (!group) {
        throw new InternalServerError(`Invalid default group name "${DEFAULT_ARCHITECTURE_GROUP_NAME}"`);
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handledQuotes: any[] = [
      {
        description: group.name,
        optional: false,
        cost: totalCost,
        type: CodeEnum.ItemTypeTitle,
        uuid: generateNewUUID(),
      },
      ...quotes,
    ];

    return {
      quote_items: handledQuotes,
      offer_desc: offerDesc,
      p,
      tm,
      discount_percent: 0,
    };
  }
}
