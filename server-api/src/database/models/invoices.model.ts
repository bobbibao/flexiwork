import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, HasOne } from 'sequelize-typescript';
import { ApiProperty } from '@nestjs/swagger';
import NumberEntry from './numbers.model';
import Customer from './customers.model';
import InvoiceDetail from './invoice-details.model';
import Log from './logs.model';

@Table({
  tableName: 'invoices',
  indexes: [
    { fields: ['company_id'] },
    { fields: ['offer_id'] },
    { fields: ['project_id'] },
    { fields: ['customer_id'] },
    { fields: ['number_id'] },
  ],
})
export default class Invoice extends Model<Invoice> {
  @ApiProperty({
    description: 'The unique identifier of the invoice',
    type: Number,
  })
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.INTEGER,
  })
  id!: number;

  @ApiProperty({
    description: 'The ID of the company associated with the invoice',
    type: Number,
    nullable: true,
  })
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  company_id!: number | null;

  @ApiProperty({
    description: 'The ID of the offer associated with the invoice',
    type: Number,
    nullable: true,
  })
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  offer_id!: number | null;

  @ApiProperty({
    description: 'The ID of the project associated with the invoice',
    type: Number,
    nullable: true,
  })
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  project_id!: number | null;

  @ApiProperty({
    description: 'The ID of the customer associated with the invoice',
    type: Number,
    nullable: true,
  })
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  customer_id!: number | null;

  @ApiProperty({
    description: 'The type of the invoice',
    type: String,
    nullable: true,
  })
  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  type!: string | null;

  @ApiProperty({
    description: 'The name of the invoice',
    type: String,
    nullable: true,
  })
  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  name!: string | null;

  @ApiProperty({
    description: 'The number ID associated with the invoice',
    type: Number,
    nullable: true,
  })
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  number_id!: number | null;

  @ApiProperty({
    description: 'The status of the invoice',
    type: String,
    nullable: true,
  })
  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  status!: string | null;

  @ApiProperty({
    description: 'The date when the invoice was charged',
    type: Date,
    nullable: true,
  })
  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  charged_on!: Date | null;

  @ApiProperty({
    description: 'The due date of the invoice',
    type: Date,
    nullable: true,
  })
  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  due_on!: Date | null;

  @ApiProperty({
    description: 'The timestamp when the invoice was created',
    type: Date,
    nullable: true,
  })
  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  created_at!: Date | null | '0001-01-01T00:00:00Z';

  @ApiProperty({
    description: 'The ID of the user who created the invoice',
    type: Number,
    nullable: true,
  })
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  created_by!: number | null;

  @ApiProperty({
    description: 'The timestamp when the invoice was last updated',
    type: Date,
    nullable: true,
  })
  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  updated_at!: Date | null | '0001-01-01T00:00:00Z';

  @ApiProperty({
    description: 'The ID of the user who last updated the invoice',
    type: Number,
    nullable: true,
  })
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  updated_by!: number | null;

  @ApiProperty({
    description: 'The timestamp when the invoice was deleted',
    type: Date,
    nullable: true,
  })
  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  deleted_at!: Date | null;

  @ApiProperty({
    description: 'The ID of the user who deleted the invoice',
    type: Number,
    nullable: true,
  })
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  deleted_by!: number | null;

  @HasOne(() => InvoiceDetail, {
    foreignKey: 'invoice_id',
    sourceKey: 'id',
    as: 'details',
  })
  details?: InvoiceDetail;

  number?: NumberEntry;

  customer?: Customer;

  log?: Log[];
}
