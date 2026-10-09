export class GenerateProductDto {
  coefficients_z1: {
    label: string;
    value: number;
  };
  coefficients_z2: {
    label: string;
    value: number;
  };
  construction_cost: {
    label: string;
    value: number;
  };
  difficulty_lv: {
    label: string;
    value: number;
  };
  special_service_factor: {
    label: string;
    value: number;
  };
  adjustment_factor: {
    label: string;
    value: number;
  };
  team_factor: {
    label: string;
    value: number;
  };
  u_factor: {
    label: string;
    value: number;
  };
  advertised: {
    label: string;
    value: number;
  };
}

export interface GeneratedProductResponse {
  quote_items: any;
  offer_desc: string;
  p: number;
  tm: number;
  discount_percent: number;
}

export interface ProductQuoteItem {
  amount: number;
  break_page: boolean;
  cost: number;
  description: string;
  id?: number;
  name: string;
  optional: boolean;
  price: number;
  type: string;
  unit: string;
  uuid: string;
  vat_rate: number;
}
