import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, ForeignKey } from 'sequelize-typescript';
import { ApiProperty } from '@nestjs/swagger';
import User from './users.model';

@Table({
  tableName: 'user_activations',
})
export default class UserActivation extends Model<UserActivation> {
  @ApiProperty({
    description: 'The unique identifier of the user activation record',
    type: Number,
  })
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.INTEGER,
  })
  id!: number;

  @ApiProperty({
    description: 'The ID of the company associated with the user activation',
    type: Number,
    nullable: true,
  })
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  company_id!: number | null;

  @ApiProperty({
    description: 'The ID of the user associated with the activation',
    type: Number,
    nullable: true,
  })
  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  user_id!: number | null;

  @ApiProperty({
    description: 'The activation code associated with the user activation',
    type: String,
    nullable: true,
  })
  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  activation_code!: string | null;

  @ApiProperty({
    description: 'The type of user activation',
    type: String,
    nullable: true,
  })
  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  type!: string | null;

  @ApiProperty({
    description: 'The timestamp when the user activation record was created',
    type: Date,
    nullable: true,
  })
  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  created_at!: Date | null;

  @ApiProperty({
    description: 'The timestamp when the user activation record was last updated',
    type: Date,
    nullable: true,
  })
  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  updated_at!: Date | null;

  @ApiProperty({
    description: 'The timestamp when the user activation record was deleted',
    type: Date,
    nullable: true,
  })
  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  deleted_at!: Date | null;
}
