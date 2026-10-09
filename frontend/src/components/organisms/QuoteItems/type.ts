export type QuoteItemType = "title" | "individual" | "textfield";
export type Unit = {
  name?: string;
  display?: string;
  description: string;
  is_default?: boolean;
};
export type Vat = {
  rate: number;
  is_default: boolean;
};

export interface QuoteItem {
  id?: string;
  type: QuoteItemType;
  name?: string;
  description: string;
  optional?: boolean;
  unit?: string;
  amount?: number;
  price?: number;
  vat_rate?: number;
  quarter?: number;
  year?: number;
  cost?: number;
  apply_discount?: boolean;
  is_nk?: boolean;
  product_id?: string;
  uuid?: string;
  break_page?: boolean;
}
