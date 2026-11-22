import type { Prisma } from '@prisma/client';
import { prisma } from '../../database/client';
import type { ScenarioRow } from './replay.types';

const withEvents = {
  events: { orderBy: [{ availableAt: 'asc' }, { id: 'asc' }] },
} satisfies Prisma.ReplayScenarioInclude;

export const replayRepository = {
  listScenarios(): Promise<ScenarioRow[]> {
    return prisma.replayScenario.findMany({ include: withEvents, orderBy: { startTime: 'desc' } });
  },

  /** When `asOf` is given, events after it are excluded in the query itself. */
  findScenario(id: string, asOf?: Date): Promise<ScenarioRow | null> {
    return prisma.replayScenario.findUnique({
      where: { id },
      include: {
        events: {
          where: asOf ? { availableAt: { lte: asOf } } : undefined,
          orderBy: [{ availableAt: 'asc' }, { id: 'asc' }],
        },
      },
    });
  },
};
