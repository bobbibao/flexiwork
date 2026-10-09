import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, BelongsTo, ForeignKey } from 'sequelize-typescript';
import { ApiProperty } from '@nestjs/swagger';
import InvoiceDetail from './invoice-details.model';

@Table({
  tableName: 'invoice_additional_costs',
  timestamps: false,
  indexes: [{ fields: ['invoice_id'] }],
})
export default class InvoiceAdditionalCost extends Model<InvoiceAdditionalCost> {
  @ApiProperty({ description: 'The unique identifier of the additional cost', type: Number })
  @PrimaryKey
  @AutoIncrement
  @Column({ type: DataType.INTEGER })
  id!: number;

  @ForeignKey(() => InvoiceDetail)
  @Column({ type: DataType.INTEGER })
  invoice_id!: number;

  @BelongsTo(() => InvoiceDetail)
  invoiceDetails!: InvoiceDetail;

  @ApiProperty({ type: String, nullable: true })
  @Column({ type: DataType.TEXT, allowNull: true })
  label!: string | null;

  @ApiProperty({ type: Number, nullable: true })
  @Column({ type: DataType.DECIMAL(5, 2), allowNull: true })
  value!: number | null;

  @ApiProperty({ type: Boolean, nullable: true })
  @Column({ type: DataType.BOOLEAN, allowNull: true })
  is_active!: boolean | null;

  @ApiProperty({ type: Date, nullable: true })
  @Column({ type: DataType.DATE, allowNull: true })
  created_at!: Date | null;

  @ApiProperty({ type: Number, nullable: true })
  @Column({ type: DataType.INTEGER, allowNull: true })
  created_by!: number | null;

  @ApiProperty({ type: Date, nullable: true })
  @Column({ type: DataType.DATE, allowNull: true })
  updated_at!: Date | null;

  @ApiProperty({ type: Number, nullable: true })
  @Column({ type: DataType.INTEGER, allowNull: true })
  updated_by!: number | null;
}
