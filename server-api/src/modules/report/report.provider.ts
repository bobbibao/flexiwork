import { Provider } from '@nestjs/common';
import { Invoice, InvoiceAdditionalCost, InvoiceDetail, InvoiceLabel, InvoiceProduct } from 'src/database/models';
import InvoicePayments from 'src/database/models/invoice-payments.model';
import Log from 'src/database/models/logs.model';
import Project from 'src/database/models/projects.model';
import Setting from 'src/database/models/setting.model';

export const reportProvider: Provider[] = [
  {
    provide: 'SETTING_REPOSITORY',
    useValue: Setting,
  },
  {
    provide: 'LOG_REPOSITORY',
    useValue: Log,
  },
  {
    provide: 'PROJECT_REPOSITORY',
    useValue: Project,
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
  {
    provide: 'INVOICE_PAYMENTS_REPOSITORY',
    useValue: InvoicePayments,
  },
];
