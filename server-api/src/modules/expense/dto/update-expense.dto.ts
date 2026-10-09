import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateExpenseDto {
  @ApiProperty({
    description: 'The recipient of the expense',
  })
  @IsString()
  @IsNotEmpty()
  recipient: string;

  @ApiProperty({
    description: 'The payment reference of the expense',
  })
  @IsString()
  @IsNotEmpty()
  payment_ref: string;

  @ApiProperty({
    description: 'The date of the expense',
  })
  @IsString()
  @IsNotEmpty()
  date: string;

  @ApiPropertyOptional({
    description: 'The comment of the expense',
  })
  @IsString()
  @IsOptional()
  comment: string;

  @ApiProperty({
    description: 'The amount of the expense',
  })
  @IsNumber()
  @IsNotEmpty()
  amount: number;
}
