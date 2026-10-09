import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response } from 'express';
import * as cors from 'cors';

@Injectable()
export class CorsMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: () => void) {
    //    const cors_origin_list = process.env.CORS_ORIGIN_ALLOW;

    const corsOptions: cors.CorsOptions = {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      origin: (origin: any, callback: (arg0: null, arg1: boolean) => void) => {
        callback(null, true);
      },
      exposedHeaders: 'Content-Disposition',
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
      credentials: true,
      optionsSuccessStatus: 204,
      maxAge: 86400, // Set the highest possible Access-Control-Max-Age value
    };

    cors(corsOptions)(req, res, next);
  }
}
