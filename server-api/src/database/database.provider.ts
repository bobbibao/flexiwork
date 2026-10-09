import { Dialect } from 'sequelize';
import { Sequelize, SequelizeOptions } from 'sequelize-typescript';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AcpActionEvents,
  AcpFailedJobs,
  AcpPasswordResets,
  AcpUsers,
  Attachment,
  Comment,
  CompanyShare,
  Company,
  Config,
  Contact,
  Customer,
  Expense,
  Export,
  GroupProduct,
  Invoice,
  Log,
  NumberEntry,
  Offer,
  Option,
  Product,
  ProjectPull,
  Project,
  Setting,
  TaskAssignee,
  Task,
  Unit,
  UserActivation,
  UserHoliday,
  User,
  VatRate,
  WorkItem,
  WorkLog,
  WorkSubmit,
  OfferAdditionalCost,
  OfferCostEstimate,
  OfferEvent,
  OfferInternalDesc,
  OfferQuoteItem,
  OfferDetail,
  ProjectDetail,
  ProjectAdditionalCost,
  ProjectCostEstimate,
  ProjectComment,
  ProjectEvent,
  ProjectProduct,
  ProjectLabel,
  InvoiceDetail,
  InvoicePayment,
  InvoiceAdditionalCost,
  InvoiceProduct,
  InvoiceLabel,
  AuditLog,
} from './models';
import CompanyGroup from './models/company-groups.model';
import CompanyTemplate from './models/company-templates.model';

