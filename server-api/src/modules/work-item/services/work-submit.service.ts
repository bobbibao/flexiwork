import { Inject, Injectable } from '@nestjs/common';
import { col, fn, literal, Op } from 'sequelize';
import WorkSubmit from 'src/database/models/work-submits.model';
import DateFormatter, {
  getFirstDateOfMonth,
  getLastDateOfMonth,
  getParsedOrFirstDateOfYear,
  getParsedOrLastDateOfYear,
} from 'src/shared/utils/date-utils';
import { WorkSubmitResponseDto } from '../dto/work-submit-entity.dto';
import { LockRequestDto, UnlockRequestDto } from '../dto/lock-request.dto';
import User from 'src/database/models/users.model';
import WorkLog from 'src/database/models/work-logs.model';
import { WorkLogInputDto } from '../dto/work-log-input.dto';
import { BadRequestError } from 'src/shared/utils';

@Injectable()
export class WorkSubmitService {
  constructor(
    @Inject('WORK_SUBMIT_REPOSITORY')
    private readonly workSubmitRepository: typeof WorkSubmit,
    @Inject('WORK_LOG_REPOSITORY')
    private readonly workLogRepository: typeof WorkLog,
  ) {}

  async getWorkSubmit(companyId: number, startDate: string, endDate: string): Promise<WorkSubmitResponseDto[]> {
    const [start, end] = [getParsedOrFirstDateOfYear(startDate), getParsedOrLastDateOfYear(endDate)];

    if (start > end) {
      throw new BadRequestError('start date cannot larger than end date');
    }

    const workSubmit = await User.findAll({
      attributes: [
        'id',
        'email',
        [fn('COALESCE', col('first_name'), ''), 'first_name'],
        [fn('COALESCE', col('last_name'), ''), 'last_name'],
        [
          fn('COALESCE', literal("TO_CHAR(work_submits.start_date, 'YYYY-MM-DD\"T\"HH24:MI:SS.US') || 'Z'"), null),
          'start_date',
        ],
        [
          fn('COALESCE', literal("TO_CHAR(work_submits.end_date, 'YYYY-MM-DD\"T\"HH24:MI:SS.US') || 'Z'"), null),
          'end_date',
        ],
      ],
      include: [
        {
          model: WorkSubmit,
          as: 'work_submits',
          attributes: [],
          required: false,
          where: {
            start_date: {
              [Op.between]: [startDate, endDate],
            },
          },
        },
      ],
      where: {
        company_id: companyId,
        deleted_at: { [Op.is]: null },
        id: { [Op.ne]: 1 },
        is_active: true,
      },
      order: [['id', 'ASC']],
      raw: true, // get raw data for DateFormatter
    });

    if (!workSubmit) {
      throw new BadRequestError(`Work submit not found for company_id: ${companyId}`);
    }

    const data = workSubmit.map((item) => DateFormatter.formatDTO(item, 'removeTrailingZeros'));

    return data;
  }

  async getWorkSubmitByUser(companyId: number, userId: number, startDate: Date, endDate: Date): Promise<WorkSubmit[]> {
    const ws = await this.workSubmitRepository.findAll({
      where: {
        company_id: companyId,
        user_id: userId,
        start_date: startDate,
        end_date: endDate,
      },
      raw: true,
    });

    if (!ws) {
      throw new BadRequestError(`Work submit not found for company_id: ${companyId} and user_id: ${userId}`);
    }

    return ws;
  }

  async lockWorkItem(companyId: number, data: LockRequestDto): Promise<void> {
    const [start, end] = [getFirstDateOfMonth(data.date), getLastDateOfMonth(data.date)];

    const [, isCreated] = await this.workSubmitRepository.findOrCreate({
      where: {
        company_id: companyId,
        user_id: data.user_id,
        start_date: start,
        end_date: end,
      },
      defaults: {
        company_id: companyId,
        user_id: data.user_id,
        start_date: start,
        end_date: end,
        metadata: {},
      },
    });

    if (!isCreated) {
      throw new BadRequestError('you already submitted this month');
    }
  }

  async unlockWorkItem(companyId: number, data: UnlockRequestDto): Promise<void> {
    const [start, end] = [getFirstDateOfMonth(data.date), getLastDateOfMonth(data.date)];

    data.user_ids.forEach(async (userId) => {
      await this.deleteWorkSubmit(companyId, userId, start, end);
    });
  }

  async deleteWorkSubmit(companyId: number, userId: number, startDate: Date, endDate: Date): Promise<void> {
    await this.workSubmitRepository.destroy({
      where: {
        company_id: companyId,
        user_id: userId,
        start_date: startDate,
        end_date: endDate,
      },
    });
  }

