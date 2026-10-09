import { IsNotEmpty, IsNumber, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUpdateRateDto {
  @ApiProperty({ example: 10, description: 'The VAT rate.' })
  @IsNotEmpty()
  @IsNumber()
  rate: number;

  @ApiProperty({ example: false, description: 'Indicates if this VAT rate is the default one.' })
  @IsOptional()
  @IsBoolean()
  is_default?: boolean;

  @ApiProperty({ example: false, description: 'Indicates if this VAT rate is visible.' })
  @IsOptional()
  @IsBoolean()
  is_visible?: boolean;
}
