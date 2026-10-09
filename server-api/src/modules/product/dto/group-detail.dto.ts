import { ProductDetailDto } from "./product-detail.dto";
import Product from "src/database/models/products.model";

export class GroupDetailDto extends Product {
  products: ProductDetailDto[];
}