import Product from 'src/database/models/products.model';
import Unit from 'src/database/models/units.model';
import VatRate from 'src/database/models/vat-rates.model';

export class ProductDetailDto extends Product {
    vat_rate: VatRate;
    unit: Unit;
}
