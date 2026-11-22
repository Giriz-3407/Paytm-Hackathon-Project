import { z } from 'zod';

// bcrypt only hashes the first 72 bytes, so longer passwords would be silently truncated.
const password = z
  .string()
  .min(10, 'must be at least 10 characters')
  .refine((v) => Buffer.byteLength(v, 'utf8') <= 72, 'must be at most 72 bytes');

const email = z.email().max(254).transform((v) => v.toLowerCase());

export const registerBody = z.strictObject({
  name: z.string().trim().min(1).max(100),
  email,
  password,
});

export const loginBody = z.strictObject({
  email,
  // Do not apply strength rules at login; only reject absurd input.
  password: z.string().min(1).max(200),
});

export const userIdParam = z.object({ id: z.uuid() });

export const updateRoleBody = z.strictObject({ role: z.enum(['ADMIN', 'ANALYST', 'VIEWER']) });

export type RegisterInput = z.infer<typeof registerBody>;
export type LoginInput = z.infer<typeof loginBody>;
export type UpdateRoleInput = z.infer<typeof updateRoleBody>;
