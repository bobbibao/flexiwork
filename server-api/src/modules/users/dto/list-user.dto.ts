import User from 'src/database/models/users.model';

export class ListUserDto {
  error: boolean;
  count: number;
  payload: User[];
}
