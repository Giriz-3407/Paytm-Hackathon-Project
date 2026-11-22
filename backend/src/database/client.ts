import { PrismaClient } from '@prisma/client';
import { env } from '../config/env';
import { logger } from '../config/logger';

export const prisma = new PrismaClient({
  log: env.isTest ? [] : [{ emit: 'event', level: 'warn' }, { emit: 'event', level: 'error' }],
});

if (!env.isTest) {
  prisma.$on('warn', (e) => logger.warn({ target: e.target }, e.message));
  prisma.$on('error', (e) => logger.error({ target: e.target }, e.message));
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Connects with bounded retries so a slow-starting database does not crash the boot. */
export async function connectDatabase(attempts = 5, delayMs = 2000): Promise<void> {
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      await prisma.$connect();
      logger.info('Database connected');
      return;
    } catch (error) {
      logger.warn(
        { attempt, attempts, err: (error as Error).message },
        'Database connection failed',
      );
      if (attempt === attempts) {
        throw new Error('Could not connect to the database. Is PostgreSQL running and DATABASE_URL correct?');
      }
      await sleep(delayMs * attempt);
    }
  }
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
  logger.info('Database disconnected');
}
