import { z } from 'zod';

export const sourceIdParam = z.object({ id: z.string().trim().min(1).max(64) });

export const updateSourceBody = z.strictObject({ enabled: z.boolean() });

export type UpdateSourceInput = z.infer<typeof updateSourceBody>;
