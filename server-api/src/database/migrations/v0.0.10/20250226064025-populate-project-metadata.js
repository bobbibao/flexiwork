'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      let projects = await queryInterface.sequelize.query('SELECT id, offer_id, metadata FROM projects;', {
        type: Sequelize.QueryTypes.SELECT,
        transaction,
      });

      const projectDetails = [];
      const projectAdditionalCosts = [];
      const projectEvents = [];
      const projectCostEstimates = [];
      const projectInternalDesc = [];
      const projectProducts = [];

      const defaultKmLabel = 'Keine - 0.0%';
      const defaultKmValue = 0;

      let relatedOffer = {};

      for (const project of projects) {
        const { id: projectId, offer_id, metadata } = project;
        const {
          quote_items = [],
          internal_desc = [],
          cost_estimate = [],
          events = [],
          additional_cost = [],
          km_dropdown,
          ...details
        } = metadata;

        if (Array.isArray(quote_items) && quote_items.length) {
          projectProducts.push(
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            ...quote_items.map(({ id = null, offer_id, ...quoteItem }) => ({
              project_id: projectId,
              product_id: id > 0 ? id : null,
              ...quoteItem,
              amount: parseFloat(quoteItem.amount || '0'),
            })),
          );
        }

        if (Array.isArray(internal_desc) && internal_desc.length) {
          projectInternalDesc.push(
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            ...internal_desc.map(({ id, offer_id, ...internalDesc }) => ({
              project_id: projectId,
              ...internalDesc,
            })),
          );
        }

        if (Array.isArray(cost_estimate) && cost_estimate.length) {
          projectCostEstimates.push(
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            ...cost_estimate.map(({ id, offer_id, order, ...costEstimate }) => ({
              project_id: projectId,
              ...costEstimate,
              value: parseFloat(costEstimate.value || '0'),
            })),
          );
        }

        if (Array.isArray(events) && events.length) {
          projectEvents.push(
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            ...events.map(({ id, offer_id, ...event }) => ({
              project_id: projectId,
              ...event,
            })),
          );
        }

        if (Array.isArray(additional_cost) && additional_cost.length) {
          projectAdditionalCosts.push(
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            ...additional_cost.map(({ id, offer_id, ...additionalCost }) => ({
              project_id: projectId,
              ...additionalCost,
              is_active: additionalCost.is_active || false,
            })),
          );
        }

        if (offer_id !== null) {
          relatedOffer = await queryInterface.sequelize.query(
            `SELECT * FROM offer_details WHERE offer_id = ${offer_id};`,
            {
              type: Sequelize.QueryTypes.SELECT,
              transaction,
            },
          );
        }

        projectDetails.push({
          project_id: projectId,
          selected_km_label: km_dropdown?.label || defaultKmLabel,
          selected_km_value: km_dropdown?.value || defaultKmValue,
          end: details?.end || relatedOffer?.end,
          date: details?.date || relatedOffer?.date,
          begin: details?.begin || relatedOffer?.begin,
          event: details?.event || relatedOffer?.event,
          offer: details?.offer || relatedOffer?.offer,
          title: details?.title || relatedOffer?.title,
          category: details?.category || relatedOffer?.category,
          currency: details?.currency || relatedOffer?.currency,
          duration: details?.duration || relatedOffer?.duration,
          end_desc: details?.end_desc || relatedOffer?.end_desc,
          location: details?.location || relatedOffer?.location,
          parameter: details?.parameter || relatedOffer?.parameter,
          additional: details?.additional || relatedOffer?.additional,
          begin_desc: details?.begin_desc || relatedOffer?.begin_desc,
          offer_desc: details?.offer_desc || relatedOffer?.offer_desc,
          begin_break: details?.begin_break || relatedOffer?.begin_break,
          event_break: details?.event_break || relatedOffer?.event_break,
          offer_break: details?.offer_break || relatedOffer?.offer_break,
          performance: details?.performance || relatedOffer?.performance,
          estimate_cost: details?.estimate_cost || relatedOffer?.estimate_cost,
          parameter_desc: details?.parameter_desc || relatedOffer?.parameter_desc,
          additional_desc: details?.additional_desc || relatedOffer?.additional_desc,
          parameter_break: details?.parameter_break || relatedOffer?.parameter_break,
          additional_break: details?.additional_break || relatedOffer?.additional_break,
          discount_percent: details?.discount_percent || relatedOffer?.discount_percent,
          performance_desc: details?.performance_desc || relatedOffer?.performance_desc,
          offer_quote_break: details?.offer_quote_break || relatedOffer?.offer_quote_break,
          performance_break: details?.performance_break || relatedOffer?.performance_break,
          internal_desc_custom: details?.internal_desc_custom || relatedOffer?.internal_desc_custom,
          name: details?.name || relatedOffer?.name,
          address: details?.address || relatedOffer?.address,
          only_my_company: details.only_my_company,
          is_internal: details.is_internal,
          pr_begin_break: details.pr_begin_break,
          pr_quote_break: details.pr_quote_break,
          rate_per_hour: details.rate_per_hour,
          end_on: details.end_on,
          cost_generation: JSON.stringify(details.cost_generation || relatedOffer?.cost_generation, null, 2),
        });

        // Reset related offer
        relatedOffer = null;
      }

      // Bulk insert data to new tables
      projectDetails.length && (await queryInterface.bulkInsert('project_details', projectDetails, { transaction }));
      projectAdditionalCosts.length &&
        (await queryInterface.bulkInsert('project_additional_costs', projectAdditionalCosts, { transaction }));
      projectEvents.length && (await queryInterface.bulkInsert('project_events', projectEvents, { transaction }));
      projectCostEstimates.length &&
        (await queryInterface.bulkInsert('project_cost_estimates', projectCostEstimates, { transaction }));
      projectInternalDesc.length &&
        (await queryInterface.bulkInsert('project_labels', projectInternalDesc, { transaction }));
      projectProducts.length && (await queryInterface.bulkInsert('project_products', projectProducts, { transaction }));

      // Drop column metadata from projects table
      // await queryInterface.removeColumn('projects', 'metadata', { transaction });

      // Drop column metadata from products, work_items and work_logs tables
      // await queryInterface.removeColumn('products', 'metadata', { transaction });
      // await queryInterface.removeColumn('work_items', 'metadata', { transaction });
      // await queryInterface.removeColumn('work_logs', 'metadata', { transaction });

      // add new column task_id that makes relationship to table task(id) into work_items table, add option if not exists
      const tableDescription = await queryInterface.describeTable('work_items');
      if (!tableDescription.task_id) {
        await queryInterface.addColumn('work_items', 'task_id', {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: 'tasks',
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
          transaction,
        });
      }

      // Migrate tasks from work_items to the tasks table
      console.log('Starting task migration process...');

      // Step 1: Process tasks from project.metadata and product.metadata
      projects = await queryInterface.sequelize.query(
        `SELECT p.id AS project_id, p.metadata, p.company_id FROM projects p WHERE p.metadata ? 'quote_items'`,
        { type: Sequelize.QueryTypes.SELECT, transaction },
      );

      for (const project of projects) {
        // Find an admin user for this company to use as created_by
        const [adminUser] = await queryInterface.sequelize.query(
          `SELECT id FROM users WHERE company_id = :companyId AND role = 'admin' ORDER BY id LIMIT 1`,
          {
            replacements: { companyId: project.company_id },
            type: Sequelize.QueryTypes.SELECT,
            transaction,
          },
        );

        if (!adminUser) {
          console.warn(`No admin user found for company_id: ${project.company_id}`);
          continue;
        }

        const adminUserId = adminUser.id;
        const quoteItems = project.metadata.quote_items || [];

        for (const quoteItem of quoteItems) {
          // Skip quote_items without ID
          if (!quoteItem.id) continue;

          const productId = parseInt(quoteItem.id, 10);

          // Find the corresponding product and get its metadata
          const [product] = await queryInterface.sequelize.query(
            `SELECT p.id, p.metadata FROM products p WHERE p.id = :productId`,
            {
              replacements: { productId },
              type: Sequelize.QueryTypes.SELECT,
              transaction,
            },
          );

          if (!product || !product.metadata || !product.metadata.task_list) continue;

          const taskList = product.metadata.task_list || [];

          for (const task of taskList) {
            // Insert the task into tasks table
            await queryInterface.sequelize.query(
              `INSERT INTO tasks (
                  parent_task_id, project_id, name, description, 
                  status_id, priority_id, product_id, created_by, created_at
                ) VALUES (
                  NULL, :projectId, :taskName, NULL, 
                  1, 1, :productId, :adminUserId, NOW()
                )`,
              {
                replacements: {
                  projectId: project.project_id,
                  taskName: task.name,
                  productId,
                  adminUserId,
                },
                type: Sequelize.QueryTypes.INSERT,
                transaction,
              },
            );
          }
        }
      }

      // Step 2: Update work_items to reference tasks based on project_id, product_id, and task name
      await queryInterface.sequelize.query(
        `UPDATE work_items wi
           SET task_id = t.id
           FROM tasks t
           WHERE wi.project_id = t.project_id 
           AND wi.product_id = t.product_id 
           AND wi.task = t.name 
           AND wi.task IS NOT NULL 
           AND wi.task_id IS NULL`,
        { transaction },
      );

      // Step 3: Add task assignees from work_items that weren't already covered
      await queryInterface.sequelize.query(
        `INSERT INTO task_assignees (task_id, user_id)
           SELECT wi.task_id, wi.user_id
           FROM work_items wi
           WHERE wi.task_id IS NOT NULL 
           AND wi.user_id IS NOT NULL 
           AND NOT EXISTS (
             SELECT 1
             FROM task_assignees ta
             WHERE ta.task_id = wi.task_id AND ta.user_id = wi.user_id
           )`,
        { transaction },
      );

      console.log('Task migration completed successfully');

      await transaction.commit();
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { basename } = require('path');
      // When error occurs, rollback transaction to keep data consistent. Then throw error to stop migration process.
      await transaction.rollback();
      console.error(error);
      throw new Error(`Run migration ${basename(__filename)} failed!`);
    }
  },

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async down(queryInterface, Sequelize) {
    // Drop all new tables
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.dropTable('project_products', { transaction });
      await queryInterface.dropTable('project_labels', { transaction });
      await queryInterface.dropTable('project_cost_estimates', { transaction });
      await queryInterface.dropTable('project_events', { transaction });
      await queryInterface.dropTable('project_additional_costs', { transaction });
      await queryInterface.dropTable('project_details', { transaction });
      await queryInterface.removeColumn('work_items', 'task_id', { transaction });

      // Remove task_id from work_items table, only rows are created by this migration
      await queryInterface.sequelize.query(
        `DELETE FROM task_assignees 
         WHERE task_id IN (
           SELECT t.id FROM tasks t
           JOIN work_items wi ON t.project_id = wi.project_id AND t.product_id = wi.product_id AND t.name = wi.task
           WHERE wi.task IS NOT NULL
         )`,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `DELETE FROM tasks
         WHERE id IN (
           SELECT t.id FROM tasks t
           JOIN work_items wi ON t.project_id = wi.project_id AND t.product_id = wi.product_id AND t.name = wi.task
           WHERE wi.task IS NOT NULL
         )`,
        { transaction },
      );

      console.log('Task migration rollback completed successfully!');
      await transaction.commit();
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { basename } = require('path');
      // When error occurs, rollback transaction to keep data consistent. Then throw error to stop migration process.
      await transaction.rollback();
      console.error(error);
      throw new Error(`Run migration ${basename(__filename)} failed!`);
    }
  },
};
