import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement } from 'sequelize-typescript';
import { ApiProperty } from '@nestjs/swagger';

@Table({
  tableName: 'company_shares',
  timestamps: false, // Enables createdAt field
  updatedAt: false, // No updatedAt field required
  paranoid: false, // No deletedAt field required
  indexes: [{ fields: ['company_id'] }],
})
export default class CompanyShare extends Model<CompanyShare> {
  @ApiProperty({
    description: 'The unique identifier of the company share',
    type: Number,
  })
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.INTEGER,
  })
  id!: number;

  @ApiProperty({
    description: 'The ID of the company associated with the share',
    type: Number,
    nullable: true,
  })
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  company_id!: number | null;

  @ApiProperty({
    description: 'The signature associated with the company share',
    type: String,
    nullable: true,
  })
  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  signature!: string | null;

  @ApiProperty({
    description: 'The type of the company share',
    type: String,
    nullable: true,
  })
  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  type!: string | null;

  @ApiProperty({
    description: 'The timestamp when the share was created',
    type: Date,
    nullable: true,
  })
  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  created_at!: Date | null;
}
