import { Product } from "./product.model";

export interface ProductGroup {
  id: number;
  description: string | null;
  company_id: number | null;
  name: string | null;
  metadata: object | null;
  products: Product[];
  created_at: Date | null | "0001-01-01T00:00:00Z";
  updated_at: Date | null | "0001-01-01T00:00:00Z";
  deleted_at: Date | null;
}
