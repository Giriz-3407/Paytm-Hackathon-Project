# Crisis Lens Backend

REST + realtime API for the Crisis Lens frontend. Node.js, Express 5, TypeScript, PostgreSQL, Prisma, Zod, JWT, Socket.IO.

> Decision-support software, **not** an official emergency warning service. Incidents come only from real news discovered through SerpApi; severity is never guessed.

Full endpoint reference with example payloads: [docs/api.md](docs/api.md).

## Quick start

Requires Node.js 20.11+ and a PostgreSQL 14+ database.

```bash
cd backend
npm install                      # also runs `prisma generate`
cp .env.example .env             # PowerShell: Copy-Item .env.example .env
```

Edit `.env`:

- `JWT_SECRET` — required, 32+ characters. Generate one:
  `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`
- `DATABASE_URL` — the default matches `docker-compose.yml`.
- Optional: `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` to create an admin (quote the password if it contains `#`).

Start PostgreSQL (or point `DATABASE_URL` at your own):

```bash
docker compose up -d
```

Create the schema, load reference data (sources + replay scenarios, no incidents), run:

```bash
npm run prisma:deploy            # apply migrations (use `npm run prisma:migrate` while changing the schema)
npm run db:seed                  # sources, replay scenarios, optional admin (idempotent; loads NO incidents)
npm run dev                      # http://localhost:5000, auto-reload
```

Check it: `curl http://localhost:5000/api/v1/health`

To run without the file watcher, use `npm start`. It first compiles TypeScript through
the `prestart` script, then runs `dist/server.js`. Install dependencies with `npm install`
first; the compiler is a development dependency. For auto-reloading development, use
`npm run dev` instead.

### Connect the frontend

In `frontend/.env.local`:

```env
NEXT_PUBLIC_DATA_MODE=api
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

Rebuild/restart the frontend after changing `NEXT_PUBLIC_*` values. `FRONTEND_URL` here must match the
frontend's origin (default `http://localhost:3000`).

## Live data (SerpApi)

Set `SERPAPI_API_KEY` in `.env` (server-side only), then, as an ADMIN or ANALYST:

```bash
curl -X POST http://localhost:5000/api/v1/ingestion/run -H "Authorization: Bearer <token>"
```

One run = one Google News (India) search per query (8 by default, one per hazard type). It classifies headlines,
locates them, clusters by category + state (72 h window), stores evidence with the original link, and records
source health. Re-running is idempotent. New incidents are `mode: live`, severity `Unknown`, evidence
`Unverified`; two or more different publishers move one to `Developing`, never to `Corroborated`.
Set `SERPAPI_POLL_MINUTES` to poll automatically. Switching the **News discovery** source off on the Sources
page stops collection (`409`). Identical queries are cached for 10 minutes to protect your quota.

## Scripts

| Command                   | Purpose                                         |
| ------------------------- | ----------------------------------------------- |
| `npm run dev`             | Run with `tsx watch`                            |
| `npm run build`           | Compile to `dist/`                              |
| `npm start`               | Compile TypeScript, then run `dist/server.js`   |
| `npm test`                | Vitest unit + integration tests (no DB needed)  |
| `npm run typecheck`       | `tsc --noEmit`                                  |
| `npm run lint`            | ESLint                                          |
| `npm run prisma:migrate`  | Create/apply a migration in development         |
| `npm run prisma:deploy`   | Apply committed migrations (CI/production)      |
| `npm run db:seed`         | Load sources, replay scenarios, optional admin  |

Production: set `NODE_ENV=production`, a real `DATABASE_URL`/`JWT_SECRET`, `ALLOW_ANONYMOUS_SOURCE_TOGGLE=false`,
`FRONTEND_URL` to your real origin, `TRUST_PROXY=1` behind one reverse proxy; then `npm run build && npm run prisma:deploy && npm start`.
Invalid configuration stops the process at startup with a list of every problem.

## Structure

