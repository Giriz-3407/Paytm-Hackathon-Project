import { io, Socket } from 'socket.io-client';
import { Incident, Evidence, Source } from '@/types/domain';
export interface ServerEvents {
  'incident:created': (incident: Incident) => void;
  'incident:updated': (incident: Incident) => void;
  'incident:resolved': (incident: Incident) => void;
  'evidence:added': (evidence: Evidence) => void;
  'source:health': (source: Source) => void;
}
/** Connects to the backend's Socket.IO server. Consumer owns subscribe/unsubscribe. */
export function createRealtimeClient(): Socket<ServerEvents> {
  return io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000', {
    autoConnect: false,
    reconnection: true,
  });
}
