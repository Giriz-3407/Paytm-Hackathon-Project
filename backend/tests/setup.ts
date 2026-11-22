// Runs before every test file, ahead of any application import, so config/env.ts
// validates this deterministic environment instead of a developer's .env.
Object.assign(process.env, {
  NODE_ENV: 'test',
  DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
  JWT_SECRET: 'test-secret-test-secret-test-secret-1234',
  JWT_EXPIRES_IN: '1h',
  BCRYPT_ROUNDS: '4',
  FRONTEND_URL: 'http://localhost:3000',
  ALLOW_ANONYMOUS_SOURCE_TOGGLE: 'true',
  RATE_LIMIT_MAX: '1000',
  AUTH_RATE_LIMIT_MAX: '1000',
  SEED_ADMIN_EMAIL: '',
  SEED_ADMIN_PASSWORD: '',
});
