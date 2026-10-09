import { Op, QueryTypes, Sequelize } from 'sequelize';
import Company from 'src/database/models/companies.model';
import Invoice from 'src/database/models/invoices.model';
import Project from 'src/database/models/projects.model';
import User from 'src/database/models/users.model';
import WorkLog from 'src/database/models/work-logs.model';
import { InvoiceService } from 'src/modules/invoices/services/invoice.service';
import { OfferService } from 'src/modules/offers/services/offer.service';
import { ProjectService } from 'src/modules/projects/services/project.service';
import { HolidayDto } from 'src/modules/setting/dto/holiday.dto';
import { SettingService } from 'src/modules/setting/services/setting.service';
import { CacheService } from 'src/shared/services';
import { BadRequestError, InternalServerError, UnauthorizedError } from 'src/shared/utils';

import { Injectable, Logger } from '@nestjs/common';

import {
  CompanyStatsDto,
  EmployeeStatsResponseDto,
  ProjectStatsDetailResponseDto,
  ProjectStatsDto,
  RevenueResponseDto,
  SummaryResponseDto,
  TotalHoursLoggedByUserDto,
} from '../dto';
import { CompanyService } from 'src/modules/company/services/company.service';
import ProjectPull from 'src/database/models/project-pulls.model';
import WorkItem from 'src/database/models/work-items.model';
import NumberEntry from 'src/database/models/numbers.model';
import Setting from 'src/database/models/setting.model';
import ProjectProducts from 'src/database/models/project-products.model';
import ProjectDetails from 'src/database/models/project-details.model';
import Product from 'src/database/models/products.model';
import { InvoiceDetail, InvoiceProduct } from 'src/database/models';

