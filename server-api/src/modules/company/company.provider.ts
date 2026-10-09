import { Provider } from '@nestjs/common';
import Company from 'src/database/models/companies.model';
import CompanyShare from 'src/database/models/companies-shares.model';

export const CompanyProvider: Provider[] = [
  {
    provide: 'COMPANY_REPOSITORY',
    useValue: Company,
  },
  {
    provide: 'COMPANY_SHARE_REPOSITORY',
    useValue: CompanyShare,
  },
];
