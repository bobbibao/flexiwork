import { ignoreError } from '../sn-runtime';
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, catchError, from, of, switchMap, throwError } from 'rxjs';
import type { Request, Response } from 'express';
import { IdempotencyStore } from './idempotency.store';
import { snHttpError } from '../utils/coded.error';

const IN_PROGRESS_TTL_S = 60;
const DONE_TTL_S = 24 * 3600;

/**
 * Idempotency-Key replay for POST commands (docs/ARCHITECTURE.md §12, §13).
 * Works with @Res()-style controllers by wrapping res.json to capture the response.
 */
@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  constructor(private readonly store: IdempotencyStore) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request & { user?: { id?: number } }>();
    const res = context.switchToHttp().getResponse<Response>();
    if (req.method !== 'POST') return next.handle();

    const header = req.headers['idempotency-key'];
    const idemKey = Array.isArray(header) ? header[0] : header;
    if (!idemKey || idemKey.length > 200) {
      return throwError(() => snHttpError(400, 'IDEMPOTENCY_KEY_REQUIRED', 'Header Idempotency-Key is required for this command'));
    }
    const path = (req.originalUrl || req.url).split('?')[0];
    const storeKey = `idem:${req.user?.id ?? 'anon'}:${path}:${idemKey}`;

    return from(this.store.get(storeKey)).pipe(
      switchMap((existing) => {
        if (existing?.state === 'done') {
          res.setHeader('Idempotent-Replayed', 'true');
          res.status(existing.status ?? 200).json(existing.body);
          return of(undefined);
        }
        if (existing) return throwError(() => snHttpError(409, 'IDEMPOTENCY_IN_PROGRESS', 'The same request is still being processed'));
        return from(this.store.claim(storeKey, IN_PROGRESS_TTL_S)).pipe(
          switchMap((claimed) => {
            if (!claimed) return throwError(() => snHttpError(409, 'IDEMPOTENCY_IN_PROGRESS', 'The same request is still being processed'));
            const originalJson = res.json.bind(res);
            res.json = (body: unknown) => {
              const status = res.statusCode;
              const persist = status >= 500 ? this.store.release(storeKey) : this.store.complete(storeKey, status, body, DONE_TTL_S);
              void persist.catch(ignoreError);
              return originalJson(body);
            };
            return next.handle().pipe(
              catchError((err) => {
                void this.store.release(storeKey).catch(ignoreError);
                return throwError(() => err);
              }),
            );
          }),
        );
      }),
    );
  }
}
