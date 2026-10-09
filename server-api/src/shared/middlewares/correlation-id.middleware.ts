import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { NextFunction, Request, Response } from 'express';

/** Propagates X-Correlation-Id on /api/sn/* (docs/ARCHITECTURE.md §18.4). */
@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request & { correlationId?: string }, res: Response, next: NextFunction): void {
    const header = req.headers['x-correlation-id'];
    const value = (Array.isArray(header) ? header[0] : header) || randomUUID();
    req.correlationId = String(value).slice(0, 100);
    res.setHeader('X-Correlation-Id', req.correlationId);
    next();
  }
}
