import type { TokenPayload } from '../utils/jwt';

declare global {
  namespace Express {
    interface Request {
      /** Set by the `requireAuth` middleware. */
      user?: { id: string; role: TokenPayload['role'] };
      /** Set by the `validate` middleware; read with `getValidated`. */
      validated: { body?: unknown; query?: unknown; params?: unknown };
    }
  }
}

export {};
