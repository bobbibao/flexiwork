'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Add new columns to customers table
      const tableDescription = await queryInterface.describeTable('customers');
      const columnsToAdd = [
        { name: 'address', type: { type: Sequelize.TEXT, allowNull: true } },
        { name: 'web', type: { type: Sequelize.TEXT, allowNull: true } },
        { name: 'title', type: { type: Sequelize.STRING(6), allowNull: true } },
        { name: 'postcode', type: { type: Sequelize.STRING(20), allowNull: true } },
        { name: 'place', type: { type: Sequelize.TEXT, allowNull: true } },
        { name: 'phone', type: { type: Sequelize.STRING(100), allowNull: true } },
        { name: 'other_address', type: { type: Sequelize.TEXT, allowNull: true } },
        { name: 'fax', type: { type: Sequelize.STRING(100), allowNull: true } },
        { name: 'email', type: { type: Sequelize.STRING(255), allowNull: true } },
        { name: 'country', type: { type: Sequelize.STRING(20), allowNull: true } },
        { name: 'comment', type: { type: Sequelize.TEXT, allowNull: true } },
        { name: 'cell_phone', type: { type: Sequelize.STRING(100), allowNull: true } },
      ];

      // Add columns that don't exist
      for (const column of columnsToAdd) {
        if (!tableDescription[column.name]) {
          await queryInterface.addColumn('customers', column.name, column.type, { transaction });
        }
      }

      console.log('Starting customer metadata migration process...');

      // Get all customers with metadata
      const customers = await queryInterface.sequelize.query(
        'SELECT id, metadata FROM customers WHERE metadata IS NOT NULL;',
        {
          type: Sequelize.QueryTypes.SELECT,
          transaction,
        },
      );

      console.log(`Found ${customers.length} customers with metadata to migrate`);

      // Update customers with data from metadata
      for (const customer of customers) {
        const { id, metadata } = customer;

        if (!metadata || typeof metadata !== 'object') continue;

        const updateFields = {};
        const updateValues = { customerId: id };

        // Map metadata fields to columns
        const fieldMappings = {
          address: 'address',
          web: 'web',
          title: 'title',
          postcode: 'postcode',
          place: 'place',
          phone: 'phone',
          other_address: 'other_address',
          fax: 'fax',
          email: 'email',
          country: 'country',
          comment: 'comment',
          cell_phone: 'cell_phone',
        };

        for (const [metadataKey, columnName] of Object.entries(fieldMappings)) {
          if (metadata[metadataKey] !== undefined && metadata[metadataKey] !== null) {
            updateFields[columnName] = `:${columnName}`;
            updateValues[columnName] = metadata[metadataKey];
          }
        }

        // Only update if there are fields to update
        if (Object.keys(updateFields).length > 0) {
          const setClause = Object.entries(updateFields)
            .map(([column, placeholder]) => `${column} = ${placeholder}`)
            .join(', ');

          await queryInterface.sequelize.query(`UPDATE customers SET ${setClause} WHERE id = :customerId`, {
            replacements: updateValues,
            type: Sequelize.QueryTypes.UPDATE,
            transaction,
          });
        }
      }

      console.log('Customer metadata migration completed successfully');

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
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Remove the added columns
      const columnsToRemove = [
        'address',
        'web',
        'title',
        'postcode',
        'place',
        'phone',
        'other_address',
        'fax',
        'email',
        'country',
        'comment',
        'cell_phone',
      ];

      const tableDescription = await queryInterface.describeTable('customers');

      for (const columnName of columnsToRemove) {
        if (tableDescription[columnName]) {
          await queryInterface.removeColumn('customers', columnName, { transaction });
        }
      }

      console.log('Customer metadata migration rollback completed successfully!');
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
