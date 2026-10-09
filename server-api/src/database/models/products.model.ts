import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement } from 'sequelize-typescript';
import { ApiProperty } from '@nestjs/swagger';

@Table({
  tableName: 'products',
  indexes: [{ fields: ['company_id'] }, { fields: ['unit_id'] }, { fields: ['vat_rate_id'] }],
})
export default class Product extends Model<Product> {
  @ApiProperty({
    description: 'The unique identifier of the product',
    type: Number,
  })
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.INTEGER,
  })
  id!: number;

  @ApiProperty({
    description: 'The ID of the company associated with the product',
    type: Number,
    nullable: true,
  })
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  company_id!: number | null;

  @ApiProperty({
    description: 'The price of the product',
    type: Number,
    nullable: true,
  })
  @Column({
    type: DataType.DECIMAL,
    allowNull: true,
  })
  price!: number | null;

  @ApiProperty({
    description: 'The ID of the unit associated with the product',
    type: Number,
    nullable: true,
  })
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  unit_id!: number | null;

  @ApiProperty({
    description: 'The name of the product',
    type: String,
    nullable: true,
  })
  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  name!: string | null;

  @ApiProperty({
    description: 'The description of the product',
    type: String,
    nullable: true,
  })
  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  description!: string | null;

  @ApiProperty({
    description: 'The ID of the VAT rate associated with the product',
    type: Number,
    nullable: true,
  })
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  vat_rate_id!: number | null;

  @ApiProperty({
    description: 'The timestamp when the product was created',
    type: Date,
    nullable: true,
  })
  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  created_at!: Date | null | '0001-01-01T00:00:00Z';

  @ApiProperty({
    description: 'The timestamp when the product was last updated',
    type: Date,
    nullable: true,
  })
  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  updated_at!: Date | null | '0001-01-01T00:00:00Z';

  @ApiProperty({
    description: 'The timestamp when the product was deleted',
    type: Date,
    nullable: true,
  })
  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  deleted_at!: Date | null;

  @ApiProperty({
    description: 'The folder associated with the product',
    type: String,
    nullable: true,
  })
  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  folder!: string | null;
}
