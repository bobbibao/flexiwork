import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, Unique } from 'sequelize-typescript';
import { ApiProperty } from '@nestjs/swagger';

@Table({
  tableName: 'acp_users',
  timestamps: false, // Enables Sequelize's automatic handling of createdAt and updatedAt
})
export default class AcpUser extends Model<AcpUser> {
  @ApiProperty({
    description: 'The unique identifier of the user',
    type: Number,
  })
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.BIGINT,
  })
  id!: number;

  @ApiProperty({
    description: 'The name of the user',
    type: String,
  })
  @Column({
    allowNull: false,
  })
  name!: string;

  @ApiProperty({
    description: 'The email of the user',
    type: String,
  })
  @Unique
  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  email!: string;

  @ApiProperty({
    description: 'The timestamp when the email was verified',
    type: Date,
    nullable: true,
  })
  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  email_verified_at!: Date | null;

  @ApiProperty({
    description: 'The password of the user',
    type: String,
  })
  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  password!: string;

  @ApiProperty({
    description: 'The remember token for the user',
    type: String,
    nullable: true,
  })
  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  remember_token!: string | null;

  @ApiProperty({
    description: 'The timestamp when the user was created',
    type: Date,
    nullable: true,
  })
  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  created_at!: Date | null;

  @ApiProperty({
    description: 'The timestamp when the user was last updated',
    type: Date,
    nullable: true,
  })
  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  updated_at!: Date | null;
}
