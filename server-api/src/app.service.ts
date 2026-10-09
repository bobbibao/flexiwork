import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { BadRequestError, generateNewUUID, NotFoundError, saveUploadFile } from './shared/utils';
import { ConfigService } from '@nestjs/config';

interface UploadedFile {
  filename: string;
  path: string;
}

@Injectable()
export class AppService {
  private readonly UPLOADS_API_PATH: string;
  private readonly UPLOAD_PATH: string;

  constructor(private readonly configService: ConfigService) {
    this.UPLOAD_PATH = this.configService.get<string>('UPLOAD_PATH');
    this.UPLOADS_API_PATH = this.configService.get<string>('UPLOADS_API_PATH', 'api/uploads');

    if (!fs.existsSync(this.UPLOAD_PATH)) {
      fs.mkdirSync(this.UPLOAD_PATH);
    }
  }

  findFile(fileName: string) {
    // Catch path traversal exploits
    if (fileName.includes('..')) {
      throw new BadRequestError('Invalid filename');
    }

    const filePath = path.join(this.UPLOAD_PATH, fileName);
    const existingFile = fs.existsSync(filePath);

    if (!existingFile) {
      throw new NotFoundError('File not found');
    }

    const fileBuffer = fs.readFileSync(filePath);
    return fileBuffer.toString('base64');
  }

  handleUploadedFiles(files: Array<Express.Multer.File>): UploadedFile[] {
    // Handle to save files
    const uploadedFiles: UploadedFile[] = files.map((file) => {
      // Handle to save file

      const filename = `${generateNewUUID()}-${path.parse(file.originalname).name}`;
      const savedFilePath = saveUploadFile(file, filename);

      return {
        filename: savedFilePath,
        path: `${this.UPLOADS_API_PATH}/${savedFilePath}`,
      };
    });

    return uploadedFiles;
  }
}
