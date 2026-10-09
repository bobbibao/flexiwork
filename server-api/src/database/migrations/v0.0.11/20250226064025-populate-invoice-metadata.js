'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const invoices = await queryInterface.sequelize.query(
        'SELECT id, metadata, company_id, customer_id, project_id FROM invoices;',
        {
          type: Sequelize.QueryTypes.SELECT,
          transaction,
        },
      );

      const invoiceDetails = [];
      const invoiceLabels = [];
      const invoicePaidHistories = [];
      const invoiceProducts = [];
      const invoiceAdditionalCosts = [];

      const defaultKmLabel = 'Keine - 0.0%';
      const defaultKmValue = 0;

      for (const invoice of invoices) {
        const { id: invoiceId, metadata, project_id } = invoice;

        if (!metadata) continue;

        const {
          quote_items = [],
          internal_desc = [],
          paid_history = [],
          additional_cost = [],
          km_dropdown,
          ...details
        } = metadata;

        if (Array.isArray(quote_items) && quote_items.length) {
          invoiceProducts.push(
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            ...quote_items.map(({ id = null, invoice_id, ...quoteItem }) => ({
              invoice_id: invoiceId,
              product_id: id > 0 ? id : null,
              ...quoteItem,
              amount: parseFloat(quoteItem.amount || '0'),
              price: parseFloat(quoteItem.price || '0'),
              cost: parseFloat(quoteItem.cost || '0'),
              vat_rate: parseFloat(quoteItem.vat_rate || '0'),
              break_page: quoteItem.break_page || false,
              optional: quoteItem.optional || false,
              apply_discount: quoteItem.apply_discount || false,
              is_nk: quoteItem.is_nk || false,
              remaining: parseFloat(quoteItem.remaining || quoteItem.amount || '0'),
              invoice_rate: parseFloat(quoteItem.invoice_rate || quoteItem.price || '0'),
            })),
          );
        }

        if (Array.isArray(internal_desc) && internal_desc.length) {
          invoiceLabels.push(
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            ...internal_desc.map(({ id, invoice_id, ...labelInfo }) => ({
              invoice_id: invoiceId,
              label: labelInfo.label || null,
              is_active: labelInfo.is_active || false,
            })),
          );
        }

        if (Array.isArray(paid_history) && paid_history.length) {
          invoicePaidHistories.push(
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            ...paid_history.map(({ id, invoice_id, ...paidHistory }) => ({
              invoice_id: invoiceId,
              // Fix: Convert empty strings to null for date field
              date: paidHistory.date && paidHistory.date !== '' ? paidHistory.date : null,
              amount: parseFloat(paidHistory.value || '0'),
              percent: parseFloat(paidHistory.percent || '0'),
            })),
          );
        }

        if (Array.isArray(additional_cost) && additional_cost.length) {
          invoiceAdditionalCosts.push(
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            ...additional_cost.map(({ id, invoice_id, ...additionalCost }) => ({
              invoice_id: invoiceId,
              label: additionalCost.label || null,
              value: parseFloat(additionalCost.value || '0'),
              is_active: additionalCost.is_active || false,
            })),
          );
        }

        // Get project details if associated with a project
        let projectDetails = {};
        if (project_id) {
          [projectDetails] = await queryInterface.sequelize.query(
            `SELECT * FROM project_details WHERE project_id = ${project_id};`,
            {
              type: Sequelize.QueryTypes.SELECT,
              transaction,
            },
          );
        }

        invoiceDetails.push({
          invoice_id: invoiceId,
          project_id: project_id || null,
          // Fix: Convert empty strings to null for date fields
          date: details?.date && details?.date !== '' ? details?.date : null,
          currency: details?.currency || projectDetails?.currency || 'EUR',
          duration: details?.duration || projectDetails?.duration || null,
          begin_desc: details?.begin_desc || projectDetails?.begin_desc || null,
          end_desc: details?.end_desc || projectDetails?.end_desc || null,
          location: details?.location || projectDetails?.location || null,
          discount_percent: details?.discount_percent || projectDetails?.discount_percent || 0,
          internal_desc_custom: details?.internal_desc_custom || projectDetails?.internal_desc_custom || null,
          address: details?.address || projectDetails?.address || null,
          selected_km_label: km_dropdown?.label || defaultKmLabel,
          selected_km_value: km_dropdown?.value || defaultKmValue,
          payment_deadline: details?.payment_deadline || 14,
          is_final: details?.is_final || false,
          is_custom_date: details?.is_custom_date || false,
          is_custom_title: details?.is_custom_title || false,
          start_date_inv: details?.start_date_inv && details?.start_date_inv !== '' ? details?.start_date_inv : null,
          end_date_inv: details?.end_date_inv && details?.end_date_inv !== '' ? details?.end_date_inv : null,
          is_included_external_hour_report: details?.is_include_external_hour_report || false,
          is_included_internal_hour_report: details?.is_include_internal_hour_report || false,
          slip_number: details?.slip_number || null,
          paid_on: details.paid_on || null,
          invoice_value_date: details.invoice_value_date || null,
          invoice_comment: details.invoice_comment || null,
        });
      }

      // Bulk insert data to new tables
      invoiceDetails.length && (await queryInterface.bulkInsert('invoice_details', invoiceDetails, { transaction }));

      invoiceLabels.length && (await queryInterface.bulkInsert('invoice_labels', invoiceLabels, { transaction }));

      invoicePaidHistories.length &&
        (await queryInterface.bulkInsert('invoice_payments', invoicePaidHistories, { transaction }));

      invoiceProducts.length && (await queryInterface.bulkInsert('invoice_products', invoiceProducts, { transaction }));

      invoiceAdditionalCosts.length &&
        (await queryInterface.bulkInsert('invoice_additional_costs', invoiceAdditionalCosts, { transaction }));

      // Optional: Remove metadata column from invoices table after migration
      // await queryInterface.removeColumn('invoices', 'metadata', { transaction });

      console.log('Invoice metadata migration completed successfully');
      await transaction.commit();
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { basename } = require('path');
      await transaction.rollback();
      console.error(error);
      throw new Error(`Run migration ${basename(__filename)} failed!`);
    }
  },

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Drop data from tables
      await queryInterface.bulkDelete('invoice_additional_costs', null, { transaction });
      await queryInterface.bulkDelete('invoice_products', null, { transaction });
      await queryInterface.bulkDelete('invoice_payments', null, { transaction });
      await queryInterface.bulkDelete('invoice_labels', null, { transaction });
      await queryInterface.bulkDelete('invoice_details', null, { transaction });

      console.log('Invoice metadata rollback completed successfully!');
      await transaction.commit();
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { basename } = require('path');
      await transaction.rollback();
      console.error(error);
      throw new Error(`Rollback migration ${basename(__filename)} failed!`);
    }
  },
};
