import bcrypt from 'bcrypt';
import { env } from '../../config/env';
import { AppError } from '../../utils/app-error';
import { signAccessToken } from '../../utils/jwt';
import { authRepository } from './auth.repository';
import type { LoginInput, RegisterInput, UpdateRoleInput } from './auth.schemas';
import { toPublicUser, type AuthResult, type PublicUser } from './auth.types';

// Compared against when the email is unknown, so "no such user" and "wrong password"
// take about the same time and cannot be told apart by timing.
let dummyHash: Promise<string> | null = null;
const getDummyHash = () => (dummyHash ??= bcrypt.hash('not-a-real-password', env.BCRYPT_ROUNDS));

const issueToken = (user: { id: string; role: PublicUser['role'] }) =>
  signAccessToken({ sub: user.id, role: user.role });

export const authService = {
  /** Self-registration always creates a read-only VIEWER; an admin can promote later. */
  async register(input: RegisterInput): Promise<AuthResult> {
    if (await authRepository.findByEmail(input.email)) {
      throw AppError.conflict('An account with this email already exists');
    }
    const passwordHash = await bcrypt.hash(input.password, env.BCRYPT_ROUNDS);
    const user = await authRepository.create({
      name: input.name,
      email: input.email,
      passwordHash,
      role: 'VIEWER',
    });
    return { user: toPublicUser(user), accessToken: issueToken(user), expiresIn: env.JWT_EXPIRES_IN };
  },

  async login(input: LoginInput): Promise<AuthResult> {
    const user = await authRepository.findByEmail(input.email);
    const valid = await bcrypt.compare(input.password, user?.passwordHash ?? (await getDummyHash()));
    if (!user || !valid) throw AppError.unauthorized('Invalid email or password');
    return { user: toPublicUser(user), accessToken: issueToken(user), expiresIn: env.JWT_EXPIRES_IN };
  },

  async me(userId: string): Promise<PublicUser> {
    const user = await authRepository.findById(userId);
    if (!user) throw AppError.unauthorized('Account no longer exists');
    return toPublicUser(user);
  },

  async updateRole(actorId: string, targetId: string, input: UpdateRoleInput): Promise<PublicUser> {
    // Prevents the last admin from locking everyone out of user management.
    if (actorId === targetId) throw AppError.badRequest('You cannot change your own role');
    if (!(await authRepository.findById(targetId))) throw AppError.notFound('User not found');
    return toPublicUser(await authRepository.updateRole(targetId, input.role));
  },
};
