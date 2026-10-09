import { round } from 'lodash';
import { literal, Op, Order, Sequelize, WhereOptions } from 'sequelize';
import Company from 'src/database/models/companies.model';
import Customer from 'src/database/models/customers.model';
import Invoice from 'src/database/models/invoices.model';
import Log from 'src/database/models/logs.model';
import NumberEntry from 'src/database/models/numbers.model';
import Offer from 'src/database/models/offers.model';
import Product from 'src/database/models/products.model';
import ProjectPull from 'src/database/models/project-pulls.model';
import Project from 'src/database/models/projects.model';
import Setting from 'src/database/models/setting.model';
import CompanyTemplate from 'src/database/models/company-templates.model';
import User from 'src/database/models/users.model';
import WorkItem from 'src/database/models/work-items.model';
import WorkLog from 'src/database/models/work-logs.model';
import { CompanyService } from 'src/modules/company/services/company.service';
import { CustomerService } from 'src/modules/customer/services/customer.service';
import { ExportCreateDto } from 'src/modules/export/dto/export-create.dto';
import { ExportFileService } from 'src/modules/export/services/export-file.service';
import { ExportService } from 'src/modules/export/services/export.service';
import { CreateInvoiceDto, InvoiceDetailDto } from 'src/modules/invoices/dto';
import { InvoiceService } from 'src/modules/invoices/services/invoice.service';
import { ProjectWithRateReportInterface } from 'src/modules/report/dto/report-project-with-rate.dto';
import { SettingService } from 'src/modules/setting/services/setting.service';
import { ActionEnum, CodeEnum, FileTypeEnum } from 'src/shared/enums';
import {
  addFieldValuesIfNotExisted,
  BadRequestError,
  generateNewUUID,
  getCustomerTitle,
  getDocument,
  getInvoiceTable,
  getOption,
  getTable,
  getTableSum,
  InternalServerError,
  NotFoundError,
  removeFields,
} from 'src/shared/utils';
import DateFormatter from 'src/shared/utils/date-utils';

import { forwardRef, Inject, Injectable } from '@nestjs/common';

import {
  ConnectedProject,
  CreateInvoiceHoursDto,
  CreateProjectCommentDto,
  CreateProjectDto,
  GenerateInvoiceDto,
  GenerateServiceInvoiceDto,
  ListProjectsRequestDto,
  ProjectCommentResponseDto,
  ProjectDetailCost,
  ProjectDetailDto,
  ProjectGridItemDto,
  ProjectGridRequestDto,
  ProjectSummaryDto,
  ProjectWithLogsDetailsDto,
  ProjectWithLogsDto,
  RowHour,
  ServiceDto,
  UpdateProjectDto,
  UpdateProjectStatusDto,
} from '../dto';
import { getOrderOptions } from 'src/shared/utils/generate-ORM-options';
import { BulkDeleteOffersDto } from 'src/modules/offers/dto/bulk-delete-offers.dto';
import ProjectDetails from 'src/database/models/project-details.model';
import ProjectProducts from 'src/database/models/project-products.model';
import ProjectEvents from 'src/database/models/project-events.model';
import ProjectLabels from 'src/database/models/project-labels.model';
import ProjectAdditionalCosts from 'src/database/models/project-additional-costs.model';
import ProjectCostEstimates from 'src/database/models/project-cost-estimates.model';
import OfferDetail from 'src/database/models/offer-details.model';
import OfferQuoteItem from 'src/database/models/offer-quote-item.model';
import OfferAdditionalCost from 'src/database/models/offer-additional-cost.model';
import OfferCostEstimate from 'src/database/models/offer-cost-estimate.model';
import OfferEvent from 'src/database/models/offer-event.model';
import OfferInternalDesc from 'src/database/models/offer-internal-desc.model';
import InvoiceProduct from 'src/database/models/invoice-products.model';
import InvoiceDetail from 'src/database/models/invoice-details.model';
import InvoiceAdditionalCost from 'src/database/models/invoice-additional-costs.model';
import InvoiceLabel from 'src/database/models/invoice-labels.model';
import ProjectComment from 'src/database/models/project-comments.model';
import VatRate from 'src/database/models/vat-rates.model';
import Unit from 'src/database/models/units.model';
import Task from 'src/database/models/task.model';

@Injectable()
export class ProjectService {
  constructor(
    @Inject('LOG_REPOSITORY')
    private readonly logRepository: typeof Log,
    @Inject('PROJECT_REPOSITORY')
    private readonly projectRepository: typeof Project,
    @Inject('PROJECT_PULL_REPOSITORY')
    private readonly projectPullRepository: typeof ProjectPull,
    @Inject('COMPANY_TEMPLATE_REPOSITORY')
    private readonly companyTemplateRepository: typeof CompanyTemplate,
    @Inject(forwardRef(() => InvoiceService))
    private readonly invoiceService: InvoiceService,
    @Inject(forwardRef(() => ExportService))
    private readonly exportService: ExportService,
    private readonly companyService: CompanyService,
    private readonly settingsService: SettingService,
    private readonly customerService: CustomerService,
    private readonly exportFileService: ExportFileService,
    @Inject('PROJECT_DETAILS_REPOSITORY')
    private readonly projectDetailsRepository: typeof ProjectDetails,
    @Inject('PROJECT_PRODUCTS_REPOSITORY')
    private readonly projectProductsRepository: typeof ProjectProducts,
    @Inject('PROJECT_LABELS_REPOSITORY')
    private readonly projectLabelsRepository: typeof ProjectLabels,
    @Inject('PROJECT_EVENTS_REPOSITORY')
    private readonly projectEventsRepository: typeof ProjectEvents,
    @Inject('PROJECT_COST_ESTIMATES_REPOSITORY')
    private readonly projectCostEstimatesRepository: typeof ProjectCostEstimates,
    @Inject('PROJECT_ADDITIONAL_COSTS_REPOSITORY')
    private readonly projectAdditionalCostsRepository: typeof ProjectAdditionalCosts,
    @Inject('PROJECT_COMMENTS_REPOSITORY')
    private readonly projectCommentsRepository: typeof ProjectComment,
  ) {}

