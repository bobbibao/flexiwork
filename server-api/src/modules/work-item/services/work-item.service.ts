import { cast, col, fn, literal, Op, QueryTypes, Sequelize } from 'sequelize';
import User from 'src/database/models/users.model';
import WorkItem from 'src/database/models/work-items.model';
import { HolidayDto } from 'src/modules/setting/dto/holiday.dto';
import { SettingService } from 'src/modules/setting/services/setting.service';
import { UsersService } from 'src/modules/users/services/user.service';
import { QueryDateFilterUserId, QueryDateUserId } from 'src/shared/dto';
import { CacheService } from 'src/shared/services';
import {
  compareDates,
  formatDateToISOStringWithMachineTimezone,
  formatDateToYYYYMMDD,
  getParsedOrFirstDateOfYear,
  getParsedOrLastDateOfYear,
  parseDate,
  BadRequestError,
  NotFoundError,
  InternalServerError,
} from 'src/shared/utils';
import DateFormatter, { dateInRange, daysBetween, isWeekend } from 'src/shared/utils/date-utils';
import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import {
  FlexHourEntityDto,
  processHolidays,
  ProjectTimeSheetResponseDto,
  TimeSheetPeriodsEntityDto,
  WorkItemEntityDto,
  WorkItemInputDto,
} from '../dto';
import { ProductTasksResponseDto } from 'src/modules/product/dto/project-product-response.dto';
import { ProductService } from 'src/modules/product/services/product.service';
import UserHoliday from 'src/database/models/user-holidays.model';
import Setting from 'src/database/models/setting.model';
import Product from 'src/database/models/products.model';
import Project from 'src/database/models/projects.model';
import NumberEntry from 'src/database/models/numbers.model';
import WorkLog from 'src/database/models/work-logs.model';
import Task from 'src/database/models/task.model';
import ProjectDetails from 'src/database/models/project-details.model';

@Injectable()
export class WorkItemService {
  private readonly logger = new Logger(WorkItemService.name);

  constructor(
    @Inject('WORK_ITEM_REPOSITORY')
    private readonly workItemRepository: typeof WorkItem,
    @Inject('WORK_LOG_REPOSITORY')
    private readonly workLogRepository: typeof WorkLog,
    @Inject('USER_HOLIDAY_REPOSITORY')
    private readonly userHolidayRepository: typeof UserHoliday,
    @Inject('SETTING_REPOSITORY')
    private readonly settingRepository: typeof Setting,
    @Inject(forwardRef(() => UsersService))
    private readonly userService: UsersService,
    private readonly cacheService: CacheService,
    private readonly settingService: SettingService,
    private readonly productService: ProductService,
  ) {}

