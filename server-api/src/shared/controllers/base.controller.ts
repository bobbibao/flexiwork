import { Controller, Logger } from '@nestjs/common';
import { ApiResponse, ApiResponseProps, BaseError } from '../utils';
import { Response } from 'express';

@Controller()
export class BaseController {
  constructor(protected readonly logger: Logger) {}

  protected sendApiResponse<T, H>(
    res: Response,
    { error, payload, count, code, language, holidays, dates, statusCode }: ApiResponseProps<T, H>,
  ): void {
    const response = new ApiResponse<T, H>({
      error,
      payload,
      count,
      code,
      language,
      holidays,
      dates,
      statusCode,
    });
    response.send(res);
  }

  protected throwError(routeHandlerName: string, res: Response, error: unknown, passthrough: boolean = false) {
    if (!(error instanceof BaseError)) {
      this.logger.error(`${routeHandlerName}: ${error}`, error instanceof Error ? error.stack : undefined);

      if (passthrough) {
        return this.sendPassthroughErrorResponse(res, 500, 'Internal server error');
      }
      return res.status(500).json({
        error: true,
        message: 'Internal server error',
      });
    }

    this.logger.error(`${routeHandlerName}: ${error.message}`, error.stack);

    if (passthrough) {
      return this.sendPassthroughErrorResponse(res, error.statusCode, error.message);
    }
    return res.status(error.statusCode).json({
      error: true,
      message: error.message,
    });
  }

  private sendPassthroughErrorResponse(res: Response, statusCode: number, message: string) {
    res.status(statusCode);
    return {
      error: true,
      message,
    };
  }
}
