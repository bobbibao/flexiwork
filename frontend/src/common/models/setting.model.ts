import { OfferSetting } from "./offerSetting.model";
import { ProductSetting } from "./productSetting.model";

export interface SettingDto {
  company_id: number;
  offer: OfferSetting;
  product: ProductSetting;
  created_at: string | null;
  updated_at: string | null;
}
