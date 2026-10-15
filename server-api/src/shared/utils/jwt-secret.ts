import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const LEGACY_FALLBACK = 'jwt_secret_key';
let warned = false;

/**
 * JWT signing secret (PLAN.md P12.6). The legacy code fell back to a well-known literal when JWT_SECRET_KEY was
 * missing, which lets anyone forge tokens. Staging/production now refuse to start without a real secret;
 * development keeps the old fallback (behaviour unchanged) but warns once.
 */
export function resolveJwtSecret(config?: ConfigService): string {
  const secret = config ? config.get<string>('JWT_SECRET_KEY') : process.env.JWT_SECRET_KEY;
  if (secret && secret !== LEGACY_FALLBACK) return secret;
  if (['staging', 'production'].includes(process.env.NODE_ENV || '')) {
    throw new Error('JWT_SECRET_KEY must be set to a strong secret in staging/production');
  }
  if (!warned) {
    new Logger('auth').warn('JWT_SECRET_KEY is not set: using the insecure development fallback');
    warned = true;
  }
  return LEGACY_FALLBACK;
}
