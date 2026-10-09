import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement } from 'sequelize-typescript';
import { ApiProperty } from '@nestjs/swagger';

@Table({
  tableName: 'company_groups',
  indexes: [{ fields: ['company_id'] }],
})
export default class CompanyGroup extends Model<CompanyGroup> {
  @ApiProperty({
    description: 'The unique identifier of the group',
    type: Number,
  })
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.INTEGER,
  })
  id!: number;

  @ApiProperty({
    description: 'The ID of the company associated with the group',
    type: Number,
    nullable: true,
  })
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  company_id!: number | null;

  @ApiProperty({
    description: 'The name of the group',
    type: String,
    nullable: true,
  })
  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  name!: string | null;

  @ApiProperty({
    description: 'The description of the group',
    type: String,
    nullable: true,
  })
  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  description!: string | null;

  @ApiProperty({
    description: 'Whether this group is the default group',
    type: Boolean,
    default: false,
  })
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  is_default!: boolean;

  @ApiProperty({
    description: 'The timestamp when the group was created',
    type: Date,
  })
  @Column({
    type: DataType.DATE,
    defaultValue: DataType.NOW,
  })
  created_at!: Date;

  @ApiProperty({
    description: 'The timestamp when the group was last updated',
    type: Date,
  })
  @Column({
    type: DataType.DATE,
    defaultValue: DataType.NOW,
  })
  updated_at!: Date;

  @ApiProperty({
    description: 'The timestamp when the group was deleted',
    type: Date,
  })
  @Column(DataType.DATE)
  deleted_at!: Date;
}
