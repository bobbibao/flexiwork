'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Check if old tables exist
      const [groupsExists] = await queryInterface.sequelize.query(
        "SELECT table_name FROM information_schema.tables WHERE table_name = 'groups' AND table_schema = current_schema();",
        { type: Sequelize.QueryTypes.SELECT, transaction },
      );

      const [templatesExists] = await queryInterface.sequelize.query(
        "SELECT table_name FROM information_schema.tables WHERE table_name = 'templates' AND table_schema = current_schema();",
        { type: Sequelize.QueryTypes.SELECT, transaction },
      );

      // Migrate data from groups to company_groups if old table exists
      if (groupsExists) {
        // Get all columns from groups table except metadata
        const groupsStructure = await queryInterface.describeTable('groups');
        const groupsColumns = Object.keys(groupsStructure).filter((col) => col !== 'metadata');
        const columnsStr = groupsColumns.join(', ');

        await queryInterface.sequelize.query(
          `INSERT INTO company_groups (${columnsStr}) SELECT ${columnsStr} FROM groups`,
          { transaction },
        );
        console.log('Data migrated from groups to company_groups (excluding metadata column)');

        // Set default groups based on company metadata
        const companies = await queryInterface.sequelize.query(
          'SELECT id, metadata FROM companies WHERE metadata IS NOT NULL;',
          {
            type: Sequelize.QueryTypes.SELECT,
            transaction,
          },
        );

        for (const company of companies) {
          const { id: companyId, metadata } = company;
          if (!metadata) continue;

          const { default_generate_group_id } = metadata;
          if (default_generate_group_id) {
            await queryInterface.sequelize.query(
              'UPDATE company_groups SET is_default = true WHERE id = :groupId AND company_id = :companyId;',
              {
                replacements: { groupId: default_generate_group_id, companyId },
                type: Sequelize.QueryTypes.UPDATE,
                transaction,
              },
            );
          }
        }
      }

      // Migrate data from templates to company_templates if old table exists
      if (templatesExists) {
        // Get all columns from templates table (no exclusions needed)
        const templatesStructure = await queryInterface.describeTable('templates');
        const templatesColumns = Object.keys(templatesStructure);
        const columnsStr = templatesColumns.join(', ');

        await queryInterface.sequelize.query(
          `INSERT INTO company_templates (${columnsStr}) SELECT ${columnsStr} FROM templates`,
          { transaction },
        );
        console.log('Data migrated from templates to company_templates');
      }

      console.log('Migration completed successfully');
      await transaction.commit();
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { basename } = require('path');
      await transaction.rollback();
      console.error(error);
      throw new Error(`Run migration ${basename(__filename)} failed!`);
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Check if new tables exist and drop them (old tables still exist)
      const [companyGroupsExists] = await queryInterface.sequelize.query(
        "SELECT table_name FROM information_schema.tables WHERE table_name = 'company_groups' AND table_schema = current_schema();",
        { type: Sequelize.QueryTypes.SELECT, transaction },
      );

      const [companyTemplatesExists] = await queryInterface.sequelize.query(
        "SELECT table_name FROM information_schema.tables WHERE table_name = 'company_templates' AND table_schema = current_schema();",
        { type: Sequelize.QueryTypes.SELECT, transaction },
      );

      if (companyGroupsExists) {
        await queryInterface.dropTable('company_groups', { transaction });
        console.log('Dropped company_groups table (original groups table still exists)');
      }

      if (companyTemplatesExists) {
        await queryInterface.dropTable('company_templates', { transaction });
        console.log('Dropped company_templates table (original templates table still exists)');
      }

      console.log('Rollback completed successfully!');
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
