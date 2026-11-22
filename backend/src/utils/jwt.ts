import jwt, { type SignOptions } from 'jsonwebtoken';
import { z } from 'zod';
import { env } from '../config/env';
import { AppError } from './app-error';

const payloadSchema = z.object({
  sub: z.string().min(1),
  role: z.enum(['ADMIN', 'ANALYST', 'VIEWER']),
});

export type TokenPayload = z.infer<typeof payloadSchema>;

const ALGORITHM = 'HS256';

export function signAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    algorithm: ALGORITHM,
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
  });
}

export function verifyAccessToken(token: string): TokenPayload {
  try {
    // Pinning the algorithm prevents "alg: none" and key-confusion attacks.
    const decoded = jwt.verify(token, env.JWT_SECRET, { algorithms: [ALGORITHM] });
    return payloadSchema.parse(decoded);
  } catch {
    throw AppError.unauthorized('Invalid or expired token');
  }
}
