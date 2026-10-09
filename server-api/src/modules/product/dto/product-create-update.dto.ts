import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, ValidateNested } from 'class-validator';

class UnitDto {
  @ApiProperty({ example: 39, description: 'The ID of the unit' })
  @IsNumber()
  id: number;

  @ApiProperty({ example: 'Hours', description: 'The name of the unit' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'unit.hours', description: 'The value of the unit' })
  @IsString()
  value: string;
}

class VatRateDto {
  @ApiProperty({ example: 86, description: 'The ID of the VAT rate' })
  @IsNumber()
  id: number;

  @ApiProperty({ example: 8.1, description: 'The rate of the VAT' })
  @IsNumber()
  rate: number;
}

export class ProductBodyDto {
  @ApiProperty({ example: 'Product Name', description: 'The name of the product' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Product Description', description: 'The description of the product' })
  @IsString()
  description: string;

  @ApiProperty({ example: 32, description: 'The price of the product' })
  @IsNumber()
  price: number;

  @ApiProperty({ type: UnitDto, description: 'The unit of the product' })
  @ValidateNested()
  unit: UnitDto;

  @ApiProperty({ type: VatRateDto, description: 'The VAT rate of the product' })
  @ValidateNested()
  vat_rate: VatRateDto;

  @ApiProperty({ example: 'Default', description: 'The folder for the product' })
  @IsString()
  @IsNotEmpty()
  folder: string;
}
