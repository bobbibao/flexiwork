import { Injectable, NestMiddleware } from '@nestjs/common';
import * as multer from 'multer';

@Injectable()
export class MulterMiddleware implements NestMiddleware {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  use(req: any, res: any, next: () => void) {
    const upload = multer({ storage: multer.memoryStorage() }).any();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    upload(req, res, (err: any) => {
      if (err) {
        // Handle multer errors here
        res.status(500).send(err.message);
      } else {
        next();
      }
    });
  }
}
