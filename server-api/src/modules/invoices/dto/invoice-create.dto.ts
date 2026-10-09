import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import Customer from 'src/database/models/customers.model';
import InvoiceAdditionalCost from 'src/database/models/invoice-additional-costs.model';
import InvoiceLabel from 'src/database/models/invoice-labels.model';
import InvoicePayments from 'src/database/models/invoice-payments.model';
import InvoiceProduct from 'src/database/models/invoice-products.model';

export class PaidInvoiceDto {
  @ApiProperty({
    description: 'The value date when the invoice was paid',
    type: String,
    format: 'date-time',
    example: '2024-09-25T14:48:00.000Z',
  })
  value_date: Date;

  @ApiPropertyOptional({
    description: 'Comment about the invoice payment',
    type: String,
    example: 'Payment for the final invoice.',
  })
  comment?: string;
}

export class CreateInvoiceDto {
  @ApiProperty({ description: '', example: '', type: String })
  name: string;

  @ApiPropertyOptional({ description: '', example: '', type: String })
  location?: string;

  @ApiProperty({ description: '', example: '', type: Date })
  date: Date;

  @ApiProperty({ description: '', example: '', type: String })
  address: string;

  @ApiProperty({ description: '', example: '', type: Number })
  project_id: number;

  @ApiPropertyOptional({ description: '', example: '', type: String })
  begin_desc?: string;

  @ApiPropertyOptional({ description: '', example: '', type: String })
  end_desc?: string;

  @ApiPropertyOptional({ description: '', example: '', type: String })
  internal_desc_custom?: string;

  @ApiProperty({ description: '', example: '', type: Number })
  payment_deadline: number;

  @ApiPropertyOptional({ description: '', example: '', type: String })
  slip_number?: string;

  @ApiPropertyOptional({ description: '', example: '', type: Number })
  discount_percent?: number;

  @ApiPropertyOptional({ description: '', example: '', type: Boolean })
  inv_begin_break?: boolean;

  @ApiPropertyOptional({ description: '', example: '', type: Boolean })
  inv_quote_break?: boolean;

  @ApiProperty({ description: '', example: '', type: String })
  currency: string;

  @ApiPropertyOptional({ description: '', example: '', type: Boolean })
  is_final?: boolean;

  @ApiPropertyOptional({ description: '', example: '', type: String })
  charged_on?: string;

  @ApiPropertyOptional({ description: '', example: '', type: String })
  due_on?: string;

  @ApiProperty({ description: '', example: '', type: Object })
  km_dropdown: {
    label: string;
    value: number;
  };

  @ApiProperty({ description: '', example: '', type: Customer })
  customer: Customer;

  @ApiPropertyOptional({ description: '', example: '', type: [InvoiceLabel] })
  internal_desc?: InvoiceLabel[];

  @ApiPropertyOptional({ description: '', example: '', type: [InvoiceProduct] })
  quote_items?: InvoiceProduct[];

  @ApiPropertyOptional({ description: '', example: '', type: [InvoiceAdditionalCost] })
  additional_cost?: InvoiceAdditionalCost[];

  @ApiPropertyOptional({ description: '', example: '', type: [InvoicePayments] })
  paid_history?: {
    date: Date;
    percent: number;
    value: number;
  }[];
}
