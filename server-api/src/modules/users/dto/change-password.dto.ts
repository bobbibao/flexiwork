import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'Current password' })
  current_password: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'New password' })
  password: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'Confirm password' })
  confirm_password: string;
}
