import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import Customer from 'src/database/models/customers.model';

class KmDropdownDto {
  @ApiProperty({ example: 'Keine - 0.0%' })
  label: string;

  @ApiProperty({ example: 0 })
  value: number;
}

class QuoteItemDto {
  id: number;

  @ApiProperty({ example: 1 })
  amount: number;

  @ApiProperty({ example: 10000 })
  cost: number;

  @ApiPropertyOptional({ example: 'Aufbau 3D-Bestandesmodell ArchiCAD' })
  description?: string;

  @ApiProperty({ example: 'Aufbau 3D-Bestandesmodell ArchiCAD' })
  name: string;

  @ApiProperty({ example: false })
  optional: boolean;

  @ApiProperty({ example: 10000 })
  price: number;

  @ApiPropertyOptional({ example: 1 })
  quarter?: number;

  @ApiPropertyOptional({ example: 'individual' })
  type?: string;

  @ApiPropertyOptional({ example: 'unit.flatRate' })
  unit?: string;

  @ApiProperty({ example: '827c2174-303f-4419-a82b-ff659e224936' })
  uuid: string;

  @ApiProperty({ example: 8.1 })
  vat_rate: number;

  @ApiPropertyOptional({ example: 2024 })
  year?: number;

  @ApiPropertyOptional({ example: false })
  apply_discount?: boolean;

  @ApiPropertyOptional({ example: 1 })
  product_id?: number;
}

class PaidHistoryDto {
  id: number;

  @ApiPropertyOptional({ example: '' })
  date?: string;

  @ApiPropertyOptional({ example: 0 })
  value?: number;

  @ApiPropertyOptional({ example: 0 })
  percent?: number;
}

class InternalDescDto {
  id: number;

  @ApiProperty()
  label: string;

  @ApiProperty()
  is_active: boolean;
}

class AdditionalCostDto {
  id: number;

  @ApiProperty()
  label: string;

  @ApiProperty()
  value: number;

  @ApiProperty()
  is_active: boolean;
}

export class UpdateInvoiceDto {
  @ApiPropertyOptional({ example: 'open' })
  status?: string;

  @ApiPropertyOptional({ example: 'Schlussrechnung Architekturleistungen: Aufbau 3D-Bestandesmodell' })
  name?: string;

  @ApiPropertyOptional({ example: 'Jona SG' })
  location?: string;

  @ApiPropertyOptional({ example: '2024-08-22' })
  date?: string;

  @ApiPropertyOptional({ example: '<p>Sehr geehrter Herr Basartangil,</p><p><br></p>' })
  address?: string;

  @ApiPropertyOptional({
    example:
      '<p>Gerne lassen wir Ihnen wie vereinbart die Rechnung für die Leistungen des 3D-Aufbaus der Bestandespläne zukommen.</p>',
  })
  begin_desc?: string;

  @ApiPropertyOptional({
    example: '<p>Herzlichen Dank für Ihr Vertrauen in plan4you. Wir würden uns sehr freuen...</p>',
  })
  end_desc?: string;

  @ApiPropertyOptional({ type: [InternalDescDto] })
  internal_desc?: InternalDescDto[];

  @ApiPropertyOptional({ example: '240826 RG übermittelt per email und Versand per Post.' })
  internal_desc_custom?: string;

  @ApiPropertyOptional({ example: 10 })
  payment_deadline?: string;

  @ApiPropertyOptional({ example: '016278' })
  slip_number?: string;

  @ApiPropertyOptional({ type: Customer })
  customer?: Customer;

  @ApiPropertyOptional({ type: [QuoteItemDto] })
  quote_items?: QuoteItemDto[];

  @ApiPropertyOptional({ example: 0 })
  discount_percent?: number;

  @ApiPropertyOptional({ example: false })
  inv_begin_break?: boolean;

  @ApiPropertyOptional({ example: false })
  inv_quote_break?: boolean;

  @ApiPropertyOptional({ example: 'CHF' })
  currency?: string;

  @ApiPropertyOptional({ example: false })
  is_final?: boolean;

  @ApiPropertyOptional({ type: [PaidHistoryDto] })
  paid_history?: PaidHistoryDto[];

  @ApiPropertyOptional({ example: '2024-08-26' })
  charged_on?: string;

  @ApiPropertyOptional({ example: '2024-09-05' })
  due_on?: string;

  @ApiPropertyOptional({ example: false })
  is_custom_title?: boolean;

  @ApiPropertyOptional({ example: false })
  is_include_internal_hour_report?: boolean;

  @ApiPropertyOptional({ example: false })
  is_include_external_hour_report?: boolean;

  @ApiPropertyOptional({ example: true })
  is_custom_date?: boolean;

  @ApiPropertyOptional({ type: KmDropdownDto })
  km_dropdown?: KmDropdownDto;

  @ApiPropertyOptional({ type: [AdditionalCostDto] })
  additional_cost?: AdditionalCostDto[];

  @ApiPropertyOptional({ example: 595 })
  project_id?: number;

  @ApiPropertyOptional({ example: '2024-08-26' })
  paid_on?: string;
}
