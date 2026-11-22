import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeIncidentRow } from '../fixtures';

// Repositories are mocked, so these tests exercise routing, middleware, validation,
// auth, error handling and response shaping without needing a database.
vi.mock('../../src/modules/health/health.repository', () => ({
  healthRepository: { pingDatabase: vi.fn() },
}));
vi.mock('../../src/modules/incidents/incidents.repository', () => ({
  incidentsRepository: { list: vi.fn(), findById: vi.fn(), create: vi.fn(), update: vi.fn() },
}));
vi.mock('../../src/modules/sources/sources.repository', () => ({
  sourcesRepository: { list: vi.fn(), findById: vi.fn(), setEnabled: vi.fn() },
}));

import { createApp } from '../../src/app';
import { healthRepository } from '../../src/modules/health/health.repository';
import { incidentsRepository } from '../../src/modules/incidents/incidents.repository';
import { sourcesRepository } from '../../src/modules/sources/sources.repository';
import { signAccessToken } from '../../src/utils/jwt';

const app = createApp();
const bearer = (role: 'ADMIN' | 'ANALYST' | 'VIEWER') =>
  `Bearer ${signAccessToken({ sub: 'user-1', role })}`;

beforeEach(() => vi.resetAllMocks());

describe('health', () => {
  it('returns 200 with the standard envelope when the database is up', async () => {
    vi.mocked(healthRepository.pingDatabase).mockResolvedValue(true);
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      success: true,
      data: { status: 'ok', checks: { database: 'up' } },
      meta: null,
    });
    expect(res.headers['x-request-id']).toBeTruthy();
  });

  it('returns 503 when the database is down', async () => {
    vi.mocked(healthRepository.pingDatabase).mockResolvedValue(false);
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(503);
    expect(res.body.data.checks.database).toBe('down');
  });
});

describe('cross-cutting behaviour', () => {
  it('returns a JSON 404 envelope for unknown routes', async () => {
    const res = await request(app).get('/api/v1/nope');
    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({ success: false, error: { code: 'NOT_FOUND' } });
  });

  it('sets security headers and hides the framework', async () => {
    vi.mocked(healthRepository.pingDatabase).mockResolvedValue(true);
    const res = await request(app).get('/api/v1/health');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  it('allows the configured frontend origin and rejects others', async () => {
    vi.mocked(healthRepository.pingDatabase).mockResolvedValue(true);
    const ok = await request(app).get('/api/v1/health').set('Origin', 'http://localhost:3000');
    expect(ok.headers['access-control-allow-origin']).toBe('http://localhost:3000');

    const denied = await request(app).get('/api/v1/health').set('Origin', 'http://evil.example');
    expect(denied.status).toBe(403);
    expect(denied.body.error.code).toBe('CORS_ORIGIN_DENIED');
  });

  it('answers malformed JSON with 400 and no stack trace', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .set('Content-Type', 'application/json')
      .send('{bad');
    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body)).not.toMatch(/at .*\.ts|node_modules/);
  });

  it('masks unexpected errors as a generic 500', async () => {
    vi.mocked(incidentsRepository.findById).mockRejectedValue(new Error('secret db detail'));
    const res = await request(app).get('/api/v1/incidents/CL-1');
    expect(res.status).toBe(500);
    expect(res.body.message).toBe('Internal server error');
    expect(JSON.stringify(res.body)).not.toContain('secret db detail');
  });
});

describe('GET /incidents', () => {
  it('returns the frontend Incident shape inside the envelope, with pagination meta', async () => {
    vi.mocked(incidentsRepository.list).mockResolvedValue({ items: [makeIncidentRow()], total: 1 });
    const res = await request(app).get('/api/v1/incidents?categories=Flood&pageSize=200');

    expect(res.status).toBe(200);
    expect(res.body.data[0]).toMatchObject({ id: 'CL-1', coordinates: [26.14, 91.73], mode: 'demo' });
    expect(res.body.meta).toEqual({ page: 1, pageSize: 200, total: 1, totalPages: 1 });
    expect(vi.mocked(incidentsRepository.list).mock.calls[0]![0]).toMatchObject({
      categories: ['Flood'],
      sort: 'newest',
    });
  });

  it('rejects invalid query parameters with field-level details', async () => {
    const res = await request(app).get('/api/v1/incidents?severities=Bogus');
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details[0]).toMatchObject({ part: 'query' });
  });
});

describe('GET /incidents/:id', () => {
  it('returns 404 for a missing incident', async () => {
    vi.mocked(incidentsRepository.findById).mockResolvedValue(null);
    const res = await request(app).get('/api/v1/incidents/CL-404');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

describe('authorization on writes', () => {
  const body = {
    title: 'Flooding in Surat',
    description: 'd',
    category: 'Flood',
    location: { city: 'Surat', state: 'Gujarat', district: 'Surat' },
    coordinates: [21.17, 72.83],
    summary: 's',
  };

  it('requires a token', async () => {
    const res = await request(app).post('/api/v1/incidents').send(body);
    expect(res.status).toBe(401);
  });

  it('rejects an invalid token', async () => {
    const res = await request(app)
      .post('/api/v1/incidents')
      .set('Authorization', 'Bearer garbage')
      .send(body);
    expect(res.status).toBe(401);
  });

  it('forbids VIEWER accounts', async () => {
    const res = await request(app)
      .post('/api/v1/incidents')
      .set('Authorization', bearer('VIEWER'))
      .send(body);
    expect(res.status).toBe(403);
  });

  it('lets an ANALYST create an incident and returns 201', async () => {
    vi.mocked(incidentsRepository.create).mockResolvedValue(makeIncidentRow({ evidence: [] }));
    const res = await request(app)
      .post('/api/v1/incidents')
      .set('Authorization', bearer('ANALYST'))
      .send(body);
    expect(res.status).toBe(201);
    expect(res.body.data.sourceCount).toBe(0);
  });

  it('rejects unknown fields instead of silently dropping them', async () => {
    const res = await request(app)
      .post('/api/v1/incidents')
      .set('Authorization', bearer('ADMIN'))
      .send({ ...body, mode: 'replay' });
    expect(res.status).toBe(422);
  });

  it('only lets ADMIN change roles', async () => {
    const res = await request(app)
      .patch('/api/v1/auth/users/6f9619ff-8b86-4011-b42d-00c04fc964ff/role')
      .set('Authorization', bearer('ANALYST'))
      .send({ role: 'ADMIN' });
    expect(res.status).toBe(403);
  });
});

describe('PATCH /sources/:id', () => {
  it('works anonymously only because the dev flag is enabled in the test env', async () => {
    const row = {
      id: 's1',
      name: 'News',
      type: 'News discovery',
      url: 'https://news.google.com',
      status: 'Healthy',
      enabled: false,
      frequency: 'Every 5 minutes',
      reports: 1,
      error: null,
      lastSync: new Date('2026-11-22T06:25:00Z'),
      lastAttempt: new Date('2026-11-22T06:29:00Z'),
      createdAt: new Date(),
      updatedAt: new Date(),
    } as const;
    vi.mocked(sourcesRepository.findById).mockResolvedValue({ ...row, enabled: true });
    vi.mocked(sourcesRepository.setEnabled).mockResolvedValue({ ...row });

    const res = await request(app).patch('/api/v1/sources/s1').send({ enabled: false });
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ id: 's1', enabled: false });
  });

  it('validates the body', async () => {
    const res = await request(app).patch('/api/v1/sources/s1').send({ enabled: 'yes' });
    expect(res.status).toBe(422);
  });
});
