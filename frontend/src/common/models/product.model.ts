import { Unit } from "@/components/organisms/QuoteItems/type";

export interface Product {
  id: number;
  company_id: number | null;
  price: number | string;
  unit_id: number | null;
  name: string | null;
  description: string | null;
  vat_rate_id: number | null;
  metadata: object | null;
  created_at: Date | null | "0001-01-01T00:00:00Z";
  updated_at: Date | null | "0001-01-01T00:00:00Z";
  deleted_at: Date | null;
  folders: [{
    name: string;
    value: string;
  }]
  unit: Unit;
}
