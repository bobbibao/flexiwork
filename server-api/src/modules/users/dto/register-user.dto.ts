import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RegisterUserDto {
  @ApiProperty({ description: 'User email' })
  @IsString()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'User currency' })
  @IsString()
  @IsNotEmpty()
  currency: string;

  @ApiProperty({ description: 'User language' })
  @IsString()
  @IsNotEmpty()
  language: string;

  @ApiProperty({ description: 'User company' })
  @IsString()
  @IsNotEmpty()
  company: string;

  @ApiProperty({ description: 'Accept term' })
  @IsBoolean()
  @IsNotEmpty()
  accept_term: boolean;

  @ApiPropertyOptional({ description: 'Architecture template' })
  @IsBoolean()
  @IsOptional()
  architecture_template?: boolean;

  @ApiPropertyOptional({ description: 'VAT active' })
  @IsBoolean()
  @IsOptional()
  vat_active?: boolean;
}
