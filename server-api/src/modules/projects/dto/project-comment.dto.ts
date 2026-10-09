import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateProjectCommentDto {
  @ApiProperty({ description: 'Project ID', example: 1 })
  @IsNumber()
  @IsNotEmpty()
  project_id: number;

  @ApiProperty({ description: 'Comment content', example: 'Great progress on this project!' })
  @IsString()
  @IsNotEmpty()
  comment: string;
}

export class CommentUserDto {
  @ApiProperty({ description: 'User ID' })
  id: number;

  @ApiProperty({ description: 'User first name', required: false })
  @IsOptional()
  first_name?: string;

  @ApiProperty({ description: 'User last name', required: false })
  @IsOptional()
  last_name?: string;

  @ApiProperty({ description: 'User email' })
  email: string;

  @ApiProperty({ description: 'User avatar URL', required: false })
  @IsOptional()
  avatar_url?: string;
}

export class ProjectCommentResponseDto {
  @ApiProperty({ description: 'Comment ID' })
  id: number;

  @ApiProperty({ description: 'Project ID' })
  project_id: number;

  @ApiProperty({ description: 'Comment content' })
  comment: string;

  @ApiProperty({ description: 'Created at timestamp' })
  created_at: Date;

  @ApiProperty({ description: 'User who created the comment', type: CommentUserDto })
  creator: CommentUserDto;
}
