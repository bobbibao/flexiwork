import { ApiProperty } from '@nestjs/swagger';

export class InvoiceIdDto {
  @ApiProperty({
    description: 'The unique identifier of the invoice',
    example: '12345',
  })
  id: number;
}

export class UpdateInvoiceStatusDto {
  @ApiProperty({
    type: [InvoiceIdDto],
    description: 'Array of invoice objects with their IDs',
  })
  id: InvoiceIdDto[];

  @ApiProperty({
    description:
      'The status to update the invoices to. Valid values are: offset, open, paid, cancelled, reminder1, reminder2',
    example: 'paid',
  })
  status: string;
}
