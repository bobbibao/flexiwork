import * as fs from 'fs';
import * as path from 'path';
import { HttpException, HttpStatus } from '@nestjs/common';
import configuration from './configuration';

const formatFileName = (filename: string, name: string): string => {
  const filenameExt = filename.includes('.') ? `.${filename.split('.').pop()}` : '';
  const newFilename = `${name}${filenameExt}`;

  if (newFilename) {
    return newFilename;
  } else {
    throw new Error('Invalid filename or name');
  }
};

const saveUploadFile = (file: Express.Multer.File, format: string) => {
  const UPLOAD_PATH = configuration().UPLOAD_PATH;
  const filename = formatFileName(file.originalname, format);

  // the full path for the file
  const filePath = path.join(UPLOAD_PATH, filename);

  // Write the file to the designated path
  fs.writeFileSync(filePath, file.buffer);

  return filename;
};

const readFileAndEncode = (filepath: string): string => {
  try {
    const fileContent = fs.readFileSync(filepath, 'utf-8');
    const base64Content = Buffer.from(fileContent).toString('base64');
    return base64Content;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    throw new HttpException(`Error reading file: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
  }
};

const getAllFilePaths = (folderPath: string): string[] => {
  if (!fs.existsSync(folderPath)) {
    return [];
  }

  const filePaths: string[] = [];
  function readDirectory(directory: string) {
    const files = fs.readdirSync(directory);
    files.forEach((file) => {
      const fullPath = path.join(directory, file);
      if (fs.statSync(fullPath).isDirectory()) {
        readDirectory(fullPath);
      } else {
        filePaths.push(fullPath.replace(/\\/g, '\\'));
      }
    });
  }

  readDirectory(folderPath);

  return filePaths.map((filePath) => filePath.replace(folderPath, '').normalize().replace(/\\/g, '/'));
};

export { formatFileName, saveUploadFile, readFileAndEncode, getAllFilePaths };
