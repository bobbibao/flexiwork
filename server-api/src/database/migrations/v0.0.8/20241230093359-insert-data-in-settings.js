'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const defaultTaskStates = {
      statuses: [
        {
          id: 1,
          label: 'Not Started',
          color: '#667085',
        },
        {
          id: 2,
          label: 'In Progress',
          color: '#7A5AF8',
        },
        {
          id: 3,
          label: 'Done',
          color: '#12B76A',
        },
      ],
      priorities: [
        {
          id: 1,
          label: 'High',
          color: '#F04438',
        },
        {
          id: 2,
          label: 'Normal',
          color: '#F79009',
        },
        {
          id: 3,
          label: 'Low',
          color: '#2E90FA',
        },
      ],
    };

    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Insert default task states if `task` column is empty
      await queryInterface.bulkUpdate(
        'settings',
        {
          task: JSON.stringify(defaultTaskStates),
        },
        {
          task: {
            [Sequelize.Op.is]: null,
          },
        },
        { transaction },
      );
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw new Error(`Run migration 20241230093359-insert-data-in-settings failed: ${error.message}`);
    }
  },

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async down(queryInterface, Sequelize) {},
};
