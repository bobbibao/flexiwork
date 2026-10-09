import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response } from 'express-serve-static-core';
import * as compression from 'compression';

@Injectable()
export class CompressionMiddleware implements NestMiddleware {
  private readonly compressionMiddleware = compression();

  use(req: Request, res: Response, next: () => void) {
    this.compressionMiddleware(req, res, next);
  }
}
