import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, BelongsTo, ForeignKey } from 'sequelize-typescript';
import { ApiProperty } from '@nestjs/swagger';
import InvoiceDetail from './invoice-details.model';

@Table({
  tableName: 'invoice_payments',
  timestamps: false,
  indexes: [{ fields: ['invoice_id'] }],
})
export default class InvoicePayments extends Model<InvoicePayments> {
  @ApiProperty({
    description: 'The unique identifier of the invoice paid history',
    type: Number,
  })
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.INTEGER,
  })
  id!: number;

  @ForeignKey(() => InvoiceDetail)
  @Column({ type: DataType.INTEGER })
  invoice_id!: number;

  @ApiProperty({
    description: 'Date of the invoice payment',
    type: Number,
  })
  @Column({ type: DataType.DATE, allowNull: true })
  @ApiProperty({ type: Date, nullable: true })
  date!: Date | null;

  @ApiProperty({
    description: 'Amount paid for this payment',
    type: Number,
  })
  @ApiProperty({ type: Number, nullable: true })
  @Column({ type: DataType.DECIMAL(10, 2), allowNull: true })
  amount!: number | null;

  @ApiProperty({
    description: 'Percentage of the amount paid',
    type: Number,
  })
  @ApiProperty({ type: Number, nullable: true })
  @Column({ type: DataType.DECIMAL(5, 2), allowNull: true })
  percent!: number | null;

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

  @BelongsTo(() => InvoiceDetail)
  invoiceDetail!: InvoiceDetail;
}
