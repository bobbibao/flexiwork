import { ApiProperty } from '@nestjs/swagger';

export class CompanyConnectDto {
  @ApiProperty()
  signature: string;
}

export class CompanyConnectedDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  signature: string;

  @ApiProperty()
  created_at: string;
}
