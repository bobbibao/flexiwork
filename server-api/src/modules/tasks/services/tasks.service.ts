import { Op, WhereOptions } from 'sequelize';
import { TaskState } from 'src/database/models';
import Attachment from 'src/database/models/attachment.model';
import Comment from 'src/database/models/comment.model';
import Product from 'src/database/models/products.model';
import Project from 'src/database/models/projects.model';
import TaskAssignee from 'src/database/models/task-assignee.model';
import Task from 'src/database/models/task.model';
import User from 'src/database/models/users.model';
import { ProductService } from 'src/modules/product/services/product.service';
import { SettingService } from 'src/modules/setting/services/setting.service';
import { PaginatedResponse } from 'src/shared/interfaces';
import { BadRequestError, InternalServerError, NotFoundError } from 'src/shared/utils';
import { getFilterOptions, getOrderOptions } from 'src/shared/utils/generate-ORM-options';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { BulkDeleteTasksDto, BulkUpdateTasksDto, CreateCommentDto, UpdateTaskDto, UndoTasksDto } from '../dtos';
import { ProductWithTask, TasksByProjects } from '../dtos/task-by-project.dto';
import { CreateTaskDto } from '../dtos/task-create.dto';
import NumberEntry from 'src/database/models/numbers.model';
import { ConfigService } from '@nestjs/config';
import { existsSync } from 'fs';
import WorkItem from 'src/database/models/work-items.model';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);
  private readonly UPLOADS_API_PATH: string;
  private readonly UPLOAD_PATH: string;

  constructor(
    @Inject('TASK_REPOSITORY')
    private readonly taskRepository: typeof Task,
    @Inject('TASK_ASSIGNEE_REPOSITORY')
    private readonly taskAssigneeRepository: typeof TaskAssignee,
    @Inject('COMMENT_REPOSITORY')
    private readonly commentRepository: typeof Comment,
    @Inject('ATTACHMENT_REPOSITORY')
    private readonly attachmentRepository: typeof Attachment,
    @Inject('PROJECT_REPOSITORY')
    private readonly projectRepository: typeof Project,
    private readonly configService: ConfigService,
    private readonly settingService: SettingService,
    private readonly productService: ProductService,
  ) {
    this.UPLOAD_PATH = this.configService.get<string>('UPLOAD_PATH');
    this.UPLOADS_API_PATH = this.configService.get<string>('UPLOADS_API_PATH', 'api/uploads');
  }

  async getCommentById(commentId: number): Promise<Comment> {
    const comment = await this.commentRepository.findByPk(commentId, {
      include: [
        {
          model: Attachment,
          as: 'attachments',
        },
        {
          model: User,
          as: 'user',
        },
      ],
    });
    if (!comment) {
      throw new NotFoundError('Comment not found');
    }

    return comment;
  }

  async getTaskStatusById(statusId: number, companyId: number): Promise<TaskState> {
    const getStatus = await this.settingService.getSettingValue<TaskState[]>(companyId, 'task', 'statuses');
    const status = getStatus.find((item) => item.id === statusId);
    if (!status) {
      throw new NotFoundError('Task status not found');
    }

    return status;
  }

  async getTaskPriorityById(priorityId: number, companyId: number): Promise<TaskState> {
    const getPriority = await this.settingService.getSettingValue<TaskState[]>(companyId, 'task', 'priorities');
    const priority = getPriority.find((item) => item.id === priorityId);
    if (!priority) {
      throw new NotFoundError('Task priority not found');
    }

    return priority;
  }

  async createAttachment(commentId: number, path: string, filename: string): Promise<Attachment> {
    const result = await this.attachmentRepository.create({
      filename,
      comment_id: commentId,
      path,
      created_at: new Date(),
    });

    if (!result) {
      throw new BadRequestError('Failed to create attachment');
    }

    return result;
  }

  async createComment(taskId: number, userId: number, data: CreateCommentDto): Promise<Comment> {
    try {
      await this.getTaskById(taskId);
      if (data.reply_to) {
        const cm = await this.getCommentById(data.reply_to);

        if (+cm.dataValues.task_id !== +taskId) {
          throw new BadRequestError('Comment not related to task');
        }
      }

      const { attachments, ...cmData } = data;

      const comment = await this.commentRepository.create({
        ...cmData,
        owner_id: userId,
        task_id: taskId,
        created_at: new Date(),
      });
      if (!comment) {
        throw new BadRequestError('Failed to create comment');
      }

      if (attachments && attachments.length > 0) {
        attachments.forEach(async (attach) => {
          await this.createAttachment(comment.id, attach.path, attach.filename);
        });
      }

      const result = await this.getCommentById(comment.id);

      return result;
    } catch (error) {
      this.logger.error(error);
      throw new BadRequestError('Failed to create comment');
    }
  }

  async getTaskAssigneesByTaskId(taskId: number): Promise<TaskAssignee[]> {
    const task = await this.getTaskById(taskId);

    const assignees = await this.taskAssigneeRepository.findAll({ where: { task_id: task.id } });
    return assignees;
  }

  async updateTaskAssignees(taskId: number, assignees: number[]): Promise<TaskAssignee[]> {
    const task = await this.getTaskById(taskId);
    const uniqueAssignees = [...new Set(assignees)];

    // delete all assignees
    await this.deleteAllTaskAssignees(taskId);
    if (uniqueAssignees.length === 0) {
      return [];
    }

    // check if assignees exist
    for (const assignee of uniqueAssignees) {
      const assigneeExists = await User.findOne({ where: { id: assignee } });
      if (!assigneeExists) {
        throw new NotFoundError(`Assignee with ID ${assignee} not found`);
      }
    }

    const assigneesData = uniqueAssignees.map((assigneeId) => ({
      task_id: task.id,
      user_id: assigneeId,
    }));

    const results = await this.taskAssigneeRepository.bulkCreate(assigneesData);

    return results;
  }

  async deleteAllTaskAssignees(taskId: number): Promise<void> {
    const task = await this.getTaskById(taskId);
    await this.taskAssigneeRepository.destroy({
      where: {
        task_id: task.id,
      },
    });
  }

  async updateTask(taskId: number, companyId: number, data: UpdateTaskDto): Promise<Task> {
    const currentTask = await Task.findOne({
      where: { id: taskId, deleted_at: null },
    });
    if (!currentTask) {
      throw new NotFoundError('Task not found');
    }

    const dueDate = new Date(data.due_date);
    if (isNaN(dueDate.getTime())) {
      throw new BadRequestError('Invalid date format');
    }

    const project = await Project.findOne({ where: { id: data.project_id } });
    if (!project) {
      throw new NotFoundError('Project not found');
    }

    await this.getTaskStatusById(data.status_id, companyId);
    await this.updateTaskAssignees(taskId, data.assignee_to);

    if (data.parent_task_id) {
      try {
        await this.getTaskById(data.parent_task_id);
      } catch (error) {
        throw new NotFoundError('Parent task not found');
      }
    }

    const [, tasks] = await this.taskRepository.update(
      { ...data, due_date: dueDate, updated_at: new Date() },
      {
        where: { id: taskId },
        returning: true,
      },
    );

    const listTaskChildren = await Task.findAll({
      where: {
        parent_task_id: taskId,
        deleted_at: null,
      },
    });

    if (data.product_id !== currentTask.product_id && listTaskChildren.length > 0) {
      for (const child of listTaskChildren) {
        await this.taskRepository.update(
          { product_id: data.product_id, project_id: data.project_id, updated_at: new Date() },
          { where: { id: child.id } },
        );
      }
    }

    if (!tasks || tasks.length === 0) {
      throw new BadRequestError('Failed to update task');
    }

    return tasks[0];
  }

  async bulkUpdateTasks(currentUser: User, bulkUpdateTasksDto: BulkUpdateTasksDto): Promise<void> {
    const { ids, status_id: statusId } = bulkUpdateTasksDto;

    // Validate if status id is existing
    await this.getTaskStatusById(statusId, currentUser.company_id);

    const transaction = await Task.sequelize.transaction();
    try {
      for (const taskId of ids) {
        const existingTask = await Task.findOne({ where: { id: taskId } });
        if (!existingTask) {
          continue;
        }

        existingTask.status_id = statusId;
        existingTask.updated_at = new Date();
        existingTask.updated_by = currentUser.id;
        await existingTask.save({ transaction });
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw new InternalServerError('Failed to update tasks');
    }
  }

  async bulkDeleteTasks(currentUser: User, bulkDeleteTasksDto: BulkDeleteTasksDto): Promise<void> {
    const { ids } = bulkDeleteTasksDto;

    const transaction = await Task.sequelize.transaction();

    try {
      for (const taskId of ids) {
        const existingTasks = await Task.findAll({
          where: {
            [Op.or]: [{ id: taskId }, { parent_task_id: taskId }],
          },
        });

        if (!existingTasks) {
          continue;
        }

        for (const task of existingTasks) {
          await this.taskRepository.update(
            {
              deleted_by: currentUser.id,
              deleted_at: new Date(),
            },
            {
              where: { id: task.id },
              transaction,
            },
          );
        }
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw new InternalServerError(`Failed to delete tasks`);
    }
  }

  async createTask(data: CreateTaskDto, currentUserId: number, companyId: number): Promise<Task> {
    const transaction = await Task.sequelize.transaction();
    try {
      const dueDate = new Date(data.due_date);
      if (isNaN(dueDate.getTime())) {
        throw new BadRequestError('Invalid date format');
      }

      const project = await this.projectRepository.findOne({ where: { id: data.project_id } });
      if (!project) {
        throw new BadRequestError('Project not found');
      }

      await this.getTaskStatusById(data.status_id, companyId);

      if (data.parent_task_id) {
        const parentTask = await Task.findOne({ where: { id: data.parent_task_id } });
        if (!parentTask) {
          throw new BadRequestError('Parent task not found');
        }
      }

      if (data.assignee_to.length > 0) {
        data.assignee_to.forEach(async (assignee) => {
          const assigneeExists = await User.findOne({ where: { id: assignee } });
          if (!assigneeExists) {
            throw new BadRequestError(`Assignee with ID ${assignee} not found`);
          }
        });
      } else {
        throw new BadRequestError('At least one assignee must be specified');
      }

      // Create the task
      const task = await Task.create(
        {
          project_id: data.project_id,
          name: data.name,
          status_id: data.status_id,
          priority_id: data.priority_id,
          due_date: dueDate,
          input_data: data.input_data,
          output_data: data.output_data,
          description: data.description,
          parent_task_id: data.parent_task_id,
          product_id: data.product_id || null,
          created_at: new Date(),
          created_by: currentUserId,
        },
        { transaction },
      );

      // Create task assignees
      const assignees = data.assignee_to.map((assigneeId) => ({
        task_id: task.id,
        user_id: assigneeId,
      }));

      await TaskAssignee.bulkCreate(assignees, { transaction });

      // Commit the transaction
      await transaction.commit();

      return task;
    } catch (error) {
      this.logger.error(error);
      // Rollback the transaction in case of failure
      await transaction.rollback();
      // Throw a specific error for invalid date or handle Sequelize errors
      if (error instanceof BadRequestError) {
        throw error;
      } else {
        throw new BadRequestError('Task creation failed');
      }
    }
  }

  async deleteTask(currentUser: User, taskId: number): Promise<void> {
    // Validate task
    const existingTasks = await Task.findAll({
      where: {
        [Op.or]: [{ id: taskId }, { parent_task_id: taskId }],
      },
    });
    if (!existingTasks) {
      throw new BadRequestError('Task not found');
    }

    const transaction = await Task.sequelize.transaction();
    try {
      for (const task of existingTasks) {
        await this.taskRepository.update(
          { deleted_by: currentUser.id, deleted_at: new Date() },
          {
            where: { id: task.id },
            transaction,
          },
        );
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw new BadRequestError(`Error when deleting task`);
    }
  }

  async getTasks(
    currentUser: User,
    page: number,
    pageSize: number,
    order: string,
    filters: string[],
    search: string,
    getSoftDeleted: boolean,
  ): Promise<PaginatedResponse<Task>> {
    // Generate order options from order input
    const orderOptions = getOrderOptions<Task>(
      order || 'id:DESC',
      ['id', 'name', 'description', 'due_date', 'priority_id', 'status_id', 'input_data', 'output_data', 'created_at'],
      {
        project: ['project', 'name'],
        task_assignee: ['task_assignees', 'user', 'email'],
        created_by: ['creator', 'email'],
      },
    );

    // Get searched projects
    const searchedProjectIds = await this.findProjectIdsByName(currentUser, search);
    // Generate where options from filters & search inputs
    !getSoftDeleted && filters.push('deleted_at:null');
    searchedProjectIds.length && filters.push(`project_id:${searchedProjectIds.join(',')}`);
    let whereOptions = getFilterOptions<Task>(filters, search, ['status_id', 'priority_id', 'project_id'], ['name'], {
      deleted_at: () => null,
      status_id: (value) => ({
        [Op.in]: value.split(',').map((v) => +v),
      }),
      project_id: () => ({
        [Op.in]: searchedProjectIds,
      }),
    });

    // Get assignee filter
    const assigneeFilter: number[] = filters
      .map((filter) => {
        if (filter.includes('task_assignee:')) {
          return parseInt(filter.split(':')[1]);
        }
        return null;
      })
      .filter((filter) => !!filter);

    // Get task ids that match the assignee filter
    const filteredTaskIds = await this.getFilteredTaskIds(
      whereOptions,
      assigneeFilter.length === 0 ? [] : assigneeFilter,
    );

    // Handle query
    whereOptions = {
      id: {
        [Op.in]: filteredTaskIds,
      },
      deleted_at: {
        ...(getSoftDeleted ? { [Op.not]: null } : { [Op.eq]: null }),
      },
      ...whereOptions,
    };
    const { rows: tasks, count: totalItems } = await this.taskRepository.findAndCountAll({
      where: whereOptions,
      distinct: true,
      col: 'id',
      limit: pageSize,
      offset: (page - 1) * pageSize,
      include: [
        {
          model: Project,
          as: 'project',
          include: [
            {
              model: NumberEntry,
              as: 'number',
            },
          ],
        },
        {
          model: Product,
          as: 'product',
        },
        {
          model: TaskAssignee,
          as: 'task_assignees',
          include: [
            {
              model: User,
              as: 'user',
            },
          ],
        },
        {
          model: User,
          as: 'creator',
        },
        {
          model: User,
          as: 'eraser',
        },
        {
          model: Comment,
          as: 'comments',
          include: [
            {
              model: User,
              as: 'user',
            },
          ],
          order: [['id', 'DESC']],
        },
      ],
      order: orderOptions,
    });

    const dataResult = (await Promise.all(
      tasks.map(async (task) => {
        const [task_status, task_priority] = await Promise.all([
          this.getTaskStatusById(task.dataValues.status_id, currentUser.company_id),
          this.getTaskPriorityById(task.dataValues.priority_id, currentUser.company_id),
        ]);

        return {
          ...task.toJSON(),
          task_status,
          task_priority,
        };
      }),
    )) as Task[];
    return {
      items: dataResult,
      total_items: totalItems,
      total_pages: Math.ceil(totalItems / pageSize),
      current_page: page,
      page_size: pageSize,
    };
  }

  async listAllTasksByProject(currentUser: User, filters: string[], search: string): Promise<TasksByProjects[]> {
    // Get searched projects id
    const searchedProjectIds = await this.findProjectIdsByName(currentUser, search);

    // Generate where task options from filters & search inputs
    filters.push('deleted_at:null');
    searchedProjectIds.length && filters.push(`project_id:${searchedProjectIds.join(',')}`);
    const whereTaskOptions = getFilterOptions<Task>(
      filters,
      search,
      ['status_id', 'priority_id', 'project_id'],
      ['name'],
      {
        deleted_at: () => null,
        status_id: (value) => ({
          [Op.in]: value.split(',').map((v) => +v),
        }),
        project_id: () => ({
          [Op.in]: searchedProjectIds,
        }),
      },
    );

    // Get assignee filter
    const assigneeFilter: number[] = filters
      .map((filter) => (filter.includes('task_assignee:') ? parseInt(filter.split(':')[1]) : null))
      .filter((filter) => !!filter);

    // Get task ids that match the assignee filter
    const filteredTaskIds = await this.getFilteredTaskIds(
      whereTaskOptions,
      assigneeFilter.length === 0 ? [] : assigneeFilter,
      true,
    );

    // Fetch projects without products
    const projects = await this.projectRepository.findAll({
      where: {
        company_id: currentUser.company_id,
        deleted_at: null,
      },
      include: [
        {
          model: NumberEntry,
          as: 'number',
        },
      ],
      order: [['id', 'DESC']],
    });

    const tasksByProjects: TasksByProjects[] = [];
    for (const project of projects.map((p) => p.get({ plain: true }))) {
      const products = await this.productService.getProjectProducts(currentUser.company_id, project.id);

      if (products.length === 0) {
        continue;
      }

      // Get products with tasks
      const productsWithTasks: ProductWithTask[] = [];
      for (const product of products) {
        const tasks = await this.getTasksByProduct(product.id, project.id, filteredTaskIds);

        if (tasks.length === 0) {
          continue;
        }

        productsWithTasks.push({
          ...product,
          tasks,
        });
      }

      if (productsWithTasks.length === 0) {
        continue;
      }

      // Get project with products, tasks
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      tasksByProjects.push({
        ...project,
        products: productsWithTasks,
      });
    }

    return tasksByProjects;
  }

  async getTasksByProduct(productId: number, projectId: number, filteredTaskIds: number[]): Promise<Task[]> {
    const tasks = await this.taskRepository.findAll({
      where: {
        deleted_at: null,
        product_id: productId,
        project_id: projectId,
        id: {
          [Op.in]: filteredTaskIds,
        },
      },
      include: [
        {
          model: TaskAssignee,
          as: 'task_assignees',
          required: true,
          include: [
            {
              model: User,
              as: 'user',
            },
          ],
        },
        {
          model: User,
          as: 'creator',
        },
        {
          model: Comment,
          as: 'comments',
          include: [
            {
              model: User,
              as: 'user',
            },
          ],
          order: [
            ['id', 'DESC'],
            ['products', 'tasks', 'name', 'ASC'],
          ],
        },
      ],
    });

    return tasks;
  }

  async getTaskById(taskId: number): Promise<Task> {
    const existingTask = await this.taskRepository.findOne({
      where: {
        id: taskId,
        deleted_at: null,
      },
      include: [
        { model: Project, as: 'project' },
        { model: Product, as: 'product' },
        {
          model: Comment,
          as: 'comments',
          include: [
            { model: Attachment, as: 'attachments' },
            { model: User, as: 'user' },
          ],
        },
        {
          model: TaskAssignee,
          as: 'task_assignees',
          include: [{ model: User, as: 'user' }],
        },
      ],
    });
    if (!existingTask) {
      throw new NotFoundError('Task not found');
    }

    const [task_status, task_priority] = await Promise.all([
      this.getTaskStatusById(existingTask.dataValues.status_id, existingTask.project.company_id),
      this.getTaskPriorityById(existingTask.dataValues.priority_id, existingTask.project.company_id),
    ]);
    const dataResult = { ...existingTask.toJSON(), task_status, task_priority } as Task;

    return dataResult;
  }

  async getParentTasks(projectId: number, productId: number, userId?: number): Promise<Task[]> {
    const tasks = await this.taskRepository.findAll({
      where: {
        deleted_at: null,
        parent_task_id: null,
        [Op.or]: [{ product_id: productId }, { product_id: null }],
        project_id: projectId,
      },
      include: [
        {
          model: WorkItem,
          as: 'work_items',
          required: false,
          attributes: ['id'],
          where: {
            project_id: projectId,
            product_id: productId,
            ...(userId ? { user_id: userId } : {}),
          },
        },
      ],
    });

    return tasks;
  }

  /** Get filtered task ids (tasks have filtered assignees)  */
  private async getFilteredTaskIds(
    whereOptions: WhereOptions<Task>,
    assigneeFilter: number[],
    getParentTask: boolean = false,
  ): Promise<number[]> {
    const filteredTasks = await this.taskRepository.findAll({
      where: {
        ...whereOptions,
      },
      include: [
        {
          model: TaskAssignee,
          as: 'task_assignees',
          required: true,
          where: {
            user_id: {
              [Op.or]: assigneeFilter,
            },
          },
          include: [
            {
              model: User,
              as: 'user',
            },
          ],
        },
      ],
    });

    for (const filteredTask of filteredTasks) {
      if (filteredTask.parent_task_id && getParentTask) {
        const parentTask = await this.taskRepository.findOne({
          where: {
            id: filteredTask.parent_task_id,
          },
        });
        filteredTasks.push(parentTask);
      }
    }

    return filteredTasks.map((task) => task.id);
  }

  private async findProjectIdsByName(currentUser: User, search: string): Promise<number[]> {
    const projects = await this.projectRepository.findAll({
      where: {
        deleted_at: null,
        company_id: currentUser.company_id,
        name: {
          [Op.iLike]: `%${search}%`,
        },
        status: 'active',
      },
      attributes: ['id'],
      raw: true,
    });

    return projects.map((project) => project.id);
  }

  async bulkUndoTasks(currentUser: User, bulkUndoTasks: UndoTasksDto): Promise<void> {
    const transaction = await Task.sequelize.transaction();
    try {
      const { task_ids } = bulkUndoTasks;
      // Initialize a set of task ids to restore
      let tasksToRestore = new Set<number>(task_ids);

      // Then, for each task, get all its soft-deleted sub-tasks and its parent task and add them to the set
      for (const taskId of task_ids) {
        const task = await Task.findByPk(taskId, {
          attributes: ['parent_task_id'],
          paranoid: false,
        });
        const parentTaskId = task.get('parent_task_id');
        const softDeletedSubTasks = await Task.findAll({
          where: {
            parent_task_id: taskId,
            deleted_at: {
              [Op.not]: null,
            },
          },
          attributes: ['id'],
          paranoid: false,
          transaction,
        });
        tasksToRestore = new Set([
          ...softDeletedSubTasks.map((st) => st.get('id')),
          ...(parentTaskId ? [parentTaskId] : []),
          ...tasksToRestore.values(),
        ]);
      }
      // Finally, restore all tasks in the set
      await Task.update(
        {
          deleted_at: null,
          deleted_by: null,
          updated_at: new Date(),
          updated_by: currentUser.id,
        },
        {
          where: {
            id: {
              [Op.in]: Array.from(tasksToRestore.values()),
            },
          },
          transaction,
        },
      );
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw new InternalServerError('Failed to undo tasks');
    }
  }

  async getAttachment(id: number): Promise<{
    fileName: string;
    filePath: string;
  }> {
    const attachment = await this.attachmentRepository.findByPk(id);
    if (!attachment) {
      throw new NotFoundError('Attachment not found');
    }

    const filePath = `${this.UPLOAD_PATH}/${attachment.filename}`;
    if (!existsSync(filePath)) {
      throw new BadRequestError('File not found');
    }

    return {
      fileName: attachment.filename,
      filePath,
    };
  }

  async getSubtasks(taskId: number): Promise<Task[]> {
    const tasks = await this.taskRepository.findAll({
      where: {
        parent_task_id: taskId,
        deleted_at: null,
      },
    });
    return tasks;
  }
}
