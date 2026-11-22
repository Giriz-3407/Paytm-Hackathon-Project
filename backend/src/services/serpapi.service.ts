import { env } from '../config/env';
import { logger } from '../config/logger';
import { AppError } from '../utils/app-error';

export interface NewsItem {
  title: string;
  link: string;
  publisher: string;
  publishedAt: Date | null;
  snippet: string | null;
}

const ENDPOINT = 'https://serpapi.com/search.json';
const TIMEOUT_MS = 20_000;
const CACHE_TTL_MS = 10 * 60 * 1000;

// Identical queries within the TTL reuse the previous result, so repeated runs
// (and clicking "run" twice) do not burn the plan's search quota.
const cache = new Map<string, { at: number; items: NewsItem[] }>();

interface RawNewsResult {
  title?: string;
  link?: string;
  snippet?: string;
  date?: string;
  iso_date?: string;
  source?: { name?: string } | string;
  stories?: RawNewsResult[];
}

/** SerpApi dates look like "11/22/2026, 06:30 AM, +0000 UTC"; `iso_date` is preferred when present. */
export function parseSerpDate(raw: RawNewsResult): Date | null {
  if (raw.iso_date) {
    const d = new Date(raw.iso_date);
    if (!Number.isNaN(d.getTime())) return d;
  }
  const m = raw.date?.match(/^(\d{2})\/(\d{2})\/(\d{4}), (\d{1,2}):(\d{2}) (AM|PM)/);
  if (!m) return null;
  const [, mm, dd, yyyy, hh, min, ampm] = m;
  let hour = Number(hh) % 12;
  if (ampm === 'PM') hour += 12;
  return new Date(Date.UTC(Number(yyyy), Number(mm) - 1, Number(dd), hour, Number(min)));
}

export function normaliseResults(results: RawNewsResult[]): NewsItem[] {
  const flat = results.flatMap((r) => [r, ...(r.stories ?? [])]);
  const items: NewsItem[] = [];
  for (const r of flat) {
    if (!r.title || !r.link) continue;
    let url: URL;
    try {
      url = new URL(r.link);
    } catch {
      continue;
    }
    if (!/^https?:$/.test(url.protocol)) continue; // never store javascript:/data: links
    items.push({
      title: r.title.trim(),
      link: url.toString(),
      publisher: (typeof r.source === 'string' ? r.source : r.source?.name)?.trim() || 'Unknown publisher',
      publishedAt: parseSerpDate(r),
      snippet: r.snippet?.trim() || null,
    });
  }
  return items;
}

/** Searches Google News (India edition) through SerpApi. The API key never leaves this file. */
export async function searchGoogleNews(query: string): Promise<NewsItem[]> {
  if (!env.SERPAPI_API_KEY) {
    throw new AppError(503, 'SerpApi is not configured (set SERPAPI_API_KEY)', 'SERPAPI_NOT_CONFIGURED');
  }
  const cached = cache.get(query);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.items;

  const url = new URL(ENDPOINT);
  url.search = new URLSearchParams({
    engine: 'google_news',
    q: query,
    gl: 'in',
    hl: 'en',
    api_key: env.SERPAPI_API_KEY,
  }).toString();

  let response: Response;
  try {
    response = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch (error) {
    // Do not log `url` or the raw error: both can contain the API key.
    logger.warn({ query, reason: (error as Error).name }, 'SerpApi request failed');
    throw new AppError(502, 'Could not reach SerpApi', 'SERPAPI_UNREACHABLE');
  }

  const body = (await response.json().catch(() => null)) as {
    error?: string;
    news_results?: RawNewsResult[];
  } | null;

  if (!response.ok || body?.error) {
    // SerpApi reports "no results" as an error string; treat that as an empty result set.
    if (/hasn't returned any results/i.test(body?.error ?? '')) return [];
    logger.warn({ query, status: response.status, serpError: body?.error }, 'SerpApi returned an error');
    const status = response.status === 429 ? 429 : 502;
    throw new AppError(status, `SerpApi error: ${body?.error ?? response.status}`, 'SERPAPI_ERROR');
  }

  const items = normaliseResults(body?.news_results ?? []);
  cache.set(query, { at: Date.now(), items });
  return items;
}
