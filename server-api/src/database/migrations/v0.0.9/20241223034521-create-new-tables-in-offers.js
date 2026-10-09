'use strict';

/**
 * This migration is created to add new tables in offers.
 * From old table `offers` we will create new tables `offers`, `offer_details`, `offer_additional_cost`, `offer_events`, `offer_cost_estimates`, `offer_internal_desc` and `offer_quote_items`.
 * Then we will migrate data from field `metadata` of old table `offers` to new tables.
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create transaction for migration
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const offers = await queryInterface.sequelize.query('SELECT id, metadata FROM offers;', {
        type: Sequelize.QueryTypes.SELECT,
        transaction,
      });

      const offerDetails = [];
      const offerAdditionalCosts = [];
      const offerEvents = [];
      const offerCostEstimates = [];
      const offerInternalDesc = [];
      const offerQuoteItems = [];

      for (const offer of offers) {
        const { id: offerId, metadata } = offer;
        const {
          quote_items = [],
          internal_desc = [],
          cost_estimate = [],
          events = [],
          additional_cost = [],
          ...details
        } = metadata;

        offerDetails.push({
          offer_id: offerId,
          name: details.name || null,
          begin: details.begin || null,
          end: details.end || null,
          date: details.date || null,
          event: details.event || null,
          offer: details.offer || null,
          title: details.title || null,
          category: details.category || null,
          currency: details.currency || null,
          end_desc: details.end_desc || null,
          location: details.location || null,
          parameter: details.parameter || null,
          additional: details.additional || null,
          begin_desc: details.begin_desc || null,
          offer_desc: details.offer_desc || null,
          begin_break: details.begin_break || false,
          event_break: details.event_break || false,
          offer_break: details.offer_break || false,
          performance: details.performance || null,
          cost_generate: JSON.stringify(details.cost_generate || {}),
          estimate_cost: details.estimate_cost || null,
          parameter_desc: details.parameter_desc || null,
          additional_desc: details.additional_desc || null,
          parameter_break: details.parameter_break || false,
          additional_break: details.additional_break || false,
          discount_percent: details.discount_percent || 0,
          performance_desc: details.performance_desc || null,
          offer_quote_break: details.offer_quote_break || false,
          performance_break: details.performance_break || false,
          internal_desc_custom: details.internal_desc_custom || null,
          selected_km_label: details.km_dropdown?.label || '',
          selected_km_value: details.km_dropdown?.value || 0,
        });

        if (Array.isArray(quote_items) && quote_items.length > 0) {
          offerQuoteItems.push(
            ...quote_items.map((item) => ({
              offer_id: offerId,
              product_id: item.id || null, // `id` in quote_item is product_id
              name: item.name || null,
              cost: item.cost || 0,
              type: item.type || null,
              unit: item.unit || null,
              uuid: item.uuid || null,
              price: item.price || 0,
              year: item.year || null,
              description: item.description || null,
              amount: item.amount || 0,
              quarter: item.quarter || null,
              optional: item.optional || false,
              vat_rate: item.vat_rate || 0,
              break_page: item.break_page || false,
              is_nk: item.is_nk || false,
              apply_discount: item.apply_discount || false,
            })),
          );
        }

        if (Array.isArray(internal_desc) && internal_desc.length > 0) {
          offerInternalDesc.push(
            ...internal_desc.map((desc) => ({
              offer_id: offerId,
              label: desc.label || null,
              is_active: desc.is_active || false,
            })),
          );
        }

        if (Array.isArray(cost_estimate) && cost_estimate.length > 0) {
          offerCostEstimates.push(
            ...cost_estimate.map((estimate) => ({
              offer_id: offerId,
              order: estimate.id || '',
              label: estimate.label || null,
              value: estimate.value || 0,
            })),
          );
        }

        if (Array.isArray(events) && events.length > 0) {
          offerEvents.push(
            ...events.map((event) => ({
              offer_id: offerId,
              label: event.label || null,
              value: event.value || null,
            })),
          );
        }

        if (Array.isArray(additional_cost) && additional_cost.length > 0) {
          offerAdditionalCosts.push(
            ...additional_cost.map((cost) => ({
              offer_id: offerId,
              label: cost.label || null,
              value: cost.value || 0,
              is_active: cost.is_active || false,
            })),
          );
        }
      }

      // Insert data to new tables
      await queryInterface.bulkInsert('offer_details', offerDetails, { transaction });
      offerAdditionalCosts.length &&
        (await queryInterface.bulkInsert('offer_additional_cost', offerAdditionalCosts, { transaction }));
      offerEvents.length && (await queryInterface.bulkInsert('offer_events', offerEvents, { transaction }));
      offerCostEstimates.length &&
        (await queryInterface.bulkInsert('offer_cost_estimates', offerCostEstimates, { transaction }));
      offerInternalDesc.length &&
        (await queryInterface.bulkInsert('offer_internal_desc', offerInternalDesc, { transaction }));
      offerQuoteItems.length &&
        (await queryInterface.bulkInsert('offer_quote_items', offerQuoteItems, { transaction }));

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

  async down(queryInterface) {
    // Create transaction for migration
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.dropTable('offer_quote_items', { transaction });
      await queryInterface.dropTable('offer_internal_desc', { transaction });
      await queryInterface.dropTable('offer_cost_estimates', { transaction });
      await queryInterface.dropTable('offer_events', { transaction });
      await queryInterface.dropTable('offer_additional_cost', { transaction });
      await queryInterface.dropTable('offer_details', { transaction });
      await transaction.commit();
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { basename } = require('path');
      // When error occurs, rollback transaction to keep data consistent. Then throw error to stop rollback process.
      await transaction.rollback();
      console.error(error);
      throw new Error(`Rollback migration ${basename(__filename)} failed:`);
    }
  },
};
