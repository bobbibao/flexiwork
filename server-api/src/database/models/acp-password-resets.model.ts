import { Table, Column, Model, DataType } from 'sequelize-typescript';
import { ApiProperty } from '@nestjs/swagger';

@Table({
  tableName: 'acp_password_resets',
  timestamps: false, // Disables Sequelize's automatic handling of createdAt and updatedAt
})
export default class AcpPasswordReset extends Model<AcpPasswordReset> {
  @ApiProperty({
    description: 'The email associated with the password reset request',
    type: String,
  })
  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  email!: string;

  @ApiProperty({
    description: 'The token for resetting the password',
    type: String,
  })
  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  token!: string;

  @ApiProperty({
    description: 'The timestamp when the password reset was created',
    type: Date,
    nullable: true,
  })
  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  created_at!: Date | null;
}
