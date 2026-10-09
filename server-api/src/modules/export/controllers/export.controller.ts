import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse as ApiResponseDecorator, ApiTags } from '@nestjs/swagger';
import { Controller, Get, Logger, Query, Res, StreamableFile } from '@nestjs/common';
import { File } from 'buffer';
import { PassThrough } from 'stream';
import type { Response } from 'express';
import { BaseController } from 'src/shared/controllers/base.controller';
import { AuditAction, AuditModule, PublicRoute } from 'src/shared/decorators';
import { ExportService } from '../services/export.service';
import { AuthService } from 'src/modules/auth/services/auth.service';
import { PreviewQueryDto } from '../dto';
import { generateFileName } from '../utils';
import { AuditModuleEnum, AuditActionEnum } from 'src/shared/constants/audit.constants';

@ApiBearerAuth()
@Controller('/api/export')
@ApiTags('Export')
@AuditModule(AuditModuleEnum.EXPORT)
export class ExportController extends BaseController {
  constructor(
    private readonly exportService: ExportService,
    private readonly authService: AuthService,
  ) {
    super(new Logger(ExportController.name));
  }

  @PublicRoute()
  @Get('/preview')
  @ApiOperation({ summary: 'Get PDF file preview', operationId: 'previewFile' })
  @ApiResponseDecorator({
    status: 200,
    description: 'Returns of PDF file preview',
    type: File,
    isArray: false,
  })
  @ApiQuery({ name: 'id', type: Number, required: true })
  @ApiQuery({ name: 'type', type: String, required: true })
  @ApiQuery({ name: 'file_type', type: String, required: true })
  @ApiQuery({ name: 'code', type: String, required: true })
  @ApiQuery({ name: 'status', type: String, required: true })
  @ApiQuery({ name: 'start', type: String, required: true })
  @ApiQuery({ name: 'end', type: String, required: true })
  @AuditAction(AuditActionEnum.VIEW)
  async previewFile(@Res({ passthrough: true }) res: Response, @Query() previewQueryDto: PreviewQueryDto) {
    try {
      const { file_type: fileType, code, preview } = previewQueryDto;
      await this.exportService.validateParams(previewQueryDto);

      // Check the token. Return the user if the token is valid, otherwise throw an UnauthorizedError
      const user = await this.authService.decode(code);

      // Handle to generate file buffer
      const exportFileType = fileType || 'pdf';
      const fileBuffer = await this.exportService.previewFileExport(user, exportFileType, previewQueryDto);

      const fileNameWithoutExt: string = await generateFileName(previewQueryDto.type, user, previewQueryDto);
      const fileName: string = `${fileNameWithoutExt}.${exportFileType}`;

      // Use PassThough stream to send the file buffer to the client
      const fileBufferStream = new PassThrough();
      fileBufferStream.end(fileBuffer);

      let mimeType = 'application/octet-stream';
      if (exportFileType === 'pdf') {
        mimeType = 'application/pdf';
      } else if (exportFileType === 'docx') {
        mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      } else if (exportFileType === 'xlsx') {
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      }

      const isPreview: boolean = preview === 'true';
      res.setHeader(
        'Content-Disposition',
        `${isPreview ? 'inline' : 'attachment'}; filename*=UTF-8''${encodeURIComponent(fileName)}`,
      );

      return new StreamableFile(fileBufferStream, {
        type: mimeType,
        length: fileBuffer.length,
      });
    } catch (error) {
      const errorMessage = typeof error == 'object' && 'message' in error ? error.message : 'Internal server error';
      res.status(500).send({ error: true, message: errorMessage });
    }
  }
}
