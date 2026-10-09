import { Provider } from '@nestjs/common';
import Company from 'src/database/models/companies.model';
import GroupProduct from 'src/database/models/group-products.model';
import CompanyGroup from 'src/database/models/company-groups.model';
import Product from 'src/database/models/products.model';
import Setting from 'src/database/models/setting.model';
import Unit from 'src/database/models/units.model';
import UserActivation from 'src/database/models/user-activations.model';
import User from 'src/database/models/users.model';
import VatRate from 'src/database/models/vat-rates.model';
import WorkLog from 'src/database/models/work-logs.model';

export const userProvider: Provider[] = [
  {
    provide: 'USER_REPOSITORY',
    useValue: User,
  },
  {
    provide: 'USER_ACTIVATION_REPOSITORY',
    useValue: UserActivation,
  },
  {
    provide: 'COMPANY_REPOSITORY',
    useValue: Company,
  },
  {
    provide: 'VAT_RATE_REPOSITORY',
    useValue: VatRate,
  },
  {
    provide: 'UNIT_REPOSITORY',
    useValue: Unit,
  },
  {
    provide: 'PRODUCT_REPOSITORY',
    useValue: Product,
  },
  {
    provide: 'COMPANY_GROUP_REPOSITORY',
    useValue: CompanyGroup,
  },
  {
    provide: 'GROUP_PRODUCT_REPOSITORY',
    useValue: GroupProduct,
  },
  {
    provide: 'SETTING_REPOSITORY',
    useValue: Setting,
  },
  {
    provide: 'WORK_LOG_REPOSITORY',
    useValue: WorkLog,
  },
];