interface RowsRevenue {
  period: Date;
  sum: number;
}
interface HoursResult {
  user_id: number;
  hours: string | number;
}
interface WorkLogResult {
  hours_noted: string | number;
  user: {
    id: number;
    first_name: string | null;
    last_name: string | null;
  };
}
interface ProjectHoursResult {
  project_id: number;
  hours: string | number;
}
interface ProjectStatsItem {
  id: number;
  name: string;
  project_nbr: string;
  project_time: number;
  productive_hours: number;
  unproductive_hours: number;
  revenue: number;
  invoiced: number;
  total_hours: number;
  total_cost_to_hours: number;
  uninvoiced: number;
  total_amount?: number;
  company?: string;
}
interface RevenueResult {
  id: number;
  job: string;
  hours: string | number;
}
interface HoursResultConnected {
  id: number;
  hours: string | number;
}
interface ProjectWithLocation {
  id: number;
  name: string;
  location?: string;
  project_nbr: string;
}
interface ProjectHours {
  project_id: number;
  hours: string | number;
}
interface ProjectRate {
  id: number;
  rate_per_hour: number | string;
}
interface RevenueData {
  project_id: number;
  job: string;
  hours: string | number;
}
interface WorkLogsResult {
  product_id: number;
  product_name: string;
  hours_noted: string | number;
}
interface ProjectWithFullName {
  id: number;
  name: string;
  full_name: string;
  project_nbr: string;
}
interface ProjectProductWithTotal {
  project_id: number;
  total_amount: string | number;
}
interface ProjectWithLocationResult {
  id: number;
  name: string;
  location: string;
  project_nbr: string;
}
interface ProjectProductWithTotalAmount {
  project_id: number;
  total_amount: string | number;
}
interface ProjectRateResult {
  id: number;
  rate_per_hour: string | number;
}
interface LeistungCostResult {
  project_id: number;
  total_cost: string | number;
}
interface RevenueDataResult {
  project_id: number;
  job: string;
  hours: string | number;
}
@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    private readonly cacheService: CacheService,
    private readonly invoiceService: InvoiceService,
    private readonly offerService: OfferService,
    private readonly projectService: ProjectService,
    private readonly settingsService: SettingService,
    private readonly companyService: CompanyService,
  ) {}

  async getSummary(companyId: number, status: string = 'all'): Promise<SummaryResponseDto> {
    const offers = await this.offerService.getOfferSummary(companyId);
    let totalOfferAmount = 0.0;
    let totalOfferAmountGross = 0.0;
    for (const offer of offers) {
      totalOfferAmountGross += offer.amount;
      totalOfferAmount += offer.detail_cost.total_net + offer.detail_cost.total_net_nk;
    }
    const projects = await this.projectService.getProjectsSummary(companyId, status);
    let totalProjectAmount = 0.0;
    let totalProjectRemaining = 0.0;
    for (const project of projects) {
      totalProjectAmount += project.total_amount;
      totalProjectRemaining += project.remaining;
    }
    const invoices = await this.invoiceService.getInvoicesSummary(companyId);
    let totalOpenAmount = 0.0;
    let totalOpenGrossAmount = 0.0;
    for (const invoice of invoices) {
      if (invoice.status === 'open') {
        totalOpenAmount += invoice.detail_cost.total_net + invoice.detail_cost.total_net_nk;
        totalOpenGrossAmount += invoice.amount;
      }
    }

    return {
      invoices: invoices,
      offers: offers,
      projects: projects,
      total_offer_gross_amount: totalOfferAmountGross,
      total_offer_net_amount: totalOfferAmount,
      total_open_gross_amount: totalOpenGrossAmount,
      total_open_net_amount: totalOpenAmount,
      total_project_amount: totalProjectAmount,
      total_remaining_amount: totalProjectRemaining,
    };
  }

  async getRevenue(companyId: number): Promise<RevenueResponseDto[] | null> {
    const GET_REVENUE_SQL = await this.cacheService.getConfigValue('GET_REVENUE_SQL');
    const query = GET_REVENUE_SQL;
    const rows = await Invoice.sequelize.query<RowsRevenue>(query, {
      type: QueryTypes.SELECT,
      replacements: { companyId: companyId },
    });

    if (rows.length <= 0) {
      return null;
    }

    // Initialize an object to store the revenues by year
    // example:
    // {
    //    '2021': [1, 0, 3, 45, 45],
    //    '2022': [0, 0, 0, 123, 5]
    // }
    const revs: { [year: number]: number[] } = {};

    rows.forEach((row: RowsRevenue) => {
      const year = row.period.getFullYear();
      const month = row.period.getMonth();

      // Check if the current year is existing in object or not ==> if not then initialize it
      if (!revs[year]) {
        revs[year] = Array(12).fill(0); // Initialize an array with 12 months (all set to 0)
      }

      // Assign the revenue to the appropriate month
      revs[year][month] = Math.round(row.sum * 100) / 100; // Rounds to 2 decimal place;
    });

    // Format response
    const res: RevenueResponseDto[] = Object.keys(revs).map((year) => ({
      name: year,
      data: revs[parseInt(year)],
    }));

    res.sort((a, b) => a.name.localeCompare(b.name));

    return res;
  }

  async projectsStats(
    selCompanyId: number,
    startDate: Date,
    endDate: Date,
    status: string,
    projectId: number,
    user: User,
  ): Promise<ProjectStatsDto[]> {
    const company = await Company.findByPk(user.company_id || 0);

    const companyId = selCompanyId;
    selCompanyId = user.company_id;

    if (companyId > 0 && companyId !== selCompanyId) {
      selCompanyId = companyId;
    }

    let rows: ProjectStatsDto[] = [];
    if (selCompanyId !== user.company_id) {
      rows = await this.getProjectsStatsForConnected(user.company_id, selCompanyId, startDate, endDate);
    } else {
      if (status !== 'all') {
        if (status === 'deleted') {
          rows = await this.getProjectsStatsWithDeleted(selCompanyId, startDate, endDate);
        } else {
          if (status === 'internal') {
            rows = await this.getProjectsStatsInternal(selCompanyId, startDate, endDate);
          } else {
            rows = await this.getProjectsStatsByStatus(selCompanyId, startDate, endDate, status);
          }
        }
      } else {
        rows = await this.getProjectsStats(selCompanyId, startDate, endDate);
      }
    }
    // Adding Go logic adaptation before returning rows
    for (let i = 0; i < rows.length; i++) {
      const project = rows[i];

      // Example logic from Go code: Update company name and retrieve detailed project stats
      project.company = company.name; // Assuming company name is part of the user object

      try {
        const projectStats = await this.getProjectStatsDetail(selCompanyId, project.id, startDate, endDate);
        for (let j = 0; j < projectStats.length; j++) {
          project.total_hours += projectStats[j].hours_project;
        }

        // Temporary remove logic for TotalCostToHours check
        if (project.total_cost_to_hours > 0) {
          project.total_hours += project.total_cost_to_hours;
        }

        // Check if this company is authorized
        const projects = await Project.findAll({ where: { company_id: company.id, id: project.id } });
        if (!projects) throw new UnauthorizedError('Unauthorized to view project stats');

        if (projects) {
          for (const v of projects) {
            if (v.id > 0) {
              const pTmp = await Project.findByPk(v.id);
              const tmp = await this.getProjectStatsDetail(pTmp.company_id, v.id, startDate, endDate);
              for (let k = 0; k < tmp.length; k++) {
                project.project_time += tmp[k].hours_noted;
                project.total_hours += tmp[k].hours_project;
              }
            }
          }
        }
      } catch (err) {
        this.logger.error('Error fetching project stats or pull data:', err);
        throw new BadRequestError('Unable to fetch project stats details');
      }
    }
    // Hide money for PM role as in Go logic
    if (user.role === 'PM') {
      // Assuming 'PM' role is defined in the user object
      for (const v of rows) {
        v.revenue = 0.0;
        v.invoiced = 0.0;
        v.uninvoiced = 0.0;
      }
    }

    // Filter by project ID if provided
    if (projectId > 0) {
      rows = rows.filter((v) => v.id === projectId);
      return rows.length > 0 ? [rows[0]] : [];
    }

    return rows;
  }

  async projectDetailStats(
    companyId: number,
    selCompanyId: number,
    projectId: number,
    startDate: Date,
    endDate: Date,
    selCompany: number,
  ): Promise<CompanyStatsDto[]> {
    // Get company info
    const company = await this.companyService.selectCompany(companyId);

    // Get project stats detail
    const projectStatsDetail = await this.getProjectStatsDetail(selCompanyId, projectId, startDate, endDate);
    if (!projectStatsDetail) {
      throw new InternalServerError('Error when get project stats detail');
    }

    const projects: CompanyStatsDto[] = [
      {
        company_name: company.name,
        stats: projectStatsDetail,
      },
    ];
    if (selCompany === 0) {
      const pull = await ProjectPull.findOne({
        where: {
          project_id: projectId,
          company_id: company.id,
        },
      });

      if (pull) {
        for (const item of pull.metadata['project_ids']) {
          const prjId = Number(item);
          if (prjId <= 0) {
            continue;
          }

          const pTmp = await this.projectService.selectProjectByID(prjId);
          if (!pTmp) {
            throw new InternalServerError('Project not found');
          }
          const cTmp = await this.companyService.selectCompany(pTmp.company_id);
          const tmp = await this.getProjectStatsDetail(pTmp.company_id, prjId, startDate, endDate);
          if (!tmp) {
            throw new InternalServerError('Error when get tmp project stats detail');
          }
          projects.push({
            company_name: cTmp.name,
            stats: tmp,
          });
        }
      }
    }

    return projects;
  }

  async getProjectStatsDetail(
    selCompanyId: number,
    projectId: number,
    submitStartDate: Date,
    submitEndDate: Date,
  ): Promise<ProjectStatsDetailResponseDto[]> {
    try {
      // 1. Get work logs data first (equivalent to pos in SQL)
      const workLogsData = (await WorkLog.findAll({
        attributes: [
          [Sequelize.col('workItem.product.id'), 'product_id'],
          [Sequelize.col('workItem.product.name'), 'product_name'],
          [Sequelize.fn('SUM', Sequelize.col('spent_in_hour')), 'hours_noted'],
        ],
        include: [
          {
            model: WorkItem,
            as: 'workItem',
            required: true,
            attributes: [],
            where: {
              project_id: projectId,
              deleted_at: null,
            },
            include: [
              {
                model: Product,
                as: 'product',
                attributes: [],
                required: true,
              },
            ],
          },
        ],
        where: {
          date: { [Op.between]: [submitStartDate, submitEndDate] },
          deleted_at: null,
        },
        group: ['workItem.product.id', 'workItem.product.name'],
        raw: true,
      })) as unknown as WorkLogsResult[];

      // 2. Get project products data (equivalent to pqs in SQL)
      const projectProducts = await ProjectProducts.findAll({
        attributes: ['product_id', 'name', 'cost', 'amount'],
        where: {
          project_id: projectId,
          type: { [Op.ne]: 'title' },
          optional: false,
        },
        raw: true,
      });

      // 3. Map project products by product_id for the JOIN condition
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const productMap = new Map<number, any>();
      projectProducts.forEach((product) => {
        if (product.product_id) {
          productMap.set(product.product_id, product);
        }
      });

      // 4. Process results (implements LEFT JOIN and GROUP BY from SQL)
      const resultByName = new Map<string, ProjectStatsDetailResponseDto>();

      // Process each work log entry (equivalent to "FROM pos")
      for (const logItem of workLogsData) {
        const hoursNoted = parseFloat(logItem.hours_noted?.toString() || '0');

        // LEFT JOIN with projectProducts on product_id (equivalent to "LEFT JOIN pqs ON pos.id = pqs.id")
        const matchedProduct = logItem.product_id ? productMap.get(logItem.product_id) : null;

        const productName = matchedProduct?.name || logItem.product_name || 'Anderen';
        const totalSum = matchedProduct ? parseFloat(matchedProduct.cost?.toString() || '0') : 0;
        let hoursProject = matchedProduct ? parseFloat(matchedProduct.amount?.toString() || '0') : 0;

        // Apply the special calculation as in original code
        if (hoursProject === 1) {
          hoursProject = totalSum / 125;
        }

        // Calculate hours_available as hours_project - hours_noted
        const hoursAvailable = hoursProject - hoursNoted;

        // GROUP BY productName
        if (resultByName.has(productName)) {
          const existing = resultByName.get(productName);
          existing.total_sum += totalSum;
          existing.hours_project += hoursProject;
          existing.hours_noted += hoursNoted;
          existing.hours_available = existing.hours_project - existing.hours_noted; // Calculate hours_available
        } else {
          resultByName.set(productName, {
            name: productName,
            total_sum: totalSum,
            hours_project: hoursProject,
            hours_noted: hoursNoted,
            hours_available: hoursAvailable, // Calculate hours_available
          });
        }
      }

      // Convert map to array for response
      const result: ProjectStatsDetailResponseDto[] = Array.from(resultByName.values());

      return result;
    } catch (error) {
      throw new InternalServerError('Failed to get project stats detail');
    }
  }

  async employeesStats(
    companyId: number,
    start: string,
    end: string,
    user: User,
  ): Promise<{
    payload: EmployeeStatsResponseDto[];
    holidays: HolidayDto[];
  }> {
    const submitStartDate = new Date(start);
    const submitEndDate = new Date(end);

    if (isNaN(submitStartDate.getTime()) || isNaN(submitEndDate.getTime())) {
      throw new BadRequestError('Invalid start or end date format');
    }

    let selCompanyId = user.company_id;
    if (companyId > 0 && companyId !== selCompanyId) {
      selCompanyId = companyId;
    }

    // Fetch holidays using the SettingService
    let holidays: HolidayDto[];
    try {
      holidays = await this.settingsService.getSettingValue(selCompanyId, 'timesheet', 'holidays');
    } catch (error) {
      throw new BadRequestError(`Failed to fetch holidays: ${error}`);
    }

    // Process holidays
    const appliedHolidays = [];
    let holidayCount = 0;
    for (const holiday of holidays || []) {
      const holidayData = holiday;
      const holidayDate = new Date(holidayData.date);

      if (submitStartDate.getTime() < holidayDate.getTime() && submitEndDate.getTime() > holidayDate.getTime()) {
        appliedHolidays.push({
          date: holidayDate,
          label: holidayData.label,
        });
        holidayCount++;
      }
    }

    // Get active users from the company
    const users = await User.findAll({
      where: {
        company_id: selCompanyId,
        id: { [Op.ne]: 1 }, // Exclude user with ID 1
        is_active: true,
        deleted_at: { [Op.is]: null },
      },
      attributes: ['id', 'first_name', 'last_name', 'max_work_hours_per_day'],
      raw: true,
    });

    // Get all user IDs for the consolidated queries
    const userIds = users.map((user) => user.id);

    const unbillableHoursResult = await WorkLog.findAll({
      attributes: [
        [Sequelize.col('workItem.user_id'), 'user_id'],
        [Sequelize.fn('SUM', Sequelize.col('spent_in_hour')), 'hours'],
      ],
      include: [
        {
          model: WorkItem,
          as: 'workItem',
          attributes: [],
          required: true,
          where: {
            user_id: { [Op.in]: userIds },
            deleted_at: { [Op.is]: null },
          },
          include: [
            {
              model: Project,
              as: 'project',
              attributes: [],
              required: true,
              where: {
                is_internal: true,
              },
            },
          ],
        },
      ],
      where: {
        date: { [Op.between]: [submitStartDate, submitEndDate] },
        deleted_at: { [Op.is]: null },
      },
      group: ['workItem.user_id'],
      raw: true,
    });

    const billableHoursResult = await WorkLog.findAll({
      attributes: [
        [Sequelize.col('workItem.user_id'), 'user_id'],
        [Sequelize.fn('SUM', Sequelize.col('spent_in_hour')), 'hours'],
      ],
      include: [
        {
          model: WorkItem,
          as: 'workItem',
          attributes: [],
          required: true,
          where: {
            user_id: { [Op.in]: userIds },
            deleted_at: { [Op.is]: null },
          },
          include: [
            {
              model: Project,
              as: 'project',
              attributes: [],
              required: true,
              where: {
                is_internal: { [Op.not]: true },
              },
            },
          ],
        },
      ],
      where: {
        date: { [Op.between]: [submitStartDate, submitEndDate] },
        deleted_at: { [Op.is]: null },
      },
      group: ['workItem.user_id'],
      raw: true,
    });

    // Calculate business days
    const businessDays = this.countBusinessDays(submitStartDate, submitEndDate);

    // Create maps for quick lookup
    const unbillableHoursMap = new Map(
      (unbillableHoursResult as unknown as HoursResult[]).map((item) => [
        item.user_id,
        parseFloat(item.hours?.toString() || '0'),
      ]),
    );

    const billableHoursMap = new Map(
      (billableHoursResult as unknown as HoursResult[]).map((item) => [
        item.user_id,
        parseFloat(item.hours?.toString() || '0'),
      ]),
    );

    // Combine the results
    const rows = users
      .map((user) => {
        const billableHours = billableHoursMap.get(user.id) || 0;
        const unbillableHours = unbillableHoursMap.get(user.id) || 0;
        const loggedHours = billableHours + unbillableHours;
        const maxWorkHoursPerDay = parseFloat(user.max_work_hours_per_day?.toString() || '8.5');
        const totalHours = (businessDays - holidayCount) * maxWorkHoursPerDay;

        return {
          id: user.id,
          first_name: user.first_name || '',
          last_name: user.last_name || '',
          billable_hours: billableHours,
          unbillable_hours: unbillableHours,
          logged_hours: loggedHours,
          total_hours: totalHours,
        };
      })
      .sort((a, b) => a.id - b.id);

    return {
      payload: rows,
      holidays: appliedHolidays,
    };
  }

  // Helper method to count business days (excluding weekends)
  private countBusinessDays(start: Date, end: Date): number {
    let count = 0;
    const current = new Date(start);

    while (current <= end) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        // 0 is Sunday, 6 is Saturday
        count++;
      }
      current.setDate(current.getDate() + 1);
    }

    return count;
  }

  async getEmployeeProjectDetailStats(
    projectId: number,
    start: string,
    end: string,
  ): Promise<TotalHoursLoggedByUserDto[]> {
    const submitStartDate = new Date(start);
    const submitEndDate = new Date(end);

    if (isNaN(submitStartDate.getTime()) || isNaN(submitEndDate.getTime())) {
      throw new BadRequestError('Invalid start or end date format');
    }

    const workLogData = (await WorkLog.findAll({
      attributes: [[Sequelize.fn('SUM', Sequelize.col('spent_in_hour')), 'hours_noted']],
      include: [
        {
          model: WorkItem,
          as: 'workItem',
          required: true,
          attributes: [],
          where: {
            project_id: projectId,
            deleted_at: { [Op.is]: null },
          },
        },
        {
          model: User,
          as: 'user',
          required: true,
          attributes: ['id', 'first_name', 'last_name'],
        },
      ],
      where: {
        date: { [Op.between]: [submitStartDate, submitEndDate] },
        deleted_at: { [Op.is]: null },
      },
      group: ['user.id', 'user.first_name', 'user.last_name'],
      raw: true,
      nest: true,
    })) as unknown as WorkLogResult[];

    // Format the results to match the expected output
    const rows = workLogData.map((item) => ({
      first_name: item.user.first_name || '',
      last_name: item.user.last_name || '',
      hours_noted: parseFloat(item.hours_noted?.toString()) || 0,
    }));

    return rows;
  }

  async getProjectsStatsForConnected(
    curCompany: number,
    selCompanyId: number,
    submitStartDate: Date,
    submitEndDate: Date,
  ): Promise<ProjectStatsDto[]> {
    try {
      // Step 1: Get project IDs from project_pulls (unchanged)t
      const projectPullsData = await ProjectPull.findAll({
        attributes: ['metadata'],
        where: {
          company_id: curCompany,
        },
        raw: true,
      });

      // Extract project IDs from metadata (unchanged)
      const projectIds = projectPullsData.flatMap((pull) => {
        if (pull.metadata && pull.metadata.project_ids) {
          return pull.metadata.project_ids.map((id: string) => parseInt(id, 10));
        }
        return [];
      });

      if (projectIds.length === 0) {
        return [];
      }

      // Step 2: Get base project data with join to numbers
      const baseProjects = await Project.findAll({
        attributes: [
          'id',
          'name',
          [
            Sequelize.fn(
              'COALESCE',
              Sequelize.col('number.custom_id'),
              Sequelize.cast(Sequelize.col('number.id'), 'TEXT'),
            ),
            'project_nbr',
          ],
        ],
        include: [
          {
            model: NumberEntry,
            as: 'number',
            attributes: [],
            required: true,
          },
        ],
        where: {
          company_id: selCompanyId,
          deleted_at: null,
          id: {
            [Op.in]: projectIds,
          },
        },
        order: [
          ['id', 'ASC'],
          [Sequelize.literal('number'), 'ASC'],
        ],
        raw: true,
      });

      // Create project result map with proper typing
      const projectResultMap = new Map<number, ProjectStatsItem>();

      baseProjects.forEach((project) => {
        projectResultMap.set(project.id, {
          id: project.id,
          name: project.name,
          project_nbr: String(project.project_nbr || ''),
          project_time: 0,
          productive_hours: 0,
          unproductive_hours: 0,
          revenue: 0,
          invoiced: 0,
          total_hours: 0,
          total_cost_to_hours: 0,
          uninvoiced: 0,
          total_amount: 0,
        });
      });

      // Step 3: Calculate project quote total amounts from ProjectProducts table
      const projectsWithProducts = await ProjectProducts.findAll({
        attributes: ['project_id', 'cost', 'type', 'optional', 'unit', 'amount'],
        where: {
          project_id: { [Op.in]: Array.from(projectResultMap.keys()) },
        },
        raw: true,
      });

      // Group products by project
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const productsByProject = new Map<number, any[]>();
      for (const product of projectsWithProducts) {
        if (!product.project_id) continue;

        const existingProducts = productsByProject.get(product.project_id) || [];
        productsByProject.set(product.project_id, [...existingProducts, product]);
      }

      // Calculate total amount for each project
      for (const [projectId, products] of productsByProject.entries()) {
        let totalAmount = 0;

        for (const product of products) {
          // Check if the product is not a title and not optional
          if (product.type !== 'title' && product.optional === false && product.cost) {
            totalAmount += parseFloat(product.cost);
          }
        }

        if (totalAmount > 0 && projectResultMap.has(projectId)) {
          projectResultMap.get(projectId).total_amount = totalAmount;
        }
      }

      // Step 4: Calculate invoiced amounts (ivs in original query)
      const invoices = await Invoice.findAll({
        attributes: ['project_id'],
        where: {
          company_id: selCompanyId,
          deleted_at: null,
          project_id: { [Op.in]: Array.from(projectResultMap.keys()) },
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
      }).then((invoices) => invoices.map((i) => i.get({ plain: true })));

      // Create a map to collect all quote items by project
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const projectQuoteItems = new Map<number, any[]>();

      // First collect all quote items by project
      for (const invoice of invoices) {
        if (!invoice.project_id || !invoice.details.quote_items || invoice.details.quote_items.length == 0) continue;

        const quoteItems = invoice.details.quote_items;
        if (!Array.isArray(quoteItems)) {
          continue;
        }

        const existingItems = projectQuoteItems.get(invoice.project_id) || [];
        projectQuoteItems.set(invoice.project_id, [...existingItems, ...quoteItems]);
      }

      // Now calculate invoiced amount by project - this matches the SQL GROUP BY approach
      const invoicedAmountsByProject = new Map<number, number>();
      for (const [projectId, items] of projectQuoteItems.entries()) {
        let invoicedAmount = 0;

        for (const item of items) {
          // More robust type checking
          if (
            item &&
            typeof item === 'object' &&
            item.type !== 'title' &&
            String(item.optional) === 'false' &&
            item.cost !== undefined &&
            item.cost !== null
          ) {
            const cost = parseFloat(item.cost);
            if (!isNaN(cost)) {
              invoicedAmount += cost;
            }
          }
        }

        if (invoicedAmount > 0) {
          invoicedAmountsByProject.set(projectId, invoicedAmount);
        }
      }

      // Set the invoiced amount on each project
      for (const [projectId, invoicedAmount] of invoicedAmountsByProject.entries()) {
        if (projectResultMap.has(projectId)) {
          projectResultMap.get(projectId).invoiced = invoicedAmount;
        }
      }

      // Step 5: Calculate productive hours (phrs in original query)
      const productiveHours = (await WorkLog.findAll({
        attributes: [
          [Sequelize.col('workItem.project_id'), 'id'],
          [Sequelize.fn('SUM', Sequelize.col('spent_in_hour')), 'hours'],
        ],
        include: [
          {
            model: WorkItem,
            as: 'workItem',
            attributes: [],
            required: true,
            where: {
              deleted_at: null,
            },
            include: [
              {
                model: Project,
                as: 'project',
                attributes: [],
                required: true,
                where: {
                  is_internal: { [Op.not]: true },
                },
              },
            ],
          },
        ],
        where: {
          date: { [Op.between]: [submitStartDate, submitEndDate] },
          company_id: selCompanyId,
        },
        group: ['workItem.project_id'],
        raw: true,
      })) as unknown as HoursResultConnected[];

      for (const item of productiveHours) {
        if (projectResultMap.has(item.id)) {
          projectResultMap.get(item.id).productive_hours = parseFloat(item.hours as string) || 0;
        }
      }

      // Step 6: Calculate total hours from project products
      // Use the same products data we already retrieved
      for (const [projectId, products] of productsByProject.entries()) {
        let totalHours = 0;

        for (const product of products) {
          if (product.unit === 'unit.hours' && product.amount) {
            totalHours += parseFloat(product.amount);
          }
        }

        if (totalHours > 0 && projectResultMap.has(projectId)) {
          projectResultMap.get(projectId).total_hours = totalHours;
        }
      }

      // Step 7: Calculate unproductive hours (uphrs in original query)
      const unproductiveHours = (await WorkLog.findAll({
        attributes: [
          [Sequelize.col('workItem.project_id'), 'id'],
          [Sequelize.fn('SUM', Sequelize.col('spent_in_hour')), 'hours'],
        ],
        include: [
          {
            model: WorkItem,
            as: 'workItem',
            attributes: [],
            required: true,
            where: {
              deleted_at: null,
            },
            include: [
              {
                model: Project,
                as: 'project',
                attributes: [],
                required: true,
                where: {
                  is_internal: true,
                },
              },
            ],
          },
        ],
        where: {
          date: { [Op.between]: [submitStartDate, submitEndDate] },
          company_id: selCompanyId,
        },
        group: ['workItem.project_id'],
        raw: true,
      })) as unknown as HoursResultConnected[];

      for (const item of unproductiveHours) {
        if (projectResultMap.has(item.id)) {
          projectResultMap.get(item.id).unproductive_hours = parseFloat(item.hours as string) || 0;
        }
      }

      // Step 8: Calculate total project hours (wlhrs in original query)

      const totalProjectHours = (await WorkLog.findAll({
        attributes: [
          [Sequelize.col('workItem.project_id'), 'project_id'],
          [Sequelize.fn('SUM', Sequelize.col('spent_in_hour')), 'hours'],
        ],
        include: [
          {
            model: WorkItem,
            as: 'workItem',
            attributes: [],
            required: true,
            where: {
              deleted_at: null,
              project_id: { [Op.in]: Array.from(projectResultMap.keys()) },
            },
          },
        ],
        where: {
          date: { [Op.between]: [submitStartDate, submitEndDate] },
          company_id: selCompanyId,
        },
        group: ['workItem.project_id'],
        raw: true,
      })) as unknown as ProjectHoursResult[];

      for (const item of totalProjectHours) {
        if (projectResultMap.has(item.project_id)) {
          projectResultMap.get(item.project_id).project_time = parseFloat(item.hours as string) || 0;
        }
      }

      // Step 9: Calculate revenue (revs in original query)
      // First, get job rates from settings
      const settingsData = await Setting.findOne({
        attributes: ['timesheet'],
        where: {
          company_id: selCompanyId,
        },
        raw: true,
      });

      // Create a map of job rates
      const jobRates = new Map<string, number>();
      if (settingsData && settingsData.timesheet && settingsData.timesheet.jobs) {
        for (const job of settingsData.timesheet.jobs) {
          if (job.label && job.rate) {
            jobRates.set(job.label, parseFloat(job.rate));
          }
        }
      }

      // Calculate revenue if we have job rates
      if (jobRates.size > 0) {
        const revenueData = (await WorkLog.findAll({
          attributes: [
            [Sequelize.col('workItem.project_id'), 'id'],
            [Sequelize.col('workItem.user.job'), 'job'],
            [Sequelize.fn('SUM', Sequelize.col('spent_in_hour')), 'hours'],
          ],
          include: [
            {
              model: WorkItem,
              as: 'workItem',
              attributes: [],
              required: true,
              where: {
                deleted_at: null,
              },
              include: [
                {
                  model: Project,
                  as: 'project',
                  attributes: [],
                  required: true,
                  where: {
                    is_internal: { [Op.not]: true },
                    deleted_at: null,
                  },
                },
                {
                  model: User,
                  as: 'user',
                  attributes: [],
                  required: true,
                  where: {
                    deleted_at: null,
                  },
                },
              ],
            },
          ],
          where: {
            date: { [Op.between]: [submitStartDate, submitEndDate] },
            company_id: selCompanyId,
          },
          group: ['workItem.project_id', 'workItem.user.job'],
          raw: true,
        })) as unknown as RevenueResult[];

        // Calculate revenue for each project based on hours and job rates
        const projectRevenue = new Map<number, number>();
        for (const item of revenueData) {
          if (!item.id || !item.job) continue;

          const rate = jobRates.get(item.job) || 0;
          const hours = parseFloat(item.hours as string) || 0;
          const revenue = rate * hours;

          if (revenue > 0) {
            const currentRevenue = projectRevenue.get(item.id) || 0;
            projectRevenue.set(item.id, currentRevenue + revenue);
          }
        }

        for (const [projectId, revenue] of projectRevenue.entries()) {
          if (projectResultMap.has(projectId)) {
            // Format revenue as a string with one decimal place
            projectResultMap.get(projectId).revenue = revenue;
          }
        }
      }

      // Step 10: Calculate uninvoiced amounts
      for (const project of projectResultMap.values()) {
        const totalAmount = project.total_amount || 0;
        const invoiced = project.invoiced || 0;

        // Calculate uninvoiced as direct difference, allowing negative values
        project.uninvoiced = totalAmount - invoiced;
      }
      // Convert the map back to an array and ensure it's of the ProjectStatsDto type
      return Array.from(projectResultMap.values()) as unknown as ProjectStatsDto[];
    } catch (error) {
      this.logger.error('Error in getProjectsStatsForConnected:', error);
      throw new InternalServerError('Failed to get project stats for connected');
    }
  }

  async getProjectsStatsWithDeleted(
    selCompanyId: number,
    submitEndDate: Date,
    submitStartDate: Date,
  ): Promise<ProjectStatsDto[]> {
    const GET_PROJECT_STATS_WITH_DELETED_SQL = await this.cacheService.getConfigValue(
      'GET_PROJECT_STATS_WITH_DELETED_SQL',
    );
    const query = GET_PROJECT_STATS_WITH_DELETED_SQL;

    const replacements = [
      selCompanyId,
      selCompanyId,
      submitStartDate,
      submitEndDate,
      selCompanyId,
      selCompanyId,
      selCompanyId,
    ];

    const rows = await Project.sequelize.query<ProjectStatsDto>(query, {
      type: QueryTypes.SELECT,
      replacements,
    });

    return rows;
  }

  async getProjectsStatsInternal(
    selCompanyId: number,
    submitEndDate: Date,
    submitStartDate: Date,
  ): Promise<ProjectStatsDto[]> {
    try {
      // Step 1: Get base internal projects with NumberEntry join and ProjectDetails
      const baseProjects = (await Project.findAll({
        attributes: [
          'id',
          'name',
          [
            Sequelize.fn(
              'CONCAT',
              Sequelize.col('Project.name'),
              Sequelize.literal("', '"),
              Sequelize.fn('COALESCE', Sequelize.col('details.location'), ''),
            ),
            'full_name',
          ],
          [
            Sequelize.fn(
              'COALESCE',
              Sequelize.col('number.custom_id'),
              Sequelize.cast(Sequelize.col('number.id'), 'TEXT'),
            ),
            'project_nbr',
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
            model: ProjectDetails,
            as: 'details',
            attributes: [],
            required: false,
          },
        ],
        where: {
          company_id: selCompanyId,
          deleted_at: null,
          is_internal: true,
        },
        order: [
          ['id', 'ASC'],
          [Sequelize.literal('number'), 'ASC'],
        ],
        raw: true,
      })) as unknown as ProjectWithFullName[];

      // Create project map for results
      const projectResultMap = new Map<number, ProjectStatsDto>();
      const projectIds = baseProjects.map((p) => p.id);

      if (projectIds.length === 0) {
        return [];
      }

      // Initialize result objects
      baseProjects.forEach((project) => {
        projectResultMap.set(project.id, {
          id: project.id,
          name: project.full_name,
          project_nbr: project.project_nbr,
          project_time: 0,
          productive_hours: 0,
          unproductive_hours: 0,
          revenue: 0,
          invoiced: 0,
          total_hours: 0,
          total_cost_to_hours: 0,
          uninvoiced: 0,
          company: '',
        });
      });

      // Step 2: Get project products for total_amount calculation (pjs in original SQL)
      const projectProducts = (await ProjectProducts.findAll({
        attributes: ['project_id', [Sequelize.fn('SUM', Sequelize.col('cost')), 'total_amount']],
        where: {
          project_id: { [Op.in]: projectIds },
          type: { [Op.ne]: 'title' },
          optional: false,
        },
        group: ['project_id'],
        having: Sequelize.literal('SUM(cost) > 0.0'),
        raw: true,
      })) as unknown as ProjectProductWithTotal[];

      projectProducts.forEach((item) => {
        if (projectResultMap.has(item.project_id)) {
          const project = projectResultMap.get(item.project_id);
          project.uninvoiced = parseFloat(item.total_amount?.toString() || '0');
        }
      });

      // Step 3: Get invoice amounts (ivs in original SQL)
      const invoices = await Invoice.findAll({
        attributes: ['project_id'],
        where: {
          company_id: selCompanyId,
          deleted_at: null,
          project_id: { [Op.in]: Array.from(projectResultMap.keys()) },
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
      }).then((invoices) => invoices.map((i) => i.get({ plain: true })));

      // Calculate invoiced amounts per project
      const invoicedByProject = new Map<number, number>();
      for (const invoice of invoices) {
        if (!invoice.project_id || !invoice.details?.quote_items || invoice.details.quote_items.length == 0) continue;

        let projectTotal = 0;
        const quoteItems = invoice.details.quote_items;

        if (Array.isArray(quoteItems)) {
          for (const item of quoteItems) {
            if (item.type !== 'title' && item.optional === false && Number(item.cost)) {
              projectTotal += Number(item.cost);
            }
          }
        }

        if (projectTotal > 0) {
          const currentAmount = invoicedByProject.get(invoice.project_id) || 0;
          invoicedByProject.set(invoice.project_id, Number(currentAmount) + Number(projectTotal));
        }
      }

      // Apply invoiced amounts and calculate uninvoiced
      for (const [projectId, invoicedAmount] of invoicedByProject.entries()) {
        if (projectResultMap.has(projectId)) {
          const project = projectResultMap.get(projectId);
          project.invoiced = invoicedAmount;
          project.uninvoiced = Math.max(0, project.uninvoiced - invoicedAmount);
        }
      }

      // Step 4: Get productive hours (phrs in original SQL)
      const productiveHours = (await WorkLog.findAll({
        attributes: [
          [Sequelize.col('workItem.project_id'), 'project_id'],
          [Sequelize.fn('SUM', Sequelize.col('spent_in_hour')), 'hours'],
        ],
        include: [
          {
            model: WorkItem,
            as: 'workItem',
            attributes: [],
            required: true,
            where: {
              deleted_at: null,
            },
            include: [
              {
                model: Project,
                as: 'project',
                attributes: [],
                required: true,
                where: {
                  id: { [Op.in]: projectIds },
                  is_internal: { [Op.not]: true },
                },
              },
            ],
          },
        ],
        where: {
          date: { [Op.between]: [submitStartDate, submitEndDate] },
          company_id: selCompanyId,
        },
        group: ['workItem.project_id'],
        raw: true,
      })) as unknown as ProjectHoursResult[];

      productiveHours.forEach((item) => {
        if (projectResultMap.has(item.project_id)) {
          projectResultMap.get(item.project_id).productive_hours = parseFloat(item.hours?.toString() || '0');
        }
      });

      // Step 5: Get total hours from project quote items (ivsh in original SQL)
      const projectHours = (await ProjectProducts.findAll({
        attributes: ['project_id', [Sequelize.fn('SUM', Sequelize.col('amount')), 'total_hours']],
        where: {
          project_id: { [Op.in]: projectIds },
          unit: 'unit.hours',
        },
        group: ['project_id'],
        raw: true,
      })) as unknown as { project_id: number; total_hours: string }[];

      projectHours.forEach((item) => {
        if (projectResultMap.has(item.project_id)) {
          projectResultMap.get(item.project_id).total_hours = parseFloat(item.total_hours || '0');
        }
      });

      // Step 6: Get total_cost_to_hours (ivsf in original SQL)
      // First get project rates

      const projectRates = (await Project.findAll({
        attributes: ['id', [Sequelize.fn('COALESCE', Sequelize.col('details.rate_per_hour'), 125), 'rate_per_hour']],
        include: [
          {
            model: ProjectDetails,
            as: 'details',
            attributes: [],
            required: false,
          },
        ],
        where: {
          id: { [Op.in]: projectIds },
        },
        raw: true,
      })) as unknown as ProjectRateResult[];

      // Get Leistung costs

      const leistungCosts = (await ProjectProducts.findAll({
        attributes: ['project_id', [Sequelize.fn('SUM', Sequelize.col('cost')), 'total_cost']],
        where: {
          project_id: { [Op.in]: projectIds },
          unit: 'Leistung',
        },
        group: ['project_id'],
        raw: true,
      })) as unknown as LeistungCostResult[];

      // Build rate map
      const rateMap = new Map<number, number>();
      projectRates.forEach((pr) => rateMap.set(pr.id, parseFloat(pr.rate_per_hour?.toString() || '125')));

      // Calculate cost to hours ratio
      leistungCosts.forEach((lc) => {
        const projectId = lc.project_id;
        const rate = rateMap.get(projectId) || 125;
        if (projectResultMap.has(projectId) && rate > 0) {
          projectResultMap.get(projectId).total_cost_to_hours = parseFloat(lc.total_cost?.toString() || '0') / rate;
        }
      });

      // Step 7: Get unproductive hours (uphrs in original SQL)
      const unproductiveHours = (await WorkLog.findAll({
        attributes: [
          [Sequelize.col('workItem.project_id'), 'project_id'],
          [Sequelize.fn('SUM', Sequelize.col('spent_in_hour')), 'hours'],
        ],
        include: [
          {
            model: WorkItem,
            as: 'workItem',
            attributes: [],
            required: true,
            where: {
              deleted_at: null,
            },
            include: [
              {
                model: Project,
                as: 'project',
                attributes: [],
                required: true,
                where: {
                  id: { [Op.in]: projectIds },
                  is_internal: true,
                },
              },
            ],
          },
        ],
        where: {
          date: { [Op.between]: [submitStartDate, submitEndDate] },
          company_id: selCompanyId,
        },
        group: ['workItem.project_id'],
        raw: true,
      })) as unknown as ProjectHoursResult[];

      unproductiveHours.forEach((item) => {
        if (projectResultMap.has(item.project_id)) {
          projectResultMap.get(item.project_id).unproductive_hours = parseFloat(item.hours?.toString() || '0');
        }
      });

      // Step 8: Get total project time (wlhrs in original SQL)
      const projectTimes = (await WorkLog.findAll({
        attributes: [
          [Sequelize.col('workItem.project_id'), 'project_id'],
          [Sequelize.fn('SUM', Sequelize.col('spent_in_hour')), 'hours'],
        ],
        include: [
          {
            model: WorkItem,
            as: 'workItem',
            attributes: [],
            required: true,
            where: {
              deleted_at: null,
              project_id: { [Op.in]: projectIds },
            },
          },
        ],
        where: {
          company_id: selCompanyId,
          date: { [Op.between]: [submitStartDate, submitEndDate] },
        },
        group: ['workItem.project_id'],
        raw: true,
      })) as unknown as ProjectHoursResult[];

      projectTimes.forEach((item) => {
        if (projectResultMap.has(item.project_id)) {
          projectResultMap.get(item.project_id).project_time = parseFloat(item.hours?.toString() || '0');
        }
      });

      // Step 9: Calculate revenue based on job rates (revs in original SQL)
      const settings = await Setting.findOne({
        attributes: ['timesheet'],
        where: { company_id: selCompanyId },
        raw: true,
      });

      // Build job rates map
      const jobRates = new Map<string, number>();
      if (settings?.timesheet?.jobs) {
        settings.timesheet.jobs.forEach((job: { label: string; rate: string | number }) => {
          if (job.label && job.rate) {
            jobRates.set(job.label, parseFloat(job.rate.toString()));
          }
        });
      }

      // If we have job rates, calculate revenue
      if (jobRates.size > 0) {
        const revenueData = (await WorkLog.findAll({
          attributes: [
            [Sequelize.col('workItem.project_id'), 'project_id'],
            [Sequelize.col('user.job'), 'job'],
            [Sequelize.fn('SUM', Sequelize.col('spent_in_hour')), 'hours'],
          ],
          include: [
            {
              model: WorkItem,
              as: 'workItem',
              attributes: [],
              required: true,
              where: {
                deleted_at: null,
              },
              include: [
                {
                  model: Project,
                  as: 'project',
                  attributes: [],
                  required: true,
                  where: {
                    id: { [Op.in]: projectIds },
                    is_internal: { [Op.not]: true },
                    deleted_at: null,
                  },
                },
              ],
            },
            {
              model: User,
              as: 'user',
              attributes: [],
              required: true,
              where: {
                deleted_at: null,
              },
            },
          ],
          where: {
            date: { [Op.between]: [submitStartDate, submitEndDate] },
            company_id: selCompanyId,
          },
          group: ['workItem.project_id', 'user.job'],
          raw: true,
        })) as unknown as RevenueDataResult[];

        // Calculate revenue by multiplying hours by rate
        revenueData.forEach((item) => {
          if (projectResultMap.has(item.project_id) && item.job) {
            const rate = jobRates.get(item.job) || 0;
            const hours = parseFloat(item.hours?.toString() || '0');
            const revenue = rate * hours;

            if (revenue > 0) {
              const currentRevenue = projectResultMap.get(item.project_id).revenue;
              projectResultMap.get(item.project_id).revenue = currentRevenue + revenue;
            }
          }
        });
      }

      // Format numbers consistently with the SQL query
      const results = Array.from(projectResultMap.values());
      results.forEach((project) => {
        project.revenue = Number(project.revenue.toFixed(1));
        project.invoiced = Number(project.invoiced.toFixed(4));
        project.total_hours = Number(project.total_hours.toFixed(6));
        project.total_cost_to_hours = Number(project.total_cost_to_hours.toFixed(6));
        project.uninvoiced = Number(project.uninvoiced.toFixed(5));
      });

      return results;
    } catch (error) {
      this.logger.error('Error in getProjectsStatsInternal:', error);
      throw new InternalServerError('Failed to get internal project statistics');
    }
  }

  async getProjectsStatsByStatus(
    selCompanyId: number,
    submitEndDate: Date,
    submitStartDate: Date,
    status: string,
  ): Promise<ProjectStatsDto[]> {
    try {
      // Step 1: Get base project data with join to numbers and project details
      const baseProjects = (await Project.findAll({
        attributes: [
          'id',
          'name',
          [Sequelize.fn('COALESCE', Sequelize.col('details.location'), ''), 'location'],
          [
            Sequelize.fn(
              'COALESCE',
              Sequelize.col('number.custom_id'),
              Sequelize.cast(Sequelize.col('number.id'), 'TEXT'),
            ),
            'project_nbr',
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
            model: ProjectDetails,
            as: 'details',
            attributes: [],
            required: false,
          },
        ],
        where: {
          company_id: selCompanyId,
          deleted_at: null,
          status: status,
        },
        order: [
          ['id', 'ASC'],
          [Sequelize.literal('number'), 'ASC'],
        ],
        raw: true,
      })) as unknown as ProjectWithLocationResult[];

      // Create project result map with proper typing
      const projectResultMap = new Map<number, ProjectStatsDto>();

      baseProjects.forEach((project) => {
        projectResultMap.set(project.id, {
          id: project.id,
          name: `${project.name}, ${project.location || ''}`,
          project_nbr: String(project.project_nbr || ''),
          project_time: 0,
          productive_hours: 0,
          unproductive_hours: 0,
          revenue: 0,
          invoiced: 0,
          total_hours: 0,
          total_cost_to_hours: 0,
          uninvoiced: 0,
          company: '',
        });
      });

      const projectIds = Array.from(projectResultMap.keys());
      if (projectIds.length === 0) {
        return [];
      }

      // Step 2: Calculate project quote total amounts from ProjectProducts table

      const projectProducts = (await ProjectProducts.findAll({
        attributes: ['project_id', [Sequelize.fn('SUM', Sequelize.col('cost')), 'total_amount']],
        where: {
          project_id: { [Op.in]: projectIds },
          type: { [Op.ne]: 'title' },
          optional: false,
        },
        group: ['project_id'],
        having: Sequelize.literal('SUM(cost) > 0.0'),
        raw: true,
      })) as unknown as ProjectProductWithTotalAmount[];

      projectProducts.forEach((item) => {
        if (projectResultMap.has(item.project_id)) {
          const project = projectResultMap.get(item.project_id);
          project.uninvoiced = parseFloat(item.total_amount?.toString() || '0');
        }
      });

      // Step 3: Calculate invoiced amounts from invoices
      const invoices = await Invoice.findAll({
        attributes: ['project_id'],
        where: {
          company_id: selCompanyId,
          deleted_at: null,
          project_id: { [Op.in]: Array.from(projectResultMap.keys()) },
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
      }).then((invoices) => invoices.map((i) => i.get({ plain: true })));

      // Calculate invoiced amounts per project
      const invoicedByProject = new Map<number, number>();
      for (const invoice of invoices) {
        if (!invoice.project_id || !invoice.details?.quote_items || invoice.details.quote_items.length == 0) continue;

        let projectTotal = 0;
        const quoteItems = invoice.details.quote_items;

        if (Array.isArray(quoteItems)) {
          for (const item of quoteItems) {
            if (item.type !== 'title' && item.optional === false && Number(item.cost)) {
              projectTotal += Number(item.cost);
            }
          }
        }

        if (projectTotal > 0) {
          const currentAmount = invoicedByProject.get(invoice.project_id) || 0;
          invoicedByProject.set(invoice.project_id, Number(currentAmount) + Number(projectTotal));
        }
      }

      // Apply invoiced amounts and calculate uninvoiced
      for (const [projectId, invoicedAmount] of invoicedByProject.entries()) {
        if (projectResultMap.has(projectId)) {
          const project = projectResultMap.get(projectId);
          project.invoiced = invoicedAmount;
          project.uninvoiced = project.uninvoiced - invoicedAmount;
        }
      }

      // Step 4: Calculate productive hours
      const productiveHours = (await WorkLog.findAll({
        attributes: [
          [Sequelize.col('workItem.project_id'), 'project_id'],
          [Sequelize.fn('SUM', Sequelize.col('spent_in_hour')), 'hours'],
        ],
        include: [
          {
            model: WorkItem,
            as: 'workItem',
            attributes: [],
            required: true,
            where: {
              deleted_at: null,
            },
            include: [
              {
                model: Project,
                as: 'project',
                attributes: [],
                required: true,
                where: {
                  id: { [Op.in]: projectIds },
                  is_internal: { [Op.not]: true },
                },
              },
            ],
          },
        ],
        where: {
          date: { [Op.between]: [submitStartDate, submitEndDate] },
          company_id: selCompanyId,
        },
        group: ['workItem.project_id'],
        raw: true,
      })) as unknown as ProjectHoursResult[];

      productiveHours.forEach((item) => {
        if (projectResultMap.has(item.project_id)) {
          projectResultMap.get(item.project_id).productive_hours = parseFloat(item.hours?.toString() || '0');
        }
      });

      // Step 5: Calculate total hours from project quote items
      const projectHours = (await ProjectProducts.findAll({
        attributes: ['project_id', [Sequelize.fn('SUM', Sequelize.col('amount')), 'total_hours']],
        where: {
          project_id: { [Op.in]: projectIds },
          unit: 'unit.hours',
        },
        group: ['project_id'],
        raw: true,
      })) as unknown as { project_id: number; total_hours: string }[];

      projectHours.forEach((item) => {
        if (projectResultMap.has(item.project_id)) {
          projectResultMap.get(item.project_id).total_hours = parseFloat(item.total_hours || '0');
        }
      });

      // Step 6: Calculate total_cost_to_hours
      // First get project rates
      const projectRates = (await Project.findAll({
        attributes: ['id', [Sequelize.fn('COALESCE', Sequelize.col('details.rate_per_hour'), 125), 'rate_per_hour']],
        include: [
          {
            model: ProjectDetails,
            as: 'details',
            attributes: [],
            required: false,
          },
        ],
        where: {
          id: { [Op.in]: projectIds },
        },
        raw: true,
      })) as unknown as ProjectRateResult[];

      // Get Leistung costs
      const leistungCosts = (await ProjectProducts.findAll({
        attributes: ['project_id', [Sequelize.fn('SUM', Sequelize.col('cost')), 'total_cost']],
        where: {
          project_id: { [Op.in]: projectIds },
          unit: 'Leistung',
        },
        group: ['project_id'],
        raw: true,
      })) as unknown as LeistungCostResult[];

      // Build rate map
      const rateMap = new Map<number, number>();
      projectRates.forEach((pr) => rateMap.set(pr.id, parseFloat(pr.rate_per_hour?.toString() || '125')));

      // Calculate cost to hours ratio
      leistungCosts.forEach((lc) => {
        const projectId = lc.project_id;
        const rate = rateMap.get(projectId) || 125;
        if (projectResultMap.has(projectId) && rate > 0) {
          projectResultMap.get(projectId).total_cost_to_hours = parseFloat(lc.total_cost?.toString() || '0') / rate;
        }
      });

      // Step 7: Calculate unproductive hours
      const unproductiveHours = (await WorkLog.findAll({
        attributes: [
          [Sequelize.col('workItem.project_id'), 'project_id'],
          [Sequelize.fn('SUM', Sequelize.col('spent_in_hour')), 'hours'],
        ],
        include: [
          {
            model: WorkItem,
            as: 'workItem',
            attributes: [],
            required: true,
            where: {
              deleted_at: null,
            },
            include: [
              {
                model: Project,
                as: 'project',
                attributes: [],
                required: true,
                where: {
                  id: { [Op.in]: projectIds },
                  is_internal: true,
                },
              },
            ],
          },
        ],
        where: {
          date: { [Op.between]: [submitStartDate, submitEndDate] },
          company_id: selCompanyId,
        },
        group: ['workItem.project_id'],
        raw: true,
      })) as unknown as ProjectHoursResult[];

      unproductiveHours.forEach((item) => {
        if (projectResultMap.has(item.project_id)) {
          projectResultMap.get(item.project_id).unproductive_hours = parseFloat(item.hours?.toString() || '0');
        }
      });

      // Step 8: Calculate total project time
      const projectTimes = (await WorkLog.findAll({
        attributes: [
          [Sequelize.col('workItem.project_id'), 'project_id'],
          [Sequelize.fn('SUM', Sequelize.col('spent_in_hour')), 'hours'],
        ],
        include: [
          {
            model: WorkItem,
            as: 'workItem',
            attributes: [],
            required: true,
            where: {
              deleted_at: null,
              project_id: { [Op.in]: projectIds },
            },
          },
        ],
        where: {
          company_id: selCompanyId,
          date: { [Op.between]: [submitStartDate, submitEndDate] },
        },
        group: ['workItem.project_id'],
        raw: true,
      })) as unknown as ProjectHoursResult[];

      projectTimes.forEach((item) => {
        if (projectResultMap.has(item.project_id)) {
          projectResultMap.get(item.project_id).project_time = parseFloat(item.hours?.toString() || '0');
        }
      });

      // Step 9: Calculate revenue based on job rates
      const settings = await Setting.findOne({
        attributes: ['timesheet'],
        where: { company_id: selCompanyId },
        raw: true,
      });

      // Build job rates map
      const jobRates = new Map<string, number>();
      if (settings?.timesheet?.jobs) {
        settings.timesheet.jobs.forEach((job: { label: string; rate: string | number }) => {
          if (job.label && job.rate) {
            jobRates.set(job.label, parseFloat(job.rate.toString()));
          }
        });
      }

      // If we have job rates, calculate revenue
      if (jobRates.size > 0) {
        const revenueData = (await WorkLog.findAll({
          attributes: [
            [Sequelize.col('workItem.project_id'), 'project_id'],
            [Sequelize.col('user.job'), 'job'],
            [Sequelize.fn('SUM', Sequelize.col('spent_in_hour')), 'hours'],
          ],
          include: [
            {
              model: WorkItem,
              as: 'workItem',
              attributes: [],
              required: true,
              where: {
                deleted_at: null,
              },
              include: [
                {
                  model: Project,
                  as: 'project',
                  attributes: [],
                  required: true,
                  where: {
                    id: { [Op.in]: projectIds },
                    is_internal: { [Op.not]: true },
                    deleted_at: null,
                  },
                },
              ],
            },
            {
              model: User,
              as: 'user',
              attributes: [],
              required: true,
              where: {
                deleted_at: null,
              },
            },
          ],
          where: {
            date: { [Op.between]: [submitStartDate, submitEndDate] },
            company_id: selCompanyId,
          },
          group: ['workItem.project_id', 'user.job'],
          raw: true,
        })) as unknown as RevenueDataResult[];

        // Calculate revenue by multiplying hours by rate
        revenueData.forEach((item) => {
          if (projectResultMap.has(item.project_id) && item.job) {
            const rate = jobRates.get(item.job) || 0;
            const hours = parseFloat(item.hours?.toString() || '0');
            const revenue = rate * hours;

            if (revenue > 0) {
              const currentRevenue = projectResultMap.get(item.project_id).revenue;
              projectResultMap.get(item.project_id).revenue = currentRevenue + revenue;
            }
          }
        });
      }

      // Format numbers consistently with the SQL query
      const results = Array.from(projectResultMap.values());
      results.forEach((project) => {
        project.revenue = Number(project.revenue.toFixed(1));
        project.invoiced = Number(project.invoiced.toFixed(4));
        project.total_hours = Number(project.total_hours.toFixed(6));
        project.total_cost_to_hours = Number(project.total_cost_to_hours.toFixed(6));
        project.uninvoiced = Number(project.uninvoiced.toFixed(5));
      });

      return results;
    } catch (error) {
      throw new InternalServerError('Failed to get project stats by status');
    }
  }

  async getProjectsStats(selCompanyId: number, submitEndDate: Date, submitStartDate: Date): Promise<ProjectStatsDto[]> {
    try {
      // Step 1: Get base project data with join to numbers
      const baseProjects = (await Project.findAll({
        attributes: [
          'id',
          'name',
          [Sequelize.fn('COALESCE', Sequelize.col('details.location'), ''), 'location'],
          [
            Sequelize.fn(
              'COALESCE',
              Sequelize.col('number.custom_id'),
              Sequelize.cast(Sequelize.col('number.id'), 'TEXT'),
            ),
            'project_nbr',
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
            model: ProjectDetails,
            as: 'details',
            attributes: [],
            required: false,
          },
        ],
        where: {
          company_id: selCompanyId,
          deleted_at: null,
        },
        order: [
          ['id', 'ASC'],
          [Sequelize.literal('number'), 'ASC'],
        ],
        raw: true,
      })) as unknown as ProjectWithLocation[];

      // Create project result map with proper typing
      const projectResultMap = new Map<number, ProjectStatsDto>();

      baseProjects.forEach((project) => {
        projectResultMap.set(project.id, {
          id: project.id,
          name: `${project.name}, ${project.location || ''}`,
          project_nbr: String(project.project_nbr || ''),
          project_time: 0,
          productive_hours: 0,
          unproductive_hours: 0,
          revenue: 0,
          invoiced: 0,
          total_hours: 0,
          total_cost_to_hours: 0,
          uninvoiced: 0,
          company: '',
        });
      });

      const projectIds = Array.from(projectResultMap.keys());
      if (projectIds.length === 0) {
        return [];
      }

      // Step 2: Calculate project quote total amounts from ProjectProducts table
      const projectsWithProducts = await ProjectProducts.findAll({
        attributes: ['project_id', 'cost', 'type', 'optional', 'unit', 'amount'],
        where: {
          project_id: { [Op.in]: projectIds },
          type: { [Op.ne]: 'title' },
          optional: false,
        },
        raw: true,
      });

      // Group products by project
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const productsByProject = new Map<number, any[]>();
      for (const product of projectsWithProducts) {
        if (!product.project_id) continue;

        const existingProducts = productsByProject.get(product.project_id) || [];
        productsByProject.set(product.project_id, [...existingProducts, product]);
      }

      // Calculate total amount for each project
      for (const [projectId, products] of productsByProject.entries()) {
        let totalAmount = 0;

        for (const product of products) {
          if (product.cost) {
            totalAmount += parseFloat(product.cost);
          }
        }

        if (totalAmount > 0 && projectResultMap.has(projectId)) {
          const project = projectResultMap.get(projectId);
          project.uninvoiced = totalAmount; // Initially set uninvoiced to total amount
        }
      }

      // Step 3: Calculate invoiced amounts from invoices
      const invoices = await Invoice.findAll({
        attributes: ['project_id'],
        where: {
          company_id: selCompanyId,
          deleted_at: null,
          project_id: { [Op.in]: Array.from(projectResultMap.keys()) },
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
      }).then((invoices) => invoices.map((i) => i.get({ plain: true })));

      // Create a map to collect all quote items by project
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const projectQuoteItems = new Map<number, any[]>();

      // First collect all quote items by project
      for (const invoice of invoices) {
        if (!invoice.project_id || !invoice.details.quote_items || invoice.details.quote_items.length == 0) continue;

        const quoteItems = invoice.details.quote_items;
        if (!Array.isArray(quoteItems)) {
          continue;
        }

        const existingItems = projectQuoteItems.get(invoice.project_id) || [];
        projectQuoteItems.set(invoice.project_id, [...existingItems, ...quoteItems]);
      }

      // Calculate invoiced amount by project
      for (const [projectId, items] of projectQuoteItems.entries()) {
        let invoicedAmount = 0;

        for (const item of items) {
          if (
            item &&
            typeof item === 'object' &&
            item.type !== 'title' &&
            String(item.optional) === 'false' &&
            item.cost !== undefined &&
            item.cost !== null
          ) {
            const cost = parseFloat(item.cost);
            if (!isNaN(cost)) {
              invoicedAmount += Number(cost);
            }
          }
        }

        if (invoicedAmount > 0 && projectResultMap.has(projectId)) {
          const project = projectResultMap.get(projectId);
          project.invoiced = invoicedAmount;
          project.uninvoiced = project.uninvoiced - invoicedAmount;
        }
      }

      // Step 4: Calculate productive hours
      const productiveHours = (await WorkLog.findAll({
        attributes: [
          [Sequelize.col('workItem.project_id'), 'project_id'],
          [Sequelize.fn('SUM', Sequelize.col('spent_in_hour')), 'hours'],
        ],
        include: [
          {
            model: WorkItem,
            as: 'workItem',
            attributes: [],
            required: true,
            where: {
              deleted_at: null,
              project_id: { [Op.in]: projectIds },
            },
            include: [
              {
                model: Project,
                as: 'project',
                attributes: [],
                required: true,
                where: {
                  is_internal: { [Op.not]: true },
                },
              },
            ],
          },
        ],
        where: {
          date: { [Op.between]: [submitStartDate, submitEndDate] },
          company_id: selCompanyId,
        },
        group: ['workItem.project_id'],
        raw: true,
      })) as unknown as ProjectHours[];

      productiveHours.forEach((item) => {
        if (item.project_id && projectResultMap.has(item.project_id)) {
          projectResultMap.get(item.project_id).productive_hours = parseFloat(item.hours as string) || 0;
        }
      });

      // Step 5: Calculate total hours from project products
      for (const [projectId, products] of productsByProject.entries()) {
        let totalHours = 0;
        for (const product of products) {
          if (product.unit === 'unit.hours' && product.amount) {
            totalHours += parseFloat(product.amount);
          }
        }

        if (totalHours > 0 && projectResultMap.has(projectId)) {
          projectResultMap.get(projectId).total_hours = totalHours;
        }
      }

      // Step 6: Calculate total_cost_to_hours
      const projectsWithRates = (await Project.findAll({
        attributes: ['id', [Sequelize.fn('COALESCE', Sequelize.col('details.rate_per_hour'), 125), 'rate_per_hour']],
        include: [
          {
            model: ProjectDetails,
            as: 'details',
            attributes: [],
            required: false,
          },
        ],
        where: {
          id: { [Op.in]: projectIds },
        },
        raw: true,
      })) as unknown as ProjectRate[];

      const ratesByProject = new Map<number, number>();
      projectsWithRates.forEach((project) => {
        ratesByProject.set(project.id, parseFloat(project.rate_per_hour.toString()));
      });

      for (const [projectId, products] of productsByProject.entries()) {
        const rate = ratesByProject.get(projectId) || 125;
        let leistungCost = 0;

        for (const product of products) {
          if (product.unit === 'Leistung' && product.cost) {
            leistungCost += parseFloat(product.cost);
          }
        }

        if (leistungCost > 0 && rate > 0 && projectResultMap.has(projectId)) {
          projectResultMap.get(projectId).total_cost_to_hours = leistungCost / rate;
        }
      }

      // Step 7: Calculate unproductive hours
      const unproductiveHours = (await WorkLog.findAll({
        attributes: [
          [Sequelize.col('workItem.project_id'), 'project_id'],
          [Sequelize.fn('SUM', Sequelize.col('spent_in_hour')), 'hours'],
        ],
        include: [
          {
            model: WorkItem,
            as: 'workItem',
            attributes: [],
            required: true,
            where: {
              deleted_at: null,
              project_id: { [Op.in]: projectIds },
            },
            include: [
              {
                model: Project,
                as: 'project',
                attributes: [],
                required: true,
                where: {
                  is_internal: true,
                },
              },
            ],
          },
        ],
        where: {
          date: { [Op.between]: [submitStartDate, submitEndDate] },
          company_id: selCompanyId,
        },
        group: ['workItem.project_id'],
        raw: true,
      })) as unknown as ProjectHours[];

      unproductiveHours.forEach((item) => {
        if (item.project_id && projectResultMap.has(item.project_id)) {
          projectResultMap.get(item.project_id).unproductive_hours = parseFloat(item.hours as string) || 0;
        }
      });

      // Step 8: Calculate total project hours
      const totalProjectHours = (await WorkLog.findAll({
        attributes: [
          [Sequelize.col('workItem.project_id'), 'project_id'],
          [Sequelize.fn('SUM', Sequelize.col('spent_in_hour')), 'hours'],
        ],
        include: [
          {
            model: WorkItem,
            as: 'workItem',
            attributes: [],
            required: true,
            where: {
              deleted_at: null,
              project_id: { [Op.in]: projectIds },
            },
          },
        ],
        where: {
          date: { [Op.between]: [submitStartDate, submitEndDate] },
          company_id: selCompanyId,
        },
        group: ['workItem.project_id'],
        raw: true,
      })) as unknown as ProjectHours[];

      totalProjectHours.forEach((item) => {
        if (item.project_id && projectResultMap.has(item.project_id)) {
          projectResultMap.get(item.project_id).project_time = parseFloat(item.hours as string) || 0;
        }
      });

      // Step 9: Calculate revenue
      const settingsData = await Setting.findOne({
        attributes: ['timesheet'],
        where: {
          company_id: selCompanyId,
        },
        raw: true,
      });

      const jobRates = new Map<string, number>();
      if (settingsData && settingsData.timesheet && settingsData.timesheet.jobs) {
        for (const job of settingsData.timesheet.jobs) {
          if (job.label && job.rate) {
            jobRates.set(job.label, parseFloat(job.rate));
          }
        }
      }

      if (jobRates.size > 0) {
        const revenueData = (await WorkLog.findAll({
          attributes: [
            [Sequelize.col('workItem.project_id'), 'project_id'],
            [Sequelize.col('workItem.user.job'), 'job'],
            [Sequelize.fn('SUM', Sequelize.col('spent_in_hour')), 'hours'],
          ],
          include: [
            {
              model: WorkItem,
              as: 'workItem',
              attributes: [],
              required: true,
              where: {
                deleted_at: null,
                project_id: { [Op.in]: projectIds },
              },
              include: [
                {
                  model: Project,
                  as: 'project',
                  attributes: [],
                  required: true,
                  where: {
                    is_internal: { [Op.not]: true },
                    deleted_at: null,
                  },
                },
                {
                  model: User,
                  as: 'user',
                  attributes: [],
                  required: true,
                  where: {
                    deleted_at: null,
                  },
                },
              ],
            },
          ],
          where: {
            date: { [Op.between]: [submitStartDate, submitEndDate] },
            company_id: selCompanyId,
          },
          group: ['workItem.project_id', 'workItem.user.job'],
          raw: true,
        })) as unknown as RevenueData[];

        const projectRevenue = new Map<number, number>();
        for (const item of revenueData) {
          if (!item.project_id || !item.job) continue;

          const rate = jobRates.get(item.job) || 0;
          const hours = parseFloat(item.hours as string) || 0;
          const revenue = rate * hours;

          if (revenue > 0) {
            const currentRevenue = projectRevenue.get(item.project_id) || 0;
            projectRevenue.set(item.project_id, currentRevenue + revenue);
          }
        }

        for (const [projectId, revenue] of projectRevenue.entries()) {
          if (projectResultMap.has(projectId)) {
            projectResultMap.get(projectId).revenue = revenue;
          }
        }
      }

      const results = Array.from(projectResultMap.values());

      for (const project of results) {
        // Format revenue as a string with one decimal place, exactly as in SQL
        project.revenue = Number(project.revenue.toFixed(1));

        // Round invoiced amount to 4 decimal places
        project.invoiced = Number(project.invoiced.toFixed(4));

        // Round total_hours and total_cost_to_hours to 6 decimal places
        project.total_hours = Number(project.total_hours.toFixed(6));
        project.total_cost_to_hours = Number(project.total_cost_to_hours.toFixed(6));

        // Round uninvoiced to 5 decimal places
        project.uninvoiced = Number(project.uninvoiced.toFixed(5));
      }

      return results;
    } catch (error) {
      this.logger.error('Error in getProjectsStats:', error);
      throw new InternalServerError('Failed to get project stats');
    }
  }
}
