import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement } from 'sequelize-typescript';
import { ApiProperty } from '@nestjs/swagger';

@Table({
  tableName: 'work_submits',
})
export default class WorkSubmit extends Model<WorkSubmit> {
  @ApiProperty({
    description: 'The unique identifier of the work submit',
    type: Number,
  })
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.INTEGER,
  })
  id!: number;

  @ApiProperty({
    description: 'The ID of the company associated with the work submit',
    type: Number,
    nullable: true,
  })
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  company_id!: number | null;

  @ApiProperty({
    description: 'The ID of the user associated with the work submit',
    type: Number,
    nullable: true,
  })
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  user_id!: number | null;

  @ApiProperty({
    description: 'The start date of the work submit period',
    type: Date,
    nullable: true,
  })
  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  start_date!: Date | null;

  @ApiProperty({
    description: 'The end date of the work submit period',
    type: Date,
    nullable: true,
  })
  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  end_date!: Date | null;

  @ApiProperty({
    description: 'Additional metadata for the work submit',
    type: Object,
    nullable: true,
  })
  @Column({
    type: DataType.JSONB,
    allowNull: true,
  })
  metadata!: object | null;
}
