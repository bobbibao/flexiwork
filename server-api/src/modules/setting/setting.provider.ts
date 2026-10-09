import { Provider } from '@nestjs/common';
import Setting from 'src/database/models/setting.model';

export const settingProvider: Provider[] = [
  {
    provide: 'SETTING_REPOSITORY',
    useValue: Setting,
  },
];
