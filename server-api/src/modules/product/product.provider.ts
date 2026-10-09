import { Provider } from '@nestjs/common';
import CompanyGroup from 'src/database/models/company-groups.model';
import Product from 'src/database/models/products.model';

export const ProductProvider: Provider[] = [
  {
    provide: 'PRODUCT_PROVIDER',
    useValue: Product,
  },
  {
    provide: 'COMPANY_GROUP_REPOSITORY',
    useValue: CompanyGroup,
  },
];
