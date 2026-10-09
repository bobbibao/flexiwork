import { InvoiceDetail } from 'src/database/models';

export interface BaseInvoice {
  id: number;
  charged_on: string;
  due_on: string;
  number: string;
  title: string;
  customer: string;
  status: string;
  details: InvoiceDetail;
  date?: string;
  ref_number?: string;
  net_amount?: number;
  gross_amount?: number;
  net_amount_nk?: number;
  gross_amount_nk?: number;
}

export interface QuoteItem {
  type: string;
  cost?: number | string;
  vat_rate: number;
  optional?: boolean;
  is_nk?: boolean;
  apply_discount?: boolean;
}
