export const API_PREFIX = '/api/v1';

/** Mirrors `categories` in frontend/src/types/domain.ts. */
export const CATEGORIES = [
  'Flood',
  'Cyclone',
  'Earthquake',
  'Landslide',
  'Heatwave',
  'Fire',
  'Severe weather',
  'Industrial',
] as const;

/** Mirrors `Source['type']` in frontend/src/types/domain.ts. */
export const SOURCE_TYPES = [
  'News discovery',
  'Official alerts',
  'Weather bulletins',
  'Historical datasets',
] as const;

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 50,
  MAX_PAGE_SIZE: 200,
} as const;

/** Realtime event names; must stay in sync with frontend/src/lib/realtime/socket-client.ts. */
export const SOCKET_EVENTS = {
  INCIDENT_CREATED: 'incident:created',
  INCIDENT_UPDATED: 'incident:updated',
  INCIDENT_RESOLVED: 'incident:resolved',
  EVIDENCE_ADDED: 'evidence:added',
  SOURCE_HEALTH: 'source:health',
} as const;

export const REQUEST_ID_HEADER = 'x-request-id';
