import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement } from 'sequelize-typescript';
import { ApiProperty } from '@nestjs/swagger';

@Table({
  tableName: 'companies',
})
export default class Company extends Model {
  @ApiProperty({
    description: 'The unique identifier of the company',
    type: Number,
  })
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.INTEGER,
  })
  id!: number;

  @ApiProperty({
    description: 'The name of the company',
    type: String,
    nullable: true,
  })
  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  name!: string | null;

  @ApiProperty({
    description: 'The language preference of the company',
    type: String,
    nullable: true,
  })
  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  language!: string | null;

  @ApiProperty({
    description: 'The currency used by the company',
    type: String,
    nullable: true,
  })
  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  currency!: string | null;

  @ApiProperty({
    description: 'Additional metadata for the company',
    type: Object,
    nullable: true,
  })
  @Column({
    type: DataType.JSONB,
    allowNull: true,
  })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata!: Record<string, any> | null;

  @ApiProperty({
    description: 'The signature associated with the company',
    type: String,
    nullable: true,
  })
  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  signature!: string | null;

  @ApiProperty({
    description: 'The timestamp when the project was created',
    type: Date,
    nullable: true,
  })
  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  created_at!: Date | null | '0001-01-01T00:00:00Z';

  @ApiProperty({
    description: 'The timestamp when the project was last updated',
    type: Date,
    nullable: true,
  })
  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  updated_at!: Date | null | '0001-01-01T00:00:00Z';

  @ApiProperty({
    description: 'The timestamp when the project was deleted',
    type: Date,
    nullable: true,
  })
  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  deleted_at!: Date | null;
}
