import { applyDecorators, UseInterceptors } from '@nestjs/common';
import { ApiHeader } from '@nestjs/swagger';
import { IdempotencyInterceptor } from '../redis/idempotency.interceptor';

/** Requires and honours the Idempotency-Key header on a POST command endpoint. */
export const Idempotent = () =>
  applyDecorators(
    UseInterceptors(IdempotencyInterceptor),
    ApiHeader({ name: 'Idempotency-Key', required: true, description: 'Unique key per user action (UUID); retries reuse it' }),
  );
