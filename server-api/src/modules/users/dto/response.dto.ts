import Company from 'src/database/models/companies.model';
import User from 'src/database/models/users.model';

export interface AuthResponseDto {
  access_token: string;
  user: Partial<User>;
}

export interface MultipleAccountResponseDto {
  companies: Company[];
  error: string;
}