export const databaseProviders = [
  {
    provide: 'SEQUELIZE',
    useFactory: async () => {
      const logger = new Logger('databaseProviders');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const models: any = [
        Config,
        AcpActionEvents,
        AcpFailedJobs,
        AcpPasswordResets,
        AcpUsers,
        Project,
        Offer,
        Task,
        Comment,
        Attachment,
        Company,
        User,
        CompanyShare,
        WorkSubmit,
        Customer,
        Contact,
        Expense,
        GroupProduct,
        CompanyGroup,
        Invoice,
        Log,
        Option,
        Product,
        ProjectPull,
        Setting,
        CompanyTemplate,
        Export,
        Unit,
        UserActivation,
        UserHoliday,
        WorkLog,
        VatRate,
        WorkItem,
        NumberEntry,
        TaskAssignee,
        OfferDetail,
        OfferAdditionalCost,
        OfferCostEstimate,
        OfferEvent,
        OfferInternalDesc,
        OfferQuoteItem,
        ProjectDetail,
        ProjectAdditionalCost,
        ProjectCostEstimate,
        ProjectComment,
        ProjectEvent,
        ProjectProduct,
        ProjectLabel,
        InvoiceDetail,
        InvoicePayment,
        InvoiceAdditionalCost,
        InvoiceLabel,
        InvoiceProduct,
        AuditLog,
      ];
      //const seedInProdModels = [Config];

      const dbHost = process.env.DB_HOST;
      const dbPort = parseInt(process.env.DB_PORT, 10);
      const dbUsername = process.env.DB_USERNAME;
      const dbPassword = process.env.DB_PASSWORD;
      const dbName = process.env.DB_NAME;
      const dbEncrypt = process.env.DB_ENCRYPT === 'true';

      const sequelizeConfig: SequelizeOptions = {
        dialect: 'postgres' as Dialect,
        host: dbHost,
        port: dbPort,
        username: dbUsername,
        password: dbPassword,
        database: dbName,
        dialectOptions: {
          encrypt: dbEncrypt,
          requestTimeout: 240000,
        },
        define: {
          timestamps: false,
          paranoid: false,
        },
        logging: true,
        models: models,
      };
      const sequelize = new Sequelize(sequelizeConfig);

      async function deleteInvalidData(
        sequelize: Sequelize,
        model: typeof models,
        referenceModel: typeof models,
        referenceField: string,
        deleteField: string,
      ) {
        const logger = new Logger('deleteInvalidData');
        try {
          if (!model || !referenceModel || !referenceField || !deleteField) {
            logger.warn('Model or reference model information is incomplete.');
            return;
          }

          logger.log(`Deleting invalid data in ${model.name}...`);

          const deleteQuery = `
            DELETE FROM ${model.getTableName()}
            WHERE ${deleteField} NOT IN (SELECT ${referenceField} FROM ${referenceModel.getTableName()});
          `;

          await sequelize.query(deleteQuery);

          logger.log(`Invalid data in ${model.name} has been deleted successfully.`);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
          logger.error(`Error deleting invalid data in ${model.name}: ${error.message}`, error.stack);
        }
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async function loadModel(sequelize: Sequelize, models: any[]) {
        if (!sequelize) {
          console.error('Sequelize is not initialized.');
          return;
        }
        try {
          for (const model of models) {
            // Call the initializeModel method if it exists
            // if (typeof model.initializeModel === 'function') {
            //   await model.initializeModel(sequelize); // Call the initializeModel method
            // }
            logger.log(`Loading ${model.name} model...`);
            // sequelize.addModels([model]);

            // if (seedInProdModels.includes(model)) {
            //   // With model in seedInProdModels, we will sync the model manually with alter: true then seeding data into them
            //   await model.sync({ alter: true }).then(async () => {
            //     if (typeof model.seedData === 'function') {
            //       logger.log(`Seeding data for ${model.name}...`);
            //       await model.seedData(sequelize);
            //       logger.log(`Data seeding for ${model.name} completed.`);
            //     }
            //   });
            // }
          }
          await deleteInvalidData(sequelize, UserActivation, User, 'id', 'user_id');
          logger.log(`Loaded ${models.length} Sequelize models.`);

          // Synchronize all models with the database
          await sequelize.sync();

          logger.log(`All ${models.length} Sequelize models synchronized successfully.`);
        } catch (error) {
          logger.error(`Error loading and syncing Sequelize models: ${error}`);
          // Additional error handling logic if needed
        }
      }

      async function loadRelationships() {
        try {
          // Define relationships with unique aliases and correct foreign keys
          Attachment.belongsTo(Comment, { foreignKey: 'comment_id', as: 'comment' });
          Comment.hasMany(Attachment, { foreignKey: 'comment_id', as: 'attachments' });

          // Set up relationships with the correct foreign keys
          Comment.belongsTo(Task, { foreignKey: 'task_id', as: 'task' });
          Comment.belongsTo(User, { foreignKey: 'owner_id', as: 'user' });

          // Define other relationships without alias conflicts
          CompanyShare.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });
          Contact.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });
          Contact.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });
          Customer.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });
          Customer.hasMany(Contact, { foreignKey: 'customer_id', as: 'contacts' });
          Expense.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });
          Expense.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
          Export.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });
          Export.belongsTo(CompanyTemplate, { foreignKey: 'template_id', as: 'template' });
          CompanyGroup.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });
          Invoice.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });
          Invoice.belongsTo(Offer, { foreignKey: 'offer_id', as: 'offer' });
          Invoice.belongsTo(Project, { foreignKey: 'project_id', as: 'project' });
          Invoice.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });
          Invoice.belongsTo(NumberEntry, { foreignKey: 'number_id', as: 'invNumber' });
          Invoice.hasMany(Log, { foreignKey: 'ref_id', as: 'log' });
          Log.belongsTo(Invoice, { foreignKey: 'id', as: 'invoice' });
          Log.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });
          NumberEntry.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });
          Offer.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });
          Offer.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });
          Offer.belongsTo(NumberEntry, { foreignKey: 'number_id', as: 'number' });
          Offer.hasMany(Project, { foreignKey: 'offer_id', as: 'projects' });
          Option.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });

          Product.hasMany(Task, { foreignKey: 'product_id', as: 'tasks' });
          Product.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });
          Product.belongsTo(Unit, { foreignKey: 'unit_id', as: 'unit' });
          Product.belongsTo(VatRate, { foreignKey: 'vat_rate_id', as: 'vat_rate' });

          Project.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });
          Project.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });
          Project.belongsTo(User, { foreignKey: 'assignee_id', as: 'assignee' });
          Project.belongsTo(Offer, { foreignKey: 'offer_id', as: 'offer' });
          Project.belongsTo(NumberEntry, { foreignKey: 'number_id', as: 'number' });
          Project.hasMany(Invoice, { as: 'invoices', foreignKey: 'project_id' });
          Project.hasMany(Task, { foreignKey: 'project_id', as: 'tasks' });
          Project.hasMany(Log, { foreignKey: 'ref_id', as: 'logs' });
          Project.hasMany(WorkItem, { foreignKey: 'project_id', as: 'work_items' });

          Log.belongsTo(Project, { foreignKey: 'ref_id', as: 'project' });

          Setting.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });
          Invoice.belongsTo(NumberEntry, { foreignKey: 'number_id', as: 'number' });

          Task.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
          Task.belongsTo(Project, { foreignKey: 'project_id', as: 'project' });

          Task.hasMany(Comment, { foreignKey: 'task_id', as: 'comments' });
          CompanyTemplate.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });
          Unit.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });
          UserActivation.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });
          UserActivation.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
          UserHoliday.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });
          UserHoliday.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
          User.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });
          User.hasMany(Comment, { foreignKey: 'owner_id', as: 'comments' });
          User.hasMany(WorkSubmit, { foreignKey: 'user_id', as: 'work_submits' });

          VatRate.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });
          WorkItem.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });
          WorkItem.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
          WorkItem.belongsTo(Project, { foreignKey: 'project_id', as: 'project' });
          WorkItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
          WorkItem.belongsTo(Task, { foreignKey: 'task_id', as: 'tasks' });
          WorkItem.hasMany(WorkLog, { foreignKey: 'work_item_id', as: 'work_logs' });
          WorkLog.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });
          WorkLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
          WorkLog.belongsTo(WorkItem, { foreignKey: 'work_item_id', as: 'workItem' });
          WorkSubmit.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });
          WorkSubmit.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

          Product.belongsToMany(CompanyGroup, { through: GroupProduct, foreignKey: 'product_id', as: 'groups' });
          CompanyGroup.belongsToMany(Product, { through: GroupProduct, foreignKey: 'group_id', as: 'products' });

          Company.hasMany(ProjectPull, { foreignKey: 'company_id' });
          Project.hasMany(ProjectPull, { foreignKey: 'project_id', as: 'project_pulls' });
          ProjectPull.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });
          ProjectPull.belongsTo(Project, { foreignKey: 'project_id', as: 'project' });

          Task.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
          Task.belongsTo(User, { foreignKey: 'deleted_by', as: 'eraser' });
          Task.hasMany(WorkItem, { foreignKey: 'task_id', as: 'work_items' });

          Task.belongsToMany(User, { through: TaskAssignee, foreignKey: 'task_id' });
          User.belongsToMany(Task, { through: TaskAssignee, foreignKey: 'user_id' });
          Task.hasMany(TaskAssignee, { foreignKey: 'task_id', as: 'task_assignees' });
          User.hasMany(TaskAssignee, { foreignKey: 'user_id', as: 'taskAssignees' });
          TaskAssignee.belongsTo(Task, { foreignKey: 'task_id', as: 'task' });
          TaskAssignee.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

          logger.log('Sequelize relationships loaded successfully.');
          await sequelize.sync();
        } catch (error) {
          logger.error(`Error loading Sequelize relationships: ${error}`);
        }
      }

      await loadModel(sequelize, models);
      await loadRelationships();
      return sequelize;
    },
    inject: [ConfigService],
  },
];
