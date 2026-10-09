import { ExecutionContext, CallHandler } from '@nestjs/common';
import { Inject, Injectable, Logger, LoggerService, NestInterceptor } from '@nestjs/common';
import { Response } from 'express';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(@Inject(Logger) private readonly logger: LoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler) {
    const now = Date.now();
    const req = context.switchToHttp().getRequest();
    const { originalUrl, method, params, query, body } = req;

    this.logger.log(originalUrl, method, params, query, body);

    return next.handle().pipe(
      tap((data) => {
        const res: Response = context.switchToHttp().getResponse();
        const responseTime = Date.now() - now;
      }),
    );
  }
}
