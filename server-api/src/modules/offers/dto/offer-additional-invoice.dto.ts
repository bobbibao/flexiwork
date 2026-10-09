import { ApiProperty } from '@nestjs/swagger';

export class CreateAdditionalCostInvoiceDto {
  @ApiProperty({
    description: 'The amount of additional cost',
    example: 1000.0,
  })
  amount: number;

  @ApiProperty({
    description: 'The percentage used for calculation',
    example: 15.0,
  })
  percent: number;
}
