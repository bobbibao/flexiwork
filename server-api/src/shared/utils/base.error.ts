import { HttpStatus } from '@nestjs/common';

interface IBaseError {
  message: string;
  statusCode: HttpStatus;
}

export class BaseError extends Error {
  public readonly statusCode: number;

  constructor({ message, statusCode = 500 }: IBaseError) {
    super(message);
    this.statusCode = statusCode;
  }
}

export class BadRequestError extends BaseError {
  constructor(message: string) {
    super({ message, statusCode: 400 });
  }
}

export class UnauthorizedError extends BaseError {
  constructor(message: string) {
    super({ message, statusCode: 401 });
  }
}

export class ForbiddenError extends BaseError {
  constructor(message: string) {
    super({ message, statusCode: 403 });
  }
}

export class NotFoundError extends BaseError {
  constructor(message: string) {
    super({ message, statusCode: 404 });
  }
}

export class NotAcceptableError extends BaseError {
  constructor(message: string) {
    super({ message, statusCode: 406 });
  }
}

export class InternalServerError extends BaseError {
  constructor(message?: string) {
    super({ message: message ?? 'Internal Server Error', statusCode: 500 });
  }
}
