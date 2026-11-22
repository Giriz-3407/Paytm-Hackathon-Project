# Crisis Lens

A complete Next.js frontend for crisis situational awareness across India, with a map, incident investigation, analytics, reports, source management, and an interactive historical replay engine.

**This is a demo, not an emergency warning system.** All 18 monitoring incidents, their evidence, source health, and analytics are illustrative. The snapshot is fixed at **22 November 2026, 12:00 IST**. Historical scenario names provide context; their event content and precise timestamps are synthetic. No live ingestion or AI model is connected.

## Setup

Use Node.js 22.13+ (or a newer supported LTS release) and npm.

```sh
npm install
cp .env.example .env.local
npm run dev
```

On Windows PowerShell, use `npm.cmd` if execution policy blocks `npm.ps1`, and use `Copy-Item .env.example .env.local` to copy the configuration. Open **http://localhost:3000**. The root opens your saved default view, initially `/dashboard`.

```sh
npm run typecheck
npm run lint
npm test
npm run build
npm start
npm run test:e2e
```

The Playwright configuration uses locally installed Google Chrome (`channel: 'chrome'`). To use bundled Chromium instead, remove that setting and run `npx playwright install chromium`. Tests start the production server automatically when one is not already running, so run `npm run build` first. The production server is reused when available.

## Stack

Next.js 16 App Router, React 19, strict TypeScript, Tailwind CSS 4, shadcn-style component primitives built on Radix UI, Lucide, TanStack Query, Zustand, React Hook Form with Zod, React Leaflet 5 / Leaflet / react-leaflet-cluster 4, Recharts, date-fns, Socket.IO client, Vitest, React Testing Library, and Playwright. The Inter font is bundled locally; no Google Fonts request is needed.

## Routes

| Route                     | Purpose                                                                                                             |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `/dashboard`              | Date-filtered metrics, map, recent incidents, severity/category charts, acknowledgable demo alerts, source health   |
| `/monitoring`             | Search, category/severity/evidence/state/district/date filters, sorting, split-view investigation, connection state |
| `/map`                    | India map with clustered severity markers, preview, filters, map/list toggle, reset and expanded view               |
| `/incidents`              | Table/cards, multi-category/severity filters, sorting, row selection, visible columns, pagination, filtered CSV     |
| `/incidents/[incidentId]` | Overview, timeline, evidence, illustrative analysis, history, report generation                                     |
| `/replay`                 | Scenario selection, date/time, accurate virtual clock, playback, speed, seek, state reconstruction, evidence feed   |
| `/analytics`              | Shared filters, detection trend, category/severity/state/source/evidence/lifecycle distributions                    |
| `/reports`                | Search/category/date/incident filters, local report generation, viewing, browser print/PDF                          |
| `/sources`                | Simulated source health, ingestion history, errors, session-local enable/disable                                    |
| `/settings`               | Persisted general, theme, sidebar, monitoring, and notification preferences                                         |
| `/help`                   | Onboarding, data semantics, limitations, links to official information                                              |

## Architecture

```
src/app/                 App Router routes, root layout and error/loading boundaries
src/components/layout/   Shared shell, desktop/mobile navigation and global search
src/components/ui/       Accessible, reusable Radix/shadcn-style primitives
src/components/shared/   Filters, incident cards/badges, headers and feedback states
src/features/            Dashboard, incidents, map, replay, analytics, reports, sources, settings, help
src/features/replay/engine/  Pure clock and deterministic event reconstruction
src/services/            Repository contracts, mock/API adapters, TanStack Query hooks
src/types/               Shared domain contracts and discriminated replay event union
src/data/                Deterministic demo records and synthetic scenario definitions
src/lib/realtime/        Typed Socket.IO adapter and query-cache subscriptions
src/stores/              Persisted UI preferences
tests/                   Unit, component and essential browser tests
```

Routes compose feature components. Features share contracts and repository hooks rather than importing incident arrays directly. Repository interfaces and adapters are intentionally colocated in one small module until backend complexity warrants splitting them.

## Environment and backend integration

`NEXT_PUBLIC_DATA_MODE=mock` is the default. Set it to `api`, configure `NEXT_PUBLIC_API_URL`, and optionally set `NEXT_PUBLIC_SOCKET_URL` to use an actual backend. Public environment variables are bundled at build time; rebuild after changing them. Never put secrets in `NEXT_PUBLIC_*` variables.

The API adapter expects JSON with the shapes in `src/types/domain.ts`:

