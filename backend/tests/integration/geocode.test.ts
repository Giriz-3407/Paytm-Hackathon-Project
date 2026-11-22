import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/services/nominatim.service', () => ({ searchPlaces: vi.fn() }));

import { createApp } from '../../src/app';
import { searchPlaces } from '../../src/services/nominatim.service';

const app = createApp();
beforeEach(() => vi.resetAllMocks());

describe('GET /api/v1/geocode/search', () => {
  it('returns places in the standard envelope', async () => {
    vi.mocked(searchPlaces).mockResolvedValue([
      { displayName: 'Bhubaneswar, Odisha, India', lat: 20.29, lng: 85.82, boundingBox: [20.1, 85.7, 20.4, 85.95], category: 'boundary', type: 'administrative', importance: 0.6 },
    ]);
    const res = await request(app).get('/api/v1/geocode/search?q=Bhubaneswar');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ success: true, data: [{ lat: 20.29, lng: 85.82 }], meta: null });
    expect(searchPlaces).toHaveBeenCalledWith('Bhubaneswar', 5);
  });

  it('rejects missing, too-short and oversized queries before calling the geocoder', async () => {
    for (const url of ['/api/v1/geocode/search', '/api/v1/geocode/search?q=a', `/api/v1/geocode/search?q=${'x'.repeat(101)}`, '/api/v1/geocode/search?q=ok&limit=50']) {
      const res = await request(app).get(url);
      expect(res.status).toBe(422);
    }
    expect(searchPlaces).not.toHaveBeenCalled();
  });

  it('succeeds with an empty list when nothing is found', async () => {
    vi.mocked(searchPlaces).mockResolvedValue([]);
    const res = await request(app).get('/api/v1/geocode/search?q=nowhere');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });
});
