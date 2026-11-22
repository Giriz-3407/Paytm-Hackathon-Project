import type { Prisma, ReplayEvent, ReplayScenario } from '@prisma/client';

export type ScenarioRow = ReplayScenario & { events: ReplayEvent[] };

/** Mirrors `ReplayEvent` in frontend/src/types/domain.ts (payload shape depends on eventType). */
export interface ReplayEventDto {
  id: string;
  scenarioId: string;
  availableAt: string;
  eventType: ReplayEvent['eventType'];
  payload: Prisma.JsonValue;
}

/** Mirrors `ReplayScenario` in frontend/src/types/domain.ts. */
export interface ReplayScenarioDto {
  id: string;
  title: string;
  description: string;
  location: string;
  startTime: string;
  endTime: string;
  events: ReplayEventDto[];
  dataQualityNotes: string;
  evaluation: string;
}

export const toScenarioDto = (row: ScenarioRow): ReplayScenarioDto => ({
  id: row.id,
  title: row.title,
  description: row.description,
  location: row.location,
  startTime: row.startTime.toISOString(),
  endTime: row.endTime.toISOString(),
  dataQualityNotes: row.dataQualityNotes,
  evaluation: row.evaluation,
  events: row.events.map((e) => ({
    id: e.id,
    scenarioId: e.scenarioId,
    availableAt: e.availableAt.toISOString(),
    eventType: e.eventType,
    payload: e.payload,
  })),
});
