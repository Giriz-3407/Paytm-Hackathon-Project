import type { User } from '@prisma/client';

/** The only user shape that ever leaves the service: no password hash. */
export interface PublicUser {
  id: string;
  name: string;
  email: string;
  role: User['role'];
  createdAt: string;
}

export const toPublicUser = (user: User): PublicUser => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  createdAt: user.createdAt.toISOString(),
});

export interface AuthResult {
  user: PublicUser;
  accessToken: string;
  expiresIn: string;
}
