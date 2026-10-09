import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class LoginUserDto {
  @ApiProperty({ description: 'User email' })
  @IsString()
  @IsNotEmpty({ message: 'invalid credentials' })
  email: string;

  @ApiProperty({ description: 'User password', required: true })
  @IsString()
  @IsNotEmpty({ message: 'invalid credentials' })
  password: string;

  @ApiPropertyOptional({ description: 'Company ID' })
  @IsNumber()
  @IsOptional()
  company_id?: number;
}
