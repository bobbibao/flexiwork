import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, BelongsTo, ForeignKey } from 'sequelize-typescript';
import { ApiProperty } from '@nestjs/swagger';
import InvoiceDetail from './invoice-details.model';
import Product from './products.model';

@Table({
  tableName: 'invoice_products',
  timestamps: false,
  indexes: [{ fields: ['invoice_id'] }],
})
export default class InvoiceProduct extends Model<InvoiceProduct> {
  @ApiProperty({
    description: 'The unique identifier of the quote item',
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

  @ApiProperty({ type: Number, nullable: true })
  @ForeignKey(() => Product)
  @Column({ type: DataType.INTEGER, allowNull: true })
  product_id!: number | null;

  @ApiProperty({ type: String, nullable: true })
  @Column({ type: DataType.STRING, allowNull: true })
  name!: string | null;

  @ApiProperty({ type: Number, nullable: true })
  @Column({ type: DataType.DECIMAL(10, 2), allowNull: true })
  cost!: number | null;

  @ApiProperty({ type: String, nullable: true })
  @Column({ type: DataType.TEXT, allowNull: true })
  description!: string | null;

  @ApiProperty({ type: String, nullable: true })
  @Column({ type: DataType.STRING(100), allowNull: true })
  type!: string | null;

  @ApiProperty({ type: String, nullable: true })
  @Column({ type: DataType.STRING(100), allowNull: true })
  unit!: string | null;

  @ApiProperty({ type: Number, nullable: true })
  @Column({ type: DataType.INTEGER, allowNull: true })
  quarter!: number | null;

  @ApiProperty({ type: Number, nullable: true })
  @Column({ type: DataType.INTEGER, allowNull: true })
  year!: number | null;

  @ApiProperty({ type: String, nullable: true })
  @Column({ type: DataType.STRING(100), allowNull: true })
  uuid!: string | null;

  @ApiProperty({ type: Number, nullable: true })
  @Column({ type: DataType.DECIMAL(10, 2), allowNull: true })
  price!: number | null;

  @ApiProperty({ type: Number, nullable: true })
  @Column({ type: DataType.DECIMAL(10, 2), allowNull: true })
  invoice_rate!: number | null;

  @ApiProperty({ type: Number, nullable: true })
  @Column({ type: DataType.DECIMAL(10, 2), allowNull: true })
  amount!: number | null;

  @ApiProperty({ type: Number, nullable: true })
  @Column({ type: DataType.DECIMAL(10, 2), allowNull: true })
  remaining!: number | null;

  @ApiProperty({ type: Boolean, nullable: true })
  @Column({ type: DataType.BOOLEAN, allowNull: true })
  break_page!: boolean | null;

  @ApiProperty({ type: Boolean, nullable: true })
  @Column({ type: DataType.BOOLEAN, allowNull: true })
  optional!: boolean | null;

  @ApiProperty({ type: Number, nullable: true })
  @Column({ type: DataType.DECIMAL(5, 2), allowNull: true })
  vat_rate!: number | null;

  @ApiProperty({ type: Boolean, nullable: true })
  @Column({ type: DataType.BOOLEAN, allowNull: true })
  is_nk!: boolean | null;

  @ApiProperty({ type: Boolean, nullable: true })
  @Column({ type: DataType.BOOLEAN, allowNull: true })
  apply_discount!: boolean | null;

  @ApiProperty({ type: Boolean, nullable: true })
  @Column({ type: DataType.BOOLEAN, allowNull: true })
  selected!: boolean | null;

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
  invoiceDetails?: InvoiceDetail;

  @BelongsTo(() => Product)
  product?: Product;
}
