import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement } from 'sequelize-typescript';
import { ApiProperty } from '@nestjs/swagger';

@Table({
  tableName: 'customers',
  indexes: [{ fields: ['company_id'] }],
})
export default class Customer extends Model<Customer> {
  @ApiProperty({
    description: 'The unique identifier of the customer',
    type: Number,
  })
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.INTEGER,
  })
  id!: number;

  @ApiProperty({
    description: 'The ID of the company associated with the customer',
    type: Number,
    nullable: true,
  })
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  company_id!: number | null;

  @ApiProperty({
    description: 'The name of the customer',
    type: String,
    nullable: true,
  })
  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  name!: string | null;

  @ApiProperty({
    description: 'The first name of the customer',
    type: String,
    nullable: true,
  })
  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  first_name!: string | null;

  @ApiProperty({
    description: 'The last name of the customer',
    type: String,
    nullable: true,
  })
  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  last_name!: string | null;

  @ApiProperty({
    description: 'The type of the customer',
    type: String,
    nullable: true,
  })
  @Column({
    type: DataType.STRING(20),
    allowNull: true,
  })
  type!: string | null;

  @ApiProperty({
    description: 'The category of the customer',
    type: String,
    nullable: true,
  })
  @Column({
    type: DataType.STRING(20),
    allowNull: true,
  })
  category!: string | null;

  @ApiProperty({
    description: 'The address of the customer',
    type: String,
    nullable: true,
  })
  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  address!: string | null;

  @ApiProperty({
    description: 'The website of the customer',
    type: String,
    nullable: true,
  })
  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  web!: string | null;

  @ApiProperty({
    description: 'The title of the customer',
    type: String,
    nullable: true,
  })
  @Column({
    type: DataType.STRING(6),
    allowNull: true,
  })
  title!: string | null;

  @ApiProperty({
    description: 'The postcode of the customer',
    type: String,
    nullable: true,
  })
  @Column({
    type: DataType.STRING(20),
    allowNull: true,
  })
  postcode!: string | null;

  @ApiProperty({
    description: 'The place/city of the customer',
    type: String,
    nullable: true,
  })
  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  place!: string | null;

  @ApiProperty({
    description: 'The phone number of the customer',
    type: String,
    nullable: true,
  })
  @Column({
    type: DataType.STRING(30),
    allowNull: true,
  })
  phone!: string | null;

  @ApiProperty({
    description: 'Other address information',
    type: String,
    nullable: true,
  })
  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  other_address!: string | null;

  @ApiProperty({
    description: 'The fax number of the customer',
    type: String,
    nullable: true,
  })
  @Column({
    type: DataType.STRING(30),
    allowNull: true,
  })
  fax!: string | null;

  @ApiProperty({
    description: 'The email address of the customer',
    type: String,
    nullable: true,
  })
  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  email!: string | null;

  @ApiProperty({
    description: 'The country of the customer',
    type: String,
    nullable: true,
  })
  @Column({
    type: DataType.STRING(20),
    allowNull: true,
  })
  country!: string | null;

  @ApiProperty({
    description: 'Comments about the customer',
    type: String,
    nullable: true,
  })
  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  comment!: string | null;

  @ApiProperty({
    description: 'The cell phone number of the customer',
    type: String,
    nullable: true,
  })
  @Column({
    type: DataType.STRING(30),
    allowNull: true,
  })
  cell_phone!: string | null;

  @ApiProperty({
    description: 'Additional metadata for the customer',
    type: Object,
    nullable: true,
  })
  @Column({
    type: DataType.JSONB,
    allowNull: true,
  })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata!: Record<string, any> | null;

  @ApiProperty({
    description: 'The user ID who deleted the customer record',
    type: Date,
    nullable: true,
  })
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  deleted_by!: number | null;

  @ApiProperty({
    description: 'The timestamp when the customer was deleted',
    type: Date,
    nullable: true,
  })
  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  deleted_at!: Date | null;

  @ApiProperty({
    description: 'The timestamp when the customer was created',
    type: Date,
    nullable: true,
  })
  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  created_at!: Date | null;

  @ApiProperty({
    description: 'The timestamp when the customer was updated',
    type: Date,
    nullable: true,
  })
  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  updated_at!: Date | null;
}

export function findCustomerByBasic(
  customers: Customer[],
  name: string,
  firstName: string,
  lastName: string,
  type: string,
  category: string,
  address: string,
  postcode: string,
  place: string,
  country: string,
): [number | null, boolean] {
  for (let i = 0; i <= customers.length; i++) {
    if (
      customers[i].name === name &&
      customers[i].first_name === firstName &&
      customers[i].last_name === lastName &&
      customers[i].type === type &&
      customers[i].category === category &&
      customers[i].metadata.address === address &&
      customers[i].metadata.postcode === postcode &&
      customers[i].metadata.place === place &&
      customers[i].metadata.country === country
    ) {
      return [i, true];
    }
  }

  return [null, false];
}