  async getWorkItemById(companyId: number, workItemId: number): Promise<WorkItemEntityDto> {
    const workItem = (await WorkItem.findOne({
      where: {
        company_id: companyId,
        id: workItemId,
        deleted_at: {
          [Op.is]: null,
        },
      },
      attributes: [
        'id',
        'product_id',
        'task',
        'is_hide',
        [
          fn(
            'COALESCE',
            fn('TO_CHAR', col('WorkItem.created_at'), 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
            '0001-01-01T00:00:00Z',
          ),
          'created_at',
        ],
        [
          fn(
            'COALESCE',
            fn('TO_CHAR', col('WorkItem.updated_at'), 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
            '0001-01-01T00:00:00Z',
          ),
          'updated_at',
        ],
      ],
      include: [
        {
          model: User,
          as: 'user',
          attributes: [
            'id',
            'email',
            'role',
            [fn('COALESCE', col('user.email'), ''), 'email'],
            'is_active',
            [fn('COALESCE', col('user.avatar_url'), ''), 'avatar_url'],
            'max_work_hours_per_week',
            'max_work_hours_per_day',
            [fn('COALESCE', col('user.address'), ''), 'address'],
            [fn('COALESCE', col('user.dob'), ''), 'dob'],
            [fn('COALESCE', col('user.end_work_date'), ''), 'end_work_date'],
            [fn('COALESCE', col('user.job'), ''), 'job'],
            [fn('COALESCE', col('user.name'), ''), 'name'],
            [fn('COALESCE', col('user.phone'), ''), 'phone'],
            [fn('COALESCE', col('user.place'), ''), 'place'],
            [fn('COALESCE', col('user.postcode'), ''), 'postcode'],
            [fn('COALESCE', col('user.start_work_date'), ''), 'start_work_date'],
            [fn('COALESCE', col('user.first_name'), ''), 'first_name'],
            [fn('COALESCE', col('user.last_name'), ''), 'last_name'],
            [fn('COALESCE', col('user.holidays'), 0), 'holidays'],
            [fn('COALESCE', col('user.work_percent_per_week'), '0'), 'work_percent_per_week'],
            'timesheet_periods',
            'holiday_periods',
            'company_id',
            [
              fn(
                'COALESCE',
                fn('TO_CHAR', col('user.created_at'), 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
                '0001-01-01T00:00:00Z',
              ),
              'created_at',
            ],
            [
              fn(
                'COALESCE',
                fn('TO_CHAR', col('user.updated_at'), 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
                '0001-01-01T00:00:00Z',
              ),
              'updated_at',
            ],
          ],
          where: {
            deleted_at: {
              [Op.is]: null,
            },
          },
          required: false,
        },
        {
          model: Product,
          as: 'product',
          attributes: [
            'id',
            [literal('CAST(price AS NUMERIC)'), 'price'],
            'name',
            'description',
            'folder',
            [
              fn(
                'COALESCE',
                fn('TO_CHAR', col('user.created_at'), 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
                '0001-01-01T00:00:00Z',
              ),
              'created_at',
            ],
            [
              fn(
                'COALESCE',
                fn('TO_CHAR', col('user.updated_at'), 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
                '0001-01-01T00:00:00Z',
              ),
              'updated_at',
            ],
          ],
          where: {
            deleted_at: {
              [Op.is]: null,
            },
          },
          required: false,
        },
        {
          model: Project,
          as: 'project',
          attributes: [
            'id',
            'name',
            'status',
            'company_id',
            'end_on',
            [fn('COALESCE', col('is_internal'), false), 'is_internal'],
            'created_at',
            'updated_at',
            [literal('0'), 'amount'], // 0 AS amount
            [literal("'0001-01-01T00:00:00Z'"), 'date'], // '0001-01-01T00:00:00Z' AS date
            [literal('false'), 'is_connected'], // false AS is_connected
          ],
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
          attributes: [
            'id',
            'spent',
            'spent_in_hour',
            [
              fn(
                'COALESCE',
                fn('TO_CHAR', col('work_logs.date'), 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
                '0001-01-01T00:00:00Z',
              ),
              'date',
            ],
            [fn('COALESCE', col('work_logs.comment'), ''), 'comment'],
            [
              fn(
                'COALESCE',
                fn('TO_CHAR', col('work_logs.created_at'), 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
                '0001-01-01T00:00:00Z',
              ),
              'created_at',
            ],
            [
              fn(
                'COALESCE',
                fn('TO_CHAR', col('work_logs.updated_at'), 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
                '0001-01-01T00:00:00Z',
              ),
              'updated_at',
            ],
          ],
          required: false,
        },
      ],
      group: ['WorkItem.id', 'user.id', 'product.id', 'project.id', 'work_logs.id'],
    })) as WorkItemEntityDto;

    if (!workItem) {
      throw new NotFoundError(`No work item found`);
    }

    workItem.user.holiday_periods = JSON.parse(workItem.user.holiday_periods);
    workItem.user.work_percent_per_week = +workItem.user.work_percent_per_week;
    workItem.work_logs = workItem.work_logs.map((log) => DateFormatter.formatDTO(log));

    return DateFormatter.formatDTO(workItem);
  }

  async getWorkItem(workItemId: number): Promise<WorkItem> {
    const workItem = await this.workItemRepository.findByPk(workItemId);

    if (!workItem) {
      throw new NotFoundError(`No work item found`);
    }

    return workItem;
  }

  async selectProjectForTimeSheet(companyId: number): Promise<ProjectTimeSheetResponseDto[]> {
    const project = (await Project.findAll({
      attributes: [
        'id',
        [
          fn('CONCAT', fn('COALESCE', col('number.custom_id'), cast(col('number.id'), 'TEXT')), ' ', col('name')),
          'name',
        ],
        'status',
        'company_id',
        'end_on',
        [fn('COALESCE', col('is_internal'), false), 'is_internal'],
        [
          fn(
            'COALESCE',
            fn('TO_CHAR', col('Project.created_at'), 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
            '0001-01-01T00:00:00Z',
          ),
          'created_at',
        ],
        [
          fn(
            'COALESCE',
            fn('TO_CHAR', col('Project.updated_at'), 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
            '0001-01-01T00:00:00Z',
          ),
          'updated_at',
        ],
        [literal('0'), 'amount'], // 0 AS amount
        [literal("'0001-01-01T00:00:00Z'"), 'date'], // '0001-01-01T00:00:00Z' AS date
        [literal('false'), 'is_connected'], // false AS is_connected
      ],
      include: [
        {
          model: NumberEntry,
          as: 'number',
          attributes: [],
        },
      ],
      where: {
        company_id: companyId,
        status: 'active',
        deleted_at: { [Op.is]: null },
      },
      order: [['name', 'ASC']],
    })) as unknown as ProjectTimeSheetResponseDto[];

    if (!project || project.length === 0) {
      throw new NotFoundError('Not found project');
    }

    const data = project.map((item: ProjectTimeSheetResponseDto) => DateFormatter.formatDTO(item));

    return data;
  }

  async getProductTasks(companyId: number, productId: number): Promise<ProductTasksResponseDto[]> {
    const tasks = await Task.findAll({
      attributes: [[fn('DISTINCT', col('Task.name')), 'name']],
      where: {
        product_id: productId,
        deleted_at: { [Op.is]: null },
      },
      include: [
        {
          model: Project,
          as: 'project',
          attributes: [],
          where: {
            company_id: companyId,
            deleted_at: { [Op.is]: null },
          },
        },
      ],
      raw: true,
      order: [['name', 'ASC']],
    });

    return tasks as ProductTasksResponseDto[];
  }

  async resetValueIsHide(companyId: number, userId: number): Promise<number> {
    const [affectedCount] = await this.workItemRepository.update(
      {
        is_hide: true,
      },
      {
        where: {
          company_id: companyId,
          user_id: userId,
        },
      },
    );

    return affectedCount;
  }

  async updateValueIsHide(companyId: number, userId: number, ids: number[]): Promise<number> {
    const [affectedCount] = await this.workItemRepository.update(
      {
        is_hide: false,
      },
      {
        where: {
          id: {
            [Op.in]: ids,
          },
          company_id: companyId,
          user_id: userId,
        },
      },
    );

    return affectedCount;
  }

  async createWorkItem(user: User, data: WorkItemInputDto): Promise<void> {
    await this.workItemRepository.bulkCreate(
      // null is used to create a work item for product/service level
      [null, ...data.task_ids].map((task_id) => ({
        company_id: user.company_id,
        project_id: data.project_id,
        product_id: data.product_id,
        user_id: data.user_id ?? user.id,
        task_id: task_id,
        created_at: new Date(),
      })),
      {
        conflictWhere: {
          company_id: user.company_id,
          project_id: data.project_id,
          product_id: data.product_id,
          user_id: data.user_id ?? user.id,
          task_id: null, // This is used to find a work item for product/service level
        },
        ignoreDuplicates: true, // Ignore duplicates
      },
    );
  }

  async selectOrInsertWorkItem(user: User, data: WorkItemInputDto, task_id: number): Promise<[WorkItem, boolean]> {
    const userId = data.user_id || user.id;

    const [workItem, created] = await this.workItemRepository.findOrCreate({
      where: {
        company_id: user.company_id,
        project_id: data.project_id,
        product_id: data.product_id,
        user_id: userId,
        task_id: task_id,
      },
      defaults: {
        company_id: user.company_id,
        project_id: data.project_id,
        product_id: data.product_id,
        user_id: userId,
        task_id: task_id,
        created_at: new Date(),
      },
      raw: true,
    });

    return [workItem, created];
  }

  async updateWorkItem(workItemId: number, data: WorkItemInputDto, task_id: number): Promise<void> {
    const [affectedCount] = await this.workItemRepository.update(
      {
        product_id: data.product_id,
        task_id: task_id,
        user_id: data.user_id,
        updated_at: new Date(),
      },
      {
        where: {
          id: workItemId,
        },
      },
    );

    if (affectedCount === 0) {
      throw new NotFoundError(`No work item found`);
    }
  }

  async getListWorkItemsByCompanyId(
    companyId: number,
    user: {
      id: number;
      role: string;
    },
    query: QueryDateFilterUserId,
  ): Promise<WorkItemEntityDto[]> {
    try {
      // Get the start and end dates of the query
      const [start, end] = [getParsedOrFirstDateOfYear(query.start_date), getParsedOrLastDateOfYear(query.end_date)];
      if (start > end) {
        throw new BadRequestError('start date cannot larger than end date');
      }

      //if user = admin and user_id not empty then assign user_id to the query
      //else just assign user_id = user ID to the current query
      const wlUserId = query.user_id;
      const wiUserId = user.role === 'admin' && query.user_id ? query.user_id : user.id;

      const whereCondition: {
        company_id: number;
        user_id: number;
        deleted_at: { [Op.is]: null };
        '$project.is_internal$'?: { [Op.not]?: boolean } | boolean;
      } = {
        company_id: companyId,
        user_id: wiUserId,
        deleted_at: {
          [Op.is]: null,
        },
      };

      if (query.filter === 'billable') {
        whereCondition['$project.is_internal$'] = { [Op.not]: true };
      } else if (query.filter === 'internal') {
        whereCondition['$project.is_internal$'] = true;
      }

      const searchConditions = [];
      if (query.search) {
        const searchQuery = query.search;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const searchCondition: any = {
          [Op.or]: [
            { '$project.name$': { [Op.iLike]: `%${searchQuery}%` } },
            { '$project.details.location$': { [Op.iLike]: `%${searchQuery}%` } },
            { '$product.name$': { [Op.iLike]: `%${searchQuery}%` } },
            { '$project.number.custom_id$': { [Op.iLike]: `%${searchQuery}%` } },
          ],
        };

        try {
          // Get task IDs related to the search query
          const taskIds = await this.findTasks(searchQuery);

          // If task IDs were found, add them to the search conditions
          if (taskIds.length > 0) {
            searchCondition[Op.or].push({ '$tasks.id$': { [Op.in]: taskIds } });
          }
        } catch (error) {
          this.logger.error('Error processing work item task search:', error);
        }

        searchConditions.push(searchCondition);
      }

      const orderCondition: Array<[string, string, 'ASC' | 'DESC'] | [string, 'ASC' | 'DESC']> = [
        ['product', 'name', 'ASC'],
        ['project', 'name', 'ASC'],
        ['id', 'DESC'],
      ];

      const workItems = (await WorkItem.findAll({
        attributes: [
          'id',
          'product_id',
          'is_hide',
          [
            fn(
              'COALESCE',
              fn('TO_CHAR', col('WorkItem.created_at'), 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
              '0001-01-01T00:00:00Z',
            ),
            'created_at',
          ],
          [
            fn(
              'COALESCE',
              fn('TO_CHAR', col('WorkItem.updated_at'), 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
              '0001-01-01T00:00:00Z',
            ),
            'updated_at',
          ],
        ],
        include: [
          {
            model: User,
            as: 'user',
            attributes: { exclude: ['password', 'metadata', 'nickname', 'deleted_at'] },
            where: {
              deleted_at: {
                [Op.is]: null,
              },
            },
            required: false,
          },
          {
            model: Product,
            as: 'product',
            attributes: ['id', 'name'],
            required: false,
          },
          {
            model: Project,
            as: 'project',
            attributes: [
              'id',
              [
                fn(
                  'CONCAT',
                  fn('COALESCE', col('project.number.custom_id'), cast(col('project.number.id'), 'TEXT')),
                  ' ',
                  col('project.name'),
                ),
                'name',
              ],
              'status',
            ],
            where: {
              deleted_at: {
                [Op.is]: null,
              },
            },
            required: true,
            include: [
              {
                model: NumberEntry,
                as: 'number',
                attributes: [],
              },
              {
                model: ProjectDetails,
                as: 'details',
                attributes: ['location'],
              },
            ],
          },
          {
            model: Task,
            as: 'tasks',
            attributes: ['id', 'name', 'parent_task_id'],
            where: {
              deleted_at: {
                [Op.is]: null,
              },
            },
            required: false, // Make it optional to allow work items without tasks
          },
          {
            model: WorkLog,
            as: 'work_logs',
            attributes: [
              'id',
              'spent',
              'spent_in_hour',
              [
                fn(
                  'COALESCE',
                  fn('TO_CHAR', col('work_logs.date'), 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
                  '0001-01-01T00:00:00Z',
                ),
                'date',
              ],
              [fn('COALESCE', col('work_logs.comment'), ''), 'comment'],
              'work_item_id',
            ],
            where: {
              user_id: wlUserId,
              date: {
                [Op.gte]: Sequelize.literal(`'${formatDateToYYYYMMDD(start)}'`),
                [Op.lte]: Sequelize.literal(`'${formatDateToYYYYMMDD(end)}'`),
              },
            },
            required: false,
          },
        ],
        where: {
          ...whereCondition,
          ...(searchConditions.length > 0 ? { [Op.and]: searchConditions } : {}),
        },
        order: orderCondition,
      })) as WorkItemEntityDto[];

      if (workItems.length === 0) {
        throw new NotFoundError('No work items found for the company');
      }

      // Rehandle the work items
      // Group work items by project ID to avoid duplicate API calls
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const projectIds = [...new Set(workItems.map((item) => item.project.id))];

      // Fetch products for all projects in a single batch
      const projectProductsMap = await this.productService.getProjectsProducts(companyId, projectIds);

      // Map the products to each work item
      const updatedWorkItems = workItems.map((item) => {
        const products = projectProductsMap.get(item.project.id) || [];

        products.forEach((prd) => {
          if (item.product_id === prd.id) {
            item.product.name = prd.name;
          }
        });

        // Handle special task case
        // if (item.task === 'Import aus TIM' && start.getFullYear() >= 2023) {
        //   item.task = 'Planungsleistungen';
        // }

        // Format work logs
        item.work_logs?.forEach((log, logIndex) => {
          item.work_logs[logIndex].spent = parseFloat(log.spent).toFixed(2);
        });

        // Parse user data
        if (item.user) {
          item.user.holiday_periods = JSON.parse(item.user.holiday_periods);
          item.user.work_percent_per_week = +item.user.work_percent_per_week;
        }

        return item;
      });

      const data = updatedWorkItems.map((item) => DateFormatter.formatDTO(item));

      return data;
    } catch (error) {
      this.logger.error(error);
      return [];
    }
  }

  async getListTask(companyId: number, user: User, query: QueryDateFilterUserId): Promise<WorkItem[]> {
    // Get the start and end dates of the query
    const [start, end] = [getParsedOrFirstDateOfYear(query.start_date), getParsedOrLastDateOfYear(query.end_date)];
    if (start > end) {
      throw new BadRequestError('start date cannot larger than end date');
    }

    //if user = admin and user_id not empty then assign user_id to the query
    //else just assign user_id = user ID to the current query
    const userId = user.role === 'admin' && query.user_id ? query.user_id : user.id;

    const whereCondition: {
      company_id: number;
      user_id: number;
      deleted_at: { [Op.is]: null };
      '$project.is_internal$'?: { [Op.not]?: boolean } | boolean;
    } = {
      company_id: companyId,
      deleted_at: { [Op.is]: null },
      user_id: userId,
    };

    if (query.filter === 'billable') {
      whereCondition['$project.is_internal$'] = { [Op.not]: true };
    } else if (query.filter === 'internal') {
      whereCondition['$project.is_internal$'] = true;
    }

    const orderCondition: Array<[string, string, 'ASC' | 'DESC'] | [string, 'ASC' | 'DESC']> = [
      ['product', 'name', 'ASC'],
      ['project', 'name', 'ASC'],
      ['id', 'DESC'],
    ];

    const tasks = await WorkItem.findAll({
      attributes: [
        'id',
        'product_id',
        'task',
        'is_hide',
        [
          fn(
            'COALESCE',
            fn('TO_CHAR', col('WorkItem.created_at'), 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
            '0001-01-01T00:00:00Z',
          ),
          'created_at',
        ],
        [
          fn(
            'COALESCE',
            fn('TO_CHAR', col('WorkItem.updated_at'), 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
            '0001-01-01T00:00:00Z',
          ),
          'updated_at',
        ],
      ],
      include: [
        {
          model: Product,
          as: 'product',
          required: false,
          attributes: ['id', 'price', 'name', 'description', 'folder', 'created_at', 'updated_at'],
        },
        {
          model: Project,
          as: 'project',
          required: true,
          where: {
            deleted_at: { [Op.is]: null },
            status: { [Op.notIn]: ['archived'] }, // Exclude archived projects
          },
          include: [
            {
              model: NumberEntry,
              as: 'number',
              attributes: [],
            },
          ],
          attributes: [
            'id',
            [
              fn(
                'CONCAT',
                fn('COALESCE', col('project.number.custom_id'), cast(col('project.number.id'), 'TEXT')),
                ' ',
                col('project.name'),
              ),
              'name',
            ],
            'status',
            'company_id',
            'end_on',
            [fn('COALESCE', col('is_internal'), false), 'is_internal'],
            'created_at',
            'updated_at',
            [literal('0'), 'amount'], // 0 AS amount
            [literal("'0001-01-01T00:00:00Z'"), 'date'], // '0001-01-01T00:00:00Z' AS date
            [literal('false'), 'is_connected'], // false AS is_connected
          ],
        },
        {
          model: Task,
          as: 'tasks',
          attributes: ['id', 'name', 'parent_task_id'],
          where: {
            deleted_at: {
              [Op.is]: null,
            },
          },
          required: false, // Make it optional to allow work items without tasks
        },
        {
          model: WorkLog,
          as: 'work_logs',
          required: false,
          where: {
            deleted_at: { [Op.is]: null },
            date: {
              [Op.gte]: Sequelize.literal(`'${formatDateToYYYYMMDD(start)}'`),
              [Op.lte]: Sequelize.literal(`'${formatDateToYYYYMMDD(end)}'`),
            },
          },
          attributes: [],
        },
      ],
      where: whereCondition,
      order: orderCondition,
    });

    // if (tasks.length === 0) {
    //   throw new NotFoundError('No work items found for the company');
    // }

    const data = tasks.map((item) => DateFormatter.formatDTO(item));
    return data;
  }

  async getFlexHours(
    user: User,
    query: QueryDateUserId,
  ): Promise<{
    results: FlexHourEntityDto[];
    appliedHolidays: HolidayDto[];
  }> {
    // Get the start and end dates of the query
    const [start, end] = [getParsedOrFirstDateOfYear(query.start_date), getParsedOrLastDateOfYear(query.end_date)];
    if (start > end) {
      throw new BadRequestError('start date cannot larger than end date');
    }
    let getUser: User = new User();

    if (query.user_id && user.role === 'admin') {
      getUser = (await this.userService.findUserById(user, user.id.toString())).dataValues;
    }

    let periods = await this.getTimesheetPeriods(query.user_id);

    const endOfDate = new Date();
    endOfDate.setHours(23, 59, 59, 999);

    periods =
      periods.length > 0
        ? periods
        : [
            new TimeSheetPeriodsEntityDto(
              getParsedOrFirstDateOfYear(null),
              endOfDate,
              getUser.work_percent_per_week,
              getUser.max_work_hours_per_day,
              0.0,
            ),
          ];

    const results: FlexHourEntityDto[] = [];

    const holidays = (await this.settingService.getSettingValue(
      user.company_id,
      'timesheet',
      'holidays',
    )) as HolidayDto[];
    let appliedHolidays: HolidayDto[] = [];

    holidays.forEach((v: HolidayDto) => {
      const tmpValue = v;
      const tmpDateValue = tmpValue['date'];
      if (tmpDateValue) {
        const tmpDate = tmpDateValue as string;
        if (tmpDate.length > 0) {
          const parsedDate = parseDate(tmpDate);
          if (!parsedDate) {
            throw new BadRequestError('Error parsing date');
          }
          const dayOfWeek = parsedDate.getDay();
          if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            appliedHolidays.push({
              date: parsedDate,
              label: tmpValue['label'],
            });
          }
        }
      }
    });

    const years: Map<number, number> = new Map<number, number>();

    for (const p of periods) {
      const pStartDate = parseDate(p.start_date);
      const pEndDate = parseDate(p.end_date);

      // Just use the data after 2020
      if (pStartDate.getFullYear() < 2020) {
        continue;
      }
      // Check if in range only
      if (pStartDate > end || pEndDate < start) {
        continue;
      }

      const rows = await this.getFlexHoursByRange(
        user.company_id,
        query.user_id,
        p.start_date,
        p.end_date,
        p.actual_hours_per_day,
        p.latest_flex_hours,
        appliedHolidays,
      );

      rows.forEach((r, index) => {
        rows[index] = processHolidays(r, appliedHolidays);
        rows[index].date = formatDateToISOStringWithMachineTimezone(r.date as Date);
      });

      if (rows.length > 0) {
        years.set(pStartDate.getFullYear(), rows[rows.length - 1].flex_hours);

        results.push(...rows);
      }
    }

    appliedHolidays = appliedHolidays.map((h) => DateFormatter.formatDTO(h));

    return { results, appliedHolidays };
  }

  async getFlexHoursByRange(
    companyId: number,
    userId: number,
    start: string | Date,
    end: string | Date,
    actualHour: number,
    lastMonthHours: number,
    holidays: HolidayDto[],
  ): Promise<FlexHourEntityDto[]> {
    const GET_FLEX_HOURS_BY_RANGE_SQL = await this.cacheService.getConfigValue('GET_FLEX_HOURS_BY_RANGE_SQL');
    const query = GET_FLEX_HOURS_BY_RANGE_SQL;

    const flexHours = await this.workItemRepository.sequelize.query<FlexHourEntityDto>(query, {
      replacements: [start, end, userId, userId, companyId, +actualHour, +actualHour, lastMonthHours],
      type: QueryTypes.SELECT,
    });

    if (flexHours.length === 0) {
      throw new BadRequestError('No flex hours found for the user');
    }

    let shiftBy = 0;
    flexHours.forEach((r, i) => {
      holidays.forEach((h) => {
        if (compareDates(r.date, h.date) === 0) {
          shiftBy += +actualHour;
        }
      });
      flexHours[i].actual_hours = +flexHours[i].actual_hours;
      flexHours[i].flex_hours = +flexHours[i].flex_hours + shiftBy;
    });

    return flexHours;
  }

  async getTimesheetPeriods(userId: number): Promise<TimeSheetPeriodsEntityDto[]> {
    const user = await User.findOne({
      attributes: ['timesheet_periods'],
      where: {
        id: userId,
      },
      raw: true,
    });

    if (!user || !user.timesheet_periods) {
      return [];
    }

    return user.timesheet_periods as TimeSheetPeriodsEntityDto[];
  }

  async getHolidays(currentUser: User): Promise<UserHoliday[]> {
    const userHolidays = await this.userHolidayRepository.findAll({
      where: {
        user_id: currentUser.id,
        deleted_at: null,
      },
    });

    return userHolidays;
  }

  async createHoliday(currentUser: User, startDate: Date, endDate: Date): Promise<Date[]> {
    const companySetting = await this.settingRepository.findOne({
      where: {
        company_id: currentUser.company_id,
      },
      raw: true,
    });
    if (!companySetting) {
      throw new BadRequestError('Company setting not found');
    }

    // Get data from settings
    const taskName = companySetting.timesheet['default_holiday_task'];
    const productId =
      typeof companySetting.timesheet['default_holiday_product'] === 'number'
        ? companySetting.timesheet['default_holiday_product']
        : parseInt(companySetting.timesheet['default_holiday_product']);

    if (!taskName) {
      throw new BadRequestError('Default holiday task not found');
    }
    if (!companySetting.timesheet['default_holiday_product']) {
      throw new BadRequestError('Default holiday product not found');
    }
    const task = await Task.findOne({
      where: {
        name: taskName,
        product_id: productId,
        deleted_at: null,
      },
      include: [
        {
          model: Product,
          as: 'product',
          where: {
            company_id: currentUser.company_id,
          },
        },
      ],
      attributes: ['id'],
      raw: true,
    });

    if (!task) {
      throw new BadRequestError(`Task "${taskName}" not found for product ID ${productId}`);
    }

    // Find work_item_id
    let workItems = await this.workItemRepository.findAll({
      where: {
        product_id: productId,
        user_id: currentUser.id,
        task_id: task.id,
        deleted_at: null,
      },
    });

    if (workItems.length > 1) {
      throw new InternalServerError('Internal server error, please contact admin about this issue.');
    }
    if (workItems.length === 0) {
      workItems = await this.workItemRepository.findAll({
        where: {
          company_id: currentUser.company_id,
          product_id: productId,
          deleted_at: null,
        },
        order: [['id', 'DESC']],
        limit: 1,
      });
      if (workItems.length === 0) {
        throw new BadRequestError('No work item found');
      }

      const workItem = await this.workItemRepository.create({
        company_id: currentUser.company_id,
        user_id: currentUser.id,
        project_id: workItems[0].project_id,
        product_id: productId,
        is_hide: false,
        created_at: new Date(),
      });
      if (!workItem) {
        throw new InternalServerError('Failed when creating work item');
      }

      workItems = [workItem];
    }

    // Get timesheet periods
    const periods = await this.getTimesheetPeriods(currentUser.id);

    // Start transaction
    const transaction = await this.workItemRepository.sequelize.transaction();

    try {
      const workLogs: WorkLog[] = [];
      const days = daysBetween(startDate, endDate);
      const dates: Date[] = [];

      for (let i = 0; i <= days; i++) {
        const processDate = this.addDays(startDate, i);
        dates.push(processDate);

        if (isWeekend(processDate)) {
          continue;
        }

        // Originally, get actual hours from timesheet settings
        // If no periods found, set 8.5 as default working hour
        let actualSpent = Number(companySetting.timesheet['must_working_hours']) ?? 8.5;
        for (const period of periods) {
          const parsedStartDate: Date = new Date(period.start_date);
          const parsedEndDate: Date | null = period.end_date ? new Date(period.end_date) : null;
          if (dateInRange(parsedStartDate, parsedEndDate, processDate)) {
            actualSpent = +period.actual_hours_per_day;
          }
        }
        const actualSpentDuration = this.parseDuration(`${actualSpent}h`);

        // Save work log
        const workLog = await this.workLogRepository.create(
          {
            company_id: currentUser.company_id,
            user_id: workItems[0].user_id,
            work_item_id: workItems[0].id,
            date: processDate,
            created_at: new Date(),
            spent: actualSpentDuration.toString(),
            spent_in_hour: actualSpent,
          },
          { transaction },
        );
        workLogs.push(workLog);
      }

      const workLogIds: number[] = workLogs.map((workLog) => workLog.id);
      const userHoliday = await this.userHolidayRepository.create(
        {
          user_id: currentUser.id,
          company_id: currentUser.company_id,
          work_log_ids: workLogIds,
          start: startDate,
          end: endDate,
          created_at: new Date(),
        },
        { transaction },
      );
      if (!userHoliday) {
        throw new Error('Failed when creating user holiday');
      }

      // Commit transaction
      await transaction.commit();
      return dates;
    } catch (error) {
      await transaction.rollback();
      throw new InternalServerError('Error');
    }
  }

  async removeUserHolidays(currentUser: User, userHolidayId: number): Promise<void> {
    const holiday = await this.userHolidayRepository.findOne({
      where: {
        id: userHolidayId,
        user_id: currentUser.id,
        company_id: currentUser.company_id,
      },
    });
    if (!holiday) {
      throw new BadRequestError('User holiday does not exist');
    }

    // Start transaction
    const transaction = await this.userHolidayRepository.sequelize.transaction();

    try {
      // Remove work logs by id
      await this.workLogRepository.update(
        {
          deleted_at: new Date(),
        },
        {
          where: {
            id: {
              [Op.in]: holiday.work_log_ids,
            },
          },
          transaction,
        },
      );

      // Soft delete
      await this.userHolidayRepository.update(
        {
          deleted_at: new Date(),
        },
        {
          where: { id: userHolidayId },
          transaction,
        },
      );

      // Commit transaction
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw new InternalServerError('Error while removing user holidays');
    }
  }

  async deleteWorkItem(companyId: number, workItemId: number): Promise<void> {
    const [affectedCount] = await this.workItemRepository.update(
      {
        deleted_at: new Date(),
      },
      {
        where: {
          id: workItemId,
          company_id: companyId,
        },
      },
    );

    if (affectedCount === 0) {
      throw new NotFoundError(`Work item with id ${workItemId} not found.`);
    }
  }

  private addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  private parseDuration(input: string): string {
    // Handle empty input or zero hours directly
    if (!input || input === '0h') {
      return '0s';
    }

    // Extract the numeric part of the input
    const match = input.match(/^([\d.]+)h$/);
    if (!match) {
      throw new Error("Invalid time format. Expected a string like '8.5h'.");
    }

    // Parse the hours as a number
    const totalHours = parseFloat(match[1]);

    // Calculate hours, minutes, and seconds
    const hours = Math.floor(totalHours);
    const minutes = Math.floor((totalHours - hours) * 60);
    const seconds = Math.round(((totalHours - hours) * 60 - minutes) * 60);

    // Return the formatted string
    if (hours === 0 && minutes === 0 && seconds === 0) {
      return '0s';
    }
    return `${hours > 0 ? `${hours}h` : ''}${minutes > 0 ? `${minutes}m` : ''}${seconds > 0 ? `${seconds}s` : ''}`;
  }

  /**
   * This method ensures that:
   * - When a parent task matches: returns both parent and all its subtasks
   * - When a subtask matches: returns both the subtask and its parent task
   */
  private async findTasks(taskNameQuery: string): Promise<number[]> {
    if (!taskNameQuery.trim()) {
      return [];
    }

    // Find all tasks matching the search term
    const matchingTasks = await Task.findAll({
      attributes: ['id', 'parent_task_id'],
      where: {
        name: { [Op.iLike]: `%${taskNameQuery}%` },
        deleted_at: { [Op.is]: null },
      },
    });

    // If no matching tasks, return empty array
    if (matchingTasks.length === 0) {
      return [];
    }

    const allTaskIds = new Set<number>();
    const matchedParentTaskIds: number[] = [];

    matchingTasks.forEach((task) => {
      // Add all matching task IDs to our set
      allTaskIds.add(task.id);

      if (task.parent_task_id) {
        // If this is a subtask, also add its parent ID
        allTaskIds.add(task.parent_task_id);
      } else {
        // If this is a parent task, track it to find its subtasks later
        matchedParentTaskIds.push(task.id);
      }
    });

    // Find additional subtasks of any parent tasks we found
    if (matchedParentTaskIds.length > 0) {
      const additionalSubtasks = await Task.findAll({
        attributes: ['id'],
        where: {
          parent_task_id: { [Op.in]: matchedParentTaskIds },
          deleted_at: { [Op.is]: null },
        },
      });

      // Add all subtask IDs to our set
      additionalSubtasks.forEach((task) => {
        allTaskIds.add(task.id);
      });
    }

    return Array.from(allTaskIds);
  }
}
