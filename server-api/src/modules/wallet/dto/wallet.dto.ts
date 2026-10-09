import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min, ValidateNested } from 'class-validator';
import { BankAccountDto } from 'src/modules/worker-profile/dto/worker-profile.dto';

export class TopUpDto {
  @ApiProperty({ example: 1000000, description: 'VND, integer' })
  @IsInt()
  @Min(10000)
  @Max(500000000)
  amount_vnd: number;
}

export class PayoutDto {
  @ApiProperty({ example: 300000 })
  @IsInt()
  @Min(50000)
  amount_vnd: number;

  @ApiPropertyOptional({ type: BankAccountDto, description: 'Defaults to the bank account on the worker profile' })
  @IsOptional()
  @ValidateNested()
  @Type(() => BankAccountDto)
  bank_account?: BankAccountDto;
}

export class StatementQueryDto {
  @ApiPropertyOptional({ example: 1 }) @IsOptional() @IsInt() @Min(1) page?: number;
  @ApiPropertyOptional({ example: 20 }) @IsOptional() @IsInt() @Min(1) @Max(100) page_size?: number;
}
