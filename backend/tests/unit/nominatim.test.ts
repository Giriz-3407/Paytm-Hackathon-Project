import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearGeocodeCache,
  normalisePlaces,
  searchPlaces,
} from '../../src/services/nominatim.service';

const bhubaneswar = {
  lat: '20.2960587',
  lon: '85.8245398',
  display_name: 'Bhubaneswar, Khordha, Odisha, India',
  boundingbox: ['20.1', '20.4', '85.7', '85.95'], // Nominatim order: south, north, west, east
  category: 'boundary',
  type: 'administrative',
  importance: 0.6,
};

const okResponse = (body: unknown) => ({ ok: true, status: 200, json: async () => body }) as Response;

describe('normalisePlaces', () => {
  it('reorders the bounding box to [south, west, north, east] for Leaflet', () => {
    const [place] = normalisePlaces([bhubaneswar]);
    expect(place).toMatchObject({ lat: 20.2960587, lng: 85.8245398, boundingBox: [20.1, 85.7, 20.4, 85.95] });
  });

  it('drops entries with unusable coordinates and tolerates a missing bounding box', () => {
    const places = normalisePlaces([
      { lat: 'x', lon: '1', display_name: 'bad' },
      { lat: '10', lon: '20' },
      { lat: '10', lon: '20', display_name: 'ok' },
    ]);
    expect(places).toHaveLength(1);
    expect(places[0]).toMatchObject({ displayName: 'ok', boundingBox: null, category: 'place' });
  });
});

describe('searchPlaces', () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    clearGeocodeCache();
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());

  it('queries Nominatim for India with an identifying User-Agent', async () => {
    fetchMock.mockResolvedValue(okResponse([bhubaneswar]));
    const results = await searchPlaces('Bhubaneswar');

    expect(results[0]!.displayName).toContain('Bhubaneswar');
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(String(url)).toContain('nominatim.openstreetmap.org/search');
    expect(String(url)).toContain('countrycodes=in');
    expect(String(url)).toContain('format=jsonv2');
    expect((init as RequestInit).headers).toMatchObject({ 'User-Agent': expect.stringContaining('CrisisLens') });
  });

  it('serves repeated searches from the cache, ignoring case and spacing', async () => {
    fetchMock.mockResolvedValue(okResponse([bhubaneswar]));
    await searchPlaces('Bhubaneswar');
    await searchPlaces('  bhubaneswar ');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('maps upstream rate limiting to 503 and network failure to 502', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 429, json: async () => ({}) } as Response);
    await expect(searchPlaces('a-place')).rejects.toMatchObject({ statusCode: 503 });

    clearGeocodeCache();
    fetchMock.mockRejectedValueOnce(new Error('fetch failed'));
    await expect(searchPlaces('another place')).rejects.toMatchObject({ statusCode: 502 });
  });

  it('returns an empty list, not an error, when nothing matches', async () => {
    fetchMock.mockResolvedValue(okResponse([]));
    await expect(searchPlaces('zzzzzz nowhere')).resolves.toEqual([]);
  });
});
