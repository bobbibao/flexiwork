import { Table, Column, Model, DataType } from 'sequelize-typescript';
import { ApiProperty } from '@nestjs/swagger';

@Table({
  tableName: 'task_attachments',
  indexes: [{ fields: ['comment_id'] }],
})
export default class Attachment extends Model<Attachment> {
  @ApiProperty({
    description: 'Unique identifier for the attachment',
    type: Number,
  })
  @Column({
    type: DataType.BIGINT,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
  })
  id!: number;

  @ApiProperty({
    description: 'ID of the comment this attachment is linked to',
    type: Number,
  })
  @Column({
    type: DataType.BIGINT,
    allowNull: false,
  })
  comment_id!: number;

  @ApiProperty({
    description: 'Filename',
    type: String,
  })
  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  filename!: string;

  @ApiProperty({
    description: 'Link to the attachment',
    type: String,
  })
  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  path!: string;

  @ApiProperty({
    description: 'Timestamp when the attachment was created',
    type: Date,
  })
  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  created_at!: Date;
}
