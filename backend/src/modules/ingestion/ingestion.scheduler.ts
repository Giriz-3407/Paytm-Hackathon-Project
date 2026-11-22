import { env } from '../../config/env';
import { logger } from '../../config/logger';
import { ingestionService } from './ingestion.service';

let timer: NodeJS.Timeout | null = null;

/** Optional background polling. Disabled unless SERPAPI_POLL_MINUTES > 0 and a key is set. */
export function startIngestionScheduler(): void {
  if (!env.SERPAPI_API_KEY || env.SERPAPI_POLL_MINUTES <= 0) return;
  const everyMs = env.SERPAPI_POLL_MINUTES * 60_000;
  const tick = () =>
    ingestionService
      .run()
      .catch((error) => logger.warn({ err: (error as Error).message }, 'Scheduled ingestion failed'));
  timer = setInterval(tick, everyMs);
  timer.unref();
  logger.info({ everyMinutes: env.SERPAPI_POLL_MINUTES }, 'Ingestion scheduler started');
}

export function stopIngestionScheduler(): void {
  if (timer) clearInterval(timer);
  timer = null;
}
