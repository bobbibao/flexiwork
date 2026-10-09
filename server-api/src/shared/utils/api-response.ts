import { HttpStatus } from '@nestjs/common';
import { Response } from 'express';

export interface ApiResponseProps<T, H> {
  error: boolean;
  payload?: T;
  count?: number;
  code?: string;
  language?: string;
  holidays?: H;
  statusCode?: HttpStatus;
  dates?: Date[];
}

export class ApiResponse<T, H = unknown> {
  private readonly error: boolean;
  private payload?: T;
  private readonly count?: number;
  private readonly code?: string;
  private readonly language?: string;
  private readonly holidays?: H;
  private readonly dates?: Date[];
  private readonly statusCode?: HttpStatus;

  constructor({
    error,
    payload,
    language,
    count,
    holidays,
    code,
    dates,
    statusCode = HttpStatus.OK,
  }: ApiResponseProps<T, H>) {
    this.statusCode = statusCode;
    this.error = error;
    this.payload = payload;
    this.language = language;
    this.holidays = holidays;
    this.count = count;
    this.code = code;
    this.dates = dates;
  }

  getPayload(): T | undefined {
    return this.payload;
  }

  setPayload(payload: T): void {
    this.payload = payload;
  }

  send(res: Response): Response {
    const response: Record<string, unknown> = {
      error: this.error,
    };

    if (this.count !== undefined) {
      response.count = this.count;
    }

    if (this.holidays !== undefined) {
      response.holidays = this.holidays;
    }

    if (this.language !== undefined) {
      response.language = this.language;
    }

    if (this.code !== undefined) {
      response.code = this.code;
    }

    if (this.dates !== undefined) {
      response.dates = this.dates;
    }

    if (this.payload !== undefined) {
      response.payload = this.payload;
    }

    return res.status(this.statusCode).json(response);
  }
}
