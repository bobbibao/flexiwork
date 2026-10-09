import { Provider } from '@nestjs/common';
import Invoice from 'src/database/models/invoices.model';
import Log from 'src/database/models/logs.model';
import CompanyTemplate from 'src/database/models/company-templates.model';

export const InvoiceProvider: Provider[] = [
  {
    provide: 'INVOICE_REPOSITORY',
    useValue: Invoice,
  },
  {
    provide: 'LOG_REPOSITORY',
    useValue: Log,
  },
  {
    provide: 'TEMPLATE_SERVICE',
    useValue: CompanyTemplate,
  },
];
