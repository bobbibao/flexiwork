import { ApiProperty } from '@nestjs/swagger';

export class GenerateInvoiceDto {
  @ApiProperty({
    description: 'The amount for the invoice',
    example: 1000.5,
  })
  amount: number;

  @ApiProperty({
    description: 'The percentage associated with the invoice',
    example: 20.5,
  })
  percent: number;

  @ApiProperty({
    description: 'The total cost for the project',
    example: 5000.0,
  })
  total: number;

  @ApiProperty({
    description: 'The remaining balance for the project',
    example: 1500.25,
  })
  remaining: number;

  @ApiProperty({
    description: 'The additional cost to be added',
    example: 200.0,
  })
  additional_cost: number;

  @ApiProperty({
    description: 'The additional percentage associated with the additional cost',
    example: 10.0,
  })
  additional_percent: number;

  @ApiProperty({
    description: 'Indicates if this is the final invoice',
    example: true,
  })
  is_final: boolean;

  @ApiProperty({
    description: 'The locale for the invoice',
    example: 'en-US',
  })
  locale: string;
}

export class ProjectRowDto {
  @ApiProperty({
    description: 'The unique identifier for the project',
    example: 12345,
  })
  id: number;

  @ApiProperty({
    description: 'The total sum associated with the project',
    example: 5000.75,
  })
  sum: number;
}
