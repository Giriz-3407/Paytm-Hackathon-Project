import {
  Evidence,
  GeocodeResult,
  Incident,
  IncidentFilters,
  ReplayScenario,
  Source,
} from '@/types/domain';
import { filterIncidents } from '@/features/incidents/filter';
export interface IncidentRepository {
  list(filters?: IncidentFilters): Promise<Incident[]>;
  getById(id: string): Promise<Incident | null>;
  evidence(id: string): Promise<Evidence[]>;
}
export interface ReplayRepository {
  listScenarios(): Promise<ReplayScenario[]>;
  getScenario(id: string): Promise<ReplayScenario | null>;
}
class ApiError extends Error {
  constructor(public status: number) {
    super(`Request failed (${status}). Check the API connection.`);
  }
}
/** Backend base URL, including the /api/v1 prefix. Public, so it must never contain a secret. */
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
/** Backend responses are wrapped as `{ success, message, data, meta }`; callers get `data`. */
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, init);
  if (!response.ok) throw new ApiError(response.status);
  return ((await response.json()) as { data: T }).data;
}
/** The repository contracts return `null` for a missing record; the API answers 404. */
async function requestOrNull<T>(path: string, init?: RequestInit): Promise<T | null> {
  try {
    return await request<T>(path, init);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}
// The UI filters client-side, so ask for the largest page the API allows.
const ALL = 'pageSize=200';
export const incidentsRepository: IncidentRepository = {
  list: async (f) => filterIncidents(await request<Incident[]>(`/incidents?${ALL}`), f),
  getById: (id) => requestOrNull(`/incidents/${encodeURIComponent(id)}`),
  evidence: (id) => request(`/incidents/${encodeURIComponent(id)}/evidence`),
};
export const replayRepository: ReplayRepository = {
  listScenarios: () => request('/replay/scenarios'),
  getScenario: (id) => requestOrNull(`/replay/scenarios/${encodeURIComponent(id)}`),
};
export const sourcesRepository = {
  list: (): Promise<Source[]> => request('/sources'),
  setEnabled: (id: string, enabled: boolean): Promise<Source | null> =>
    requestOrNull(`/sources/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled }),
    }),
};
/** Place search through the backend's OpenStreetMap (Nominatim) proxy. */
export const geocodeRepository = {
  search: (q: string): Promise<GeocodeResult[]> =>
    request(`/geocode/search?q=${encodeURIComponent(q)}`),
};
