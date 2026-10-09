import {
  AutoIncrement,
  Column,
  CreatedAt,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';
import Role from './roles.model';

@Table({
  tableName: 'access_controls',
  timestamps: false,
  indexes: [{ fields: ['role_id'] }],
})
export default class AccessControl extends Model<AccessControl> {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.INTEGER,
  })
  id!: number;

  @Column({
    type: DataType.INTEGER,
  })
  @ForeignKey(() => Role)
  role_id!: number;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  api_endpoint!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  methods!: string;

  @Column({
    type: DataType.DATE,
    defaultValue: DataType.NOW,
  })
  @CreatedAt
  created_at!: Date;

  @Column({
    type: DataType.DATE,
  })
  @UpdatedAt
  updated_at!: Date;
}
