import { Table, Column, Model, DataType } from 'sequelize-typescript';
import { ApiProperty } from '@nestjs/swagger';

@Table({
  tableName: 'task_comments',
  indexes: [{ fields: ['task_id'] }, { fields: ['owner_id'] }, { fields: ['reply_to'] }],
})
export default class Comment extends Model<Comment> {
  @ApiProperty({
    description: 'Unique identifier for the comment',
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
    description: 'Reply to another comment ID, if any',
    type: Number,
    nullable: true,
  })
  @Column({
    type: DataType.BIGINT,
    allowNull: true,
  })
  reply_to!: number | null;

  @ApiProperty({
    description: 'Task ID associated with the comment',
    type: Number,
  })
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  task_id!: number;

  @ApiProperty({
    description: 'ID of the user who posted the comment',
    type: Number,
  })
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  owner_id!: number;

  @ApiProperty({
    description: 'Content of the comment',
    type: String,
  })
  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  content!: string;

  @ApiProperty({
    description: 'Timestamp when the comment was created',
    type: Date,
  })
  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  created_at!: Date;

  @ApiProperty({
    description: 'Timestamp when the comment was last updated',
    type: Date,
    nullable: true,
  })
  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  updated_at!: Date | null;
}
