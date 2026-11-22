import type { Server as HttpServer } from 'node:http';
import { Server } from 'socket.io';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { SOCKET_EVENTS } from '../constants';
import type { IncidentDto } from '../modules/incidents/incidents.types';
import type { EvidenceDto } from '../modules/evidence/evidence.types';
import type { SourceDto } from '../modules/sources/sources.types';

let io: Server | null = null;

/** Attaches Socket.IO to the HTTP server. CORS mirrors the REST API's allowlist. */
export function initRealtime(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: { origin: env.corsOrigins, methods: ['GET', 'POST'] },
  });
  io.on('connection', (socket) => {
    logger.debug({ socketId: socket.id }, 'Realtime client connected');
    socket.on('disconnect', () => logger.debug({ socketId: socket.id }, 'Realtime client disconnected'));
  });
  return io;
}

export async function closeRealtime(): Promise<void> {
  if (!io) return;
  await io.close();
  io = null;
}

/**
 * Publishers used by services. They are no-ops until `initRealtime` has run,
 * which keeps services usable in scripts and unit tests.
 */
export const realtime = {
  incidentCreated: (incident: IncidentDto) => io?.emit(SOCKET_EVENTS.INCIDENT_CREATED, incident),
  incidentUpdated: (incident: IncidentDto) => io?.emit(SOCKET_EVENTS.INCIDENT_UPDATED, incident),
  incidentResolved: (incident: IncidentDto) => io?.emit(SOCKET_EVENTS.INCIDENT_RESOLVED, incident),
  evidenceAdded: (evidence: EvidenceDto) => io?.emit(SOCKET_EVENTS.EVIDENCE_ADDED, evidence),
  sourceHealth: (source: SourceDto) => io?.emit(SOCKET_EVENTS.SOURCE_HEALTH, source),
};
