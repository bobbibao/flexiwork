import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsInt, IsObject, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class PushSubscriptionDto {
  @ApiProperty({ enum: ['webpush', 'fcm'] }) @IsIn(['webpush', 'fcm']) platform: string;
  @ApiProperty({ description: 'Web Push endpoint URL or FCM token' }) @IsString() @MaxLength(2000) endpoint: string;
  @ApiPropertyOptional({ description: 'Web Push keys { p256dh, auth }' }) @IsOptional() @IsObject() keys?: Record<string, string>;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(300) user_agent?: string;
}

export class PreferencesDto {
  @ApiPropertyOptional() @IsOptional() @IsBoolean() web_push?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() email?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() fcm?: boolean;
}

export class ListNotificationsDto {
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) page?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) @Max(100) page_size?: number;
}

