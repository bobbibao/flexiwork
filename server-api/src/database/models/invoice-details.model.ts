import { Table, Column, Model, DataType, PrimaryKey, BelongsTo, ForeignKey, HasMany } from 'sequelize-typescript';
import { ApiProperty } from '@nestjs/swagger';
import Project from './projects.model';
import Invoice from './invoices.model';
import InvoiceLabel from './invoice-labels.model';
import InvoiceProduct from './invoice-products.model';
import InvoicePayments from './invoice-payments.model';
import InvoiceAdditionalCost from './invoice-additional-costs.model';

@Table({
  tableName: 'invoice_details',
  timestamps: false,
  indexes: [{ fields: ['invoice_id'] }, { fields: ['project_id'] }],
})
export default class InvoiceDetail extends Model<InvoiceDetail> {
  @ApiProperty({
    description: 'The unique identifier of the invoice details',
    type: Number,
  })
  @ForeignKey(() => Invoice)
  @PrimaryKey
  @Column({
    type: DataType.INTEGER,
  })
  invoice_id!: number;

  @ApiProperty({
    description: 'The foreign key of the project associated with the invoice',
    type: Number,
  })
  @ForeignKey(() => Project)
  @Column({
    type: DataType.INTEGER,
  })
  project_id!: number;

  @ApiProperty({ type: Date, nullable: true })
  @Column({ type: DataType.DATE, allowNull: true })
  date!: Date | null;

  @ApiProperty({ type: String, nullable: true })
  @Column({ type: DataType.STRING(3), allowNull: true })
  currency!: string | null;

  @ApiProperty({ type: String, nullable: true })
  @Column({ type: DataType.STRING, allowNull: true })
  duration!: string | null;

  @ApiProperty({ type: String, nullable: true })
  @Column({ type: DataType.TEXT, allowNull: true })
  begin!: string | null;

  @ApiProperty({ type: String, nullable: true })
  @Column({ type: DataType.TEXT, allowNull: true })
  begin_desc!: string | null;

  @ApiProperty({ type: Boolean, nullable: true })
  @Column({ type: DataType.BOOLEAN, allowNull: true, defaultValue: false })
  inv_begin_break!: boolean;

  @ApiProperty({ type: String, nullable: true })
  @Column({ type: DataType.TEXT, allowNull: true })
  end!: string | null;

  @ApiProperty({ type: String, nullable: true })
  @Column({ type: DataType.TEXT, allowNull: true })
  end_desc!: string | null;

  @ApiProperty({ type: Boolean, nullable: true })
  @Column({ type: DataType.BOOLEAN, allowNull: true, defaultValue: false })
  inv_quote_break!: boolean;

  @ApiProperty({ type: String, nullable: true })
  @Column({ type: DataType.TEXT, allowNull: true })
  location!: string | null;

  @ApiProperty({ type: Number, nullable: true })
  @Column({ type: DataType.DECIMAL(5, 2), allowNull: true })
  discount_percent!: number | null;

  @ApiProperty({ type: String, nullable: true })
  @Column({ type: DataType.TEXT, allowNull: true })
  internal_desc_custom!: string | null;

  @ApiProperty({ type: String, nullable: true })
  @Column({ type: DataType.TEXT, allowNull: true })
  address!: string | null;

  @ApiProperty({ type: String, nullable: true })
  @Column({ type: DataType.STRING, allowNull: true })
  selected_km_label!: string | null;

  @ApiProperty({ type: Number, nullable: true })
  @Column({ type: DataType.DECIMAL(5, 2), allowNull: true })
  selected_km_value!: number | null;

  @ApiProperty({ type: Number, nullable: true })
  @Column({ type: DataType.INTEGER, allowNull: true })
  payment_deadline!: number | null;

  @ApiProperty({ type: Boolean, nullable: true })
  @Column({ type: DataType.BOOLEAN, allowNull: true, defaultValue: false })
  is_final!: boolean;

  @ApiProperty({ type: Boolean, nullable: true })
  @Column({ type: DataType.BOOLEAN, allowNull: true })
  is_custom_date!: boolean | null;

  @ApiProperty({ type: Date, nullable: true })
  @Column({ type: DataType.DATE, allowNull: true })
  paid_on!: Date | null;

  @ApiProperty({ type: Date, nullable: true })
  @Column({ type: DataType.DATE, allowNull: true })
  invoice_value_date!: Date | null;

  @ApiProperty({ type: String, nullable: true })
  @Column({ type: DataType.TEXT, allowNull: true })
  invoice_comment!: string | null;

  @ApiProperty({ type: String, nullable: true })
  @Column({ type: DataType.STRING(100), allowNull: true })
  slip_number!: string | null;

  @ApiProperty({ type: Boolean, nullable: true })
  @Column({ type: DataType.BOOLEAN, allowNull: true })
  is_custom_title!: boolean | null;

  @ApiProperty({ type: Date, nullable: true })
  @Column({ type: DataType.DATE, allowNull: true })
  start_date_inv!: Date | null;

  @ApiProperty({ type: Date, nullable: true })
  @Column({ type: DataType.DATE, allowNull: true })
  end_date_inv!: Date | null;

  @ApiProperty({ type: Boolean, nullable: true })
  @Column({ type: DataType.BOOLEAN, allowNull: true, defaultValue: false })
  is_included_external_hour_report!: boolean | null;

  @ApiProperty({ type: Boolean, nullable: true })
  @Column({ type: DataType.BOOLEAN, allowNull: true, defaultValue: false })
  is_included_internal_hour_report!: boolean | null;

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

  @BelongsTo(() => Invoice, 'invoice_id')
  invoice?: Invoice;

  @BelongsTo(() => Project, 'project_id')
  project?: Project;

  @HasMany(() => InvoicePayments, {
    foreignKey: 'invoice_id',
    sourceKey: 'invoice_id',
    as: 'paid_histories',
  })
  paid_histories!: InvoicePayments[];

  @HasMany(() => InvoiceAdditionalCost, {
    foreignKey: 'invoice_id',
    sourceKey: 'invoice_id',
    as: 'additional_costs',
  })
  additional_costs!: InvoiceAdditionalCost[];

  @HasMany(() => InvoiceLabel, {
    foreignKey: 'invoice_id',
    sourceKey: 'invoice_id',
    as: 'internal_descs',
  })
  internal_descs!: InvoiceLabel[];

  @HasMany(() => InvoiceProduct, {
    foreignKey: 'invoice_id',
    sourceKey: 'invoice_id',
    as: 'quote_items',
  })
  quote_items!: InvoiceProduct[];
}
