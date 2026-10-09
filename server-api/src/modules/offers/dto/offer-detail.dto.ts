import Customer from 'src/database/models/customers.model';
import NumberEntry from 'src/database/models/numbers.model';
import Offer from 'src/database/models/offers.model';
import { DetailCost } from 'src/shared/dto/detail-cost.dto';

export class OfferDetailDto extends Offer {
  detail_cost: DetailCost;
  amount: number;
  date: Date | '0001-01-01T00:00:00Z';
  number: NumberEntry;
  customer: Customer;
}
