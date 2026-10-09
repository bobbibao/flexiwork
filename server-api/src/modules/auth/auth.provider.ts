import { Provider } from '@nestjs/common';
import User from 'src/database/models/users.model';

export const authProvider: Provider[] = [
  {
    provide: 'USER_REPOSITORY',
    useValue: User,
  },
];
