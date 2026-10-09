import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { CommentUserDto } from './project-comment.dto';
import { ListProjectsRequestDto } from './project-query.dto';

export class ProjectGridRequestDto extends ListProjectsRequestDto {}

export class ProjectGridItemDto {
  @ApiProperty({ description: 'Project ID' })
  id: number;

  @ApiProperty({ description: 'Project name' })
  name: string;

  @ApiProperty({ description: 'Project status' })
  status: string;

  @ApiProperty({ description: 'Latest comment content', required: false })
  @IsOptional()
  comment?: string;

  @ApiProperty({ description: 'Comment creation timestamp', required: false })
  @IsOptional()
  created_at?: Date;

  @ApiProperty({ description: 'Comment creator information', required: false, type: CommentUserDto })
  @IsOptional()
  creator?: CommentUserDto;
}

export class ProjectGridResponseDto {
  @ApiProperty({ description: 'Project items', type: [ProjectGridItemDto] })
  items: ProjectGridItemDto[];

  @ApiProperty({ description: 'Total items' })
  total_items: number;

  @ApiProperty({ description: 'Current page' })
  page: number;

  @ApiProperty({ description: 'Page size' })
  page_size: number;

  @ApiProperty({ description: 'Total pages' })
  total_pages: number;
}
