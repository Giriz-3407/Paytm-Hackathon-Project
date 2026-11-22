import http from 'node:http';
import { createApp } from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { connectDatabase, disconnectDatabase } from './database/client';
import {
  startIngestionScheduler,
  stopIngestionScheduler,
} from './modules/ingestion/ingestion.scheduler';
import { closeRealtime, initRealtime } from './services/realtime.service';

const SHUTDOWN_TIMEOUT_MS = 10_000;

async function main() {
  await connectDatabase();

  const server = http.createServer(createApp());
  initRealtime(server);

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(env.PORT, () => resolve());
  });
  logger.info({ port: env.PORT, env: env.NODE_ENV }, 'Crisis Lens API listening');
  startIngestionScheduler();

  let shuttingDown = false;
  const shutdown = async (reason: string, exitCode = 0) => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info({ reason }, 'Shutting down');

    // Force-exit if connections refuse to drain.
    const timer = setTimeout(() => {
      logger.error('Graceful shutdown timed out; forcing exit');
      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS);
    timer.unref();

    try {
      stopIngestionScheduler();
      await closeRealtime(); // closes the HTTP server's websocket connections too
      if (server.listening) {
        await new Promise<void>((resolve) => server.close(() => resolve()));
      }
      await disconnectDatabase();
      process.exit(exitCode);
    } catch (error) {
      logger.error({ err: error }, 'Error during shutdown');
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('unhandledRejection', (reason) => {
    logger.fatal({ err: reason }, 'Unhandled promise rejection');
    void shutdown('unhandledRejection', 1);
  });
  process.on('uncaughtException', (error) => {
    logger.fatal({ err: error }, 'Uncaught exception');
    void shutdown('uncaughtException', 1);
  });
}

main().catch((error) => {
  logger.fatal({ err: error }, 'Failed to start server');
  process.exit(1);
});
