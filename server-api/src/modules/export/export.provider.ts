import { Provider } from '@nestjs/common';
import { InvoiceAdditionalCost, InvoiceDetail, InvoiceLabel, InvoiceProduct } from 'src/database/models';
import Customer from 'src/database/models/customers.model';
import Export from 'src/database/models/exports.model';
import Invoice from 'src/database/models/invoices.model';
import Setting from 'src/database/models/setting.model';
import User from 'src/database/models/users.model';

export const exportProvider: Provider[] = [
  {
    provide: 'EXPORT_REPOSITORY',
    useValue: Export,
  },
  {
    provide: 'CUSTOMER_REPOSITORY',
    useValue: Customer,
  },
  {
    provide: 'USER_REPOSITORY',
    useValue: User,
  },
  {
    provide: 'SETTING_REPOSITORY',
    useValue: Setting,
  },
  {
    provide: 'INVOICE_REPOSITORY',
    useValue: Invoice,
  },
  {
    provide: 'INVOICE_DETAIL_REPOSITORY',
    useValue: InvoiceDetail,
  },
  {
    provide: 'INVOICE_PRODUCT_REPOSITORY',
    useValue: InvoiceProduct,
  },
  {
    provide: 'INVOICE_ADDITIONAL_COST_REPOSITORY',
    useValue: InvoiceAdditionalCost,
  },
  {
    provide: 'INVOICE_LABEL_REPOSITORY',
    useValue: InvoiceLabel,
  },
];
