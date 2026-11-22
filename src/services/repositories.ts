import {
  Evidence,
  Incident,
  IncidentFilters,
  IntelligenceReport,
  ReplayScenario,
  Source,
} from '@/types/domain';
import { mockEvidence, mockIncidents, mockReports, mockSources } from '@/data/mock-data';
import { replayScenarios } from '@/data/replay-scenarios';
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
export interface ReportRepository {
  list(): Promise<IntelligenceReport[]>;
  getById(id: string): Promise<IntelligenceReport | null>;
}
const demo = async <T>(data: T): Promise<T> => {
  await new Promise((r) => setTimeout(r, 250));
  return structuredClone(data);
};
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || '/api'}${path}`, init);
  if (!response.ok)
    throw new Error(`Request failed (${response.status}). Check the API connection.`);
  return response.json() as Promise<T>;
}
export const dataMode = process.env.NEXT_PUBLIC_DATA_MODE === 'api' ? 'api' : 'mock';
export const incidentsRepository: IncidentRepository =
  dataMode === 'api'
    ? {
        list: async (f) => filterIncidents(await request<Incident[]>('/incidents'), f),
        getById: (id) => request(`/incidents/${encodeURIComponent(id)}`),
        evidence: (id) => request(`/incidents/${encodeURIComponent(id)}/evidence`),
      }
    : {
        list: (f) => demo(filterIncidents(mockIncidents, f)),
        getById: (id) => demo(mockIncidents.find((i) => i.id === id) || null),
        evidence: (id) => demo(mockEvidence.filter((e) => e.incidentId === id)),
      };
export const replayRepository: ReplayRepository =
  dataMode === 'api'
    ? {
        listScenarios: () => request('/replay/scenarios'),
        getScenario: (id) => request(`/replay/scenarios/${encodeURIComponent(id)}`),
      }
    : {
        listScenarios: () => demo(replayScenarios),
        getScenario: (id) => demo(replayScenarios.find((s) => s.id === id) || null),
      };
export const reportsRepository: ReportRepository =
  dataMode === 'api'
    ? {
        list: () => request('/reports'),
        getById: (id) => request(`/reports/${encodeURIComponent(id)}`),
      }
    : {
        list: () => demo(mockReports),
        getById: (id) => demo(mockReports.find((r) => r.id === id) || null),
      };
const sourceOverrides = new Map<string, boolean>();
export const sourcesRepository = {
  list: (): Promise<Source[]> =>
    dataMode === 'api'
      ? request('/sources')
      : demo(mockSources.map((s) => ({ ...s, enabled: sourceOverrides.get(s.id) ?? s.enabled }))),
  setEnabled: (id: string, enabled: boolean): Promise<Source | null> => {
    if (dataMode === 'api')
      return request(`/sources/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      });
    sourceOverrides.set(id, enabled);
    const source = mockSources.find((s) => s.id === id);
    return demo(source ? { ...source, enabled } : null);
  },
};
