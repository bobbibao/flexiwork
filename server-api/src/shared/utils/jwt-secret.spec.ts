import { ConfigService } from '@nestjs/config';
import { resolveJwtSecret } from './jwt-secret';

const config = (value?: string) => ({ get: () => value }) as unknown as ConfigService;

describe('resolveJwtSecret (P12.6)', () => {
  const env = process.env.NODE_ENV;
  afterEach(() => (process.env.NODE_ENV = env));

  it('returns the configured secret', () => {
    expect(resolveJwtSecret(config('s3cr3t-value'))).toBe('s3cr3t-value');
  });

  it.each(['staging', 'production'])('refuses a missing or legacy-literal secret in %s', (nodeEnv) => {
    process.env.NODE_ENV = nodeEnv;
    expect(() => resolveJwtSecret(config(undefined))).toThrow(/JWT_SECRET_KEY/);
    expect(() => resolveJwtSecret(config('jwt_secret_key'))).toThrow(/JWT_SECRET_KEY/);
  });

  it('keeps the legacy fallback in development', () => {
    process.env.NODE_ENV = 'development';
    expect(resolveJwtSecret(config(undefined))).toBe('jwt_secret_key');
  });
});
