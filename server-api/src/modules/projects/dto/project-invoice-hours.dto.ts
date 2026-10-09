import { ApiProperty } from '@nestjs/swagger';

export class InvoiceRowDto {
  @ApiProperty({
    description: 'The name of the service or work performed',
    example: 'Development',
  })
  name: string;

  @ApiProperty({
    description: 'The number of hours spent on the service',
    example: 20.0,
  })
  spent_in_hour: number;

  @ApiProperty({
    description: 'The price per hour or unit of work',
    example: 100.0,
  })
  price: number;

  @ApiProperty({
    description: 'Indicates if the service is optional',
    example: false,
  })
  optional: boolean;

  @ApiProperty({
    description: 'The discount flag for the item (if applicable)',
    example: true,
    required: false,
  })
  apply_discount?: boolean; // This is the added property
}

export class CreateInvoiceHoursDto {
  @ApiProperty({
    description: 'Hourly rate for the project',
    example: 100.0,
  })
  rate: number;

  @ApiProperty({
    description: 'Total amount for the invoice',
    example: 1000.0,
  })
  total: number;

  @ApiProperty({
    description: 'Start date of the work period for the invoice',
    example: '2024-01-01',
    format: 'date',
  })
  start_date: string;

  @ApiProperty({
    description: 'End date of the work period for the invoice',
    example: '2024-01-31',
    format: 'date',
  })
  end_date: string;

  @ApiProperty({
    description: 'Additional cost applied to the invoice',
    example: 50.0,
  })
  additional_cost: number;

  @ApiProperty({
    description: 'Additional cost as a percentage',
    example: 5.0,
  })
  additional_percent: number;

  @ApiProperty({
    description: 'Indicates if this is the final invoice for the project',
    example: false,
  })
  is_final: boolean;

  @ApiProperty({
    description: 'Array of rows representing the different services and hours worked',
    type: [InvoiceRowDto],
  })
  rows: InvoiceRowDto[];

  @ApiProperty({
    description: 'The locale for the invoice',
    example: 'en-US',
  })
  locale: string;
}
