/* eslint-disable @typescript-eslint/no-explicit-any -- untyped boundary: raw SQL rows / JSON event payloads */
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsInt, IsObject, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class ListCasesDto {
  @ApiPropertyOptional({ example: 'OPEN,ACKNOWLEDGED' }) @IsOptional() @IsString() status?: string;
  @ApiPropertyOptional({ example: 'critical,high' }) @IsOptional() @IsString() severity?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() type?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) page?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) @Max(100) page_size?: number;
}

export class ResolveCaseDto {
  @ApiPropertyOptional({ example: 'resolve_dispute' }) @IsOptional() @IsString() action?: string;
  @ApiPropertyOptional({ example: { outcome: 'pay', approved_minutes: 180 } }) @IsOptional() @IsObject() params?: Record<string, any>;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(1000) note?: string;
  @ApiPropertyOptional({ description: 'Close without executing an action' }) @IsOptional() @IsBoolean() dismiss?: boolean;
}

export class UpdatePolicyDto {
  @ApiPropertyOptional({ enum: ['manual', 'suggest', 'auto'] }) @IsOptional() @IsIn(['manual', 'suggest', 'auto']) mode?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() enabled?: boolean;
  @ApiPropertyOptional({ example: { max_amount_vnd: 5000000 } }) @IsOptional() @IsObject() limits?: Record<string, unknown>;
}

export class ListWorkersDto {
  @ApiPropertyOptional() @IsOptional() @IsBoolean() verified?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() search?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) page?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) @Max(100) page_size?: number;
}

export class ListOpsShiftsDto {
  @ApiPropertyOptional({ example: 'DISPUTED,NO_SHOW' }) @IsOptional() @IsString() status?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) page?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) @Max(100) page_size?: number;
}

export class ListDecisionsDto {
  @ApiPropertyOptional() @IsOptional() @IsString() decision_point?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() subject_id?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) @Max(200) limit?: number;
}
