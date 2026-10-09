import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, Default, Unique } from 'sequelize-typescript';
import { ApiProperty } from '@nestjs/swagger';

@Table({
  tableName: 'acp_failed_jobs',
  timestamps: false, // No createdAt and updatedAt fields are required
})
export default class AcpFailedJob extends Model<AcpFailedJob> {
  @ApiProperty({
    description: 'The unique identifier of the failed job',
    type: Number,
  })
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.BIGINT,
  })
  id!: number;

  @ApiProperty({
    description: 'The unique UUID of the failed job',
    type: String,
  })
  @Unique
  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  uuid!: string;

  @ApiProperty({
    description: 'The connection information of the failed job',
    type: String,
  })
  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  connection!: string;

  @ApiProperty({
    description: 'The queue information of the failed job',
    type: String,
  })
  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  queue!: string;

  @ApiProperty({
    description: 'The payload data of the failed job',
    type: String,
  })
  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  payload!: string;

  @ApiProperty({
    description: 'The exception details of the failed job',
    type: String,
  })
  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  exception!: string;

  @ApiProperty({
    description: 'The timestamp when the job failed',
    type: Date,
    default: () => new Date(),
  })
  @Default(DataType.NOW)
  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  failed_at!: Date;
}
