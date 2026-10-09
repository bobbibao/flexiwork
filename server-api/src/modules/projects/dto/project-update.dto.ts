import { ApiProperty } from '@nestjs/swagger';
import User from 'src/database/models/users.model';

class AdditionalCost {
  @ApiProperty({ example: true })
  is_active: boolean;

  @ApiProperty({ example: 'Personalspesen, Mittagessen, Kleinauslagen etc.' })
  label: string;

  @ApiProperty({ example: 0.5 })
  value: number;
}

class InternalDesc {
  @ApiProperty({ example: false })
  is_active: boolean;

  @ApiProperty({ example: 'Nach Baukosten' })
  label: string;
}

class Customer {
  @ApiProperty({ example: 346 })
  id: number;

  @ApiProperty({ example: 'Gantrisch Resort' })
  company: string;

  @ApiProperty({ example: 'CH' })
  country: string;

  @ApiProperty({ example: 'cks-konzept@cks-immoprojekt.ch' })
  email: string;

  @ApiProperty({ example: '+41 81 710 50 80' })
  phone: string;

  @ApiProperty({ example: 'Buchs' })
  place: string;

  @ApiProperty({ example: '9470' })
  postcode: string;

  @ApiProperty({ example: 'www.swissmohaus.ch' })
  web: string;
}

class KmDropdown {
  @ApiProperty({ example: 'Keine - 0.0%' })
  label: string;

  @ApiProperty({ example: 0 })
  value: number;
}

export class UpdateProjectDto {
  @ApiProperty({ example: 'Nguyen Thanh Tin' })
  name: string;

  @ApiProperty({ example: 'hcm' })
  location: string;

  @ApiProperty({ example: '2024-10-03' })
  date: string;

  @ApiProperty({ example: '2024-10-03', required: false })
  end_on?: string;

  @ApiProperty({ type: User })
  assignee: User;

  @ApiProperty({ example: '2286' })
  number: string;

  @ApiProperty({ example: '<p>lormememe</p>' })
  address: string;

  @ApiProperty({ example: '<p>Thank you for your trust...</p>' })
  begin_desc: string;

  @ApiProperty({ example: '<p>We would be pleased to plan...</p>' })
  end_desc: string;

  @ApiProperty({ type: [InternalDesc] })
  internal_desc: InternalDesc;

  @ApiProperty({ example: 'dddd' })
  internal_desc_custom: string;

  @ApiProperty({ type: Customer })
  customer: Customer;

  @ApiProperty({ type: [String], example: [] })
  quote_items: string[];

  @ApiProperty({ example: 0 })
  discount_percent: number;

  @ApiProperty({ type: KmDropdown })
  km_dropdown: KmDropdown;

  @ApiProperty({ type: [AdditionalCost] })
  additional_cost: AdditionalCost[];

  @ApiProperty({ example: false })
  pr_begin_break: boolean;

  @ApiProperty({ example: false })
  pr_quote_break: boolean;

  @ApiProperty({ example: false })
  is_internal: boolean;

  @ApiProperty({ example: true })
  only_my_company: boolean;

  @ApiProperty({ example: 'CHF' })
  currency: string;

  @ApiProperty({ example: 125 })
  rate_per_hour: number;
}
