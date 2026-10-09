import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsNumber } from 'class-validator';

export class GenerateServiceInvoiceDto {
  @ApiProperty({ description: 'Remaining amount' })
  @IsNumber()
  remaining: number;

  @ApiProperty({ description: 'List of selected services' })
  @IsArray()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  service: any[];

  @ApiProperty({ description: 'Total amount' })
  @IsNumber()
  total: number;

  @ApiProperty({ description: 'Is this the final invoice?' })
  @IsBoolean()
  is_final: boolean;

  @ApiProperty({ description: 'Additional cost' })
  @IsNumber()
  additional_cost: number;

  @ApiProperty({ description: 'Additional percentage' })
  @IsNumber()
  additional_percent: number;

  @ApiProperty({ description: 'Invoice rate' })
  @IsNumber()
  invoice_rate: number;

  @ApiProperty({
    description: 'The locale for the invoice',
    example: 'en-US',
  })
  locale: string;
}
