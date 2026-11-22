import { logger } from '../../config/logger';
import { searchGoogleNews, type NewsItem } from '../../services/serpapi.service';
import { AppError } from '../../utils/app-error';
import { evidenceRepository } from '../evidence/evidence.repository';
import { evidenceService } from '../evidence/evidence.service';
import { incidentsRepository } from '../incidents/incidents.repository';
import { incidentsService } from '../incidents/incidents.service';
import { sourcesRepository } from '../sources/sources.repository';
import { sourcesService } from '../sources/sources.service';
import { classifyCategory, locateArticle } from './ingestion.classifier';

/** The seeded "News discovery" source that SerpApi results are attributed to. */
export const NEWS_SOURCE_ID = 's1';

const CLUSTER_WINDOW_MS = 72 * 60 * 60 * 1000;
const MAX_ARTICLE_AGE_MS = 7 * 24 * 60 * 60 * 1000;

/** One search per crisis category, India-focused. Each query costs one SerpApi search. */
export const DEFAULT_QUERIES = [
  'India flood',
  'India cyclone',
  'India earthquake',
  'India landslide',
  'India heatwave',
  'India fire accident',
  'India factory blast chemical leak',
  'India heavy rain red alert',
];

export interface IngestionSummary {
  startedAt: string;
  finishedAt: string;
  queries: number;
  queriesFailed: number;
  articlesSeen: number;
  skipped: { duplicate: number; stale: number; notCrisis: number; noLocation: number };
  evidenceAdded: number;
  incidentsCreated: number;
  incidentsUpdated: number;
  errors: { scope: string; message: string }[];
}

let running = false;

/** Only AppErrors carry client-safe messages; anything else (e.g. Prisma) stays in the server log. */
const safeMessage = (error: unknown) =>
  error instanceof AppError ? error.message : 'Unexpected error while processing';

/** Publisher is stored as a "[Name] " prefix on evidence content, since evidence has no publisher column. */
const publisherOf = (content: string) => content.match(/^\[(.+?)\]/)?.[1];

async function collect(queries: string[], errors: IngestionSummary['errors']) {
  const items: NewsItem[] = [];
  let failed = 0;
  for (const query of queries) {
    try {
      items.push(...(await searchGoogleNews(query)));
    } catch (error) {
      failed++;
      logger.warn({ query, err: (error as Error).message }, 'Query failed');
      errors.push({ scope: `query:${query}`, message: safeMessage(error) });
    }
  }
  return { items, failed };
}

