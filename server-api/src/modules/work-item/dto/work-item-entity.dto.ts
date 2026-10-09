import { ApiProperty } from '@nestjs/swagger';
import Product from 'src/database/models/products.model';
import Project from 'src/database/models/projects.model';
import User from 'src/database/models/users.model';
import WorkItem from 'src/database/models/work-items.model';
import WorkLog from 'src/database/models/work-logs.model';
import { HolidayDto } from 'src/modules/setting/dto/holiday.dto';
import { compareDates } from 'src/shared/utils/date-utils';

export class WorkItemEntityDto extends WorkItem {
  @ApiProperty()
  work_logs: WorkLog[];

  user: User;
  product: Product;
  project: Project;
}

export class WorkItemInputDto {
  @ApiProperty()
  project_id: number;

  @ApiProperty()
  product_id: number;

  @ApiProperty()
  task_ids: number[];

  @ApiProperty()
  task: string;

  @ApiProperty()
  tasks: string[];

  @ApiProperty()
  user_id: number;
}

export class WorkItemShowRequestDto {
  @ApiProperty()
  ids: number[];

  @ApiProperty()
  user_id: number;
}

export class TimeSheetPeriodsEntityDto {
  start_date: Date;
  end_date: Date;
  work_percent: number | string;
  actual_hours_per_day: number;
  latest_flex_hours: number;

  constructor(
    start_date: Date,
    end_date: Date,
    work_percent: number | string,
    actual_hours_per_day: number,
    latest_flex_hours: number,
  ) {
    this.start_date = start_date;
    this.end_date = end_date;
    this.work_percent = work_percent;
    this.actual_hours_per_day = actual_hours_per_day;
    this.latest_flex_hours = latest_flex_hours;
  }
}

export class FlexHourEntityDto {
  date: Date | string;
  actual_hours: number;
  flex_hours: number;

  constructor(date: Date, actual_hours: number, flex_hours: number) {
    this.date = date;
    this.actual_hours = actual_hours;
    this.flex_hours = flex_hours;
  }
}

export function processHolidays(flexHour: FlexHourEntityDto, holidays: HolidayDto[]): FlexHourEntityDto {
  const fh = flexHour;
  for (let index = 0; index < holidays.length; index++) {
    if (compareDates(holidays[index].date, fh.date) === 0) {
      fh.actual_hours = 0;
      break;
    }
  }

  return fh;
}

export interface WorkItemDto {
  companyId: number;
  userId: number;
  projectId: number;
  productId: number;
  task: string;
  isHide: boolean;
  createdAt: Date;
}
