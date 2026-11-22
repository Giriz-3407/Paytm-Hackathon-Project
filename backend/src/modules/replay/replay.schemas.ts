import { z } from 'zod';

export const scenarioIdParam = z.object({ id: z.string().trim().min(1).max(64) });

/**
 * `asOf` returns only events with `availableAt <= asOf`, so a client (or a future
 * server-side replay session) never receives evidence from after the virtual clock.
 * Omitting it returns every event, which is what the current frontend expects.
 */
export const getScenarioQuery = z.object({
  asOf: z.iso.datetime({ offset: true }).optional(),
});

export type GetScenarioQuery = z.infer<typeof getScenarioQuery>;
