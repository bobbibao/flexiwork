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
import OfferDetail from './offer-details.model';

@Table({
  tableName: 'offer_internal_desc',
})
export default class OfferInternalDesc extends Model<OfferInternalDesc> {
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

  @BelongsTo(() => OfferDetail, { foreignKey: 'offer_id' })
  offerDetail?: OfferDetail;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  label: string | null;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  is_active: boolean;
}
