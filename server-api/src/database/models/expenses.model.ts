import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement } from 'sequelize-typescript';
import { ApiProperty } from '@nestjs/swagger';

@Table({
  tableName: 'expenses',
  indexes: [{ fields: ['company_id'] }, { fields: ['user_id'] }],
})
export default class Expense extends Model<Expense> {
  @ApiProperty({
    description: 'The unique identifier of the expense record',
    type: Number,
  })
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.INTEGER,
  })
  id!: number;

  @ApiProperty({
    description: 'The ID of the company associated with the expense',
    type: Number,
    nullable: true,
  })
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  company_id!: number | null;

  @ApiProperty({
    description: 'The ID of the user associated with the expense',
    type: Number,
    nullable: true,
  })
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  user_id!: number | null;

  @ApiProperty({
    description: 'Additional metadata for the expense',
    type: Object,
    nullable: true,
  })
  @Column({
    type: DataType.JSONB,
    allowNull: true,
  })
  metadata!: object | null;

  @ApiProperty({
    description: 'The amount of the expense',
    type: Number,
    nullable: true,
  })
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  amount!: number | null;

  @ApiProperty({
    description: 'The reference URL associated with the expense',
    type: String,
    nullable: true,
  })
  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  ref_url!: string | null;

  @ApiProperty({
    description: 'The timestamp when the expense was created',
    type: Date,
    nullable: true,
  })
  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  created_at!: Date | null;

  @ApiProperty({
    description: 'The timestamp when the expense was last updated',
    type: Date,
    nullable: true,
  })
  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  updated_at!: Date | null;

  @ApiProperty({
    description: 'The timestamp when the expense was deleted',
    type: Date,
    nullable: true,
  })
  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  deleted_at!: Date | null;

  @ApiProperty({
    description: 'The ID of the user who deleted the expense record',
    type: Number,
    nullable: true,
  })
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  deleted_by!: number | null;
}
