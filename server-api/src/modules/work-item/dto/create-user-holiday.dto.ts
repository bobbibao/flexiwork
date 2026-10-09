import { ApiProperty } from "@nestjs/swagger";
import { IsDate, IsNotEmpty } from "class-validator";

export class CreateUserHolidayDto {
  @ApiProperty({
    description: 'The start date of the holiday',
    example: '2024-01-01',
  })
  @IsDate()
  @IsNotEmpty()
  start_date: Date;

  @ApiProperty({
    description: 'The end date of the holiday',
    example: '2024-01-10',
  })
  @IsDate()
  @IsNotEmpty()
  end_date: Date;
}
