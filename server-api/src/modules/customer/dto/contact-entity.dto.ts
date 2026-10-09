import { ApiProperty, PickType } from '@nestjs/swagger';

export class ContactEntityDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  metadata: object;

  @ApiProperty()
  created_at: string;

  @ApiProperty()
  updated_at: string;
}

export class ContactResponseDto extends PickType(ContactEntityDto, ['id', 'metadata', 'created_at', 'updated_at']) {}

export class ContactInputDto {
  @ApiProperty()
  dob: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  comment: string;

  @ApiProperty()
  given_name: string;

  @ApiProperty()
  mobile: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  phone: string;

  @ApiProperty()
  private_mail: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  title_input: string;
}
