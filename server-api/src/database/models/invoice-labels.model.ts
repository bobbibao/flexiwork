import { AutoIncrement, BelongsTo, Column, DataType, ForeignKey, Model, PrimaryKey, Table } from 'sequelize-typescript';
import InvoiceDetail from './invoice-details.model';

@Table({
  tableName: 'invoice_labels',
  timestamps: false,
  indexes: [{ fields: ['invoice_id'] }],
})
export default class InvoiceLabel extends Model<InvoiceLabel> {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.INTEGER,
  })
  id: number;

  @ForeignKey(() => InvoiceDetail)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  invoice_id: number;

  @BelongsTo(() => InvoiceDetail, { foreignKey: 'invoice_id' })
  invoiceDetail?: InvoiceDetail;

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

  @Column({ type: DataType.DATE, allowNull: true })
  created_at!: Date | null;

  @Column({ type: DataType.INTEGER, allowNull: true })
  created_by!: number | null;

  @Column({ type: DataType.DATE, allowNull: true })
  updated_at!: Date | null;

  @Column({ type: DataType.INTEGER, allowNull: true })
  updated_by!: number | null;
}
