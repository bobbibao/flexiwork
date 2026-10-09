'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Update status offers data to `deleted` if `deleted_at` is not null
     */
    const t = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.bulkUpdate(
        'offers',
        {
          status: 'deleted',
        },
        {
          deleted_at: {
            [Sequelize.Op.not]: null,
          },
        },
        { transaction: t },
      );
      await t.commit();
    } catch (error) {
      await t.rollback();
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { basename } = require('path');
      throw new Error(`Run migration ${basename(__filename)} failed: ${error.message}`);
    }
  },

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  },
};
