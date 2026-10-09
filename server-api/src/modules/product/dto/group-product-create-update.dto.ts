import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsArray, ValidateNested } from 'class-validator';

class UnitDto {
  @ApiProperty({ example: 39 })
  @IsNotEmpty()
  id: number;

  @ApiProperty({ example: 'unit.hr' })
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'unit.hours' })
  description: string;

  @ApiProperty({ example: true })
  is_visible: boolean;

  @ApiProperty({ example: true })
  time_recording_active: boolean;

  @ApiProperty({ example: true })
  is_default: boolean;
}

class VatRateDto {
  @ApiProperty({ example: 86 })
  @IsNotEmpty()
  id: number;

  @ApiProperty({ example: 8.1 })
  rate: number;

  @ApiProperty({ example: true })
  is_default: boolean;

  @ApiProperty({ example: true })
  is_visible: boolean;
}

class ProductDto {
  @ApiProperty({ example: 394 })
  @IsNotEmpty()
  id: number;

  @ApiProperty({ example: 'Nachreichung Baueingabe' })
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Nachreichung Baueingabe durch Mängelbrief' })
  description: string;

  @ApiProperty({ type: UnitDto })
  @ValidateNested()
  unit: UnitDto;

  @ApiProperty({ type: VatRateDto })
  @ValidateNested()
  vat_rate: VatRateDto;

  @ApiProperty({ example: 0 })
  price: number;

  @ApiProperty({ example: 1 })
  amount: number;

  @ApiProperty({ example: false })
  display: boolean;
}

export class CreateUpdateGroupDto {
  @ApiProperty({
    description: 'The name of the group',
    example: 'sdssssssssss',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: 'A description of the group',
    example: 'sdsdfds',
  })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({
    description: 'List of products to be associated with the group',
    type: [ProductDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  products: ProductDto[];
}
