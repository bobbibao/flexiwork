import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement } from 'sequelize-typescript';
import { ApiProperty } from '@nestjs/swagger';

@Table({
  tableName: 'numbers',
})
export default class NumberEntry extends Model<NumberEntry> {
  @ApiProperty({
    description: 'The unique identifier of the number entry',
    type: Number,
    example: 1,
  })
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.INTEGER,
  })
  id!: number;

  @ApiProperty({
    description: 'The ID of the company associated with the number entry',
    type: Number,
    required: false,
    example: 101,
  })
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  company_id!: number | null;

  @ApiProperty({
    description: 'The type of the number entry (e.g., "invoice", "order")',
    type: String,
    required: false,
    example: 'invoice',
  })
  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  type!: string | null;

  @ApiProperty({
    description: 'The reference ID associated with the number entry',
    type: Number,
    required: false,
    example: 123,
  })
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  ref_id!: number | null;

  @ApiProperty({
    description: 'The custom ID associated with the number entry (e.g., "INV2021-001")',
    type: String,
    required: false,
    example: 'INV2021-001',
  })
  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  custom_id!: string | null;

  @ApiProperty({
    description: 'The timestamp when the Numbers was created',
    type: Date,
    nullable: true,
  })
  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  created_at!: Date | null | '0001-01-01T00:00:00Z';

  @ApiProperty({
    description: 'The timestamp when the Numbers was last updated',
    type: Date,
    nullable: true,
  })
  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  updated_at!: Date | null | '0001-01-01T00:00:00Z';
}
