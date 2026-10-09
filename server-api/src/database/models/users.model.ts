import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  Default,
  BelongsToMany,
} from 'sequelize-typescript';
import { ApiProperty } from '@nestjs/swagger';
import Role from './roles.model';
import { UserRoles } from './user-roles.model';

@Table({
  tableName: 'users',
  paranoid: true, // Enables deletedAt field for soft deletes
  indexes: [{ fields: ['company_id'] }],
})
export default class User extends Model<User> {
  @ApiProperty({
    description: 'The unique identifier of the user',
    type: Number,
  })
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.INTEGER,
  })
  id!: number;

  @ApiProperty({
    description: 'The ID of the company associated with the user',
    type: Number,
    nullable: true,
  })
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  company_id!: number | null;

  @ApiProperty({
    description: 'The email of the user',
    type: String,
    nullable: true,
  })
  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  email!: string | null;

  @ApiProperty({
    description: 'The password of the user',
    type: String,
    nullable: true,
  })
  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  password!: string | null;

  @ApiProperty({
    description: 'The role of the user',
    type: String,
    nullable: true,
  })
  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  role!: string | null;

  @ApiProperty({
    description: 'The active status of the user',
    type: Boolean,
    nullable: true,
  })
  @Column({
    type: DataType.BOOLEAN,
    allowNull: true,
  })
  is_active!: boolean | null;

  @ApiProperty({
    description: 'The avatar URL of the user',
    type: String,
    nullable: true,
  })
  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  avatar_url!: string | null;

  @ApiProperty({
    description: 'Additional metadata for the user',
    type: Object,
    nullable: true,
  })
  @Column({
    type: DataType.JSONB,
    allowNull: true,
  })
  metadata!: object | null;

  @ApiProperty({
    description: 'The maximum work hours per week for the user',
    type: Number,
    default: 42.5,
  })
  @Default(42.5)
  @Column({
    type: DataType.DECIMAL,
    allowNull: true,
  })
  max_work_hours_per_week!: number | null;

  @ApiProperty({
    description: 'The maximum work hours per day for the user',
    type: Number,
    default: 8.5,
  })
  @Default(8.5)
  @Column({
    type: DataType.DECIMAL,
    allowNull: true,
  })
  max_work_hours_per_day!: number | null;

  @ApiProperty({
    description: 'The address of the user',
    type: String,
    nullable: true,
  })
  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  address!: string | null;

  @ApiProperty({
    description: 'The date of birth of the user',
    type: String,
    nullable: true,
  })
  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  dob!: string | null;

  @ApiProperty({
    description: 'The end work date of the user',
    type: String,
    nullable: true,
  })
  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  end_work_date!: string | null;

  @ApiProperty({
    description: 'The job title of the user',
    type: String,
    nullable: true,
  })
  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  job!: string | null;

  @ApiProperty({
    description: 'The name of the user',
    type: String,
    nullable: true,
  })
  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  name!: string | null;

  @ApiProperty({
    description: 'The nickname of the user',
    type: String,
    nullable: true,
  })
  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  nickname!: string | null;

  @ApiProperty({
    description: 'The phone number of the user',
    type: String,
    nullable: true,
  })
  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  phone!: string | null;

  @ApiProperty({
    description: 'The place associated with the user',
    type: String,
    nullable: true,
  })
  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  place!: string | null;

  @ApiProperty({
    description: 'The postcode associated with the user',
    type: String,
    nullable: true,
  })
  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  postcode!: string | null;

  @ApiProperty({
    description: 'The start work date of the user',
    type: String,
    nullable: true,
  })
  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  start_work_date!: string | null;

  @ApiProperty({
    description: 'The number of holidays of the user',
    type: Number,
    nullable: true,
  })
  @Column({
    type: DataType.DECIMAL,
    allowNull: true,
  })
  holidays!: number | null;

  @ApiProperty({
    description: 'The first name of the user',
    type: String,
    nullable: true,
  })
  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  first_name!: string | null;

  @ApiProperty({
    description: 'The work percentage per week of the user',
    type: String,
    nullable: true,
  })
  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  work_percent_per_week!: string | number | null;

  @ApiProperty({
    description: 'The last name of the user',
    type: String,
    nullable: true,
  })
  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  last_name!: string | null;

  @ApiProperty({
    description: 'The timesheet periods associated with the user',
    type: Object,
    nullable: true,
  })
  @Column({
    type: DataType.JSONB,
    allowNull: true,
  })
  timesheet_periods!: object | null;

  @ApiProperty({
    description: 'The holiday periods associated with the user',
    type: String,
    nullable: true,
  })
  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  holiday_periods!: string | null;

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

  @ApiProperty({
    description: 'The timestamp when the user was deleted',
    type: Date,
    nullable: true,
  })
  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  deleted_at!: Date | null;

  // Define the many-to-many relationship with Role through UserRoles table
  @BelongsToMany(() => Role, () => UserRoles)
  roles?: Role[];
}
