export class DetailCost {
  id?: number;
  total_net: number;
  total_net_nk: number;
  total_gross: number;
  total_gross_nk: number;
  total_discount: number;
  total_discount_nk: number;
  total_vat_list: Record<string, number>;
  total_init_net_by_vat: Record<string, number>;
  total_init_net_nk_by_vat: Record<string, number>;

}
