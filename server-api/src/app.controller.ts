import { Controller, Get, Logger, Post, Req, Res, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { AppService } from './app.service';
import { PublicRoute } from './shared/decorators';
import { Request, Response } from 'express';
import { ApiBody, ApiConsumes, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BaseController } from './shared/controllers/base.controller';
import { FilesInterceptor } from '@nestjs/platform-express';

@Controller('api')
export class AppController extends BaseController {
  constructor(private readonly appService: AppService) {
    super(new Logger(AppController.name));
  }

  @PublicRoute()
  @Post('files')
  @ApiOperation({ summary: 'Upload multiple files' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  @UseInterceptors(FilesInterceptor('files', 10))
  uploadFiles(@Res() res: Response, @UploadedFiles() files: Array<Express.Multer.File>) {
    try {
      const uploadedFiles = this.appService.handleUploadedFiles(files ?? []);

      return this.sendApiResponse(res, { error: false, payload: uploadedFiles });
    } catch (error: unknown) {
      return this.throwError('Upload multiple files', res, error);
    }
  }

  @PublicRoute()
  @Get('uploads/*')
  @ApiOperation({
    summary: 'Get file from uploads folder',
  })
  @ApiResponse({
    status: 200,
    description: 'Get file from uploads folder',
  })
  async getFile(@Req() req: Request, @Res() res: Response) {
    try {
      const fileName = req.params[0];
      const fileBuffer = this.appService.findFile(fileName);

      return res.send(fileBuffer);
    } catch (error: unknown) {
      return this.throwError('Get file from uploads folder', res, error);
    }
  }
}
