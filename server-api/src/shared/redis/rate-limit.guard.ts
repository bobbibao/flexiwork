import { CanActivate, ExecutionContext, HttpException, HttpStatus, Inject, Injectable, SetMetadata, UseGuards, applyDecorators } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type Redis from 'ioredis';
import { Request } from 'express';
import { snConfig } from '../sn-runtime';

const RATE_LIMIT_KEY = 'sn:rate-limit';

interface RateLimitOptions {
  /** Requests allowed per window per (route, client IP). */
  limit: number;
  windowSec: number;
}

/**
 * Fixed-window throttle (docs/ARCHITECTURE.md §12): Redis INCR + EXPIRE, in-process fallback without REDIS_URL.
 * Applied to public SN endpoints (auth, payment webhooks) only; legacy routes are untouched.
 */
@Injectable()
export class SnRateLimitGuard implements CanActivate {
  private readonly memory = new Map<string, { count: number; resetAt: number }>();

  constructor(
    private readonly reflector: Reflector,
    @Inject('REDIS_CLIENT') private readonly redis: Redis | null,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const options = this.reflector.get<RateLimitOptions>(RATE_LIMIT_KEY, context.getHandler());
    if (!options) return true;
    const req = context.switchToHttp().getRequest<Request>();
    const key = `sn:rl:${context.getClass().name}.${context.getHandler().name}:${req.ip}`;
    const count = await this.hit(key, options.windowSec);
    if (count > options.limit * snConfig().SN_RATE_LIMIT_FACTOR) {
      throw new HttpException(
        { error: true, code: 'RATE_LIMITED', message: 'Bạn thao tác quá nhanh, vui lòng thử lại sau ít phút.' },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    return true;
  }

  private async hit(key: string, windowSec: number): Promise<number> {
    if (this.redis) {
      const count = await this.redis.incr(key);
      if (count === 1) await this.redis.expire(key, windowSec);
      return count;
    }
    const now = Date.now();
    const entry = this.memory.get(key);
    if (!entry || entry.resetAt <= now) {
      this.memory.set(key, { count: 1, resetAt: now + windowSec * 1000 });
      return 1;
    }
    entry.count++;
    return entry.count;
  }
}

export const SnRateLimit = (limit: number, windowSec: number) =>
  applyDecorators(SetMetadata(RATE_LIMIT_KEY, { limit, windowSec } as RateLimitOptions), UseGuards(SnRateLimitGuard));
