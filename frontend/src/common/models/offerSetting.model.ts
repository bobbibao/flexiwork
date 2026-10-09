import { SelectOption } from "@/components";
import { OfferCostGenerate } from "./offerCostGenerate.model";

export interface OfferSetting {
  add_cost_setting: [
    {
      label: string;
      value: number;
    }
  ];
  additional: string;
  additional_desc: string;
  begin: string;
  begin_desc: string;
  end: string;
  end_desc: string;
  estimate_cost: string;
  estimate_setting: [
    {
      id: number;
      order: string;
      label: string;
      value: number;
    }
  ];
  event: string;
  event_setting: [
    {
      label: string;
      value: string;
    }
  ];
  generate_setting: OfferCostGenerate;
  km_dropdown_setting: SelectOption[];
  offer: string;
  offer_desc: string;
  parameter: string;
  parameter_desc: string;
  performance: string;
  performance_desc: string;
  subtitle_setting: [
    {
      label: string;
    }
  ];
}
