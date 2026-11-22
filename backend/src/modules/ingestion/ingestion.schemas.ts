import { z } from 'zod';

export const runIngestionBody = z.strictObject({
  /** Overrides the default one-query-per-category set. Each query costs one SerpApi search. */
  queries: z.array(z.string().trim().min(3).max(100)).min(1).max(10).optional(),
});

export type RunIngestionInput = z.infer<typeof runIngestionBody>;