  async getUserLocked(companyId: number, startDate: string | Date, endDate: string | Date): Promise<User[]> {
    const users = (await User.findAll({
      attributes: [
        'id',
        ['email', 'email'],
        ['role', 'role'],
        [fn('COALESCE', col('is_active'), false), 'is_active'],
        [fn('COALESCE', col('avatar_url'), ''), 'avatar_url'],
        ['max_work_hours_per_week', 'max_work_hours_per_week'],
        ['max_work_hours_per_day', 'max_work_hours_per_day'],
        [fn('COALESCE', col('address'), ''), 'address'],
        [fn('COALESCE', col('dob'), ''), 'dob'],
        [fn('COALESCE', col('end_work_date'), ''), 'end_work_date'],
        [fn('COALESCE', col('job'), ''), 'job'],
        [fn('COALESCE', col('name'), ''), 'name'],
        [fn('COALESCE', col('phone'), ''), 'phone'],
        [fn('COALESCE', col('place'), ''), 'place'],
        [fn('COALESCE', col('postcode'), ''), 'postcode'],
        [fn('COALESCE', col('start_work_date'), ''), 'start_work_date'],
        [fn('COALESCE', col('first_name'), ''), 'first_name'],
        [fn('COALESCE', col('last_name'), ''), 'last_name'],
        [fn('COALESCE', col('holidays'), 0), 'holidays'],
        [fn('COALESCE', col('work_percent_per_week'), '0'), 'work_percent_per_week'],
        ['timesheet_periods', 'timesheet_periods'],
        ['holiday_periods', 'holiday_periods'],
        ['company_id', 'company_id'],
        [
          fn(
            'COALESCE',
            fn(
              'regexp_replace',
              literal(`TO_CHAR("User"."created_at" AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"')`),
              '(\\.[0-9]*[1-9])0+Z$',
              '\\1Z',
            ),
            '0001-01-01T00:00:00Z',
          ),
          'created_at',
        ], // COALESCE(regexp_replace(...), '0001-01-01T00:00:00Z')
        [
          fn(
            'COALESCE',
            fn(
              'regexp_replace',
              literal(`TO_CHAR("User"."updated_at" AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"')`),
              '(\\.[0-9]*[1-9])0+Z$',
              '\\1Z',
            ),
            '0001-01-01T00:00:00Z',
          ),
          'updated_at',
        ], // COALESCE(regexp_replace(...), '0001-01-01T00:00:00Z')
      ],
      include: [
        {
          model: WorkSubmit,
          as: 'work_submits',
          required: true,
          attributes: [],
          where: {
            start_date: startDate,
            end_date: endDate,
          },
        },
      ],
      where: {
        company_id: companyId,
        deleted_at: { [Op.is]: null },
      },
      order: [['id', 'ASC']],
    })) as User[];

    if (!users) {
      throw new BadRequestError(`User not found for company_id: ${companyId}`);
    }

    const data = users.map((user) => {
      const item = user.toJSON();

      let holidayPeriods = [];
      try {
        holidayPeriods = item.holiday_periods ? JSON.parse(item.holiday_periods) : [];
      } catch (error) {
        console.error(`Invalid holiday_periods for user ${item.id}`, error);
      }

      return DateFormatter.formatDTO({
        ...item,
        holiday_periods: holidayPeriods,
        work_percent_per_week: +item.work_percent_per_week || 0,
        max_work_hours_per_week: +item.max_work_hours_per_week || 0,
        max_work_hours_per_day: +item.max_work_hours_per_day || 0,
        holidays: +item.holidays || 0,
      });
    });

    return data;
  }

  async getWorkLogByUser(companyId: number, userId: number, workItemId: number, date: Date): Promise<WorkLog> {
    const workLog = await this.workLogRepository.findOne({
      where: {
        company_id: companyId,
        user_id: userId,
        work_item_id: workItemId,
        date: date,
      },
    });
    return workLog;
  }

  async addOrUpdateWorkLog(
    companyId: number,
    userId: number,
    workDate: Date,
    spentTime: string,
    spentTimeInHour: number,
    body: WorkLogInputDto,
  ): Promise<void> {
    const workLog = await this.getWorkLogByUser(companyId, userId, body.work_item_id, workDate);
    if (!workLog) {
      const created = await this.workLogRepository.create({
        company_id: companyId,
        user_id: userId,
        work_item_id: body.work_item_id,
        date: workDate,
        comment: body.comment,
        created_at: new Date(),
        spent: spentTime,
        spent_in_hour: spentTimeInHour,
      });

      if (!created) {
        throw new BadRequestError('Failed to create work log');
      }
    } else {
      const [updated] = await this.workLogRepository.update(
        {
          spent: spentTime,
          spent_in_hour: spentTimeInHour,
          comment: body.comment,
          updated_at: new Date(),
          date: workDate,
        },
        {
          where: {
            company_id: companyId,
            user_id: userId,
            work_item_id: body.work_item_id,
            date: workDate,
          },
        },
      );
      if (!updated) {
        throw new BadRequestError('Failed to update work log');
      }
    }
  }
}
