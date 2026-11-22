import { z } from 'zod';

export const searchQuery = z.object({
  q: z.string().trim().min(2, 'must be at least 2 characters').max(100),
  limit: z.coerce.number().int().min(1).max(10).default(5),
});

export type SearchQuery = z.infer<typeof searchQuery>;
