import { HttpException } from '@nestjs/common';
import { BaseError } from './base.error';

/**
 * Error with a stable machine-readable code (docs/ARCHITECTURE.md §16).
 * The frontend maps `code` to Vietnamese text under `sn.errors.<CODE>`.
 */
export class CodedError extends BaseError {
  constructor(
    readonly code: string,
    message: string,
    statusCode = 400,
    readonly details?: Record<string, unknown>,
  ) {
    super({ message, statusCode });
  }
}

export const notFound = (code: string, message: string) => new CodedError(code, message, 404);
export const forbidden = (code: string, message: string) => new CodedError(code, message, 403);
export const conflict = (code: string, message: string, details?: Record<string, unknown>) =>
  new CodedError(code, message, 409, details);
export const unprocessable = (code: string, message: string, details?: Record<string, unknown>) =>
  new CodedError(code, message, 422, details);

/** HttpException variant for code paths outside BaseController (guards, interceptors). */
export const snHttpError = (status: number, code: string, message: string) =>
  new HttpException({ error: true, code, message }, status);
