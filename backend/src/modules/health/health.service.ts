import { healthRepository } from './health.repository';

export interface HealthReport {
  status: 'ok' | 'degraded';
  uptimeSeconds: number;
  timestamp: string;
  checks: { database: 'up' | 'down' };
}

export const healthService = {
  async check(): Promise<HealthReport> {
    const databaseUp = await healthRepository.pingDatabase();
    return {
      status: databaseUp ? 'ok' : 'degraded',
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
      checks: { database: databaseUp ? 'up' : 'down' },
    };
  },
};
