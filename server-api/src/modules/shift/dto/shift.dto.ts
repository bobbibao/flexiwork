import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsDateString, IsIn, IsInt, IsNumber, IsOptional, IsString, IsUUID, Length, Max, MaxLength, Min } from 'class-validator';

export class PostShiftDto {
  @ApiProperty({ example: 'd5407bc2-e4a1-4740-b037-9aceedcbea77' })
  @IsUUID()
  work_location_id: string;

  @ApiProperty({ example: 'Phục vụ bàn ca tối' })
  @IsString()
  @Length(3, 120)
  title: string;

  @ApiPropertyOptional({ example: 'Mặc áo trắng, quần đen. Có ăn tối.' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({ example: 'phuc_vu' })
  @IsString()
  skill_code: string;

  @ApiProperty({ example: '2026-10-14T11:00:00.000Z' })
  @IsDateString()
  start_at: string;

  @ApiProperty({ example: '2026-10-14T15:00:00.000Z' })
  @IsDateString()
  end_at: string;

  @ApiProperty({ example: 40000, description: 'VND per hour (before premiums)' })
  @IsInt()
  @Min(1)
  hourly_vnd: number;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  headcount?: number;

  @ApiPropertyOptional({ enum: ['sequential', 'broadcast'] })
  @IsOptional()
  @IsIn(['sequential', 'broadcast'])
  dispatch_mode?: 'sequential' | 'broadcast';
}

export class QuoteShiftDto {
  @ApiProperty() @IsDateString() start_at: string;
  @ApiProperty() @IsDateString() end_at: string;
  @ApiProperty() @IsInt() @Min(1) hourly_vnd: number;
}

export class DirectOfferDto {
  @ApiPropertyOptional({ example: 12 }) @IsOptional() @IsInt() worker_id?: number;
  @ApiPropertyOptional({ example: '0901234567' }) @IsOptional() @IsString() phone?: string;
}

export class CancelShiftDto {
  @ApiPropertyOptional({ example: 'Đổi kế hoạch kinh doanh' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

export class ConfirmCompletionDto {
  @ApiPropertyOptional({ example: 240, description: 'Defaults to worked minutes capped at the schedule' })
  @IsOptional()
  @IsInt()
  @Min(0)
  approved_minutes?: number;
}

export class DisputeDto {
  @ApiProperty({ example: 'left_early', enum: ['left_early', 'late', 'quality', 'absent', 'other'] })
  @IsIn(['left_early', 'late', 'quality', 'absent', 'other'])
  reason_code: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(1000) note?: string;
  @ApiPropertyOptional({ example: 180 }) @IsOptional() @IsInt() @Min(0) claimed_minutes?: number;
}

export class ResolveDisputeDto {
  @ApiProperty({ enum: ['pay', 'refund'] }) @IsIn(['pay', 'refund']) outcome: 'pay' | 'refund';
  @ApiPropertyOptional({ example: 180 }) @IsOptional() @IsInt() @Min(0) approved_minutes?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(1000) note?: string;
}

export class PositionDto {
  @ApiProperty({ example: 10.7769 }) @IsNumber() @Min(-90) @Max(90) lat: number;
  @ApiProperty({ example: 106.7009 }) @IsNumber() @Min(-180) @Max(180) lng: number;
  @ApiProperty({ example: 20 }) @IsNumber() @Min(0) accuracy_m: number;
  @ApiPropertyOptional({ description: 'Rotating QR token when the location requires it' }) @IsOptional() @IsString() qr_token?: string;
}

export class RateShiftDto {
  @ApiProperty({ example: 5 }) @IsInt() @Min(1) @Max(5) stars: number;
  @ApiPropertyOptional({ example: ['dung_gio', 'than_thien'] }) @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[];
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(1000) comment?: string;
}

export class ListEmployerShiftsDto {
  @ApiPropertyOptional({ enum: ['open', 'accepted', 'in_progress', 'awaiting_confirmation', 'paid', 'cancelled'] }) @IsOptional() @IsString() group?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() from?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() to?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) page?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) @Max(100) page_size?: number;
}

export class ListWorkerShiftsDto {
  @ApiPropertyOptional({ enum: ['upcoming', 'active', 'history'] }) @IsOptional() @IsIn(['upcoming', 'active', 'history']) scope?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) page?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) @Max(100) page_size?: number;
}

export class NearbyShiftsDto {
  @ApiProperty({ example: 10.7769 }) @IsNumber() @Min(-90) @Max(90) lat: number;
  @ApiProperty({ example: 106.7009 }) @IsNumber() @Min(-180) @Max(180) lng: number;
  @ApiPropertyOptional({ example: 10 }) @IsOptional() @IsNumber() @Min(0.5) @Max(50) radius_km?: number;
  @ApiPropertyOptional({ example: 'phuc_vu' }) @IsOptional() @IsString() skill?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() from?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() to?: string;
  @ApiPropertyOptional({ example: 'nha hang' }) @IsOptional() @IsString() @MaxLength(100) q?: string;
  @ApiPropertyOptional({ example: 30 }) @IsOptional() @IsInt() @Min(1) @Max(100) limit?: number;
}
