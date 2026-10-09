import {
  AutoIncrement,
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Index,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import Product from './products.model';
import OfferDetail from './offer-details.model';

@Table({
  tableName: 'offer_quote_items',
})
export default class OfferQuoteItem extends Model<OfferQuoteItem> {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.INTEGER,
  })
  id: number;

  @ForeignKey(() => OfferDetail)
  @Index
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  offer_id: number;

  @BelongsTo(() => OfferDetail, { foreignKey: 'offer_id', as: 'offerDetail', targetKey: 'offer_id' })
  offerDetail?: OfferDetail;

  @ForeignKey(() => Product)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  product_id: number | null;

  @BelongsTo(() => Product)
  product?: Product;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  name: string | null;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: true,
  })
  cost: number | null;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  type: string | null;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  unit: string | null;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  uuid: string | null;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: true,
  })
  price: number | null;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  year: number | null;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  description: string | null;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: true,
  })
  amount: number | null;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  quarter: number | null;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  optional: boolean;

  @Column({
    type: DataType.DECIMAL(5, 2),
    allowNull: true,
  })
  vat_rate: number | null;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  break_page: boolean;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  is_nk: boolean;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  apply_discount: boolean;
}
