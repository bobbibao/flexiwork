import { Provider } from '@nestjs/common';
import Setting from 'src/database/models/setting.model';
import UserHoliday from 'src/database/models/user-holidays.model';
import WorkItem from 'src/database/models/work-items.model';
import WorkLog from 'src/database/models/work-logs.model';
import WorkSubmit from 'src/database/models/work-submits.model';

export const WorkItemProvider: Provider[] = [
  {
    provide: 'WORK_ITEM_REPOSITORY',
    useValue: WorkItem,
  },
  {
    provide: 'WORK_LOG_REPOSITORY',
    useValue: WorkLog,
  },
  {
    provide: 'WORK_SUBMIT_REPOSITORY',
    useValue: WorkSubmit,
  },
  {
    provide: 'USER_HOLIDAY_REPOSITORY',
    useValue: UserHoliday
  },
  {
    provide: 'SETTING_REPOSITORY',
    useValue: Setting
  }
];
