/**
 * Loads the demo dataset the frontend ships with (fictional records, snapshot 22 Nov 2026)
 * so the UI works against the API immediately. Safe to re-run: existing rows are kept.
 *
 *   npm run db:seed
 *
 * Optionally creates an ADMIN when SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD are set.
 */
import bcrypt from 'bcrypt';
import { env } from '../config/env';
import { disconnectDatabase, prisma } from './client';
import evidenceData from './seed-data/evidence.json';
import incidentsData from './seed-data/incidents.json';
import replayData from './seed-data/replay-scenarios.json';
import reportsData from './seed-data/reports.json';
import sourcesData from './seed-data/sources.json';
import type { IncidentDto } from '../modules/incidents/incidents.types';
import type { EvidenceDto } from '../modules/evidence/evidence.types';
import type { ReplayScenarioDto } from '../modules/replay/replay.types';
import type { ReportDto } from '../modules/reports/reports.types';
import type { SourceDto } from '../modules/sources/sources.types';

// JSON imports are untyped strings; the DTO types document the expected shape.
const sources = sourcesData as unknown as SourceDto[];
const incidents = incidentsData as unknown as Omit<IncidentDto, 'relatedEvidenceIds' | 'sourceCount'>[];
const evidence = evidenceData as unknown as EvidenceDto[];
const reports = reportsData as unknown as ReportDto[];
const scenarios = replayData as unknown as ReplayScenarioDto[];

const date = (iso: string) => new Date(iso);

async function seedAdmin() {
  const { SEED_ADMIN_EMAIL: email, SEED_ADMIN_PASSWORD: password } = env;
  if (!email || !password) {
    console.log('Skipped admin user (SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD not set).');
    return;
  }
  const passwordHash = await bcrypt.hash(password, env.BCRYPT_ROUNDS);
  await prisma.user.upsert({
    where: { email: email.toLowerCase() },
    update: {},
    create: { email: email.toLowerCase(), name: 'Administrator', passwordHash, role: 'ADMIN' },
  });
  console.log(`Admin user ready: ${email.toLowerCase()}`);
}

async function main() {
  // Order matters: parents before children (foreign keys).
  await prisma.source.createMany({
    skipDuplicates: true,
    data: sources.map((s) => ({
      id: s.id,
      name: s.name,
      type: s.type,
      url: s.url,
      status: s.status,
      enabled: s.enabled,
      frequency: s.frequency,
      reports: s.reports,
      error: s.error,
      lastSync: date(s.lastSync),
      lastAttempt: date(s.lastAttempt),
    })),
  });

  await prisma.incident.createMany({
    skipDuplicates: true,
    data: incidents.map((i) => ({
      id: i.id,
      title: i.title,
      description: i.description,
      category: i.category,
      severity: i.severity,
      evidenceStatus: i.evidenceStatus,
      lifecycleStatus: i.lifecycleStatus,
      city: i.location.city,
      state: i.location.state,
      district: i.location.district,
      latitude: i.coordinates[0],
      longitude: i.coordinates[1],
      firstDetectedAt: date(i.firstDetectedAt),
      lastUpdatedAt: date(i.lastUpdatedAt),
      summary: i.summary,
      mode: i.mode,
    })),
  });

  await prisma.evidence.createMany({
    skipDuplicates: true,
    data: evidence.map((e) => ({
      id: e.id,
      incidentId: e.incidentId,
      sourceId: e.sourceId,
      title: e.title,
      sourceUrl: e.sourceUrl,
      publishedAt: date(e.publishedAt),
      availableAt: date(e.availableAt),
      ingestedAt: date(e.ingestedAt),
      content: e.content,
      verificationStatus: e.verificationStatus,
    })),
  });

  await prisma.report.createMany({
    skipDuplicates: true,
    data: reports.map((r) => ({
      id: r.id,
      incidentId: r.incidentId,
      title: r.title,
      generatedAt: date(r.generatedAt),
      mode: r.mode,
      summary: r.summary,
      findings: r.findings,
      limitations: r.limitations,
      sources: r.sources,
    })),
  });

  await prisma.replayScenario.createMany({
    skipDuplicates: true,
    data: scenarios.map((s) => ({
      id: s.id,
      title: s.title,
      description: s.description,
      location: s.location,
      startTime: date(s.startTime),
      endTime: date(s.endTime),
      dataQualityNotes: s.dataQualityNotes,
      evaluation: s.evaluation,
    })),
  });

  await prisma.replayEvent.createMany({
    skipDuplicates: true,
    data: scenarios.flatMap((s) =>
      s.events.map((e) => ({
        id: e.id,
        scenarioId: s.id,
        availableAt: date(e.availableAt),
        eventType: e.eventType,
        payload: e.payload as object,
      })),
    ),
  });

  console.log(
    `Seeded ${sources.length} sources, ${incidents.length} incidents, ${evidence.length} evidence, ` +
      `${reports.length} reports, ${scenarios.length} replay scenarios.`,
  );
  await seedAdmin();
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(disconnectDatabase);
