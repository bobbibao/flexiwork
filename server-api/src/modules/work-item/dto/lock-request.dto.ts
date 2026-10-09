import { ApiProperty } from '@nestjs/swagger';

export class LockRequestDto {
  @ApiProperty()
  date: string;

  @ApiProperty()
  confirmed: boolean;

  @ApiProperty()
  user_id: number;
}

export class UnlockRequestDto {
  @ApiProperty()
  date: string;

  @ApiProperty()
  confirmed: boolean;

  @ApiProperty()
  user_ids: number[];
}
