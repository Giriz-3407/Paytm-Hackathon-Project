import { env } from '../config/env';
import { logger } from '../config/logger';
import { AppError } from '../utils/app-error';

export interface GeocodeResult {
  displayName: string;
  lat: number;
  lng: number;
  /** [south, west, north, east], ready for Leaflet's `fitBounds([[s, w], [n, e]])`. */
  boundingBox: [number, number, number, number] | null;
  category: string;
  type: string;
  importance: number;
}

const TIMEOUT_MS = 10_000;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const CACHE_MAX_ENTRIES = 500;
// Nominatim's usage policy allows at most 1 request per second; stay slightly above that.
const MIN_INTERVAL_MS = 1100;

const cache = new Map<string, { at: number; results: GeocodeResult[] }>();
let lastRequestAt = 0;
let queue: Promise<unknown> = Promise.resolve();

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Serialises calls and spaces them out so concurrent users can never exceed the policy rate. */
function throttled<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(async () => {
    const wait = lastRequestAt + MIN_INTERVAL_MS - Date.now();
    if (wait > 0) await sleep(wait);
    lastRequestAt = Date.now();
    return task();
  });
  queue = run.catch(() => undefined);
  return run;
}

interface RawPlace {
  lat?: string;
  lon?: string;
  display_name?: string;
  boundingbox?: string[]; // Nominatim order: [south, north, west, east]
  category?: string;
  class?: string;
  type?: string;
  importance?: number;
}

export function normalisePlaces(raw: RawPlace[]): GeocodeResult[] {
  const results: GeocodeResult[] = [];
  for (const place of raw) {
    const lat = Number(place.lat);
    const lng = Number(place.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || !place.display_name) continue;
    const bb = place.boundingbox?.map(Number);
    const boundingBox =
      bb && bb.length === 4 && bb.every(Number.isFinite)
        ? ([bb[0]!, bb[2]!, bb[1]!, bb[3]!] as [number, number, number, number])
        : null;
    results.push({
      displayName: place.display_name,
      lat,
      lng,
      boundingBox,
      category: place.category ?? place.class ?? 'place',
      type: place.type ?? 'unknown',
      importance: place.importance ?? 0,
    });
  }
  return results;
}

/**
 * Searches OpenStreetMap (Nominatim), restricted to India. Results are cached for 24 h and requests
 * are throttled to Nominatim's 1 req/s policy. The search is meant to run on an explicit submit,
 * never on every keystroke (autocomplete is not allowed on the public server).
 */
export async function searchPlaces(query: string, limit = 5): Promise<GeocodeResult[]> {
  const key = query.trim().replace(/\s+/g, ' ').toLowerCase();
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.results;

  const url = new URL('/search', env.NOMINATIM_BASE_URL);
  url.search = new URLSearchParams({
    q: query.trim(),
    format: 'jsonv2',
    limit: String(limit),
    countrycodes: 'in',
    'accept-language': 'en',
  }).toString();

  const results = await throttled(async () => {
    let response: Response;
    try {
      response = await fetch(url, {
        headers: { 'User-Agent': env.NOMINATIM_USER_AGENT, Accept: 'application/json' },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch (error) {
      logger.warn({ reason: (error as Error).name }, 'Nominatim request failed');
      throw new AppError(502, 'Could not reach the OpenStreetMap geocoder', 'GEOCODER_UNREACHABLE');
    }
    if (response.status === 429 || response.status === 503) {
      throw new AppError(503, 'The OpenStreetMap geocoder is busy; try again shortly', 'GEOCODER_BUSY');
    }
    if (!response.ok) {
      logger.warn({ status: response.status }, 'Nominatim returned an error');
      throw new AppError(502, 'The OpenStreetMap geocoder returned an error', 'GEOCODER_ERROR');
    }
    const body = (await response.json().catch(() => null)) as RawPlace[] | null;
    return normalisePlaces(Array.isArray(body) ? body : []);
  });

  if (cache.size >= CACHE_MAX_ENTRIES) cache.delete(cache.keys().next().value as string);
  cache.set(key, { at: Date.now(), results });
  return results;
}

/** Test helper. */
export function clearGeocodeCache() {
  cache.clear();
  lastRequestAt = 0;
}
