import { Injectable, Logger } from '@nestjs/common';
import { Op } from 'sequelize';
import { Cron } from '@nestjs/schedule';

import Task from '../../database/models/task.model';

@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);

  @Cron('0 0 0 * * *', {
    name: 'Delete Soft-Deleted Tasks Older Than 30 Days',
    timeZone: 'Europe/Zurich', // Temporary hardcode Zurich timezone, need to change to dynamic
  })
  async deleteSoftDeletedTasks() {
    try {
      this.logger.log('Deleting soft over-30-day deleted tasks...');
      const satisfiedTasks = await Task.findAll({
        attributes: ['id'],
        where: {
          deleted_at: {
            [Op.lt]: new Date(new Date().setDate(new Date().getDate() - 30)),
          },
        },
        paranoid: false,
      });
      await Task.destroy({
        where: {
          id: satisfiedTasks.map((task) => task.get('id')),
        },
      });
      this.logger.log('Soft over-30-day deleted tasks have been deleted!');
    } catch (error) {
      this.logger.error('Error when deleting soft over-30-day deleted tasks:', error);
    }
  }
}
