/**
 * Loads the reference data the app needs to start: the configured sources, the historical replay
 * scenarios (synthetic training content, labelled as such) and an optional admin user.
 * It loads NO incidents, evidence or reports: those come only from real ingestion.
 * Safe to re-run: existing rows are kept.
 *
 *   npm run db:seed
 */
import bcrypt from 'bcrypt';
import { env } from '../config/env';
import { disconnectDatabase, prisma } from './client';
import replayData from './seed-data/replay-scenarios.json';
import sourcesData from './seed-data/sources.json';
import type { ReplayScenarioDto } from '../modules/replay/replay.types';
import type { SourceDto } from '../modules/sources/sources.types';

// JSON imports are untyped strings; the DTO types document the expected shape.
const sources = sourcesData as unknown as Omit<SourceDto, 'lastSync' | 'lastAttempt'>[];
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
      lastSync: new Date(),
      lastAttempt: new Date(),
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

  console.log(`Seeded ${sources.length} sources and ${scenarios.length} replay scenarios (no incidents: run ingestion for live data).`);
  await seedAdmin();
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(disconnectDatabase);
