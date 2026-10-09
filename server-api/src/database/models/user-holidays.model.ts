import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, Default } from 'sequelize-typescript';
import { ApiProperty } from '@nestjs/swagger';

@Table({
  tableName: 'user_holidays',
  timestamps: false, // Disabling automatic timestamps since they are manually managed
  paranoid: true, // Enables deletedAt field for soft deletes
  indexes: [{ fields: ['company_id'] }, { fields: ['user_id'] }],
})
export default class UserHoliday extends Model<UserHoliday> {
  @ApiProperty({
    description: 'The unique identifier of the user holiday record',
    type: Number,
  })
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.INTEGER,
  })
  id!: number;

  @ApiProperty({
    description: 'The ID of the company associated with the user holiday',
    type: Number,
    nullable: true,
  })
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  company_id!: number | null;

  @ApiProperty({
    description: 'The ID of the user associated with the holiday',
    type: Number,
    nullable: true,
  })
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  user_id!: number | null;

  @ApiProperty({
    description: 'The start timestamp of the user holiday',
    type: Date,
    nullable: true,
  })
  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  start!: Date | null;

  @ApiProperty({
    description: 'The end timestamp of the user holiday',
    type: Date,
    nullable: true,
  })
  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  end!: Date | null;

  @ApiProperty({
    description: 'Array of work log IDs associated with the holiday',
    type: [Number],
    nullable: true,
  })
  @Column({
    type: DataType.ARRAY(DataType.INTEGER),
    allowNull: true,
  })
  work_log_ids!: number[] | null;

  @ApiProperty({
    description: 'The timestamp when the user holiday record was created',
    type: Date,
    nullable: true,
  })
  @Default(DataType.NOW)
  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  created_at!: Date | null;

  @ApiProperty({
    description: 'The timestamp when the user holiday record was deleted',
    type: Date,
    nullable: true,
  })
  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  deleted_at!: Date | null;
}
