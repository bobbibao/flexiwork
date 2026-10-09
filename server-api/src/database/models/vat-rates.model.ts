import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement } from 'sequelize-typescript';
import { ApiProperty } from '@nestjs/swagger';

@Table({
  tableName: 'vat_rates',
})
export default class VatRate extends Model<VatRate> {
  @ApiProperty({
    description: 'The unique identifier of the VAT rate',
    type: Number,
  })
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.INTEGER,
  })
  id!: number;

  @ApiProperty({
    description: 'The ID of the company associated with the VAT rate',
    type: Number,
    nullable: true,
  })
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  company_id!: number | null;

  @ApiProperty({
    description: 'The rate of the VAT',
    type: Number,
    nullable: true,
  })
  @Column({
    type: DataType.DECIMAL,
    allowNull: true,
  })
  rate!: number | null;

  @ApiProperty({
    description: 'Indicates if this VAT rate is the default',
    type: Boolean,
    nullable: true,
  })
  @Column({
    type: DataType.BOOLEAN,
    allowNull: true,
  })
  is_default!: boolean | null;

  @ApiProperty({
    description: 'Visibility status of the VAT rate',
    type: Boolean,
    nullable: true,
  })
  @Column({
    type: DataType.BOOLEAN,
    allowNull: true,
  })
  is_visible!: boolean | null;

  @ApiProperty({
    description: 'Additional metadata for the VAT rate',
    type: Object,
    nullable: true,
  })
  @Column({
    type: DataType.JSONB,
    allowNull: true,
  })
  metadata!: object | null;

  @ApiProperty({
    description: 'The timestamp when the VAT rate was created',
    type: Date,
    nullable: true,
  })
  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  created_at!: Date | null | '0001-01-01T00:00:00Z';

  @ApiProperty({
    description: 'The timestamp when the VAT rate was last updated',
    type: Date,
    nullable: true,
  })
  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  updated_at!: Date | null | '0001-01-01T00:00:00Z';
}
