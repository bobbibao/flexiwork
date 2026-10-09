import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement } from 'sequelize-typescript';
import { ApiProperty } from '@nestjs/swagger';

@Table({
  tableName: 'units',
  indexes: [{ fields: ['company_id'] }],
})
export default class Unit extends Model<Unit> {
  @ApiProperty({
    description: 'The unique identifier of the unit',
    type: Number,
  })
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.INTEGER,
  })
  id!: number;

  @ApiProperty({
    description: 'The ID of the company associated with the unit',
    type: Number,
    nullable: true,
  })
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  company_id!: number | null;

  @ApiProperty({
    description: 'The name of the unit',
    type: String,
    nullable: true,
  })
  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  name!: string | null;

  @ApiProperty({
    description: 'The description of the unit',
    type: String,
    nullable: true,
  })
  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  description!: string | null;

  @ApiProperty({
    description: 'Visibility status of the unit',
    type: Boolean,
    nullable: true,
  })
  @Column({
    type: DataType.BOOLEAN,
    allowNull: true,
  })
  is_visible!: boolean | null;

  @ApiProperty({
    description: 'Time recording active status of the unit',
    type: Boolean,
    nullable: true,
  })
  @Column({
    type: DataType.BOOLEAN,
    allowNull: true,
  })
  time_recording_active!: boolean | null;

  @ApiProperty({
    description: 'Default status of the unit',
    type: Boolean,
    nullable: true,
  })
  @Column({
    type: DataType.BOOLEAN,
    allowNull: true,
  })
  is_default!: boolean | null;

  @ApiProperty({
    description: 'Additional metadata for the unit',
    type: Object,
    nullable: true,
  })
  @Column({
    type: DataType.JSONB,
    allowNull: true,
  })
  metadata!: object | null;

  @ApiProperty({
    description: 'The timestamp when the unit was created',
    type: Date,
    nullable: true,
  })
  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  created_at!: Date | null | '0001-01-01T00:00:00Z';

  @ApiProperty({
    description: 'The timestamp when the unit was last updated',
    type: Date,
    nullable: true,
  })
  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  updated_at!: Date | null | '0001-01-01T00:00:00Z';
}
