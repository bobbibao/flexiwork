import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNumber, IsOptional, IsString, Length, Max, MaxLength, Min } from 'class-validator';

export class UpdateEmployerProfileDto {
  @ApiPropertyOptional({ example: 'Công ty TNHH Phố Cổ' })
  @IsOptional()
  @IsString()
  @Length(2, 200)
  legal_name?: string;

  @ApiPropertyOptional({ example: '0312345678' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  tax_code?: string;

  @ApiPropertyOptional({ example: 'nha_hang' })
  @IsOptional()
  @IsString()
  business_type?: string;

  @ApiPropertyOptional({ example: '12 Lý Tự Trọng, Phường Sài Gòn, TP. Hồ Chí Minh' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  address?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() province_code?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() ward_code?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(-90) @Max(90) lat?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(-180) @Max(180) lng?: number;
}

export class UpsertWorkLocationDto {
  @ApiProperty({ example: 'Nhà hàng Phố Cổ - Quận 1' })
  @IsString()
  @Length(2, 200)
  name: string;

  @ApiPropertyOptional({ example: '12 Lý Tự Trọng, Phường Sài Gòn, TP. Hồ Chí Minh' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  address?: string;

  @ApiPropertyOptional({ example: '79' }) @IsOptional() @IsString() province_code?: string;
  @ApiPropertyOptional({ example: '26734' }) @IsOptional() @IsString() ward_code?: string;

  @ApiProperty({ example: 10.7769 })
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat: number;

  @ApiProperty({ example: 106.7009 })
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng: number;

  @ApiPropertyOptional({ example: 150 })
  @IsOptional()
  @IsInt()
  @Min(20)
  @Max(2000)
  geofence_radius_m?: number;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  qr_required?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
