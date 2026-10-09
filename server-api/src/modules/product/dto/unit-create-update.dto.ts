import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsBoolean, IsOptional } from 'class-validator';

export class CreateUnitDto {
  @ApiProperty({
    description: 'The name of the unit',
    example: 'unit.hr',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: 'The description of the unit',
    example: 'unit.hours',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Visibility of the unit',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  is_visible?: boolean;

  @ApiProperty({
    description: 'Time recording active flag',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  time_recording_active?: boolean;

  @ApiProperty({
    description: 'Default status of the unit',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  is_default?: boolean;
}
