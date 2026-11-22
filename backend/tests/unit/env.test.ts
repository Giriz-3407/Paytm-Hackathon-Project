import { describe, expect, it } from 'vitest';
import { loadEnv } from '../../src/config/env';

const valid = {
  DATABASE_URL: 'postgresql://u:p@localhost:5432/db',
  JWT_SECRET: 'x'.repeat(32),
};

describe('loadEnv', () => {
  it('applies defaults', () => {
    const env = loadEnv({ ...valid });
    expect(env.PORT).toBe(5000);
    expect(env.NODE_ENV).toBe('development');
    expect(env.corsOrigins).toEqual(['http://localhost:3000']);
  });

  it('reports every missing or invalid variable at once', () => {
    expect(() => loadEnv({ JWT_SECRET: 'short' })).toThrowError(/DATABASE_URL[\s\S]*JWT_SECRET/);
  });

  it('rejects non-PostgreSQL connection strings', () => {
    expect(() => loadEnv({ ...valid, DATABASE_URL: 'mysql://localhost/db' })).toThrow(/PostgreSQL/);
  });

  it('parses a comma-separated CORS allowlist and trims trailing slashes', () => {
    const env = loadEnv({ ...valid, FRONTEND_URL: 'http://a.com/, https://b.com' });
    expect(env.corsOrigins).toEqual(['http://a.com', 'https://b.com']);
  });

  it('forbids anonymous source toggling in production', () => {
    expect(() =>
      loadEnv({ ...valid, NODE_ENV: 'production', ALLOW_ANONYMOUS_SOURCE_TOGGLE: 'true' }),
    ).toThrow(/ALLOW_ANONYMOUS_SOURCE_TOGGLE/);
    expect(() => loadEnv({ ...valid, NODE_ENV: 'production' })).not.toThrow();
  });

  it('treats empty optional values as unset', () => {
    expect(loadEnv({ ...valid, SEED_ADMIN_EMAIL: '' }).SEED_ADMIN_EMAIL).toBeUndefined();
  });
});