  async getProjectsSummary(companyId: number, status: string): Promise<ProjectDetailDto[]> {
    // Build conditions
    const whereOptions: WhereOptions<Project> = {
      company_id: companyId,
      deleted_at: {
        [Op.is]: null,
      },
      is_internal: {
        [Op.not]: true,
      },
    };

    if (status !== 'all') {
      whereOptions.status = status;
    }

    // Refactor from PROJECT_SUMMARY_SQL raw SQL, need to test again carefully!
    const projects = await this.projectRepository
      .findAll({
        where: whereOptions,
        attributes: [
          'id',
          'name',
          [Sequelize.col('"details"."date"'), 'date'],
          [
            Sequelize.literal(
              `CONCAT(COALESCE(BTRIM("number"."custom_id", E' \t'), "number"."id"::text), ' ', "Project"."name")`,
            ),
            'project_nbr_and_name',
          ],
        ],
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
            model: this.projectDetailsRepository,
            as: 'details',
            attributes: [[Sequelize.fn('COALESCE', Sequelize.col('location'), ''), 'location']],
            required: false,
          },
        ],
        order: [['id', 'DESC']],
      })
      .then((result) => result.map((p) => p.get({ plain: true }) as ProjectDetailDto));

    for (const project of projects) {
      // const detailCost = await this.getDetailProjectCost(project.id);
      const [detailCost, hoursStat] = await Promise.all([
        this.getDetailProjectCost(project.id),
        this.calcHoursStat(project.id),
      ]);
      project.detail_cost = detailCost;
      project.total_amount_gross = project.detail_cost.total_gross + project.detail_cost.total_grossnk;
      project.total_amount = project.detail_cost.total_net + project.detail_cost.total_netnk;
      project.logged_hours = hoursStat.logged_hours;
      project.total_hours = hoursStat.total_hours;

      const invoices = await this.invoiceService.getInvoicesByProject(companyId, project.id);
      project.invoiced = 0.0;
      project.invoiced_gross = 0.0;
      for (const inv of invoices) {
        const dtc = await this.invoiceService.getDetailInvoiceCost(inv.id);
        project.invoiced += dtc.total_net + dtc.total_net_nk;
        project.invoiced_gross += dtc.total_gross + dtc.total_gross_nk;
        DateFormatter.formatDTO(inv);
      }
      project.remaining = project.total_amount - project.invoiced;
      project.remaining_gross = project.total_amount_gross - project.invoiced_gross;
      project.amount = 0;
    }

    return projects;
  }

  async getDetailProjectCost(projectId: number): Promise<ProjectDetailCost> {
    const quotes = await this.projectProductsRepository.findAll({
      where: {
        project_id: projectId,
        type: {
          [Op.ne]: 'title',
        },
        optional: false,
      },
      raw: true,
    });

    const discountPercent: number = await this.projectDetailsRepository
      .findOne({
        attributes: ['discount_percent'],
        where: {
          project_id: projectId,
        },
        raw: true,
      })
      .then((res) => res.discount_percent || 0);

    // Loop through each quote item to calculate totals
    const { totalNet, totalGross, totalNetNk, totalGrossNk } = quotes.reduce(
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

    return {
      total_gross: totalGross,
      total_grossnk: totalGrossNk,
      total_net: totalNet,
      total_netnk: totalNetNk,
    } as ProjectDetailCost;
  }

  private async calcHoursStat(projectId: number): Promise<{ total_hours: number; logged_hours: number }> {
    // Query to get logged hours
    const satisfiedWiIds: number[] = await WorkItem.findAll({
      attributes: ['id'],
      where: {
        project_id: projectId,
        deleted_at: { [Op.is]: null },
      },
      raw: true,
    }).then((workItems) => workItems.map((wi) => wi.id));

    const loggedHours: number = await WorkLog.sum('spent_in_hour', {
      where: {
        work_item_id: { [Op.in]: satisfiedWiIds },
        deleted_at: { [Op.is]: null },
      },
    });

    // Calculate total_hours from project products has unit is `unit.hours`
    const totalHours: number = await this.projectProductsRepository.sum('amount', {
      where: {
        project_id: projectId,
        unit: 'unit.hours',
      },
    });

    return {
      total_hours: totalHours || 0,
      logged_hours: loggedHours || 0,
    };
  }

  async listProjects(
    currentCompanyId: number,
    filter: ListProjectsRequestDto,
  ): Promise<{
    items: ProjectDetailDto[];
    total: number;
    page: number | null;
    pageSize: number | null;
  }> {
    const selCompanyId: number = filter.company_id && filter.company_id > 0 ? filter.company_id : currentCompanyId;
    const isFromOtherCompany: boolean = filter.company_id > 0 && filter.company_id !== currentCompanyId;
    const status: string = filter.status || '';
    const isFromSelector: boolean = filter.for_selector || false;

    // Build conditions
    const whereOptions: WhereOptions<Project> = {
      company_id: selCompanyId,
    };

    let orderOptions: Order = [];

    // Handle sorting
    if (filter?.sort) {
      if (filter.sort.split(':')[0] === 'companyName') {
        const direction = filter.sort.split(':')[1];
        orderOptions = [
          ['customer', 'name', direction],
          ['customer', 'first_name', direction],
          ['customer', 'last_name', direction],
          ['id', 'DESC'],
        ] as [string, string, string][];
      } else {
        orderOptions = getOrderOptions<Project>(filter.sort, ['id', 'name', 'status'], {
          // projectNbr: ['number', 'custom_id'],
          title: ['name'] as never,
          createdOn: ['created_at'] as never,
          endedOn: ['end_on'] as never,
        });
      }
    } else {
      orderOptions.push(
        ...([
          ['status', 'ASC'],
          ['id', 'DESC'],
        ] as [string, string][]),
      );
    }
    // Add search condition if search term is provided
    if (filter.search) {
      const searchTerm = `%${filter.search}%`;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (whereOptions as any)[Op.or] = [
        {
          name: { [Op.iLike]: searchTerm },
        },
        {
          '$customer.name$': { [Op.iLike]: searchTerm },
        },
        {
          '$customer.first_name$': { [Op.iLike]: searchTerm },
        },
        {
          '$customer.last_name$': { [Op.iLike]: searchTerm },
        },
        {
          '$number.custom_id$': { [Op.iLike]: searchTerm },
        },
      ];
    }

    // Add conditions based on the status on `filter`
    switch (status) {
      case 'deleted':
        whereOptions.deleted_at = {
          [Op.ne]: null,
        };
        break;
      case 'internal':
        whereOptions['$Project.is_internal$'] = {
          [Op.is]: true,
        };
        whereOptions.deleted_at = {
          [Op.is]: null,
        };
        break;
      case '': // This is for get all projects
        whereOptions.deleted_at = {
          [Op.is]: null,
        };
        break;
      default:
        whereOptions.status = status || 'active';
        whereOptions.deleted_at = {
          [Op.is]: null,
        };
        break;
    }

    // If user is viewing projects from another company, add additional conditions
    if (isFromOtherCompany) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (whereOptions as any)[Op.and] = [
        { '$details.only_my_company$': { [Op.not]: true } },
        { is_internal: { [Op.not]: true } },
      ];
    }

    // If the user is viewing projects from the selector, order by project number and name is first priority
    if (isFromSelector) {
      orderOptions.unshift([Sequelize.literal('project_nbr_and_name'), 'ASC']);
    }

    try {
      // Handle pagination - if both page and page_size are provided, use pagination
      const usePagination = !isFromSelector && filter.page !== undefined && filter.page_size !== undefined;
      const page = filter.page || null;
      const pageSize = filter.page_size || null;
      const offset = usePagination ? (page - 1) * pageSize : undefined;
      const limit = usePagination ? pageSize : undefined;

      // Get total count first - Include Customer in the count query
      const totalCount = await this.projectRepository.count({
        where: whereOptions,
        distinct: true,
        include: [
          {
            model: this.projectDetailsRepository,
            as: 'details',
            attributes: [],
          },
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

      // Refactor from GET_LIST_PROJECT_SQL raw SQL, need to test again carefully!
      const projects = await this.projectRepository
        .findAll({
          attributes: [
            'id',
            'name',
            'status',
            'company_id',
            'customer_id',
            [Sequelize.fn('COALESCE', Sequelize.col('"Project"."is_internal"'), false), 'is_internal'],
            'end_on',
            'created_at',
            'updated_at',
            [
              Sequelize.literal(
                `CONCAT(COALESCE(BTRIM("number"."custom_id", E' \t'), "number"."id"::text), ' ', "Project"."name")`,
              ),
              'project_nbr_and_name',
            ],
          ],
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
              model: this.projectDetailsRepository,
              as: 'details',
              attributes: [
                'only_my_company',
                [Sequelize.fn('COALESCE', Sequelize.col('location'), ''), 'location'],
                'internal_desc_custom',
              ],
            },
          ],
          where: whereOptions,
          order: orderOptions,
          ...(usePagination && { limit, offset }),
          subQuery: false,
        })
        .then((result) => result.map((p) => p.get({ plain: true }) as ProjectDetailDto));

      // If status = deleted, mark all projects as deleted
      if (status === 'deleted') {
        projects.forEach((project: ProjectDetailDto) => {
          project.status = 'deleted';
        });
      }

      // Process projects for costs if no selector
      if (!isFromOtherCompany) {
        for (const project of projects) {
          const [detailCost, hoursStat, isProjectLinked] = await Promise.all([
            this.getDetailProjectCost(project.id),
            this.calcHoursStat(project.id),
            this.projectPullRepository.findOne({
              where: { project_id: project.id, company_id: selCompanyId },
              attributes: ['project_id'],
              raw: true,
            }),
          ]);

          project.is_connected = isProjectLinked && isProjectLinked.project_id > 0 ? true : false;
          project.logged_hours = hoursStat.logged_hours;
          project.total_hours = hoursStat.total_hours;
          project.total_amount_gross = detailCost.total_gross + detailCost.total_grossnk;
          project.total_amount = detailCost.total_net + detailCost.total_netnk;
          project.invoiced = 0.0;
          project.invoiced_gross = 0.0;
          project.detail_cost = detailCost;
          project.amount ||= 0;
          DateFormatter.formatDTO(project);
          DateFormatter.formatDTO(project.customer);

          const invoices = await this.invoiceService.getInvoicesByProject(selCompanyId, project.id);

          if (invoices.length > 0) {
            for (const inv of invoices) {
              const dtc = await this.invoiceService.getDetailInvoiceCost(inv.id);
              project.invoiced += dtc.total_net + dtc.total_net_nk;
              project.invoiced_gross += dtc.total_gross + dtc.total_gross_nk;
              DateFormatter.formatDTO(inv);
            }
            project.invoices = invoices;
          }

          project.remaining = project.total_amount - project.invoiced;
          project.remaining_gross = project.total_amount_gross - project.invoiced_gross;
        }
      }

      return {
        items: projects,
        total: totalCount,
        page: page,
        pageSize: pageSize,
      };
    } catch (error) {
      throw new BadRequestError(`Error fetching projects`);
    }
  }

  async projectsSummaryStats(company_id: number): Promise<ProjectSummaryDto> {
    const selCompanyId = company_id;

    // Fetch active projects with summary
    const projects = await this.getProjectsSummary(selCompanyId, 'active');
    let totalProjectAmount = 0;
    let totalProjectRemaining = 0;

    for (const project of projects as ProjectDetailDto[]) {
      totalProjectAmount += project.total_amount;
      totalProjectRemaining += project.remaining;
    }

    // Fetch invoices and calculate totals
    const invoices = await this.invoiceService.getInvoicesSummary(selCompanyId);
    let totalOpenAmount = 0;
    let totalOpenAmountGross = 0;

    for (const invoice of invoices as InvoiceDetailDto[]) {
      if (invoice.status === 'open') {
        totalOpenAmountGross += invoice.amount;
        totalOpenAmount += invoice.detail_cost.total_net + invoice.detail_cost.total_net_nk;
      }
    }

    // Return summary
    return {
      total_active_projects: projects.length,
      total_project_amount: totalProjectAmount,
      total_remaining_amount: totalProjectRemaining,
      total_open_net_amount: totalOpenAmount,
      total_open_gross_amount: totalOpenAmountGross,
    };
  }

  async selectProject(companyId: number, projectId: number): Promise<ProjectDetailDto | null> {
    const connectedProject = await ProjectPull.findOne({
      where: { project_id: projectId, company_id: companyId },
      attributes: ['project_id'],
    });

    const project = await Project.findOne({
      where: {
        id: projectId,
        company_id: companyId,
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
            ['metadata', 'details'],
            'category',
            'type',
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
          model: User,
          as: 'assignee',
          attributes: ['id', 'first_name', 'last_name'],
        },
        {
          model: Offer,
          as: 'offer',
          attributes: ['id', 'name'],
        },
        {
          model: Invoice,
          as: 'invoices',
          attributes: ['id', 'type', 'status', 'created_at'],
        },
        {
          model: Log,
          as: 'logs',
          attributes: ['id', 'created_at'],
          limit: 1,
          order: [['id', 'DESC']],
        },
        {
          model: ProjectPull,
          as: 'project_pulls',
          attributes: ['id'],
        },
        {
          model: this.projectDetailsRepository,
          as: 'details',
          include: [
            {
              model: this.projectAdditionalCostsRepository,
              as: 'additional_cost',
            },
            {
              model: this.projectEventsRepository,
              as: 'events',
            },
            {
              model: this.projectCostEstimatesRepository,
              as: 'cost_estimate',
              separate: true,
              order: ['id'],
            },
            {
              model: this.projectProductsRepository,
              as: 'quote_items',
            },
            {
              model: this.projectLabelsRepository,
              as: 'internal_desc',
            },
          ],
        },
      ],
      attributes: {
        include: [
          [Sequelize.literal(connectedProject && connectedProject.project_id > 0 ? 'true' : 'false'), 'is_connected'],
        ],
      },
    });

    if (!project) {
      throw new NotFoundError('Project not found');
    }

    return project.dataValues as ProjectDetailDto;
  }

  async detailProject(companyId: number, projectId: number): Promise<ProjectDetailDto> {
    // Fetch project details
    const project = (await this.selectProject(companyId, projectId)) as ProjectDetailDto;
    if (!project) {
      throw new NotFoundError('Project not found');
    }

    const invoices = await this.invoiceService.getInvoicesByProject(companyId, projectId);

    // Process invoices and calculate detailed costs
    for (const invoice of invoices) {
      const detailCost = await this.invoiceService.getDetailInvoiceCost(invoice.id);
      invoice.amount = round(detailCost.total_net + detailCost.total_net_nk, 2);
      project.invoice_type = invoice.type;
    }

    project.invoices = invoices;

    // Clear the invoice type if project is created before 2023
    if (new Date(project.created_at) < new Date('2023-01-01')) {
      project.invoice_type = '';
    }

    // Fetch additional costs from related offer
    // const offer = await this.offerService.selectOffer(companyId, project.offerId);
    // if (offer && offer.invoices && offer.invoices.length > 0) {
    //   project.additionalInvoice = offer.invoices;
    // }

    // Return project details
    return project;
  }

  async selectProjectByID(projectID: number): Promise<Project | null> {
    const project = await Project.findOne({
      where: {
        id: projectID,
      },
      include: [
        {
          model: Log,
          as: 'logs',
          required: false,
          limit: 1,
          order: [['id', 'DESC']],
          attributes: ['created_at'],
        },
      ],
    });

    if (!project) return null;

    return project; // Returning the first result since it's a single project
  }

  async updateProjectStatus(companyId: number, dto: UpdateProjectStatusDto): Promise<{ status: string }> {
    const validStatuses = ['archive', 'active'];

    // Manual validation: Check if the status is valid
    if (!validStatuses.includes(dto.status)) {
      throw new BadRequestError(`Invalid status: ${dto.status}`);
    }

    // Start a transaction using Sequelize
    const transaction = await Project.sequelize.transaction();

    for (const projectId of dto.ids) {
      // Find the invoice for the company
      const project = await Project.findOne({
        where: { id: projectId, company_id: companyId },
        transaction,
      });

      if (!project) {
        await transaction.rollback();
        throw new NotFoundError('Project not found');
      }

      // Update the status
      project.status = dto.status;
      await project.save({ transaction });
    }

    // Commit the transaction if everything succeeds
    await transaction.commit();
    return {
      status: dto.status,
    };
  }

  async listServices(companyId: number, projectId: number): Promise<ServiceDto[]> {
    // Check if project exists
    const project = await Project.findOne({
      where: {
        id: projectId,
        company_id: companyId,
      },
    });

    if (!project) {
      throw new NotFoundError('Project not found');
    }

    // Get project products (services)
    const quotes = (await this.projectProductsRepository.findAll({
      where: {
        project_id: projectId,
        type: {
          [Op.ne]: 'title',
        },
        optional: false,
        cost: {
          [Op.gt]: 0,
        },
        is_nk: {
          [Op.or]: [false, null],
        },
      },
      raw: true,
    })) as unknown as ServiceDto[];

    for (const service of quotes) {
      // Get relevant invoices for calculating remaining amounts
      const invoices = await Invoice.findAll({
        where: {
          deleted_at: { [Op.is]: null },
        },
        include: [
          {
            model: InvoiceDetail,
            include: [
              {
                model: InvoiceProduct,
                as: 'quote_items',
              },
            ],
          },
        ],
      });

      const quoteItems = invoices
        .flatMap((invoice) => {
          return invoice.details.quote_items || [];
        })
        .filter((quote) => quote.uuid === service.uuid);

      const costIssued = quoteItems.reduce((sum, quote) => {
        const cost: number = Number(quote.cost);
        return sum + cost;
      }, 0);

      service.remaining = service.cost - costIssued;
    }

    return quotes;
  }

  async queryHourRowsByRange(projectId: number, companyId: number, startDate: Date, endDate: Date): Promise<RowHour[]> {
    // Refactor from GET_PROJECT_HOURS_BY_RANGE_SQL raw SQL, need to test again carefully!
    // First, get all satisfied project products (quote_items)
    const filteredQuoteItems = await this.projectProductsRepository.findAll({
      attributes: ['product_id', 'name', 'optional', 'price'],
      where: {
        project_id: projectId,
        type: {
          [Op.ne]: 'title',
        },
        [Op.and]: [{ product_id: { [Op.ne]: null } }, { product_id: { [Op.gt]: 0 } }],
      },
      raw: true,
    });

    // Then, filter all work items by project product_ids
    const workItems = (await WorkItem.findAll({
      attributes: ['product_id', [Sequelize.fn('SUM', Sequelize.col('work_logs.spent_in_hour')), 'spent_in_hour']],
      where: {
        project_id: projectId,
        deleted_at: { [Op.is]: null },
        product_id: {
          [Op.in]: filteredQuoteItems.map((item) => item.product_id),
        },
      },
      include: [
        {
          model: Product,
          as: 'product',
          attributes: [],
          required: true,
        },
        {
          model: User,
          as: 'user',
          attributes: [],
          where: {
            deleted_at: {
              [Op.is]: null,
            },
          },
          required: true,
        },
        {
          model: WorkLog,
          as: 'work_logs',
          attributes: [],
          where: {
            company_id: companyId,
            date: {
              [Op.between]: [startDate, endDate],
            },
            [Op.and]: [{ spent_in_hour: { [Op.not]: null } }, { spent_in_hour: { [Op.ne]: 0 } }],
            deleted_at: { [Op.is]: null },
          },
        },
      ],
      group: ['product_id'],
      raw: true,
    })) as unknown as { product_id: number; spent_in_hour: string }[];

    const rows = workItems.reduce((acc, item) => {
      const filteredQuoteItem = filteredQuoteItems.find((quoteItem) => quoteItem.product_id === item.product_id);
      if (filteredQuoteItem) {
        acc.push({
          name: filteredQuoteItem.name,
          optional: filteredQuoteItem.optional,
          price: Number(filteredQuoteItem.price),
          spent_in_hour: Number(item.spent_in_hour),
        });
      }
      return acc;
    }, [] as RowHour[]);

    return rows;
  }

  async queryHourRows(projectId: number, companyId: number): Promise<RowHour[]> {
    // Refactor from GET_PROJECT_HOURS_SQL raw SQL, need to test again carefully!
    // First, get all satisfied project products (quote_items)
    const filteredQuoteItems = await this.projectProductsRepository.findAll({
      attributes: ['product_id', 'name', 'optional', 'price'],
      where: {
        project_id: projectId,
        type: {
          [Op.ne]: 'title',
        },
        [Op.and]: [{ product_id: { [Op.ne]: null } }, { product_id: { [Op.gt]: 0 } }],
      },
      raw: true,
    });

    if (filteredQuoteItems.length === 0) {
      return [];
    }

    // Then, query WorkLog with joins
    const workLogs = (await WorkLog.findAll({
      attributes: ['workItem.product_id', [Sequelize.fn('SUM', Sequelize.col('spent_in_hour')), 'spent_in_hour']],
      include: [
        {
          model: WorkItem,
          as: 'workItem',
          attributes: [],
          where: {
            project_id: projectId,
            product_id: {
              [Op.in]: filteredQuoteItems.map((item) => item.product_id),
            },
          },
          required: true,
          include: [
            {
              model: User,
              as: 'user',
              attributes: [],
              where: {
                deleted_at: { [Op.is]: null },
              },
              required: true,
            },
          ],
        },
      ],
      where: {
        company_id: companyId,
        spent_in_hour: { [Op.ne]: 0 },
        deleted_at: { [Op.is]: null },
      },
      group: ['workItem.product_id'],
      raw: true,
    })) as unknown as { product_id: number; spent_in_hour: string }[];

    // Map product_id => spent_in_hour for easy lookup
    const spentMap = workLogs.reduce<Map<number, number>>((map, log) => {
      const productId = log.product_id;
      const spent = Number(log.spent_in_hour);
      map.set(productId, spent);
      return map;
    }, new Map());

    const rows: RowHour[] = filteredQuoteItems
      .filter((item) => spentMap.has(item.product_id) && spentMap.get(item.product_id) > 0)
      .map((item) => ({
        name: item.name,
        optional: item.optional,
        price: Number(item.price),
        spent_in_hour: spentMap.get(item.product_id) || 0,
      }));

    return rows;
  }

  async listHours(companyId: number, projectID: number, start?: string, end?: string, user?: User) {
    let selCompanyId = user.company_id;

    // Handling optional companyId parameter
    if (companyId && companyId > 0 && companyId !== selCompanyId) {
      selCompanyId = companyId;
    }

    // Fetch the project based on companyId and projectID
    const project = await Project.findOne({
      where: { company_id: selCompanyId, id: projectID },
    });

    if (!project) {
      throw new NotFoundError('Project not found');
    }

    let rows: RowHour[] = [];

    if (start && end) {
      // Parse start and end date
      const startDate = new Date(start);
      const endDate = new Date(end);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new BadRequestError('Invalid date format');
      }

      // Query rows between date range
      rows = await this.queryHourRowsByRange(project.id, selCompanyId, startDate, endDate);
    } else {
      // Query all rows without date range
      rows = await this.queryHourRows(project.id, selCompanyId);
    }

    const totalHours = rows.reduce((sum, row) => sum + row.spent_in_hour, 0) as number;

    return {
      total: totalHours,
      rows,
    };
  }

  private async populateProductIdToQuoteItems(companyId: number, services: ProjectProducts[]): Promise<void> {
    const vatRates = await VatRate.findAll({
      where: { company_id: companyId, [Op.and]: [{ rate: { [Op.gt]: 0 } }, { rate: { [Op.not]: null } }] },
      attributes: ['id', 'rate'],
      raw: true,
    });
    const vatRateMap = new Map(vatRates.map((rate) => [Number(rate.rate).toFixed(3), rate.id]));

    const units = await Unit.findAll({
      where: { company_id: companyId },
      attributes: ['id', 'description'],
      raw: true,
    });
    const unitMap = new Map(units.map((unit) => [unit.description, unit.id]));

    for (const service of services) {
      if (service.type === 'individual' && !service.product_id) {
        // If the service is individual and has no product_id, create a new product for this company
        const createdProduct = await Product.create(
          {
            company_id: companyId,
            name: service.name,
            unit_id: Number(unitMap.get(service.unit)) || null, // Use the vat_rate from the service or null if not found
            vat_rate_id: Number(vatRateMap.get(Number(service.vat_rate).toFixed(3))) || null, // Use the vat_rate from the service or null if not found
            description: service.description || '',
            price: service.price || 0,
            folder: 'Default', // Always 'Default' folder, adjust as needed
            created_at: new Date(),
          },
          {
            fields: ['company_id', 'name', 'unit_id', 'vat_rate_id', 'description', 'price', 'folder', 'created_at'],
            returning: true, // Return the created product
          },
        );

        // Assign the created product ID to the service
        service.product_id = createdProduct.id;
      }
    }
  }

  async createProject(createProjectDto: CreateProjectDto, companyId: number) {
    // Start transaction
    const transaction = await Project.sequelize.transaction();
    // Fetch the company
    const company = await Company.findOne({ where: { id: companyId } });
    if (!company) {
      throw new NotFoundError('Company not found');
    }

    const listRemoveFields = ['name', 'status', 'number', 'customer'];

    // Handle project creation
    const project = new Project();

    // Handle "end_on" field
    if (createProjectDto.end_on) {
      project.end_on = new Date(createProjectDto.end_on);
    }

    try {
      // Create new number entry
      const number = new NumberEntry({
        company_id: company.id,
        type: 'project',
        created_at: new Date(),
      });

      if (createProjectDto.number && createProjectDto.number.trim().length > 0) {
        number.custom_id = createProjectDto.number;
      }

      await number.save({ transaction });

      // Populate project fields
      project.name = createProjectDto.name;
      project.company_id = company.id;
      project.status = 'active'; // Assuming 'active' is the status field
      project.number_id = number.id;
      project.is_internal = createProjectDto.is_internal;
      project.created_at = new Date();

      // Handle customer
      const customer = createProjectDto.customer;
      if (customer && customer.id) {
        project.customer_id = customer.id;
      }

      // Handle assignee
      if (createProjectDto.assignee && createProjectDto.assignee.id) {
        project.assignee_id = createProjectDto.assignee.id;
      }

      // Save the project
      await project.save({ transaction });

      // Update number reference with project ID
      number.ref_id = project.id;
      await number.save({ transaction });

      // Extract data for project details from project metadata
      const { km_dropdown, quote_items, internal_desc, additional_cost, ...details } = removeFields(
        createProjectDto,
        listRemoveFields,
      );
      // const createOperations = [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const addProjectId = (items?: any[]) => items?.map((item) => ({ ...item, project_id: project.id, id: null }));

      const preparedData = {
        quote_items: addProjectId(quote_items),
        // events: addProjectId(events),
        internal_desc: addProjectId(internal_desc),
        additional_costs: addProjectId(additional_cost),
      };

      if (details) {
        const { end_on, ...restDetails } = details;
        await this.projectDetailsRepository.create(
          {
            project_id: project.id,
            ...restDetails,
            end_on: end_on ? new Date(end_on) : undefined,
            selected_km_label: km_dropdown.label,
            selected_km_value: km_dropdown.value,
          },
          { transaction },
        );
      }

      if (preparedData.quote_items?.length) {
        // Populate product_id for quote items
        await this.populateProductIdToQuoteItems(company.id, preparedData.quote_items);
        // Create project products
        await this.projectProductsRepository.bulkCreate(preparedData.quote_items, { transaction });
      }

      if (preparedData.additional_costs?.length) {
        await this.projectAdditionalCostsRepository.bulkCreate(preparedData.additional_costs, { transaction });
      }

      if (preparedData.internal_desc?.length) {
        await this.projectLabelsRepository.bulkCreate(preparedData.internal_desc, { transaction });
      }

      // create project products
      // if (quote_items && quote_items.length > 0) {
      //   const productItems = quote_items.map((item: ProjectProducts) => {
      //     delete item.id;
      //     return { project_id: project.id, ...item };
      //   });

      //   const productsPromise = ProjectProducts.bulkCreate(productItems, { transaction });
      //   createOperations.push(productsPromise);
      // }

      // create project labels
      // if (internal_desc && internal_desc.length > 0) {
      //   const labelItems = internal_desc.map((item: ProjectLabels) => {
      //     return { project_id: project.id, ...item };
      //   });

      //   const labelsPromise = ProjectLabels.bulkCreate(labelItems, { transaction });
      //   createOperations.push(labelsPromise);
      // }

      // create additional costs
      // if (additional_cost && additional_cost.length > 0) {
      //   const costItems = additional_cost.map((item: ProjectAdditionalCosts) => {
      //     return { project_id: project.id, ...item };
      //   });

      //   const additionalCostsPromise = ProjectAdditionalCosts.bulkCreate(costItems, { transaction });
      //   createOperations.push(additionalCostsPromise);
      // }

      // Wait for all create operations to complete
      // await Promise.all(createOperations);

      // Commit the transaction
      await transaction.commit();

      return { success: true, project };
    } catch (error) {
      // Rollback the transaction in case of error
      await transaction.rollback();
      throw new BadRequestError(`Error creating project`);
    }
  }

  async updateProject(projectId: number, companyId: number, updateProjectDto: UpdateProjectDto) {
    // Start transaction
    const transaction = await Project.sequelize.transaction();
    // Fetch company and project
    const company = await Company.findOne({ where: { id: companyId } });
    const project = await this.projectRepository.findOne({
      where: { id: projectId, company_id: companyId },
    });

    if (!company || !project) {
      throw new NotFoundError('Company or project not found');
    }

    // Update project fields
    project.updated_at = new Date();
    project.name = updateProjectDto.name;
    project.is_internal = updateProjectDto.is_internal;

    try {
      // Handle custom number
      if (updateProjectDto.number && updateProjectDto.number.trim().length > 0) {
        await NumberEntry.update(
          {
            custom_id: updateProjectDto.number,
            updated_at: new Date(),
          },
          { where: { id: project.number_id, company_id: companyId }, transaction },
        );
      }

      // Handle assignee
      if (updateProjectDto.assignee && updateProjectDto.assignee.id) {
        project.assignee_id = updateProjectDto.assignee.id;
      }

      // Handle customer
      if (updateProjectDto.customer && updateProjectDto.customer.id) {
        project.customer_id = updateProjectDto.customer.id;
      }

      // Handle end_on date
      if (updateProjectDto.end_on) {
        project.end_on = new Date(updateProjectDto.end_on);
      }

      await project.save({ transaction });

      // clean up updateProjectDto
      const listRemoveFields = ['name', 'status', 'number', 'customer'];
      const { km_dropdown, quote_items, internal_desc, additional_cost, ...details } = removeFields(
        updateProjectDto,
        listRemoveFields,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ) as any;

      // Find existing project details or create if not exists
      let projectDetails = await ProjectDetails.findOne({
        where: { project_id: projectId },
        transaction,
      });

      if (projectDetails) {
        // Update existing record
        projectDetails.selected_km_label = km_dropdown.label;
        projectDetails.selected_km_value = km_dropdown.value;

        // Update other fields from details
        for (const [key, value] of Object.entries(details)) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (projectDetails as any)[key] = value;
        }

        await projectDetails.save({ transaction });
      } else {
        // Create new project details record
        projectDetails = new ProjectDetails({
          project_id: project.id,
          selected_km_label: km_dropdown.label,
          selected_km_value: km_dropdown.value,
          ...details,
        });

        await projectDetails.save({ transaction });
      }

      // Update Products - delete existing records and create new ones
      if (quote_items && quote_items.length > 0) {
        await this.populateProductIdToQuoteItems(company.id, quote_items);

        // Delete existing products for this project
        await ProjectProducts.destroy({
          where: { project_id: projectId },
          transaction,
        });

        // Create new product records
        const productData = quote_items.map((item: ProjectProducts) => {
          const newItem = { ...item };
          delete newItem.id;
          // Generate new UUID for each product
          newItem.uuid = generateNewUUID();
          return { project_id: projectId, ...newItem };
        });

        await ProjectProducts.bulkCreate(productData, { transaction });
      }

      // Update Internal Descriptions (Labels)
      if (internal_desc && internal_desc.length > 0) {
        await ProjectLabels.destroy({
          where: { project_id: projectId },
          transaction,
        });

        const labelData = internal_desc.map((internalDesc: ProjectLabels) => ({
          project_id: project.id,
          label: internalDesc.label,
          is_active: internalDesc.is_active || false,
        }));

        await ProjectLabels.bulkCreate(labelData, { transaction });
      }

      // Update Additional Costs
      if (additional_cost && additional_cost.length > 0) {
        await ProjectAdditionalCosts.destroy({
          where: { project_id: projectId },
          transaction,
        });

        const additionalCostData = additional_cost.map((additionalCost: ProjectAdditionalCosts) => ({
          project_id: project.id,
          label: additionalCost.label,
          value: additionalCost.value,
          is_active: additionalCost.is_active || false,
        }));

        await ProjectAdditionalCosts.bulkCreate(additionalCostData, { transaction });
      }

      // Commit transaction
      await transaction.commit();

      return { success: true, project };
    } catch (error) {
      // Rollback transaction in case of error
      await transaction.rollback();
      throw new BadRequestError(`Error updating project`);
    }
  }

  async deleteProject(projectId: number, companyId: number, userId: number) {
    // Start a transaction
    const transaction = await Project.sequelize.transaction();
    // Find the project by company and project ID
    const project = await Project.findOne({
      where: { id: projectId, company_id: companyId, deleted_at: null },
      transaction,
    });

    if (!project) {
      await transaction.rollback();
      throw new NotFoundError('Project not found');
    }

    // Ensure that the user is allowed to delete the project (optional, based on your logic)
    const user = await User.findOne({
      where: { id: userId, company_id: companyId },
    });

    if (!user) {
      await transaction.rollback();
      throw new NotFoundError('User not found');
    }

    const result = await Project.update(
      { deleted_by: userId, deleted_at: new Date() },
      {
        where: {
          id: projectId,
          company_id: companyId,
        },
        returning: true,
      },
    );

    if (!result[0]) {
      await transaction.rollback();
      throw new BadRequestError(`Error deleting project`);
    }

    // Commit the transaction
    await transaction.commit();

    return { success: true };
  }

  async bulkDeleteProjects(currentUser: User, bulkDeleteProjectsDto: BulkDeleteOffersDto): Promise<void> {
    const { ids } = bulkDeleteProjectsDto;
    const transaction = await Project.sequelize.transaction();
    try {
      for (const projectId of ids) {
        const existingProjects = await Project.findAll({
          where: {
            [Op.or]: [{ id: projectId }],
          },
        });
        if (!existingProjects) {
          continue;
        }

        for (const project of existingProjects) {
          await this.projectRepository.update(
            {
              status: 'deleted',
              deleted_by: currentUser.id,
              deleted_at: new Date(),
            },
            {
              where: { id: project.id },
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

  async queryHourBeginning(projectId: number, companyId: number): Promise<{ date: string } | null> {
    try {
      // Refactor from GET_PROJECT_HOUR_BEGINNING_SQL raw SQL, need to test again carefully
      const result = await WorkLog.findOne({
        attributes: [
          [
            Sequelize.fn(
              'COALESCE',
              Sequelize.fn('TO_CHAR', Sequelize.col('date'), 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
              null,
            ),
            'date',
          ],
        ],
        include: [
          {
            model: WorkItem,
            as: 'workItem',
            attributes: [],
            required: true,
            where: { project_id: projectId },
            include: [
              {
                model: User,
                as: 'user',
                attributes: [],
                required: true,
                where: { deleted_at: { [Op.is]: null } },
              },
            ],
          },
        ],
        where: {
          company_id: companyId,
          deleted_at: { [Op.is]: null },
        },
        order: [[Sequelize.col('date'), 'ASC']],
        limit: 1,
      });

      return result ? { date: result.date.toString() } : null;
    } catch (error) {
      throw new BadRequestError(`Error fetching project hour beginning`);
    }
  }

  async fromBeginning(projectId: number, companyId: number): Promise<{ start_date: Date | string }> {
    // Fetch project
    const project = await Project.findOne({
      where: { id: projectId, company_id: companyId },
    });

    if (!project) {
      throw new NotFoundError('Project not found');
    }

    // Query for the hour beginning (assuming queryHourBeginning is implemented in the Project model)
    const result = await this.queryHourBeginning(project.id, companyId);

    // If no rows are found, return the project creation date
    if (!result) {
      DateFormatter.formatDTO(project);
      return {
        start_date: project.created_at,
      };
    }

    // Return the earliest start date found
    return {
      start_date: result.date,
    };
  }

  async copyProject(
    projectId: number,
    companyId: number,
  ): Promise<{
    success: boolean;
    project: Project;
  }> {
    const transaction = await Project.sequelize.transaction();

    try {
      // Select the project to copy with all related data
      const originalProject = await this.projectRepository.findOne({
        where: { id: projectId, company_id: companyId },
        transaction,
      });

      if (!originalProject) {
        await transaction.rollback();
        throw new NotFoundError('Project not found');
      }

      // Create a copy of the project
      const newProject = { ...originalProject.get() };
      newProject.id = null; // Reset ID for insertion
      newProject.offer_id = null; // Clear the OfferID
      newProject.assignee_id = null; // Clear the AssigneeID
      newProject.status = 'active'; // Set the status to active
      newProject.name = `${newProject.name} (Kopie)`; // Update the name

      // Insert the new project
      const createdProject = await Project.create(newProject, { transaction });

      // Generate a new number for the copied project
      const number = await NumberEntry.create(
        {
          company_id: companyId,
          type: 'project',
          ref_id: createdProject.id,
          created_at: new Date(),
        },
        { transaction },
      );

      // Update the project with the new number ID
      createdProject.number_id = number.id;
      await createdProject.save({ transaction });

      // Copy project details
      const projectDetails = await this.projectDetailsRepository.findOne({
        where: { project_id: projectId },
        transaction,
      });
      if (projectDetails) {
        const newDetails = { ...projectDetails.get() };
        delete newDetails.id;
        newDetails.project_id = createdProject.id;
        newDetails.date = new Date();

        await ProjectDetails.create(newDetails, { transaction });
      }

      // Create an array to hold all copy operations
      const copyOperations = [];

      // Copy project products
      const quotes = await this.projectProductsRepository.findAll({
        where: { project_id: projectId },
        transaction,
      });

      if (quotes && quotes.length > 0) {
        const productItems = quotes.map((item) => {
          const newItem = { ...item.get() };
          delete newItem.id;
          // Generate new UUID for each product
          newItem.uuid = generateNewUUID();
          newItem.project_id = createdProject.id;
          return newItem;
        });

        const productsPromise = ProjectProducts.bulkCreate(productItems, { transaction });
        copyOperations.push(productsPromise);
      }

      // Copy project events
      const projectEvents = await this.projectEventsRepository.findAll({
        where: { project_id: projectId },
        transaction,
      });

      if (projectEvents && projectEvents.length > 0) {
        const eventItems = projectEvents.map((item) => {
          const newItem = { ...item.get() };
          delete newItem.id;
          newItem.project_id = createdProject.id;
          return newItem;
        });

        const eventsPromise = ProjectEvents.bulkCreate(eventItems, { transaction });
        copyOperations.push(eventsPromise);
      }

      // Copy project cost estimates
      const projectCostEstimates = await this.projectCostEstimatesRepository.findAll({
        where: { project_id: projectId },
        transaction,
      });

      if (projectCostEstimates && projectCostEstimates.length > 0) {
        const costItems = projectCostEstimates.map((item) => {
          const newItem = { ...item.get() };
          delete newItem.id;
          newItem.project_id = createdProject.id;
          return newItem;
        });

        const costEstimatesPromise = ProjectCostEstimates.bulkCreate(costItems, { transaction });
        copyOperations.push(costEstimatesPromise);
      }

      // Copy project labels
      const projectLabels = await this.projectLabelsRepository.findAll({
        where: { project_id: projectId },
        transaction,
      });

      if (projectLabels && projectLabels.length > 0) {
        const labelItems = projectLabels.map((item) => {
          const newItem = { ...item.get() };
          delete newItem.id;
          newItem.project_id = createdProject.id;
          return newItem;
        });

        const labelsPromise = ProjectLabels.bulkCreate(labelItems, { transaction });
        copyOperations.push(labelsPromise);
      }

      // Copy additional costs
      const projectAdditionalCosts = await this.projectAdditionalCostsRepository.findAll({
        where: { project_id: projectId },
        transaction,
      });

      if (projectAdditionalCosts && projectAdditionalCosts.length > 0) {
        const costItems = projectAdditionalCosts.map((item) => {
          const newItem = { ...item.get() };
          delete newItem.id;
          newItem.project_id = createdProject.id;
          return newItem;
        });

        const additionalCostsPromise = ProjectAdditionalCosts.bulkCreate(costItems, { transaction });
        copyOperations.push(additionalCostsPromise);
      }

      // Wait for all copy operations to complete
      await Promise.all(copyOperations);

      // Commit the transaction
      await transaction.commit();

      return { success: true, project: createdProject };
    } catch (error) {
      // Rollback the transaction if any error occurs
      await transaction.rollback();
      throw new BadRequestError(`Error copying project`);
    }
  }

  async copyProjectAsOffer(
    projectId: number,
    companyId: number,
  ): Promise<{
    success: boolean;
    offer: Offer;
  }> {
    const transaction = await Project.sequelize.transaction();

    try {
      // Fetch the project with all its related details
      const project = await this.projectRepository.findOne({
        where: { id: projectId, company_id: companyId },
        include: [
          { model: Offer, as: 'offer' },
          {
            model: this.projectDetailsRepository,
            as: 'details',
          },
        ],
        transaction,
      });

      if (!project) {
        await transaction.rollback();
        throw new NotFoundError('Project not found');
      }

      // Create a new offer from the project data
      const newOfferName = `${project.name} (Kopie)`;

      // Create the base offer record
      const newOffer = await Offer.create(
        {
          company_id: companyId,
          status: 'active',
          created_at: new Date(),
          name: newOfferName,
          customer_id: project.customer_id,
        },
        { transaction },
      );

      // Create offer details
      const projectDetails = project.get('details', { plain: true });
      if (!projectDetails) {
        await transaction.rollback();
        throw new NotFoundError('Project details not found');
      }

      const companySettings = await this.settingsService.selectSetting(companyId);

      if (!project.get('offer_id')) {
        // Map project details to offer details
        await OfferDetail.create(
          {
            offer_id: newOffer.id,
            name: newOfferName,
            begin: companySettings.offer.begin,
            end: companySettings.offer.end,
            date: new Date(), // Always use current date for the copy
            event: companySettings.offer.event,
            offer: companySettings.offer.offer,
            title: 'Honorarofferte',
            category: projectDetails.category,
            currency: projectDetails.currency,
            end_desc: companySettings.offer.end_desc,
            location: projectDetails.location,
            parameter: companySettings.offer.parameter,
            additional: companySettings.offer.additional,
            begin_desc: companySettings.offer.begin_desc,
            offer_desc: companySettings.offer.offer_desc,
            begin_break: projectDetails.begin_break || false,
            event_break: projectDetails.event_break || false,
            offer_break: projectDetails.offer_break || false,
            performance: companySettings.offer.performance,
            cost_generate: companySettings.offer.estimate_setting,
            estimate_cost: companySettings.offer.estimate_cost,
            parameter_desc: companySettings.offer.parameter_desc,
            additional_desc: companySettings.offer.additional_desc,
            parameter_break: projectDetails.parameter_break || false,
            additional_break: projectDetails.additional_break || false,
            discount_percent: projectDetails.discount_percent || 0,
            performance_desc: companySettings.offer.performance_desc,
            offer_quote_break: projectDetails.offer_quote_break || false,
            performance_break: projectDetails.performance_break || false,
            internal_desc_custom: projectDetails.internal_desc_custom,
            selected_km_label: projectDetails.selected_km_label || '',
            selected_km_value: projectDetails.selected_km_value || 0,
          },
          { transaction },
        );
        // Create all related entities
        const copyPromises = [];

        // 1. Copy project products to offer quote items
        const projectProducts = await this.projectProductsRepository.findAll({
          where: { project_id: projectId },
          attributes: {
            exclude: ['id', 'project_id', 'uuid'], // Exclude ID and project_id to avoid conflicts
          },
          transaction,
        });

        if (projectProducts && projectProducts.length > 0) {
          const quoteItemsPromise = OfferQuoteItem.bulkCreate(
            projectProducts.map((item) => {
              const newItem = {
                offer_id: newOffer.id,
                product_id: item.product_id,
                name: item.name,
                cost: item.cost,
                type: item.type,
                unit: item.unit,
                uuid: generateNewUUID(), // Generate new UUID for each item
                price: item.price,
                year: item.year,
                description: item.description,
                amount: item.amount,
                quarter: item.quarter,
                optional: item.optional || false,
                vat_rate: item.vat_rate,
                break_page: item.break_page || false,
                is_nk: item.is_nk || false,
                apply_discount: item.apply_discount || false,
              };
              return newItem;
            }),
            { transaction },
          );
          copyPromises.push(quoteItemsPromise);
        }

        // 2. Copy project events to offer events
        const eventsPromise = OfferEvent.bulkCreate(
          companySettings.offer.event_setting.map((event: { label: string; value: string }) => ({
            offer_id: newOffer.id,
            label: event.label,
            value: event.value,
          })),
          { transaction },
        );
        copyPromises.push(eventsPromise);

        // 3. Copy project cost estimates to offer cost estimates
        const costEstimatesPromise = OfferCostEstimate.bulkCreate(
          companySettings.offer.estimate_setting.map((estimate: { label: string; value: string; id?: number }) => ({
            offer_id: newOffer.id,
            order: estimate.id?.toString() || '',
            label: estimate.label,
            value: estimate.value,
          })),
          { transaction },
        );
        copyPromises.push(costEstimatesPromise);

        // 4. Copy project additional costs to offer additional costs
        const additionalCostsPromise = OfferAdditionalCost.bulkCreate(
          companySettings.offer.add_cost_setting.map((cost: { label: string; value: number; is_active?: boolean }) => ({
            offer_id: newOffer.id,
            label: cost.label,
            value: cost.value,
            is_active: cost.is_active || false,
          })),
          { transaction },
        );
        copyPromises.push(additionalCostsPromise);

        // 5. Copy project internal descriptions (labels) to offer internal descriptions
        const projectLabels = await this.projectLabelsRepository.findAll({
          where: { project_id: projectId },
          attributes: ['label', 'is_active'],
          transaction,
          raw: true,
        });

        if (projectLabels && projectLabels.length > 0) {
          const internalDescPromise = OfferInternalDesc.bulkCreate(
            projectLabels.map((desc) => ({
              offer_id: newOffer.id,
              label: desc.label,
              is_active: desc.is_active || false,
            })),
            { transaction },
          );
          copyPromises.push(internalDescPromise);
        }

        // Wait for all copy operations to complete
        await Promise.all(copyPromises);
      } else {
        // Map project details to offer details
        await OfferDetail.create(
          {
            offer_id: newOffer.id,
            name: newOfferName,
            begin: projectDetails.begin || companySettings.offer.begin,
            end: projectDetails.end || companySettings.offer.end,
            date: new Date(), // Always use current date for the copy
            event: projectDetails.event || companySettings.offer.event,
            offer: projectDetails.offer || companySettings.offer.offer,
            title: projectDetails.title || 'Honorarofferte',
            category: projectDetails.category,
            currency: projectDetails.currency,
            end_desc: projectDetails.end_desc || companySettings.offer.end_desc,
            location: projectDetails.location,
            parameter: projectDetails.parameter || companySettings.offer.parameter,
            additional: projectDetails.additional || companySettings.offer.additional,
            begin_desc: projectDetails.begin_desc || companySettings.offer.begin_desc,
            offer_desc: projectDetails.offer_desc || companySettings.offer.offer_desc,
            begin_break: projectDetails.begin_break || false,
            event_break: projectDetails.event_break || false,
            offer_break: projectDetails.offer_break || false,
            performance: projectDetails.performance || companySettings.offer.performance,
            cost_generate: projectDetails.cost_generation || companySettings.offer.estimate_setting,
            estimate_cost: projectDetails.estimate_cost || companySettings.offer.estimate_cost,
            parameter_desc: projectDetails.parameter_desc || companySettings.offer.parameter_desc,
            additional_desc: projectDetails.additional_desc || companySettings.offer.additional_desc,
            parameter_break: projectDetails.parameter_break || false,
            additional_break: projectDetails.additional_break || false,
            discount_percent: projectDetails.discount_percent || 0,
            performance_desc: projectDetails.performance_desc || companySettings.offer.performance_desc,
            offer_quote_break: projectDetails.offer_quote_break || false,
            performance_break: projectDetails.performance_break || false,
            internal_desc_custom: projectDetails.internal_desc_custom || '',
            selected_km_label: projectDetails.selected_km_label || '',
            selected_km_value: projectDetails.selected_km_value || 0,
          },
          { transaction },
        );

        // Create all related entities
        const copyPromises = [];

        // 1. Copy project products to offer quote items
        const projectProducts = await this.projectProductsRepository.findAll({
          where: { project_id: projectId },
          attributes: {
            exclude: ['id', 'project_id', 'uuid'], // Exclude ID and project_id to avoid conflicts
          },
          transaction,
        });

        if (projectProducts && projectProducts.length > 0) {
          const quoteItemsPromise = OfferQuoteItem.bulkCreate(
            projectProducts.map((item) => {
              const newItem = {
                offer_id: newOffer.id,
                product_id: item.product_id,
                name: item.name,
                cost: item.cost,
                type: item.type,
                unit: item.unit,
                uuid: generateNewUUID(), // Generate new UUID for each item
                price: item.price,
                year: item.year,
                description: item.description,
                amount: item.amount,
                quarter: item.quarter,
                optional: item.optional || false,
                vat_rate: item.vat_rate,
                break_page: item.break_page || false,
                is_nk: item.is_nk || false,
                apply_discount: item.apply_discount || false,
              };
              return newItem;
            }),
            { transaction },
          );
          copyPromises.push(quoteItemsPromise);
        }

        // 2. Copy project events to offer events
        const projectEvents = await this.projectEventsRepository.findAll({
          where: { project_id: projectId },
          attributes: {
            exclude: ['id', 'project_id'], // Exclude ID and project_id to avoid conflicts
          },
          transaction,
        });

        if (projectEvents && projectEvents.length > 0) {
          const eventsPromise = OfferEvent.bulkCreate(
            projectEvents.map((event) => ({
              offer_id: newOffer.id,
              label: event.label,
              value: event.value,
            })),
            { transaction },
          );
          copyPromises.push(eventsPromise);
        } else {
          const eventSettings: { label: string; value: string }[] = companySettings.offer.event_setting || [];
          copyPromises.push(
            OfferEvent.bulkCreate(
              eventSettings.map((event) => ({
                offer_id: newOffer.id,
                label: event.label,
                value: event.value,
              })),
              { transaction },
            ),
          );
        }

        // 3. Copy project cost estimates to offer cost estimates
        const projectCostEstimates = await this.projectCostEstimatesRepository.findAll({
          where: { project_id: projectId },
          attributes: {
            exclude: ['id', 'project_id'], // Exclude ID and project_id to avoid conflicts
          },
          transaction,
        });

        if (projectCostEstimates && projectCostEstimates.length > 0) {
          const costEstimatesPromise = OfferCostEstimate.bulkCreate(
            projectCostEstimates.map((estimate) => ({
              offer_id: newOffer.id,
              order: estimate.id?.toString() || '',
              label: estimate.label,
              value: estimate.value,
            })),
            { transaction },
          );
          copyPromises.push(costEstimatesPromise);
        } else {
          const estimateSettings: { label: string; value: string; id?: number }[] =
            companySettings.offer.estimate_setting || [];
          copyPromises.push(
            OfferCostEstimate.bulkCreate(
              estimateSettings.map((estimate) => ({
                offer_id: newOffer.id,
                order: estimate.id?.toString() || '',
                label: estimate.label,
                value: Number(estimate.value || '0'),
              })),
              { transaction },
            ),
          );
        }

        // 4. Copy project additional costs to offer additional costs
        const projectAdditionalCosts = await this.projectAdditionalCostsRepository.findAll({
          where: { project_id: projectId },
          attributes: {
            exclude: ['id', 'project_id'], // Exclude ID and project_id to avoid conflicts
          },
          transaction,
        });

        if (projectAdditionalCosts && projectAdditionalCosts.length > 0) {
          const additionalCostsPromise = OfferAdditionalCost.bulkCreate(
            projectAdditionalCosts.map((cost) => ({
              offer_id: newOffer.id,
              label: cost.label,
              value: cost.value,
              is_active: cost.is_active || false,
            })),
            { transaction },
          );
          copyPromises.push(additionalCostsPromise);
        }

        // 5. Copy project internal descriptions (labels) to offer internal descriptions
        const projectLabels = await this.projectLabelsRepository.findAll({
          where: { project_id: projectId },
          attributes: {
            exclude: ['id', 'project_id'], // Exclude ID and project_id to avoid conflicts
          },
          transaction,
        });

        if (projectLabels && projectLabels.length > 0) {
          const internalDescPromise = OfferInternalDesc.bulkCreate(
            projectLabels.map((desc) => ({
              offer_id: newOffer.id,
              label: desc.label,
              is_active: desc.is_active || false,
            })),
            { transaction },
          );
          copyPromises.push(internalDescPromise);
        }

        // Wait for all copy operations to complete
        await Promise.all(copyPromises);
      }
      // Generate a new number for the offer
      const number = await NumberEntry.create(
        {
          company_id: companyId,
          type: 'offer',
          ref_id: newOffer.id,
          created_at: new Date(),
        },
        { transaction },
      );

      // Update the offer with the new number ID
      newOffer.number_id = number.id;
      await newOffer.save({ transaction });

      // Commit the transaction
      await transaction.commit();

      return { success: true, offer: newOffer };
    } catch (error) {
      // Rollback the transaction in case of error
      await transaction.rollback();
      throw new BadRequestError(`Error copying project as offer: ${error}`);
    }
  }

  async generateInvoiceFromProject(
    projectId: number,
    user: User,
    reqBody: GenerateInvoiceDto,
  ): Promise<{
    invoice_id: number;
  }> {
    const transaction = await Project.sequelize.transaction();

    // 1. Fetch the project with details and products
    const project = await this.projectRepository.findOne({
      where: { id: projectId, company_id: user.company_id },
      include: [
        {
          model: this.projectDetailsRepository,
          as: 'details',
          include: [
            {
              model: this.projectAdditionalCostsRepository,
              as: 'additional_cost',
              attributes: ['label', 'value', 'is_active'],
            },
            {
              model: this.projectProductsRepository,
              as: 'quote_items',
            },
            {
              model: this.projectLabelsRepository,
              as: 'internal_desc',
              attributes: ['label', 'is_active'],
            },
          ],
        },
      ],
      transaction,
    });

    if (!project) {
      await transaction.rollback();
      throw new NotFoundError('Project not found');
    }

    // 1.1 Calculate total cost from the project products
    const projectTotal = {
      id: project.id,
      sum: ((project.details.get('quote_items') as Array<{ type: string; optional: boolean; cost: number }>) || [])
        .filter((item) => item.type !== 'title' && item.optional === false)
        .reduce((acc: number, item) => acc + (Number(item.cost) || 0), 0),
    };

    if (!projectTotal || !projectTotal.id) {
      await transaction.rollback();
      throw new NotFoundError('Project not found');
    }

    // Check if the sum is equal to the request amount to determine invoice type
    let invoiceType = projectTotal.sum === reqBody.amount ? 'invoice' : 'partial';
    const is_final = reqBody.is_final;

    if (reqBody.is_final) invoiceType = 'partial';

    // Copy data from company settings
    const companySettings = await this.settingsService.selectSetting(user.company_id);

    try {
      const baseTime = new Date();
      const invoiceName =
        reqBody.locale === 'de'
          ? `${invoiceType === 'partial' ? 'Teilrechnung' : 'Rechnung'} ${project.name}`
          : `${invoiceType === 'partial' ? 'Partial invoice' : 'Invoice'} ${project.name}`;

      const finalInvoiceName =
        reqBody.locale === 'de' ? 'Schlussrechnung ' + project.name : 'Final invoice ' + project.name;

      // Create the invoice
      const newInvoice = await Invoice.create(
        {
          company_id: user.company_id,
          name: reqBody.is_final ? finalInvoiceName : invoiceName,
          type: invoiceType,
          status: 'offset', // Adjust based on your status mapping
          number_id: project.number_id,
          customer_id: project.customer_id,
          offer_id: project.offer_id,
          project_id: project.id,
          created_at: baseTime,
          created_by: user.id,
          charged_on: baseTime,
          due_on: null,
        },
        { returning: true, transaction },
      );

      // Create the invoice details from project details and company invoice settings
      const invDetail: Partial<CreateInvoiceDto> = {
        ...project.details.get({ plain: true }),
        ...(companySettings.invoice ? companySettings.invoice : { begin_desc: '', end_desc: '' }),
        discount_percent: project.details?.discount_percent || 0, // avoid NaN
        is_final: is_final,
      };

      // Create invoice details
      const newInvDetail = await InvoiceDetail.create(
        {
          ...invDetail,
          created_at: baseTime,
          created_by: user.id,
          invoice_id: newInvoice.id,
          project_id: newInvoice.project_id,
          selected_km_label: project.details.selected_km_label,
          selected_km_value: project.details.selected_km_value,
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
            'is_final',
            'start_date_inv',
            'end_date_inv',
            'created_at',
            'created_by',
          ],
          transaction,
          returning: true,
        },
      );

      // Modify amount if discount_percent is available from project details
      if (project.details && project.details.discount_percent) {
        reqBody.amount = reqBody.amount / (1 - project.details.discount_percent / 100.0);
      }

      reqBody.amount = Math.round(reqBody.amount * 20) / 20; // Round to the nearest 0.05
      const quoteItemName =
        reqBody.locale === 'de'
          ? `${invoiceType === 'partial' ? 'Teilrechnung' : 'Rechnung'} ${project.number_id}`
          : `${invoiceType === 'partial' ? 'Partial invoice' : 'Invoice'} ${project.number_id}`;
      const finalInvoiceQuoteName =
        reqBody.locale === 'de' ? 'Schlussrechnung ' + project.number_id : 'Final invoice ' + project.number_id;

      // Create quote items for the invoice
      const quoteItems = [
        {
          invoice_id: newInvoice.id,
          amount: 1,
          description: '',
          name: reqBody.is_final ? finalInvoiceQuoteName : quoteItemName,
          optional: false,
          price: reqBody.amount,
          cost: reqBody.amount,
          type: 'individual',
          unit: 'unit.flatRate',
          vat_rate: 8.1, // Assuming VAT rate
          uuid: generateNewUUID(),
          created_at: baseTime,
          created_by: user.id,
        },
      ];

      if (reqBody.additional_percent > 0) {
        quoteItems.push({
          invoice_id: newInvoice.id,
          amount: 1,
          description: '',
          name: `Nebenkosten ${reqBody.additional_percent}%`,
          optional: false,
          price: reqBody.additional_cost,
          cost: reqBody.additional_cost,
          type: 'individual',
          unit: 'unit.flatRate',
          vat_rate: 8.1,
          uuid: generateNewUUID(),
          created_at: baseTime,
          created_by: user.id,
        });
      }

      const { additional_cost, internal_desc } = invDetail;

      await Promise.all([
        // Bulk create invoice additional costs
        InvoiceAdditionalCost.bulkCreate(
          additional_cost.map((item) => ({
            ...item,
            invoice_id: newInvoice.id,
            created_at: baseTime,
            created_by: user.id,
          })),
          {
            fields: ['invoice_id', 'label', 'value', 'is_active', 'created_at', 'created_by'],
            transaction,
          },
        ),
        // Bulk create invoice labels (internal descriptions)
        InvoiceLabel.bulkCreate(
          internal_desc.map((item) => ({
            ...item,
            invoice_id: newInvoice.id,
            created_at: baseTime,
            created_by: user.id,
          })),
          {
            fields: ['invoice_id', 'label', 'is_active', 'created_at', 'created_by'],
            transaction,
          },
        ),
        // Bulk create invoice products (quote items)
        InvoiceProduct.bulkCreate(quoteItems, {
          transaction,
          fields: [
            'invoice_id',
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
        }),
      ]);

      // If this is the final invoice, archive the project
      if (reqBody.is_final) {
        newInvDetail.is_final = true;
        project.status = 'archive'; // Adjust status to archive
      }

      // Handle number entries
      if (invoiceType === 'invoice') {
        const number = await NumberEntry.findByPk(project.number_id, { transaction });
        number.type = 'invoice';
        number.ref_id = newInvoice.id;
        await number.save({ transaction });
      } else {
        const newNumber = await NumberEntry.create(
          {
            company_id: user.company_id,
            type: 'partial',
            ref_id: newInvoice.id,
            created_at: baseTime,
          },
          { transaction },
        );

        await NumberEntry.update(
          { custom_id: `${project.number_id}-${newNumber.id}` },
          { where: { id: newNumber.id }, transaction },
        );

        newInvoice.number_id = newNumber.id;
        await newInvoice.save({ transaction });
      }
      await project.save({ transaction });
      await newInvDetail.save({ transaction });

      // Commit the transaction
      await transaction.commit();

      return {
        invoice_id: newInvoice.id,
      };
    } catch (error) {
      // Rollback transaction on error
      await transaction.rollback();
      throw new BadRequestError(`Error generating invoice from project`);
    }
  }

  async generateServiceInvoiceFromProject(
    projectId: number,
    user: User,
    reqBody: GenerateServiceInvoiceDto,
  ): Promise<{
    invoice_id: number;
  }> {
    const transaction = await this.projectRepository.sequelize.transaction();

    // 1. Fetch the project with its details and products
    const project = await this.projectRepository.findOne({
      where: { id: projectId, company_id: user.company_id },
      include: [
        {
          model: this.projectDetailsRepository,
          as: 'details',
          include: [
            {
              model: this.projectAdditionalCostsRepository,
              as: 'additional_cost',
              attributes: ['label', 'value', 'is_active'],
            },
            {
              model: this.projectProductsRepository,
              as: 'quote_items',
            },
            {
              model: this.projectLabelsRepository,
              as: 'internal_desc',
              attributes: ['label', 'is_active'],
            },
          ],
        },
      ],
      transaction,
    });

    if (!project) {
      await transaction.rollback();
      throw new NotFoundError('Project not found');
    }

    // 2. Validate selected services
    const totalSelectedServices = reqBody.service?.length || 0;
    if (totalSelectedServices <= 0) {
      await transaction.rollback();
      throw new BadRequestError('Invalid service input');
    }

    const editedCustomID = project.number_id;
    const currentInvoiceType = 'service';
    let invoiceType = reqBody.remaining === 0 ? 'invoice' : 'partial';

    if (reqBody.is_final) invoiceType = 'partial';

    const currentInvoiceName =
      reqBody.locale === 'de'
        ? `${invoiceType === 'partial' ? 'Teilrechnung' : 'Rechnung'} ${editedCustomID} ${project.name}`
        : `${invoiceType === 'partial' ? 'Partial invoice' : 'Invoice'} ${editedCustomID} ${project.name}`;
    const finalInvoiceName =
      reqBody.locale === 'de'
        ? 'Schlussrechnung ' + editedCustomID + ' ' + project.name
        : 'Final invoice ' + editedCustomID + ' ' + project.name;

    // 3. Check if services are valid (from project products)
    const quoteItems = project.details ? project.details.get('quote_items') : [];
    const quotesArray = Array.isArray(quoteItems) ? quoteItems : [];
    const totalServices = quotesArray.length;

    // Validate services quantity
    if (totalServices === 0) {
      await transaction.rollback();
      throw new BadRequestError('No services found for this project');
    }

    if (totalSelectedServices > totalServices) {
      await transaction.rollback();
      throw new BadRequestError(
        `Invalid service input: Selected ${totalSelectedServices} services but only ${totalServices} available`,
      );
    }

    try {
      // 4. Start creating the invoice
      const baseTime = new Date();

      // Get company settings
      const settings = await this.settingsService.selectSetting(user.company_id);

      // Create the invoice
      const invoice = await Invoice.create(
        {
          company_id: user.company_id,
          name: reqBody.is_final ? finalInvoiceName : currentInvoiceName,
          type: currentInvoiceType,
          status: 'offset', // Assuming 'offset' as a status
          number_id: project.number_id,
          customer_id: project.customer_id,
          offer_id: project.offer_id,
          project_id: project.id,
          created_at: baseTime,
          charged_on: baseTime,
          created_by: user.id,
        },
        { returning: true, transaction },
      );

      const invDetail: Partial<CreateInvoiceDto> = {
        ...project.details.get({ plain: true }),
        ...(settings.invoice ? settings.invoice : { begin_desc: '', end_desc: '' }),
        discount_percent: project.details?.discount_percent || 0, // avoid NaN
        is_final: reqBody.is_final,
      };

      const invoiceDetail = await InvoiceDetail.create(
        {
          ...invDetail,
          invoice_id: invoice.id,
          project_id: invoice.project_id,
          created_at: baseTime,
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
            'is_final',
            'start_date_inv',
            'end_date_inv',
            'created_at',
            'created_by',
          ],
          transaction,
          returning: true,
        },
      );

      // 5. Process the services and update their names and amounts
      reqBody.service.forEach((service) => {
        const rate = service.invoice_rate;
        const remaining = service.cost;
        const price = service.price;
        service['optional'] = false;
        service['type'] = 'individual'; // Assuming 'individual' is the item type
        service['price'] = price * rate;
        service['cost'] = remaining * rate;

        const oldNameArr = service.name.split('-');
        if (oldNameArr.length > 1) {
          oldNameArr[oldNameArr.length - 1] = `${(rate * 100).toFixed(0)}%`;
          service.name = oldNameArr.join('-');
        } else {
          service.name = `${service.name} - ${(rate * 100).toFixed(0)}%`;
        }

        service.created_at = baseTime;
        service.created_by = user.id;
        service.uuid = generateNewUUID(); // Generate a new UUID for each service
        service.invoice_id = invoice.id; // Associate service with the invoice
      });

      // 6. Add additional cost if applicable
      if (reqBody.additional_percent > 0) {
        reqBody.service.push({
          amount: 1.0,
          description: '',
          name: `Nebenkosten ${reqBody.additional_percent}%`,
          optional: false,
          price: reqBody.additional_cost,
          cost: reqBody.additional_cost,
          unit: 'unit.flatRate',
          type: 'individual',
          is_nk: true,
          apply_discount: true,
          vat_rate: 8.1, // Assuming VAT rate
          uuid: generateNewUUID(),
          created_at: baseTime,
          created_by: user.id,
          invoice_id: invoice.id,
        });
      }

      const { additional_cost, internal_desc } = invDetail;

      await Promise.all([
        // Bulk create invoice additional costs
        InvoiceAdditionalCost.bulkCreate(
          additional_cost.map((item) => ({
            ...item,
            invoice_id: invoice.id,
            created_at: baseTime,
            created_by: user.id,
          })),
          {
            fields: ['invoice_id', 'label', 'value', 'is_active', 'created_at', 'created_by'],
            transaction,
          },
        ),
        // Bulk create invoice labels (internal descriptions)
        InvoiceLabel.bulkCreate(
          internal_desc.map((item) => ({
            ...item,
            invoice_id: invoice.id,
            created_at: baseTime,
            created_by: user.id,
          })),
          {
            fields: ['invoice_id', 'label', 'is_active', 'created_at', 'created_by'],
            transaction,
          },
        ),
        InvoiceProduct.bulkCreate(reqBody.service, {
          transaction,
          fields: [
            'invoice_id',
            'name',
            'cost',
            'description',
            'type',
            'unit',
            'uuid',
            'price',
            'invoice_rate',
            'amount',
            'remaining',
            'break_page',
            'optional',
            'vat_rate',
            'is_nk',
            'selected',
            'created_at',
            'created_by',
          ],
        }),
      ]);

      // 8. Lock project if this is the final invoice
      if (reqBody.is_final) {
        invoiceDetail.is_final = true;
        project.status = 'archive'; // Assuming 'archive' as the final status
      }

      // 9. Save the invoice, project, and invoice detail
      await project.save({ transaction });
      await invoice.save({ transaction });
      await invoiceDetail.save({ transaction });

      await transaction.commit();

      return {
        invoice_id: invoice.id,
      };
    } catch (error) {
      await transaction.rollback();
      throw new BadRequestError(`Error generating service invoice from project`);
    }
  }

  async generateHourInvoice(
    projectId: number,
    user: User,
    reqBody: CreateInvoiceHoursDto, // Adjust this to match your actual DTO
  ): Promise<{
    invoice_id: number;
  }> {
    const transaction = await Project.sequelize.transaction();

    // Fetch the project with its details
    const project = await this.projectRepository.findOne({
      where: { id: projectId, company_id: user.company_id },
      include: [
        {
          model: this.projectDetailsRepository,
          as: 'details',
          include: [
            {
              model: this.projectAdditionalCostsRepository,
              as: 'additional_cost',
              attributes: ['label', 'value', 'is_active'],
            },
            {
              model: this.projectProductsRepository,
              as: 'quote_items',
            },
            {
              model: this.projectLabelsRepository,
              as: 'internal_desc',
              attributes: ['label', 'is_active'],
            },
          ],
        },
      ],
      transaction,
    });

    if (!project) {
      await transaction.rollback();
      throw new NotFoundError('Project not found');
    }

    // Ensure the total is valid
    if (reqBody.total <= 0) {
      await transaction.rollback();
      throw new BadRequestError('Invalid total amount');
    }

    // Set invoice type
    const invoiceType = 'hour',
      editedCustomID = project.number_id; // Assuming 'hour' as invoice type

    // Add company invoice settings
    const companySettings = await this.settingsService.selectSetting(user.company_id);

    try {
      // Generate invoice name based on locale
      const invoiceName =
        reqBody.locale === 'de'
          ? `Rechnung ${editedCustomID} ${project.name}`
          : `Invoice ${editedCustomID} ${project.name}`;
      const finalInvoiceName =
        reqBody.locale === 'de'
          ? 'Schlussrechnung ' + editedCustomID + ' ' + project.name
          : 'Final Invoice ' + editedCustomID + ' ' + project.name;

      // Create the invoice model
      const baseTime = new Date();
      const invoice = await Invoice.create(
        {
          company_id: user.company_id,
          name: reqBody.is_final ? finalInvoiceName : invoiceName,
          type: invoiceType,
          status: 'offset', // Assuming 'offset' is a valid status
          number_id: project.number_id,
          customer_id: project.customer_id,
          offer_id: project.offer_id,
          project_id: project.id,
          created_at: baseTime,
          charged_on: baseTime,
          created_by: user.id,
        },
        { transaction },
      );

      const invDetail: Partial<CreateInvoiceDto> = {
        ...project.details.get({ plain: true }),
        ...(companySettings.invoice ? companySettings.invoice : { begin_desc: '', end_desc: '' }),
        discount_percent: project.details?.discount_percent || 0, // avoid NaN
        is_final: reqBody.is_final,
      };

      const invoiceDetail = await InvoiceDetail.create(
        {
          ...invDetail,
          invoice_id: invoice.id,
          project_id: invoice.project_id,
          selected_km_label: project.details.selected_km_label,
          selected_km_value: project.details.selected_km_value,
          created_at: baseTime,
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
            'is_final',
            'start_date_inv',
            'end_date_inv',
            'created_at',
            'created_by',
          ],
          transaction,
          returning: true,
        },
      );

      // Create invoice items
      const quoteItems = reqBody.rows.map((row) => ({
        optional: false,
        type: 'individual', // Assuming 'individual' is the item type
        name: row.name,
        amount: row.spent_in_hour,
        description: `von ${reqBody.start_date} bis ${reqBody.end_date}`,
        price: row.price,
        cost: Math.round(row.price * row.spent_in_hour * 20) / 20,
        unit: 'unit.hours',
        vat_rate: 8.1, // Assuming VAT rate
        uuid: generateNewUUID(),
        apply_discount: false,
        is_nk: false,
        created_at: baseTime,
        created_by: user.id,
        invoice_id: invoice.id, // Associate with the invoice
      }));

      // Add additional cost if applicable
      if (reqBody.additional_percent > 0) {
        quoteItems.push({
          name: `Nebenkosten ${reqBody.additional_percent}%`,
          optional: false,
          amount: 1.0,
          description: `von ${reqBody.total}`,
          price: reqBody.additional_cost,
          cost: reqBody.additional_cost,
          type: 'individual',
          unit: 'unit.flatRate',
          vat_rate: 8.1,
          uuid: generateNewUUID(),
          apply_discount: true,
          is_nk: true,
          created_at: baseTime,
          created_by: user.id,
          invoice_id: invoice.id, // Associate with the invoice
        });
      }

      const { additional_cost, internal_desc } = invDetail;

      await Promise.all([
        // Bulk create invoice additional costs
        InvoiceAdditionalCost.bulkCreate(
          additional_cost.map((item) => ({
            ...item,
            invoice_id: invoice.id,
            created_at: baseTime,
            created_by: user.id,
          })),
          {
            fields: ['invoice_id', 'label', 'value', 'is_active', 'created_at', 'created_by'],
            transaction,
          },
        ),
        // Bulk create invoice labels (internal descriptions)
        InvoiceLabel.bulkCreate(
          internal_desc.map((item) => ({
            ...item,
            invoice_id: invoice.id,
            created_at: baseTime,
            created_by: user.id,
          })),
          {
            fields: ['invoice_id', 'label', 'is_active', 'created_at', 'created_by'],
            transaction,
          },
        ),
        InvoiceProduct.bulkCreate(quoteItems, {
          transaction,
          fields: [
            'invoice_id',
            'name',
            'cost',
            'description',
            'type',
            'unit',
            'uuid',
            'price',
            'invoice_rate',
            'amount',
            'remaining',
            'break_page',
            'optional',
            'vat_rate',
            'is_nk',
            'selected',
            'created_at',
            'created_by',
          ],
        }),
      ]);

      // Lock project if this is the final invoice
      if (reqBody.is_final) {
        invoiceDetail.is_final = true;
        project.status = 'archive';
      }

      // Create or update the invoice number
      const number = await NumberEntry.create(
        {
          company_id: user.company_id,
          type: invoiceType,
          ref_id: invoice.id,
          created_at: baseTime,
        },
        { transaction },
      );

      await NumberEntry.update(
        { custom_id: `${editedCustomID}-${number.id}` },
        { where: { id: number.id }, transaction },
      );

      await invoiceDetail.save({ transaction });
      await invoice.save({ transaction });
      await project.save({ transaction });

      // Commit transaction
      await transaction.commit();

      return {
        invoice_id: invoice.id,
      };
    } catch (error) {
      await transaction.rollback();
      throw new BadRequestError(`Error generating hour invoice from project`);
    }
  }

  // FOR REPORT
  async getAdditionalProjectIdsFromConnected(
    currentCompanyId: number,
    targetCompanyId: number,
    startDate: Date,
    endDate: Date,
  ): Promise<number[]> {
    const connectedProjects = await this.getConnectedProjectsFromTarget(currentCompanyId, targetCompanyId);
    const moreIds: number[] = [];

    try {
      for (const project of connectedProjects) {
        const projectLogs = await this.getProjectWithLogsFromId(project.connected_id, startDate, endDate);
        if (projectLogs.length > 0) {
          moreIds.push(project.project_id);
        }
      }

      return moreIds;
    } catch (error) {
      throw new BadRequestError(`Error fetching additional project IDs` + error);
    }
  }
  // Raw query to fetch connected projects
  async getConnectedProjectsFromTarget(companyId: number, targetId: number): Promise<ConnectedProject[]> {
    // Refactor from GET_CONNECTED_PROJECT_FROM_TARGET raw SQL, need to test again carefully
    const projectPulls = (await ProjectPull.findAll({
      where: { company_id: companyId },
      attributes: ['project_id', 'metadata'],
    })) as unknown as ProjectPull[];

    const pulls = projectPulls.flatMap((pull) => {
      const projectIds = pull.metadata?.project_ids || '[]';
      return projectIds.map((connectedId: number) => ({
        project_id: pull.project_id,
        connected_id: connectedId,
      }));
    });

    const validProjects = await Project.findAll({
      where: {
        company_id: targetId,
        id: { [Op.in]: pulls.map((pull) => pull.connected_id) },
      },
      attributes: ['id'],
      order: [['name', 'ASC']],
    });

    const validProjectIds = validProjects.map((project) => project.id);

    const results = pulls.filter((pull) => validProjectIds.includes(pull.connected_id));

    if (!results.length) {
      // throw new NotFoundError('Connected projects not found');
      return [];
    }
    return results;
  }

  async getProjectWithLogsFromId(id: number, startDate: Date, endDate: Date): Promise<ProjectWithLogsDto[]> {
    try {
      const projects = await this.projectRepository.findAll({
        attributes: [
          'id',
          'name',
          [Sequelize.col('details.location'), 'location'],
          [
            Sequelize.fn(
              'COALESCE',
              Sequelize.col('number.custom_id'),
              Sequelize.cast(Sequelize.col('number.id'), 'TEXT'),
            ),
            'number',
          ],
        ],
        include: [
          {
            model: NumberEntry,
            as: 'number',
            attributes: [],
            required: true,
          },
          {
            model: this.projectDetailsRepository,
            as: 'details',
            attributes: [],
            required: false,
          },
          {
            model: WorkItem,
            as: 'work_items',
            required: true,
            attributes: [],
            include: [
              {
                model: WorkLog,
                as: 'work_logs',
                required: true,
                attributes: [],
                where: {
                  deleted_at: null,
                  spent_in_hour: {
                    [Op.ne]: 0,
                  },
                  date: {
                    [Op.between]: [startDate, endDate],
                  },
                },
              },
            ],
          },
        ],
        where: {
          id: id,
          deleted_at: null,
        },
        group: ['Project.id', 'number.id', 'details.project_id'],
        order: [
          ['number', 'ASC'],
          ['name', 'ASC'],
          ['location', 'ASC'],
        ],
        raw: true,
      });

      return projects as unknown as ProjectWithLogsDto[];
    } catch (error) {
      throw new BadRequestError(`Error fetching project with logs from ID` + error);
    }
  }

  async getProjectWithLogs(companyId: number, startDate: Date, endDate: Date): Promise<ProjectWithLogsDetailsDto[]> {
    const projects = (await this.projectRepository.findAll({
      attributes: [
        'id',
        'name',
        'status',
        [Sequelize.fn('COALESCE', Sequelize.col('details.location'), ''), 'location'],
        [
          Sequelize.fn(
            'COALESCE',
            Sequelize.col('number.custom_id'),
            Sequelize.cast(Sequelize.col('number.id'), 'TEXT'),
          ),
          'number',
        ],
      ],
      include: [
        {
          model: NumberEntry,
          as: 'number',
          attributes: [],
          required: true,
        },
        {
          model: this.projectDetailsRepository,
          as: 'details',
          attributes: ['location'],
          required: false,
        },
        {
          model: WorkItem,
          as: 'work_items',
          required: false,
          attributes: [],
          include: [
            {
              model: WorkLog,
              as: 'work_logs',
              required: false,
              attributes: [],
              where: {
                deleted_at: null,
              },
            },
          ],
        },
      ],
      where: {
        company_id: companyId,
        deleted_at: null,
        '$work_items.work_logs.date$': {
          [Op.between]: [startDate, endDate],
        },
      },
      group: ['Project.id', 'number.id', 'details.project_id'],
      order: [
        ['number', 'ASC'],
        ['name', 'ASC'],
        ['status', 'ASC'],
      ],
      raw: true,
    })) as unknown as ProjectWithLogsDetailsDto[];

    return projects;
  }

  async getProjectWithLogsFromIds(ids: number[], startDate: Date, endDate: Date): Promise<ProjectWithLogsDetailsDto[]> {
    const projects = (await this.projectRepository.findAll({
      attributes: [
        'id',
        'name',
        'status',
        [Sequelize.fn('COALESCE', Sequelize.col('details.location'), ''), 'location'],
        [
          Sequelize.fn(
            'COALESCE',
            Sequelize.col('number.custom_id'),
            Sequelize.cast(Sequelize.col('number.id'), 'TEXT'),
          ),
          'number',
        ],
      ],
      include: [
        {
          model: NumberEntry,
          as: 'number',
          attributes: ['id', 'custom_id'],
          required: true,
        },
        {
          model: this.projectDetailsRepository,
          as: 'details',
          attributes: [],
          required: false,
        },
        {
          model: WorkItem,
          as: 'work_items',
          required: true,
          attributes: [],
          include: [
            {
              model: WorkLog,
              as: 'work_logs',
              required: true,
              attributes: [],
              where: {
                deleted_at: null,
              },
            },
          ],
        },
      ],
      where: {
        id: {
          [Op.in]: ids, // Equivalent to `id IN (:ids)`
        },
        deleted_at: null, // Equivalent to `p.deleted_at IS NULL`
        '$work_items.work_logs.date$': {
          [Op.between]: [startDate, endDate],
        },
        '$work_items.work_logs.spent_in_hour$': {
          [Op.ne]: 0,
        },
      },
      group: ['Project.id', 'number.id', 'details.project_id'],
      order: [
        ['number', 'ASC'],
        ['name', 'ASC'],
        ['status', 'ASC'], // Equivalent to `ORDER BY p.status`
      ],
      raw: true,
    })) as unknown as ProjectWithLogsDetailsDto[];

    return projects;
  }

  async getProjectReportWithRate(
    companyID: number,
    projectID: number,
    startDate?: Date,
    endDate?: Date,
  ): Promise<ProjectWithRateReportInterface[]> {
    // Get company settings
    const settings = await Setting.findOne({
      where: { company_id: companyID },
    });
    const jobs = settings?.timesheet.jobs || [];

    // Get project
    const project = await this.projectRepository.findOne({
      where: {
        id: projectID,
        company_id: companyID,
        deleted_at: null,
      },
      attributes: ['id'],
    });

    // Get product ids from project_products table
    const quotes = await this.projectProductsRepository.findAll({
      where: {
        project_id: project.id,
        type: {
          [Op.ne]: 'title',
        },
      },
      attributes: ['product_id'],
    });

    const productIDs =
      quotes.filter((item) => item.product_id && item.product_id > 0).map((item) => item.product_id) || [];

    // Generate work logs where options
    const workLogsWhereOptions: WhereOptions<WorkLog> = {
      deleted_at: null,
      spent_in_hour: { [Op.gt]: 0 },
    };
    if (startDate && endDate) {
      workLogsWhereOptions.date = {
        [Op.between]: [startDate, endDate],
      };
    }

    const workLogs = await WorkLog.findAll({
      where: workLogsWhereOptions,
      attributes: ['id', 'date', 'spent', 'comment'],
      include: [
        {
          model: WorkItem,
          as: 'workItem',
          required: true,
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['name'],
              where: {
                id: { [Op.in]: productIDs },
              },
            },
            {
              model: this.projectRepository,
              as: 'project',
              attributes: ['name'],
              where: {
                id: projectID,
              },
              include: [
                {
                  model: NumberEntry,
                  as: 'number',
                },
              ],
            },
            {
              model: Task,
              as: 'tasks',
              attributes: ['name'],
              required: true,
            },
          ],
        },
        {
          model: User,
          as: 'user',
          where: { deleted_at: null },
        },
      ],
      order: [['date', 'ASC']],
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const projectReports = workLogs.map((workLog: any) => {
      const userJob = workLog.user.job;
      const jobRate = jobs.find((job: { label: string }) => job.label === userJob)?.rate || null;
      const lastName = workLog.user.last_name || '';
      const firstName = workLog.user.first_name || '';

      return {
        id: workLog.id,
        number: workLog.workItem.project.number.custom_id || workLog.workItem.project.number.id.toString(),
        name: workLog.workItem.project.name,
        task: workLog.workItem.tasks.name,
        staff_id: workLog.user.id,
        staff_name: `${firstName} ${lastName}`,
        product_name: workLog.workItem.product.name,
        job: workLog.user.job,
        rate: jobRate,
        date: workLog.date,
        spent: workLog.spent,
        comment: workLog.comment,
      };
    }) as unknown as ProjectWithRateReportInterface[];

    return projectReports;
  }

  async exportFileProject(companyId: number, projectId: number, type: string): Promise<Buffer> {
    if (['pdf', 'docx'].indexOf(type) === -1) {
      throw new BadRequestError('Invalid file type');
    }
    const prj = await this.selectProject(companyId, projectId);
    const com = await this.companyService.selectCompany(companyId);

    // Get project template
    const projectTemplate = await this.companyTemplateRepository.findOne({
      where: {
        company_id: companyId,
        type: FileTypeEnum.Project,
      },
    });

    if (!projectTemplate) {
      throw new BadRequestError('No project template found, please contact development team');
    }

    const typeLog = type === 'pdf' ? CodeEnum.PDFTypeProject : CodeEnum.DOCXTypeProject;

    const exportDto: ExportCreateDto = {
      created_at: new Date(),
      company_id: companyId,
      type: typeLog,
      document_id: projectId,
      template_id: projectTemplate.id,
    };

    const [exported] = await this.exportService.selectOrCreateExport(exportDto);
    if (!exported) {
      throw new BadRequestError('Export failed');
    }

    const code = generateNewUUID();
    const bufferFile = await this.generateProjectFile(projectId, com, exported.type, projectTemplate.path, type);

    const metadata =
      type === 'pdf'
        ? { project_pdf_code: code, project_status: prj.status }
        : { project_docx_code: code, project_status: prj.status };
    await this.logRepository.create({
      company_id: companyId,
      ref_id: projectId,
      type: typeLog,
      action: type === 'pdf' ? ActionEnum.ExportPDF : ActionEnum.ExportDOCX,
      created_at: new Date(),
      metadata,
    });

    return bufferFile;
  }

  private async generateProjectFile(
    projectId: number,
    company: Company,
    typeExport: string,
    templatePath: string,
    fileType: string,
  ): Promise<Buffer> {
    const isInvoice = false;
    const doc = (await getDocument(projectId, company.id, typeExport)) as Project;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const details: any = {
      ...doc.details,
      date: doc.details.date.toISOString().split('T')[0],
    };
    const customer = await this.customerService.selectCustomer(doc.company_id, doc.customer_id);
    const invoices = (await this.detailProject(doc.company_id, doc.id)).invoices;
    const options = await getOption(doc.company_id, doc.id, typeExport);

    const contentKeys = [
      'customer',
      'address_other',
      'other_address',
      'customer_address',
      'postcode',
      'place',
      'date',
      'name',
      'location',
      'address',
      'begin_desc',
      'services',
      'service_sum',
      'invoices',
      'end_desc',
    ];

    const breakPageKeys = ['pr_begin_break', 'pr_quote_break'];
    let projectData: Record<string, string> = addFieldValuesIfNotExisted(contentKeys, breakPageKeys, details);

    const name = `Auftragsbestätigung ${doc.number.custom_id ?? doc.number.id} ${doc.name}`;
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

    projectData = {
      ...projectData,
      customer: cusTitle,
      address: details?.address || '',
      address_other: customer.metadata?.other_address || '',
      customer_address: customer.metadata?.address || '',
      postcode: customer.metadata?.postcode || '',
      place: customer.metadata?.place || '',
      name: name,
      services: getTable(details, company),
      service_sum: getTableSum(details),
      invoices: getInvoiceTable(details, invoices, company, options?.values, isInvoice),
    };

    //  generate the PDF or DOCX
    const bufferFile = await this.exportFileService.exportFileFromTemplate(projectData, templatePath, '.' + fileType);

    if (!bufferFile) {
      throw new BadRequestError('Export failed');
    }

    return bufferFile;
  }

  async listProjectForOverview(currentCompanyId: number, paramCompanyId: number): Promise<Project[]> {
    const company = await this.companyService.selectCompany(currentCompanyId);
    if (!company) {
      throw new NotFoundError('Company not found');
    }
    const isBase = Number(company.id) === Number(paramCompanyId);

    if (!isBase) {
      // Refactor from GET_PROJECTS_FOR_OVERVIEW raw SQL, need to test again carefully
      const projectPulls = await ProjectPull.findAll({
        where: { company_id: company.id },
        attributes: ['project_id', 'metadata'],
      });

      const parsedPulls = projectPulls.flatMap((pull) => {
        const projectIds = pull.metadata?.project_ids; // Parse project_ids từ metadata JSON
        return projectIds.map((connectedId: string) => ({
          project_id: pull.project_id,
          connected_id: parseInt(connectedId, 10),
        }));
      });

      const projectsWithNumbers = await Project.findAll({
        where: {
          company_id: paramCompanyId,
          id: { [Op.in]: parsedPulls.map((pull) => pull.connected_id) },
        },
        include: [
          {
            model: NumberEntry,
            as: 'number',
            attributes: ['id', 'custom_id'],
          },
        ],
        attributes: ['id', 'name', 'number_id'],
      });

      const projects = projectsWithNumbers.map((project: Project) => {
        const number = project.number;
        const customIdOrId = number?.custom_id || number?.id?.toString() || '';
        const name = `${customIdOrId} ${project.name}`;
        return { id: project.id, name };
      }) as unknown as Project[];

      return projects;
    }

    const projects = await Project.findAll({
      attributes: [
        'id',
        [literal(`CONCAT(COALESCE("number"."custom_id", "number"."id"::text), ' ', "Project"."name")`), 'name'],
        'status',
        'updated_at',
      ],
      include: [
        {
          model: NumberEntry,
          as: 'number',
          attributes: [],
        },
      ],
      where: {
        company_id: company.id,
        deleted_at: { [Op.is]: null },
      },
      order: [['name', 'DESC']],
    });

    return projects;
  }

  async getProjectConnections(projectId: number, companyId: number): Promise<Project[]> {
    const pull = await this.projectPullRepository.findOne({
      where: {
        project_id: projectId,
        company_id: companyId,
      },
    });
    if (!pull) {
      return [];
    }

    const projects: Project[] = [];
    for (const projectId of pull.metadata['project_ids']) {
      const projectIdInNumber = typeof projectId === 'string' ? parseInt(projectId) : projectId;

      if (projectIdInNumber <= 0) {
        continue;
      }

      const project = await this.selectProjectByID(projectIdInNumber);
      if (project) {
        projects.push(project);
      }
    }

    return projects;
  }

  async getProjectShares(currentUser: User, projectId: number): Promise<Company[]> {
    const pull = await this.projectPullRepository.findOne({
      where: {
        project_id: projectId,
        company_id: currentUser.company_id,
      },
    });
    if (!pull) {
      return [];
    }

    const companyIds: number[] = [];

    for (const projectId of pull.metadata['project_ids']) {
      const projectIdInNumber = typeof projectId === 'string' ? parseInt(projectId) : projectId;

      if (projectIdInNumber <= 0) {
        continue;
      }

      const project = await this.selectProjectByID(projectIdInNumber);
      companyIds.push(project.company_id);
    }

    const shares = await this.companyService.selectCompaniesByIds(companyIds);
    if (shares.length === 0) {
      throw new InternalServerError('No company shares found');
    }

    return shares;
  }

  async pullProjects(currentUser: User, projectId: number, pullProjectIds: number[]): Promise<void> {
    // Handle pull project ids input
    if (pullProjectIds.length === 0) {
      await this.projectPullRepository.destroy({
        where: {
          company_id: currentUser.company_id,
          project_id: projectId,
        },
      });

      return;
    }

    // Get existing projects for pulling
    const existingProjects = await this.projectRepository.findAll({
      where: {
        id: {
          [Op.in]: pullProjectIds,
        },
      },
    });
    const existingProjectIds = existingProjects.map((project) => project.id);

    // Pull projects
    const pull = await this.projectPullRepository.findOne({
      where: {
        company_id: currentUser.company_id,
        project_id: projectId,
      },
    });

    if (!pull) {
      const newProjectPull = await this.projectPullRepository.create({
        company_id: currentUser.company_id,
        project_id: projectId,
        metadata: {
          project_ids: existingProjectIds,
        },
      });

      if (!newProjectPull) {
        throw new InternalServerError('Failed to create project pull');
      }
    } else {
      await this.projectPullRepository.update(
        {
          metadata: {
            project_ids: existingProjectIds,
          },
        },
        {
          where: {
            id: pull.id,
          },
        },
      );
    }
  }

  async getProjectsGrid(
    companyId: number,
    filter: ProjectGridRequestDto,
  ): Promise<{
    items: ProjectGridItemDto[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const selCompanyId: number = filter.company_id && filter.company_id > 0 ? filter.company_id : companyId;
    const isFromOtherCompany: boolean = filter.company_id > 0 && filter.company_id !== companyId;
    const status: string = filter.status || '';

    // Build conditions
    const whereOptions: WhereOptions<Project> = {
      company_id: selCompanyId,
    };

    const orderOptions: Order = [
      ['status', 'ASC'],
      ['id', 'DESC'],
    ] as [string, string][];

    // Add search condition if search term is provided
    if (filter.search) {
      const searchTerm = `%${filter.search}%`;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (whereOptions as any)[Op.or] = [
        {
          name: { [Op.iLike]: searchTerm },
        },
        {
          '$customer.name$': { [Op.iLike]: searchTerm },
        },
        {
          '$customer.first_name$': { [Op.iLike]: searchTerm },
        },
        {
          '$customer.last_name$': { [Op.iLike]: searchTerm },
        },
        {
          '$number.custom_id$': { [Op.iLike]: searchTerm },
        },
      ];
    }

    // Add conditions based on the status on `filter`
    switch (status) {
      case 'deleted':
        whereOptions.deleted_at = {
          [Op.ne]: null,
        };
        break;
      case 'internal':
        whereOptions['$Project.is_internal$'] = {
          [Op.is]: true,
        };
        whereOptions.deleted_at = {
          [Op.is]: null,
        };
        break;
      case '': // This is for get all projects
        whereOptions.deleted_at = {
          [Op.is]: null,
        };
        break;
      default:
        whereOptions.status = status || 'active';
        whereOptions.deleted_at = {
          [Op.is]: null,
        };
        break;
    }

    // If user is viewing projects from another company, add additional conditions
    if (isFromOtherCompany) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (whereOptions as any)[Op.and] = [
        { '$details.only_my_company$': { [Op.not]: true } },
        { is_internal: { [Op.not]: true } },
      ];
    }

    try {
      // Handle pagination
      const page = filter.page || null;
      const pageSize = filter.page_size || null;
      const usePagination = filter.page !== undefined && filter.page_size !== undefined;
      const offset = usePagination ? (page - 1) * pageSize : undefined;
      const limit = usePagination ? pageSize : undefined;

      // Get total count
      const totalCount = await this.projectRepository.count({
        where: whereOptions,
        distinct: true,
        include: [
          {
            model: this.projectDetailsRepository,
            as: 'details',
            attributes: [],
          },
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

      // Get projects with basic info
      const projects = await this.projectRepository
        .findAll({
          attributes: ['id', 'name', 'status'],
          include: [
            {
              model: NumberEntry,
              as: 'number',
              attributes: [],
            },
            {
              model: this.projectDetailsRepository,
              as: 'details',
              attributes: [],
            },
            {
              model: Customer,
              as: 'customer',
              attributes: [],
            },
          ],
          where: whereOptions,
          order: orderOptions,
          ...(usePagination && { limit, offset }),
          subQuery: false,
        })
        .then((result) => result.map((p) => p.get({ plain: true }) as ProjectGridItemDto));

      // If status = deleted, mark all projects as deleted
      if (status === 'deleted') {
        projects.forEach((item: ProjectGridItemDto) => {
          item.status = 'deleted';
        });
      }

      // Get project IDs to fetch comments
      const projectIds = projects.map((item) => item.id);

      // Get latest comment for each project
      const latestComments = await this.projectCommentsRepository.findAll({
        attributes: ['id', 'project_id', 'comment', 'created_at'],
        where: {
          project_id: {
            [Op.in]: projectIds,
          },
        },
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'email', 'first_name', 'last_name', 'avatar_url'],
          },
        ],
        order: [
          ['project_id', 'ASC'],
          ['created_at', 'DESC'],
        ],
      });

      // Get only the latest comment per project
      const latestCommentsMap = new Map();
      latestComments.forEach((comment) => {
        if (!latestCommentsMap.has(Number(comment.project_id))) {
          latestCommentsMap.set(Number(comment.project_id), comment);
        }
      });

      // Add comment information to projects
      for (const item of projects) {
        const latestComment = latestCommentsMap.get(item.id);
        if (latestComment) {
          item.comment = latestComment.comment;
          item.created_at = latestComment.created_at;
          item.creator = latestComment.creator;
        }
      }

      // Format dates
      for (const item of projects) {
        DateFormatter.formatDTO(item);
      }

      return {
        items: projects,
        total: totalCount,
        page,
        pageSize,
      };
    } catch (error) {
      throw new BadRequestError(`Error fetching projects grid`);
    }
  }

  async getProjectComments(companyId: number, projectId: number): Promise<ProjectCommentResponseDto[]> {
    // Check if project exists and belongs to the company
    const project = await this.projectRepository.findOne({
      where: {
        id: projectId,
        company_id: companyId,
      },
    });

    if (!project) {
      throw new NotFoundError('Project not found');
    }

    // Get comments with creator information - order by creation date only
    const comments = await this.projectCommentsRepository.findAll({
      attributes: ['id', 'project_id', 'comment', 'created_at'],
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'first_name', 'last_name', 'email', 'avatar_url'],
        },
      ],
      where: {
        project_id: projectId,
      },
      order: [['created_at', 'DESC']],
    });

    return comments.map((comment) => {
      const plainComment = comment.get({ plain: true });
      return plainComment;
    }) as ProjectCommentResponseDto[];
  }

  async getProjectComment(companyId: number, projectId: number, commentId: number): Promise<ProjectCommentResponseDto> {
    // Check if project exists and belongs to the company
    const project = await this.projectRepository.findOne({
      where: {
        id: projectId,
        company_id: companyId,
      },
    });

    if (!project) {
      throw new NotFoundError('Project not found');
    }

    // Get the specific comment with creator information
    const comment = await this.projectCommentsRepository.findOne({
      attributes: ['id', 'project_id', 'comment', 'created_at'],
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'first_name', 'last_name', 'email', 'avatar_url'],
        },
      ],
      where: {
        id: commentId,
        project_id: projectId,
      },
    });

    if (!comment) {
      throw new NotFoundError('Comment not found');
    }

    return comment.get({ plain: true }) as ProjectCommentResponseDto;
  }

  async createProjectComment(
    createCommentDto: CreateProjectCommentDto,
    currentUser: User,
  ): Promise<ProjectCommentResponseDto> {
    // Check if project exists and belongs to the user's company
    const project = await this.projectRepository.findOne({
      where: {
        id: createCommentDto.project_id,
        company_id: currentUser.company_id,
      },
    });

    if (!project) {
      throw new NotFoundError('Project not found');
    }

    // Create the comment
    const comment = await this.projectCommentsRepository.create({
      project_id: createCommentDto.project_id,
      comment: createCommentDto.comment,
      created_by: currentUser.id,
      created_at: new Date(),
    });

    // Fetch the created comment with user information
    const createdComment = await this.projectCommentsRepository.findOne({
      attributes: ['id', 'project_id', 'comment', 'created_at'],
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'first_name', 'last_name', 'email', 'avatar_url'],
        },
      ],
      where: {
        id: comment.id,
      },
    });

    return createdComment.get({ plain: true }) as ProjectCommentResponseDto;
  }

  async deleteProjectComment(commentId: number, currentUser: User): Promise<void> {
    // Find the comment
    const comment = await this.projectCommentsRepository.findOne({
      where: {
        id: commentId,
      },
      include: [
        {
          model: Project,
          as: 'project',
          attributes: ['company_id'],
        },
      ],
    });

    if (!comment) {
      throw new NotFoundError('Comment not found');
    }

    // Check if the project belongs to the user's company
    if (comment.project.company_id !== currentUser.company_id) {
      throw new BadRequestError('You do not have permission to delete this comment');
    }

    // Delete the comment
    await this.projectCommentsRepository.destroy({
      where: {
        id: commentId,
      },
    });
  }
}
