import { Logger } from '@nestjs/common';
import { Response } from 'express';
import { BaseController } from './base.controller';
import { CodedError } from '../utils/coded.error';
import { ConcurrencyError } from '../event-store/concurrency.error';

/**
 * Base for /api/sn controllers. Same envelope as BaseController, plus a machine-readable `code` on errors.
 */
export class SnBaseController extends BaseController {
  constructor(logger: Logger) {
    super(logger);
  }

  protected ok<T>(res: Response, payload: T, count?: number) {
    return this.sendApiResponse(res, { error: false, payload, count });
  }

  protected fail(routeHandlerName: string, res: Response, error: unknown) {
    if (error instanceof CodedError) {
      this.logger.warn(`${routeHandlerName}: ${error.code} ${error.message}`);
      return res.status(error.statusCode).json({ error: true, code: error.code, message: error.message, details: error.details });
    }
    if (error instanceof ConcurrencyError) {
      this.logger.warn(`${routeHandlerName}: ${error.message}`);
      return res.status(409).json({ error: true, code: 'CONCURRENT_MODIFICATION', message: error.message });
    }
    return this.throwError(routeHandlerName, res, error);
  }
}