| Method | Endpoint                  | Response                             |
| ------ | ------------------------- | ------------------------------------ |
| GET    | `/incidents`              | `Incident[]`                         |
| GET    | `/incidents/:id`          | `Incident` or `null`                 |
| GET    | `/incidents/:id/evidence` | `Evidence[]`                         |
| GET    | `/replay/scenarios`       | `ReplayScenario[]`                   |
| GET    | `/replay/scenarios/:id`   | `ReplayScenario` or `null`           |
| GET    | `/reports`                | `IntelligenceReport[]`               |
| GET    | `/reports/:id`            | `IntelligenceReport` or `null`       |
| GET    | `/sources`                | `Source[]`                           |
| PATCH  | `/sources/:id`            | `Source`; body `{ "enabled": true }` |

API errors produce visible retry states. Authentication must be provided by the backend; this frontend does not implement fake auth. In production, validate responses at the API boundary and use authenticated same-origin endpoints or an appropriate CORS policy. Current list filtering runs client-side on the loaded collection; move filters/pagination to the repository/API when scaling up.

In API mode the realtime bridge connects and updates TanStack Query caches for `incident:created`, `incident:updated`, `incident:resolved`, `evidence:added`, and `source:health`. It exposes Connected/Reconnecting/Disconnected states, cleans up on unmount, and respects the saved polling interval. In mock mode it never opens a socket. Source toggles are session-local in mock mode; safe UI preferences and generated demo reports persist in localStorage.

Report generation is currently a local template, including in API mode. It must be replaced with a backend report service before operational use. It never calls an AI service or claims live model output.

## Replay architecture

`VirtualClock` uses a monotonic `performance.now()` source and an anchored calculation:

```
virtualTime = anchorVirtual + (realNow - anchorReal) * speed
```

Pause freezes the current timestamp. Resume and speed changes re-anchor without discontinuity. Seeking clamps to scenario bounds; reset returns to the beginning. A 150 ms interval updates only the replay view, while precision stays independent of rendering or timer cadence. The interval and clock clean up on navigation.

`reconstruct(events, virtualTime)` sorts events by availability, rejects duplicate IDs, and rebuilds state from events whose `availableAt <= virtualTime`. Jumping forward releases all eligible events; seeking backward removes future incidents, evidence, severity, and summaries. The original scenario is never mutated. Reports carry publication, availability, and ingestion timestamps separately.

Final Evaluation is explicitly out of band and excluded from the reducer. Scenario outcomes never influence current intelligence. Scenario definitions are loaded through `ReplayRepository`, so a backend can replace the event source without changing the clock or visual components. The two five-hour scenarios contain eight evolving events each.

## Metric definitions and limitations

- Active incidents: Active or Monitoring lifecycle status in the selected range.
- Critical incidents: current Critical severity in the filtered set.
- Regions: distinct states/union territories in the filtered set.
- New in 24 hours: first detection within 24 hours of the fixed snapshot, intersected with the selected range.
- Awaiting verification: Unverified evidence status. Corroborated is a demo label, not proof of real-world verification.
- Source contribution: incidents with illustrative evidence attributed to each configured source.
- Detection latency is explicitly unavailable: the demo has no independently measured occurrence times.
- City-centre coordinates are plausible reference locations, not impact boundaries. OpenStreetMap tiles require network access and retain provider attribution. A bundled public-domain Natural Earth outline preserves geographical context while tiles load or fail; a visible message and list fallback remain available. See src/data/MAP-DATA-LICENSE.md.
- Expanded map is an in-app overlay rather than the browser fullscreen API.
- Historical event markers can seek to an event timestamp; future content is gated until that seek changes virtual time.
- Replay analytics use the last session-local eligible snapshot; a backward seek updates that snapshot too. Final Evaluation is explicitly separated from replay intelligence.
- Incident, evidence, source, and report dates respect the saved timezone and date format with explicit timezone labels. The replay clock remains explicitly in IST, independent of display preferences.
- This is a frontend prototype. No live alerts, ingestion, authentication, AI generation, real verification, or operational emergency recommendations are provided.

## Validation

The unit suite covers incident filtering, severity sorting, date boundaries, elapsed-time accuracy, pause/resume, speed continuity, seeking/completion, event availability, chronological release, deduplication, and backward reconstruction. Component tests cover cards, filters, badges, tables, and replay controls. Playwright covers all main routes, filtering/details, map tabs, replay playback/rewind, persisted theme, mobile navigation, filtered CSV contents, generated/related reports, source toggles, saved monitoring defaults, and every route at 375px without horizontal overflow.

The app includes loading, error/retry, and empty states, keyboard focus, reduced-motion handling, responsive navigation, printable reports, CSV quoting/formula neutralisation, and safe React text rendering.