export const ingestionService = {
  isRunning: () => running,

  /**
   * Pipeline (PRD §5, rule-based variant): fetch → drop duplicates/stale → classify →
   * geolocate → cluster by category + state → store evidence → raise confidence only when
   * independent publishers agree. Severity is never guessed; new incidents are `Unknown`.
   */
  async run(queries: string[] = DEFAULT_QUERIES): Promise<IngestionSummary> {
    // The enable/disable switch on the Sources page must actually stop collection.
    const source = await sourcesRepository.findById(NEWS_SOURCE_ID);
    if (!source) throw AppError.notFound('News source is not configured (run: npm run db:seed)');
    if (!source.enabled) {
      throw AppError.conflict('The News discovery source is disabled. Enable it on the Sources page.');
    }
    if (running) throw AppError.conflict('An ingestion run is already in progress');
    running = true;
    const startedAt = new Date();
    const errors: IngestionSummary['errors'] = [];
    const summary: IngestionSummary = {
      startedAt: startedAt.toISOString(),
      finishedAt: '',
      queries: queries.length,
      queriesFailed: 0,
      articlesSeen: 0,
      skipped: { duplicate: 0, stale: 0, notCrisis: 0, noLocation: 0 },
      evidenceAdded: 0,
      incidentsCreated: 0,
      incidentsUpdated: 0,
      errors,
    };

    try {
      const { items, failed } = await collect(queries, errors);
      summary.queriesFailed = failed;

      // Same article can match several queries.
      const unique = [...new Map(items.map((i) => [i.link, i])).values()];
      summary.articlesSeen = unique.length;
      const known = await evidenceRepository.findExistingUrls(unique.map((i) => i.link));

      const touched = new Map<string, string>(); // incidentId -> current evidenceStatus
      for (const item of unique) {
        if (known.has(item.link) || item.link.length > 2048) {
          summary.skipped.duplicate++;
          continue;
        }
        if (item.publishedAt && Date.now() - item.publishedAt.getTime() > MAX_ARTICLE_AGE_MS) {
          summary.skipped.stale++;
          continue;
        }
        const text = `${item.title} ${item.snippet ?? ''}`;
        const category = classifyCategory(text);
        if (!category) {
          summary.skipped.notCrisis++;
          continue;
        }
        const place = locateArticle(item.title);
        if (!place) {
          summary.skipped.noLocation++;
          continue;
        }

        try {
          const publishedAt = item.publishedAt ?? new Date();
          const incident = await incidentsRepository.findClusterCandidate({
            category,
            state: place.state,
            since: new Date(Date.now() - CLUSTER_WINDOW_MS),
          });
          let incidentId = incident?.id;
          let status: string = incident?.evidenceStatus ?? 'Unverified';

          if (!incidentId) {
            const created = await incidentsService.create(
              {
                title: item.title.slice(0, 200),
                description:
                  'Candidate incident detected automatically from news reports. Not verified; ' +
                  'severity and impact are unknown. Coordinates are a reference point for the named place, not an impact area.',
                category,
                severity: 'Unknown',
                evidenceStatus: 'Unverified',
                lifecycleStatus: 'Monitoring',
                location: { city: place.city, state: place.state, district: place.district },
                coordinates: place.coordinates,
                summary: (item.snippet ?? item.title).slice(0, 2000),
                firstDetectedAt: publishedAt.toISOString(),
              },
              { idPrefix: 'LV' },
            );
            incidentId = created.id;
            status = created.evidenceStatus;
            summary.incidentsCreated++;
          } else {
            summary.incidentsUpdated++;
          }

          await evidenceService.addToIncident(incidentId, {
            sourceId: NEWS_SOURCE_ID,
            title: item.title.slice(0, 300),
            sourceUrl: item.link,
            publishedAt: publishedAt.toISOString(),
            content: `[${item.publisher}] ${item.snippet ?? item.title}`.slice(0, 10_000),
            verificationStatus: 'Unverified',
          });
          summary.evidenceAdded++;
          touched.set(incidentId, status);
        } catch (error) {
          logger.error({ err: error, link: item.link }, 'Failed to ingest article');
          errors.push({ scope: `article:${item.link.slice(0, 80)}`, message: safeMessage(error) });
        }
      }

      // Corroboration rule: two or more distinct publishers move an incident to "Developing".
      // It never becomes "Corroborated" automatically; that needs a human or an official source.
      for (const [incidentId, status] of touched) {
        if (status !== 'Unverified') continue;
        const evidence = await evidenceRepository.listByIncident(incidentId);
        const publishers = new Set(evidence.map((e) => publisherOf(e.content)).filter(Boolean));
        if (publishers.size >= 2) {
          await incidentsService.update(incidentId, { evidenceStatus: 'Developing' });
        }
      }

      const allFailed = failed === queries.length;
      await sourcesService.recordCollection(NEWS_SOURCE_ID, {
        ok: !allFailed,
        partial: failed > 0 && !allFailed,
        error: errors[0]?.message ?? null,
      });
    } finally {
      running = false;
      summary.finishedAt = new Date().toISOString();
      logger.info(
        {
          articlesSeen: summary.articlesSeen,
          evidenceAdded: summary.evidenceAdded,
          incidentsCreated: summary.incidentsCreated,
          queriesFailed: summary.queriesFailed,
        },
        'Ingestion run finished',
      );
    }
    return summary;
  },
};
