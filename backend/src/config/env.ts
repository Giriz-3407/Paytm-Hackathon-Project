import 'dotenv/config';
import { z } from 'zod';

/** Treat empty strings (e.g. `KEY=` in a .env file) as "not set". */
const optionalString = z
  .string()
  .optional()
  .transform((v) => (v && v.trim() ? v.trim() : undefined));

const booleanString = z.enum(['true', 'false']).transform((v) => v === 'true');

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().min(1).max(65535).default(5000),
    LOG_LEVEL: z
      .enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal', 'silent'])
      .default('info'),

    DATABASE_URL: z
      .string()
      .min(1, 'is required')
      .refine((v) => /^postgres(ql)?:\/\//.test(v), 'must be a PostgreSQL connection string'),

    JWT_SECRET: z.string().min(32, 'must be at least 32 characters'),
    JWT_EXPIRES_IN: z.string().min(1).default('1d'),
    BCRYPT_ROUNDS: z.coerce.number().int().min(4).max(15).default(12),

    FRONTEND_URL: z.string().min(1).default('http://localhost:3000'),
    TRUST_PROXY: z.coerce.number().int().min(0).default(0),

    RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(15 * 60 * 1000),
    RATE_LIMIT_MAX: z.coerce.number().int().positive().default(300),
    AUTH_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(20),

    SERPAPI_API_KEY: optionalString,
    SERPAPI_POLL_MINUTES: z.coerce.number().int().min(0).max(1440).default(0),

    ALLOW_ANONYMOUS_SOURCE_TOGGLE: booleanString.default(false),

    SEED_ADMIN_EMAIL: optionalString,
    SEED_ADMIN_PASSWORD: optionalString,
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV === 'production' && env.ALLOW_ANONYMOUS_SOURCE_TOGGLE) {
      ctx.addIssue({
        code: 'custom',
        path: ['ALLOW_ANONYMOUS_SOURCE_TOGGLE'],
        message: 'must be false when NODE_ENV=production',
      });
    }
  })
  .transform((env) => ({
    ...env,
    isProduction: env.NODE_ENV === 'production',
    isTest: env.NODE_ENV === 'test',
    corsOrigins: env.FRONTEND_URL.split(',')
      .map((o) => o.trim().replace(/\/$/, ''))
      .filter(Boolean),
  }));

export type Env = z.infer<typeof envSchema>;

/** Parses and validates a raw environment. Throws a readable error listing every problem. */
export function loadEnv(source: NodeJS.ProcessEnv): Env {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    const lines = result.error.issues.map((i) => `  - ${i.path.join('.') || 'env'}: ${i.message}`);
    throw new Error(`Invalid environment configuration:\n${lines.join('\n')}`);
  }
  return result.data;
}

function loadOrExit(): Env {
  try {
    return loadEnv(process.env);
  } catch (error) {
    // The logger depends on env, so write straight to stderr and stop.
    process.stderr.write(`${(error as Error).message}\nSee backend/.env.example.\n`);
    process.exit(1);
  }
}

export const env = loadOrExit();
