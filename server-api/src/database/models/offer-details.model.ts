import { BelongsTo, Column, DataType, ForeignKey, HasMany, Model, PrimaryKey, Table } from 'sequelize-typescript';
import Offer from './offers.model';
import OfferQuoteItem from './offer-quote-item.model';
import OfferAdditionalCost from './offer-additional-cost.model';
import OfferCostEstimate from './offer-cost-estimate.model';
import OfferEvent from './offer-event.model';
import OfferInternalDesc from './offer-internal-desc.model';

@Table({
  tableName: 'offer_details',
})
export default class OfferDetail extends Model<OfferDetail> {
  @ForeignKey(() => Offer)
  @PrimaryKey
  @Column({
    type: DataType.INTEGER,
  })
  offer_id: number;

  @BelongsTo(() => Offer, { foreignKey: 'offer_id' })
  offerSummary?: Offer;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  name: string | null;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  begin: string | null;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  end: string | null;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  date: Date | null;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  event: string | null;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  offer: string | null;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  title: string | null;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  category: string | null;

  @Column({
    type: DataType.STRING(3),
    allowNull: true,
  })
  currency: string | null;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  end_desc: string | null;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  location: string | null;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  parameter: string | null;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  additional: string | null;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  begin_desc: string | null;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  offer_desc: string | null;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  begin_break: boolean;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  event_break: boolean;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  offer_break: boolean;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  performance: string | null;

  @Column({
    type: DataType.JSONB,
    allowNull: false,
    defaultValue: {},
  })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cost_generate: Record<string, any>;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  estimate_cost: string | null;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  parameter_desc: string | null;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  additional_desc: string | null;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  parameter_break: boolean;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  additional_break: boolean;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: true,
  })
  discount_percent: number | null;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  performance_desc: string | null;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  offer_quote_break: boolean;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  performance_break: boolean;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  internal_desc_custom: string | null;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    defaultValue: '',
  })
  selected_km_label: string;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
  })
  selected_km_value: number;

  @HasMany(() => OfferQuoteItem, {
    foreignKey: 'offer_id',
    sourceKey: 'offer_id',
    as: 'quote_items',
  })
  quote_items?: OfferQuoteItem[] | null;

  @HasMany(() => OfferAdditionalCost, {
    foreignKey: 'offer_id',
    sourceKey: 'offer_id',
    as: 'additional_cost',
  })
  additional_cost?: OfferAdditionalCost[] | null;

  @HasMany(() => OfferCostEstimate, {
    foreignKey: 'offer_id',
    sourceKey: 'offer_id',
    as: 'cost_estimate',
  })
  cost_estimate?: OfferCostEstimate[] | null;

  @HasMany(() => OfferEvent, {
    foreignKey: 'offer_id',
    sourceKey: 'offer_id',
    as: 'events',
  })
  events?: OfferEvent[] | null;

  @HasMany(() => OfferInternalDesc, {
    foreignKey: 'offer_id',
    sourceKey: 'offer_id',
    as: 'internal_desc',
  })
  internal_desc?: OfferInternalDesc[] | null;
}
