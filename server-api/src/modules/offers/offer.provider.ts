import { Provider } from '@nestjs/common';
import { InvoiceAdditionalCost, InvoiceDetail, InvoiceLabel, InvoiceProduct } from 'src/database/models';
import CompanyGroup from 'src/database/models/company-groups.model';
import CompanyTemplate from 'src/database/models/company-templates.model';
import Log from 'src/database/models/logs.model';
import OfferAdditionalCost from 'src/database/models/offer-additional-cost.model';
import OfferCostEstimate from 'src/database/models/offer-cost-estimate.model';
import OfferDetail from 'src/database/models/offer-details.model';
import OfferEvent from 'src/database/models/offer-event.model';
import OfferInternalDesc from 'src/database/models/offer-internal-desc.model';
import OfferQuoteItem from 'src/database/models/offer-quote-item.model';
import Offer from 'src/database/models/offers.model';

export const OfferProvider: Provider[] = [
  {
    provide: 'LOG_REPOSITORY',
    useValue: Log,
  },
  {
    provide: 'OFFER_REPOSITORY',
    useValue: Offer,
  },
  {
    provide: 'COMPANY_TEMPLATE_REPOSITORY',
    useValue: CompanyTemplate,
  },
  {
    provide: 'COMPANY_GROUP_REPOSITORY',
    useValue: CompanyGroup,
  },
  {
    provide: 'OFFER_ADDITIONAL_COST_REPOSITORY',
    useValue: OfferAdditionalCost,
  },
  {
    provide: 'OFFER_COST_ESTIMATE_REPOSITORY',
    useValue: OfferCostEstimate,
  },
  {
    provide: 'OFFER_DETAIL_REPOSITORY',
    useValue: OfferDetail,
  },
  {
    provide: 'OFFER_EVENT_REPOSITORY',
    useValue: OfferEvent,
  },
  {
    provide: 'OFFER_INTERNAL_DESC_REPOSITORY',
    useValue: OfferInternalDesc,
  },
  {
    provide: 'OFFER_QUOTE_ITEM_REPOSITORY',
    useValue: OfferQuoteItem,
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
