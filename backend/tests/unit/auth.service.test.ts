import bcrypt from 'bcrypt';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { User } from '@prisma/client';

vi.mock('../../src/modules/auth/auth.repository', () => ({
  authRepository: {
    findByEmail: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    updateRole: vi.fn(),
  },
}));

import { authRepository } from '../../src/modules/auth/auth.repository';
import { authService } from '../../src/modules/auth/auth.service';
import { verifyAccessToken } from '../../src/utils/jwt';

const repo = vi.mocked(authRepository);

const makeUser = (overrides: Partial<User> = {}): User => ({
  id: '11111111-1111-4111-8111-111111111111',
  email: 'a@example.com',
  name: 'Ada',
  passwordHash: 'hash',
  role: 'VIEWER',
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
  ...overrides,
});

beforeEach(() => vi.resetAllMocks());

describe('authService.register', () => {
  it('hashes the password, always creates a VIEWER and never returns the hash', async () => {
    repo.findByEmail.mockResolvedValue(null);
    repo.create.mockImplementation(async (data) => makeUser({ ...(data as Partial<User>) }));

    const result = await authService.register({
      name: 'Ada',
      email: 'a@example.com',
      password: 'correct-horse-battery',
    });

    const stored = repo.create.mock.calls[0]![0] as { passwordHash: string; role: string };
    expect(stored.role).toBe('VIEWER');
    expect(stored.passwordHash).not.toContain('correct-horse');
    expect(await bcrypt.compare('correct-horse-battery', stored.passwordHash)).toBe(true);
    expect(JSON.stringify(result)).not.toContain('passwordHash');
    expect(verifyAccessToken(result.accessToken).role).toBe('VIEWER');
  });

  it('rejects an email that is already registered', async () => {
    repo.findByEmail.mockResolvedValue(makeUser());
    await expect(
      authService.register({ name: 'Ada', email: 'a@example.com', password: 'correct-horse-battery' }),
    ).rejects.toMatchObject({ statusCode: 409 });
    expect(repo.create).not.toHaveBeenCalled();
  });
});

describe('authService.login', () => {
  it('returns a token for valid credentials', async () => {
    const passwordHash = await bcrypt.hash('correct-horse-battery', 4);
    repo.findByEmail.mockResolvedValue(makeUser({ passwordHash, role: 'ANALYST' }));
    const result = await authService.login({ email: 'a@example.com', password: 'correct-horse-battery' });
    expect(verifyAccessToken(result.accessToken)).toMatchObject({ role: 'ANALYST' });
  });

  it('gives the same error for a wrong password and an unknown email', async () => {
    repo.findByEmail.mockResolvedValueOnce(makeUser({ passwordHash: await bcrypt.hash('right-password', 4) }));
    const wrongPassword = await authService
      .login({ email: 'a@example.com', password: 'wrong-password' })
      .catch((e) => e);

    repo.findByEmail.mockResolvedValueOnce(null);
    const unknownEmail = await authService
      .login({ email: 'nobody@example.com', password: 'whatever-password' })
      .catch((e) => e);

    expect(wrongPassword).toMatchObject({ statusCode: 401 });
    expect(unknownEmail).toMatchObject({ statusCode: 401, message: wrongPassword.message });
  });
});

describe('authService.updateRole', () => {
  it('prevents changing your own role', async () => {
    await expect(
      authService.updateRole('same-id', 'same-id', { role: 'VIEWER' }),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('returns 404 for an unknown user', async () => {
    repo.findById.mockResolvedValue(null);
    await expect(authService.updateRole('admin', 'other', { role: 'ANALYST' })).rejects.toMatchObject({
      statusCode: 404,
    });
  });
});

describe('verifyAccessToken', () => {
  it('rejects garbage tokens', () => {
    expect(() => verifyAccessToken('not.a.jwt')).toThrowError(/Invalid or expired/);
  });
});
