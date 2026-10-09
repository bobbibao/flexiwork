import { Provider } from '@nestjs/common';
import User from 'src/database/models/users.model';

export const snAuthProvider: Provider[] = [{ provide: 'SN_USER_REPOSITORY', useValue: User }];
