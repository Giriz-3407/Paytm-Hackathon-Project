import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeIncidentRow } from '../fixtures';

vi.mock('../../src/services/serpapi.service', () => ({ searchGoogleNews: vi.fn() }));
vi.mock('../../src/modules/evidence/evidence.repository', () => ({
  evidenceRepository: { findExistingUrls: vi.fn(), listByIncident: vi.fn() },
}));
vi.mock('../../src/modules/evidence/evidence.service', () => ({
  evidenceService: { addToIncident: vi.fn() },
}));
vi.mock('../../src/modules/incidents/incidents.repository', () => ({
  incidentsRepository: { findClusterCandidate: vi.fn() },
}));
vi.mock('../../src/modules/incidents/incidents.service', () => ({
  incidentsService: { create: vi.fn(), update: vi.fn() },
}));
vi.mock('../../src/modules/sources/sources.service', () => ({
  sourcesService: { recordCollection: vi.fn() },
}));

import { classifyCategory, locateArticle, locatePlace } from '../../src/modules/ingestion/ingestion.classifier';
import { ingestionService } from '../../src/modules/ingestion/ingestion.service';
import { evidenceRepository } from '../../src/modules/evidence/evidence.repository';
import { evidenceService } from '../../src/modules/evidence/evidence.service';
import { incidentsRepository } from '../../src/modules/incidents/incidents.repository';
import { incidentsService } from '../../src/modules/incidents/incidents.service';
import { sourcesService } from '../../src/modules/sources/sources.service';
import { AppError } from '../../src/utils/app-error';
import { searchGoogleNews } from '../../src/services/serpapi.service';


describe('classifyCategory', () => {
  it.each([
    ['Heavy flooding hits Guwahati as Brahmaputra swells', 'Flood'],
    ['Cyclone Dana makes landfall in Odisha', 'Cyclone'],
    ['Magnitude 5.2 earthquake jolts Assam', 'Earthquake'],
    ['Landslide blocks Badrinath highway', 'Landslide'],
    ['Heatwave grips Rajasthan; red alert issued', 'Heatwave'],
    ['Massive fire broke out at godown in Surat', 'Fire'],
    ['Factory blast kills three near Pune', 'Industrial'],
    ['IMD issues orange alert for heavy rainfall in Kerala', 'Severe weather'],
  ])('%s -> %s', (text, expected) => {
    expect(classifyCategory(text)).toBe(expected);
  });

  it('ignores retrospective headlines and tiny tremors', () => {
    expect(classifyCategory('Gujarat CM recalls how organisation helped quake-hit Kutch')).toBeNull();
    expect(classifyCategory('Weak mag. 2.4 earthquake - 1 km south of Alandi, Pune')).toBeNull();
    expect(classifyCategory('2.8 magnitude earthquake hits Shimla')).toBeNull();
    expect(classifyCategory('Magnitude 5.2 earthquake jolts Assam')).toBe('Earthquake');
    expect(classifyCategory('A 4.1-magnitude earthquake hits Imphal')).toBe('Earthquake');
    expect(classifyCategory('Earthquake of unknown size reported')).toBe('Earthquake');
  });

  it('ignores headlines that are not crisis reports', () => {
    expect(classifyCategory('Sensex rallies as IT stocks surge')).toBeNull();
    expect(classifyCategory('Flood of investments expected, says minister')).not.toBe('Earthquake');
  });
});

describe('locatePlace', () => {
  it('prefers a named city and keeps it at city precision', () => {
    expect(locatePlace('Waterlogging in Bengaluru after rain')).toMatchObject({
      city: 'Bengaluru',
      state: 'Karnataka',
      precision: 'city',
    });
  });

  it('understands aliases', () => {
    expect(locatePlace('Bombay rains disrupt trains')?.city).toBe('Mumbai');
  });

  it('labels state-only matches as state-level instead of faking a city pin', () => {
    const place = locatePlace('Floods in Assam affect lakhs');
    expect(place).toMatchObject({ state: 'Assam', precision: 'state', city: 'Assam (state-level)' });
  });

  it('uses the place mentioned first, not the first one in the gazetteer', () => {
    expect(locatePlace('IMD red alert in Odisha, rain also in Bihar')?.state).toBe('Odisha');
    expect(locatePlace('Rain in Bihar and Kolkata')?.state).toBe('Bihar');
  });

  it('takes the place from the headline only and never borrows one from the snippet', () => {
    expect(locateArticle('Light quake near Ukhrul in Manipur')?.state).toBe('Manipur');
    expect(locateArticle('Moderate quake near Sundargarh')).toBeNull();
  });

  it('does not mistake a timezone label for a place', () => {
    expect(locatePlace('Moderate mag. 4.2 earthquake - Sundargarh, on Friday, 05:54 pm (Kolkata time)')).toBeNull();
    expect(locatePlace('Quake in Kolkata at 5 pm (Kolkata time)')?.city).toBe('Kolkata');
  });

  it('returns null rather than guessing', () => {
    expect(locatePlace('Floods hit parts of the country')).toBeNull();
  });

  it('does not match inside longer words', () => {
    expect(locatePlace('Pune-based startup')?.city).toBe('Pune');
    expect(locatePlace('Goalkeeper saves penalty')).toBeNull();
  });
});

