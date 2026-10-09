import { ApiProperty, OmitType, PickType } from '@nestjs/swagger';
import { ContactResponseDto } from './contact-entity.dto';
import { IsNotEmpty } from 'class-validator';
import Contact from 'src/database/models/contacts.model';
import Customer from 'src/database/models/customers.model';

export class CustomerEntityDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  company: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  first_name: string;

  @ApiProperty()
  last_name: string;

  @ApiProperty()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata: Record<string, any>;

  @ApiProperty()
  contacts: ContactResponseDto[];

  @ApiProperty()
  category: string;

  @ApiProperty()
  type: string;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;
}

export class CustomerContactsInputDto extends Customer {
  @ApiProperty()
  contacts: Contact[];
}

export class CustomerDto extends OmitType(CustomerEntityDto, ['contacts']) {}

export class CustomerInputDto extends PickType(CustomerEntityDto, ['category', 'type']) {
  @ApiProperty()
  company: string;

  @ApiProperty()
  address: string;

  @ApiProperty()
  comment: string;

  @ApiProperty()
  country: object;

  @ApiProperty()
  email: string;

  @ApiProperty()
  fax: string;

  @ApiProperty()
  other_address: string;

  @ApiProperty()
  phone: string;

  @ApiProperty()
  place: string;

  @ApiProperty()
  postcode: string;

  @ApiProperty()
  web: string;

  @IsNotEmpty()
  category: string;

  @IsNotEmpty()
  type: string;
}
