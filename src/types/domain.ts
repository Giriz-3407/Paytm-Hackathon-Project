export const categories = [
  'Flood',
  'Cyclone',
  'Earthquake',
  'Landslide',
  'Heatwave',
  'Fire',
  'Severe weather',
  'Industrial',
] as const;
export type Category = (typeof categories)[number];
export const severities = ['Critical', 'High', 'Medium', 'Low', 'Unknown'] as const;
export type Severity = (typeof severities)[number];
export type EvidenceStatus = 'Corroborated' | 'Developing' | 'Unverified';
export type Mode = 'demo' | 'replay';
export interface Incident {
  id: string;
  title: string;
  description: string;
  category: Category;
  severity: Severity;
  evidenceStatus: EvidenceStatus;
  lifecycleStatus: 'Active' | 'Monitoring' | 'Resolved';
  location: { city: string; state: string; district: string };
  coordinates: [number, number];
  firstDetectedAt: string;
  lastUpdatedAt: string;
  sourceCount: number;
  summary: string;
  relatedEvidenceIds: string[];
  mode: Mode;
}
export interface Evidence {
  id: string;
  incidentId: string;
  sourceId: string;
  title: string;
  sourceUrl: string | null;
  publishedAt: string;
  availableAt: string;
  ingestedAt: string;
  content: string;
  verificationStatus: EvidenceStatus;
}
export interface Alert {
  id: string;
  incidentId: string;
  title: string;
  message: string;
  severity: Severity;
  alertType: 'escalation' | 'new';
  createdAt: string;
  acknowledgedAt: string | null;
  status: 'active' | 'acknowledged';
}
export interface Source {
  id: string;
  name: string;
  type: 'News discovery' | 'Official alerts' | 'Weather bulletins' | 'Historical datasets';
  url: string;
  status: 'Healthy' | 'Delayed' | 'Offline';
  enabled: boolean;
  lastSync: string;
  lastAttempt: string;
  frequency: string;
  reports: number;
  error: string | null;
}
export interface ReplayReport extends Evidence {
  category: Category;
  location: Incident['location'];
  relatedIncidentId: string;
}
export type ReplayEvent = { id: string; scenarioId: string; availableAt: string } & (
  | { eventType: 'incident'; payload: Incident }
  | {
      eventType: 'update';
      payload: {
        incidentId: string;
        severity: Severity;
        summary: string;
        evidenceStatus: EvidenceStatus;
        lifecycleStatus?: Incident['lifecycleStatus'];
      };
    }
  | { eventType: 'evidence'; payload: ReplayReport }
);
export interface ReplayScenario {
  id: string;
  title: string;
  description: string;
  location: string;
  startTime: string;
  endTime: string;
  events: ReplayEvent[];
  dataQualityNotes: string;
  evaluation: string;
}
export interface IncidentFilters {
  search?: string;
  categories?: string[];
  severities?: string[];
  evidence?: string;
  state?: string;
  district?: string;
  from?: string;
  to?: string;
  sort?: 'newest' | 'severity' | 'updated';
  sourceId?: string;
}