```text
backend/
├── prisma/                 schema.prisma + migrations
├── docs/api.md             endpoint reference
├── tests/                  unit/ + integration/ (repositories mocked, no DB)
└── src/
    ├── app.ts              Express setup: middleware order, routes, error handling
    ├── server.ts           startup, Socket.IO, graceful shutdown
    ├── config/             env validation (Zod), logger (pino, with redaction)
    ├── constants/          API prefix, categories, socket event names, pagination limits
    ├── database/           Prisma client + connect retry, seed.ts, seed-data/*.json
    ├── middleware/         validate, authenticate, authorize, rate-limit, request-logger, error-handler
    ├── routes/index.ts     registers every module under /api/v1
    ├── services/           shared infrastructure (realtime.service.ts: Socket.IO publisher)
    ├── utils/              api-response, app-error, jwt, pagination
    ├── types/              Express request augmentation
    └── modules/
        ├── health/  auth/  incidents/  evidence/  sources/  replay/  reports/
            └── <name>.routes · .controller · .service · .repository · .schemas · .types
```

Request flow: **route → middleware → controller → service → repository → Prisma → PostgreSQL.**
Controllers only translate HTTP; services hold business rules and import nothing from Express;
repositories are the only code that touches Prisma.

## Design decisions

- **API shape follows the frontend.** DTOs mirror `frontend/src/types/domain.ts` (nested `location`,
  `coordinates: [lat, lng]`, ISO strings). Prisma enum values equal the frontend's strings, so there is no
  translation layer. `sourceCount` / `relatedEvidenceIds` are derived from the evidence table, never stored.
- **Replay is isolated from live data.** Replay events live in their own tables, and `/incidents` only reads
  `mode = live`; the API never serves demo data. `GET /replay/scenarios/:id?asOf=` filters future events inside the query.
- **Evidence ingestion is idempotent.** `@@unique([incidentId, sourceUrl])` turns re-ingestion into a `409`
  instead of a duplicate; counters update in one transaction.
- **Auth is small on purpose.** Self-registration creates read-only `VIEWER`s; `ADMIN`/`ANALYST` can write.
  Reads stay public because the frontend has no login. Login uses constant-work comparison to avoid user
  enumeration; JWTs are pinned to HS256.
- **Reports are templated, not AI.** `POST /reports` assembles text from stored data and says so in
  `limitations`.
- **Validation is strict.** Zod schemas reject unknown fields on writes; queries are coerced and capped.
- **Security.** Helmet, CORS allowlist (`FRONTEND_URL`), global + stricter auth rate limits, 100 KB body limit,
  secrets/tokens redacted from logs, internal errors masked as `500 Internal server error`.

## Frontend changes made for integration

Only `frontend/src/services/repositories.ts` and `frontend/.env.example`:

1. Unwrap the `{ success, message, data, meta }` envelope (`request` returns `data`).
2. Treat `404` as `null` for single-record lookups, which is what the repository interfaces promise.
3. Request `?pageSize=200` for incident and report lists, since the UI still filters client-side.

## Known limitations

- **Replay gating is still client-side in the UI.** The API supports `asOf`, but the replay page downloads a
  whole scenario. The PRD's server-side replay sessions and virtual clock are not built.
- **Ingestion is SerpApi only and rule-based.** No official feeds (IMD/NDMA are listed as Offline until a
  connector exists), no LLM extraction, and no BullMQ/Redis queue. Locations come from a built-in gazetteer
  matched against the headline only, so places outside it are skipped rather than guessed.
- **Lists cap at 200 per page** and the UI filters client-side beyond that; move filtering server-side
  (already supported by the API) when data grows.
- **Roles live in the JWT**, so a demotion applies at next login/token expiry. Add a token version if you
  need instant revocation.
- Graceful shutdown (`SIGTERM`/`SIGINT`) is implemented but was not exercised on Windows, where signals
  terminate Node directly.
