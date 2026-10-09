import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, HasOne, Index } from 'sequelize-typescript';
import { ApiProperty } from '@nestjs/swagger';
import OfferDetail from './offer-details.model';

@Table({
  tableName: 'offers',
  indexes: [{ fields: ['company_id'] }, { fields: ['customer_id'] }, { fields: ['number_id'] }],
})
export default class Offer extends Model<Offer> {
  @ApiProperty({
    description: 'The unique identifier of the offer',
    type: Number,
  })
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.INTEGER,
  })
  id!: number;

  @ApiProperty({
    description: 'The ID of the company associated with the offer',
    type: Number,
    nullable: true,
  })
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  @Index
  company_id!: number | null;

  @ApiProperty({
    description: 'The ID of the customer associated with the offer',
    type: Number,
    nullable: true,
  })
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  customer_id!: number | null;

  @ApiProperty({
    description: 'The name of the offer',
    type: String,
    nullable: true,
  })
  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  name!: string | null;

  @ApiProperty({
    description: 'The number ID associated with the offer',
    type: Number,
    nullable: true,
  })
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  @Index
  number_id!: number | null;

  @ApiProperty({
    description: 'The status of the offer',
    type: String,
    nullable: true,
  })
  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  status!: string | null;

  @ApiProperty({
    description: 'The timestamp when the offer was created',
    type: Date,
    nullable: true,
  })
  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  created_at!: Date | null | '0001-01-01T00:00:00Z';

  @ApiProperty({
    description: 'The timestamp when the offer was last updated',
    type: Date,
    nullable: true,
  })
  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  updated_at!: Date | null | '0001-01-01T00:00:00Z';

  @ApiProperty({
    description: 'The timestamp when the offer was deleted',
    type: Date,
    nullable: true,
  })
  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  deleted_at!: Date | null;

  @ApiProperty({
    description: 'The ID of the user who deleted the offer',
    type: Number,
    nullable: true,
  })
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  deleted_by!: number | null;

  @HasOne(() => OfferDetail, {
    foreignKey: 'offer_id',
    as: 'details',
  })
  details?: OfferDetail | null;

  // Prepare offer to be copied, resetting necessary fields
  prepareToCopy(): Offer {
    // Clone the existing offer as a plain object
    const clonedOffer = { ...this.toJSON() };

    // Reset the ID to allow insertion as a new record
    clonedOffer.id = null;

    // Update the offer name to indicate it's a copy
    const newName = `${this.name} (Kopie)`;
    clonedOffer.name = newName;

    // Set the status of the copied offer to "active"
    clonedOffer.status = 'active';

    // Remove value of `deleted_at` and `deleted_by` fields to indicate the offer is not deleted
    clonedOffer.updated_at = new Date();
    clonedOffer.deleted_at = null;
    clonedOffer.deleted_by = null;

    // Update the details name field if details exist
    if (clonedOffer.details) {
      clonedOffer.details.name = newName;
      // Update the date field to current date
      clonedOffer.details.date = new Date();
    }

    // Build a new Offer instance with the updated data
    return Offer.build(clonedOffer);
  }
}
