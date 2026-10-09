import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsInt, IsNotEmpty, IsOptional, IsString, Length, MaxLength } from 'class-validator';

export class RegisterWorkerDto {
  @ApiProperty({ example: '0901234567', description: 'Vietnamese mobile number' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: 'MatKhau@123', minLength: 8 })
  @IsString()
  @Length(8, 128)
  password: string;

  @ApiProperty({ example: 'Nguyễn Văn An' })
  @IsString()
  @Length(2, 120)
  full_name: string;

  @ApiPropertyOptional({ example: 'an.nguyen@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ description: 'Accepts terms and location/ID data processing (Decree 13/2023)' })
  @IsBoolean()
  accept_terms: boolean;
}

export class RegisterEmployerDto {
  @ApiProperty({ example: 'Nhà hàng Phố Cổ' })
  @IsString()
  @Length(2, 200)
  company_name: string;

  @ApiPropertyOptional({ example: '0312345678', description: 'Mã số thuế' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  tax_code?: string;

  @ApiProperty({ example: 'quanly@phoco.vn' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'MatKhau@123' })
  @IsString()
  @Length(8, 128)
  password: string;

  @ApiProperty({ example: 'Trần Thị Bình' })
  @IsString()
  @Length(2, 120)
  contact_name: string;

  @ApiProperty({ example: '0281234567' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiPropertyOptional({ example: '12 Lý Tự Trọng, Phường Sài Gòn, TP. Hồ Chí Minh' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  address?: string;

  @ApiPropertyOptional({ example: '79' })
  @IsOptional()
  @IsString()
  province_code?: string;

  @ApiPropertyOptional({ example: '26734' })
  @IsOptional()
  @IsString()
  ward_code?: string;

  @ApiPropertyOptional({ example: 'nha_hang' })
  @IsOptional()
  @IsString()
  business_type?: string;

  @ApiProperty()
  @IsBoolean()
  accept_terms: boolean;
}

export class SnLoginDto {
  @ApiProperty({ example: '0901234567', description: 'Phone number (workers) or email' })
  @IsString()
  @IsNotEmpty()
  identifier: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiPropertyOptional({ description: 'Company id when the email has several employer accounts' })
  @IsOptional()
  @IsInt()
  company_id?: number;
}
