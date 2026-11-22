import { io, Socket } from 'socket.io-client';
import { Incident, Evidence, Source } from '@/types/domain';
export interface ServerEvents {
  'incident:created': (incident: Incident) => void;
  'incident:updated': (incident: Incident) => void;
  'incident:resolved': (incident: Incident) => void;
  'evidence:added': (evidence: Evidence) => void;
  'source:health': (source: Source) => void;
}
/** No socket connection is opened in demo mode. Consumer owns subscribe/unsubscribe. */
export function createRealtimeClient(): Socket<ServerEvents> | null {
  return process.env.NEXT_PUBLIC_DATA_MODE === 'api' && process.env.NEXT_PUBLIC_SOCKET_URL
    ? io(process.env.NEXT_PUBLIC_SOCKET_URL, { autoConnect: false, reconnection: true })
    : null;
}
