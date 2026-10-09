import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty } from 'class-validator';

export class ToggleUserStatusDto {
  @ApiProperty({ description: 'User status' })
  @IsBoolean()
  @IsNotEmpty()
  is_active: boolean;
}
