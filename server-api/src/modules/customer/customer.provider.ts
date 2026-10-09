import { Provider } from '@nestjs/common';
import Contact from 'src/database/models/contacts.model';
import Customer from 'src/database/models/customers.model';

export const CustomerProvider: Provider[] = [
  {
    provide: 'CUSTOMER_REPOSITORY',
    useValue: Customer,
  },
  {
    provide: 'CONTACT_REPOSITORY',
    useValue: Contact,
  },
];
