import { test as base, expect } from '@playwright/test';
import { mockEvidence, mockIncidents, mockSources } from '../fixtures/mock-data';
import { replayScenarios } from '../fixtures/replay-scenarios';

/**
 * The app ships no demo data: it only talks to the backend. These browser tests stay
 * deterministic (and need no backend, database or SerpApi quota) by answering the backend's
 * API calls with the fictional records in tests/fixtures. They are test-only and never bundled.
 */
const API = 'http://localhost:5000/api/v1';
const cors = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': '*',
  'access-control-allow-methods': 'GET,POST,PATCH,OPTIONS',
};

export const test = base.extend({
  page: async ({ page }, runTest) => {
    const sources = structuredClone(mockSources);
    const send = (route: import('@playwright/test').Route, data: unknown, status = 200) =>
      route.fulfill({
        status,
        headers: { ...cors, 'content-type': 'application/json' },
        body: JSON.stringify(
          status < 400
            ? { success: true, message: 'ok', data, meta: null }
            : { success: false, message: 'Not found', error: { code: 'NOT_FOUND' } },
        ),
      });

    await page.route('**/socket.io/**', (route) => route.abort());
    await page.route(`${API}/**`, async (route) => {
      const request = route.request();
      if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
      const path = new URL(request.url()).pathname.replace('/api/v1', '');
      const [, collection, id, child] = path.split('/');

      if (collection === 'incidents' && !id) return send(route, mockIncidents);
      if (collection === 'incidents' && id && child === 'evidence') {
        return send(
          route,
          mockEvidence.filter((e) => e.incidentId === id),
        );
      }
      if (collection === 'incidents' && id) {
        const found = mockIncidents.find((i) => i.id === id);
        return found ? send(route, found) : send(route, null, 404);
      }
      if (collection === 'sources' && !id) return send(route, sources);
      if (collection === 'sources' && id && request.method() === 'PATCH') {
        const source = sources.find((s) => s.id === id);
        if (!source) return send(route, null, 404);
        source.enabled = (request.postDataJSON() as { enabled: boolean }).enabled;
        return send(route, source);
      }
      if (collection === 'replay' && id === 'scenarios' && !child)
        return send(route, replayScenarios);
      if (collection === 'geocode') return send(route, []);
      return send(route, null, 404);
    });
    await runTest(page);
  },
});

export { expect };
