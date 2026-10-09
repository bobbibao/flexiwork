import { Table, Column, Model, DataType } from 'sequelize-typescript';
import { ApiProperty } from '@nestjs/swagger';

@Table({
  tableName: 'group_products',
})
export default class GroupProduct extends Model<GroupProduct> {
  @ApiProperty({
    description: 'The ID of the product associated with the group',
    type: Number,
  })
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  product_id!: number;

  @ApiProperty({
    description: 'The ID of the group associated with the product',
    type: Number,
  })
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  group_id!: number;

  @ApiProperty({
    description: 'The amount associated with the product in the group',
    type: Number,
    nullable: true,
  })
  @Column({
    type: DataType.DECIMAL,
    allowNull: true,
  })
  amount!: number | null;

  @ApiProperty({
    description: 'The order of the product within the group',
    type: Number,
    nullable: true,
  })
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  order!: number | null;
}