describe('ingestionService.run', () => {
  const article = (over: Record<string, unknown> = {}) => ({
    title: 'Flooding in Guwahati displaces hundreds',
    link: 'https://news.example/a',
    publisher: 'Example Times',
    publishedAt: new Date(),
    snippet: 'Rivers are in spate.',
    ...over,
  });

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(evidenceRepository.findExistingUrls).mockResolvedValue(new Set());
    vi.mocked(incidentsRepository.findClusterCandidate).mockResolvedValue(null);
    vi.mocked(evidenceRepository.listByIncident).mockResolvedValue([]);
    vi.mocked(incidentsService.create).mockResolvedValue({
      id: 'LV-1',
      evidenceStatus: 'Unverified',
    } as never);
  });

  it('creates an unverified, severity-unknown live incident for a new crisis article', async () => {
    vi.mocked(searchGoogleNews).mockResolvedValue([article()]);

    const summary = await ingestionService.run(['India flood']);

    expect(summary).toMatchObject({ incidentsCreated: 1, evidenceAdded: 1 });
    const [input, options] = vi.mocked(incidentsService.create).mock.calls[0]!;
    expect(input).toMatchObject({
      category: 'Flood',
      severity: 'Unknown',
      evidenceStatus: 'Unverified',
      lifecycleStatus: 'Monitoring',
      location: { state: 'Assam' },
    });
    expect(options).toEqual({ mode: 'live', idPrefix: 'LV' });
    expect(evidenceService.addToIncident).toHaveBeenCalledWith(
      'LV-1',
      expect.objectContaining({ sourceUrl: 'https://news.example/a', verificationStatus: 'Unverified' }),
    );
    expect(sourcesService.recordCollection).toHaveBeenCalledWith('s1', {
      ok: true,
      partial: false,
      error: null,
    });
  });

  it('clusters into an existing incident instead of creating a duplicate', async () => {
    vi.mocked(searchGoogleNews).mockResolvedValue([article()]);
    vi.mocked(incidentsRepository.findClusterCandidate).mockResolvedValue(
      makeIncidentRow({ id: 'LV-9', evidenceStatus: 'Unverified' }),
    );

    const summary = await ingestionService.run(['India flood']);

    expect(incidentsService.create).not.toHaveBeenCalled();
    expect(summary).toMatchObject({ incidentsCreated: 0, incidentsUpdated: 1, evidenceAdded: 1 });
  });

  it('skips known URLs, non-crisis headlines, unlocatable stories and stale articles', async () => {
    vi.mocked(searchGoogleNews).mockResolvedValue([
      article({ link: 'https://news.example/known' }),
      article({ link: 'https://news.example/biz', title: 'Sensex rallies', snippet: null }),
      article({ link: 'https://news.example/where', title: 'Floods hit the country', snippet: null }),
      article({ link: 'https://news.example/old', publishedAt: new Date('2020-01-01') }),
    ]);
    vi.mocked(evidenceRepository.findExistingUrls).mockResolvedValue(new Set(['https://news.example/known']));

    const summary = await ingestionService.run(['q']);

    expect(summary.skipped).toEqual({ duplicate: 1, notCrisis: 1, noLocation: 1, stale: 1 });
    expect(summary.evidenceAdded).toBe(0);
  });

  it('upgrades to Developing only when two distinct publishers agree', async () => {
    vi.mocked(searchGoogleNews).mockResolvedValue([article()]);
    vi.mocked(evidenceRepository.listByIncident).mockResolvedValue([
      { content: '[Example Times] a' },
      { content: '[Another Daily] b' },
    ] as never);

    await ingestionService.run(['q']);

    expect(incidentsService.update).toHaveBeenCalledWith('LV-1', { evidenceStatus: 'Developing' });
  });

  it('does not upgrade when every report is from one publisher', async () => {
    vi.mocked(searchGoogleNews).mockResolvedValue([article()]);
    vi.mocked(evidenceRepository.listByIncident).mockResolvedValue([
      { content: '[Example Times] a' },
      { content: '[Example Times] b' },
    ] as never);

    await ingestionService.run(['q']);

    expect(incidentsService.update).not.toHaveBeenCalled();
  });

  it('marks the source Offline when every query fails, and reports the errors', async () => {
    vi.mocked(searchGoogleNews).mockRejectedValue(new AppError(429, 'SerpApi error: quota', 'SERPAPI_ERROR'));

    const summary = await ingestionService.run(['a', 'b']);

    expect(summary.queriesFailed).toBe(2);
    expect(summary.errors[0]!.message).toMatch(/quota/);
    expect(sourcesService.recordCollection).toHaveBeenCalledWith('s1', {
      ok: false,
      partial: false,
      error: 'SerpApi error: quota',
    });
  });

  it('refuses to run twice concurrently', async () => {
    let release!: () => void;
    vi.mocked(searchGoogleNews).mockReturnValue(new Promise((r) => (release = () => r([]))));
    const first = ingestionService.run(['q']);
    await expect(ingestionService.run(['q'])).rejects.toMatchObject({ statusCode: 409 });
    release();
    await first;
  });
});

describe('ingestion error handling', () => {
  it('never exposes internal (non-AppError) failure details in the summary or source health', async () => {
    vi.resetAllMocks();
    vi.mocked(evidenceRepository.findExistingUrls).mockResolvedValue(new Set());
    vi.mocked(evidenceRepository.listByIncident).mockResolvedValue([]);
    vi.mocked(incidentsRepository.findClusterCandidate).mockResolvedValue(null);
    vi.mocked(searchGoogleNews).mockResolvedValue([
      {
        title: 'Flooding in Guwahati displaces hundreds',
        link: 'https://news.example/z',
        publisher: 'P',
        publishedAt: new Date(),
        snippet: null,
      },
    ]);
    vi.mocked(incidentsService.create).mockRejectedValue(new Error('prisma: secret table detail'));

    const summary = await ingestionService.run(['q']);

    expect(JSON.stringify(summary)).not.toContain('secret table detail');
    expect(summary.errors[0]!.message).toBe('Unexpected error while processing');
  });
});
