import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsOptional, IsArray } from 'class-validator';
import Attachment from 'src/database/models/attachment.model';

export class CreateCommentDto {
  @ApiProperty({ description: 'The ID of the comment being replied to', example: 1 })
  @IsNumber()
  @IsOptional()
  reply_to: number;

  @ApiProperty({ description: 'The content of the comment', example: 'This is a comment.' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({
    description: 'The link of attachments',
    example: ['example.com/example.jpg', 'example.com/example.pdf'],
  })
  @IsArray()
  @IsOptional()
  attachments: Attachment[];
}
