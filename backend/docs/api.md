# Crisis Lens API

Base URL: `http://localhost:5000/api/v1` · Realtime: Socket.IO at `http://localhost:5000`

Everything here is **decision support, not an official emergency warning service.**

## Conventions

### Response envelope

Every response is JSON in one of two shapes.

```json
{ "success": true, "message": "Incidents retrieved", "data": [], "meta": null }
```

`meta` is `null` except on paginated lists:

```json
{ "page": 1, "pageSize": 50, "total": 18, "totalPages": 1 }
```

Errors:

```json
{
  "success": false,
  "message": "Request validation failed",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": [{ "part": "query", "path": "pageSize", "message": "Too big: expected number to be <=200" }],
    "requestId": "9de8a80e-0122-4a64-9a0a-c41a42097bce"
  }
}
```

`requestId` matches the `X-Request-Id` response header and the server log line. Stack traces and
internal messages are never returned.

| Status | `error.code`                       | Meaning                                                   |
| ------ | ---------------------------------- | --------------------------------------------------------- |
| 400    | `BAD_REQUEST`                      | Malformed JSON, unknown foreign key, self role change     |
| 401    | `UNAUTHORIZED`                     | Missing/invalid/expired token, bad credentials            |
| 403    | `FORBIDDEN` / `CORS_ORIGIN_DENIED` | Role too low / origin not in `FRONTEND_URL`               |
| 404    | `NOT_FOUND`                        | Unknown route or record                                   |
| 409    | `CONFLICT`                         | Duplicate email or duplicate evidence URL for an incident |
| 413    | `PAYLOAD_TOO_LARGE`                | Body over 100 KB                                          |
| 422    | `VALIDATION_ERROR`                 | Zod validation failed; see `error.details`                |
| 429    | `RATE_LIMITED`                     | Too many requests                                         |
| 503    | `DATABASE_UNAVAILABLE`             | Database unreachable                                      |

### Authentication

`Authorization: Bearer <accessToken>` from `/auth/login` or `/auth/register`.

| Role      | Can                                                  |
| --------- | ---------------------------------------------------- |
| (anyone)  | All `GET` endpoints (the dashboard has no login)     |
| `VIEWER`  | Same as anyone, plus `GET /auth/me`                  |
| `ANALYST` | Create/update incidents, add evidence, make reports  |
| `ADMIN`   | Everything, including `PATCH /auth/users/:id/role`   |

Roles are read from the token, so a role change takes effect when the user next logs in.

`PATCH /sources/:id` is the exception: the current frontend sends no token, so it is open when
`ALLOW_ANONYMOUS_SOURCE_TOGGLE=true`. The server refuses to start with that flag in production.

### Pagination, filtering, sorting

`?page=1&pageSize=50` (default 50, max 200). Lists have a stable order with an `id` tie-breaker.

### Timestamps

ISO 8601 UTC strings (`2026-11-22T06:30:00.000Z`). Inputs must include a timezone offset.

---

## Health

### `GET /health`

`200` when the database answers, `503` otherwise.

```json
{
  "success": true,
  "message": "Service is healthy",
  "data": {
    "status": "ok",
    "uptimeSeconds": 4,
    "timestamp": "2026-11-22T09:23:01.704Z",
    "checks": { "database": "up" }
  },
  "meta": null
}
```

## Auth

### `POST /auth/register`

Self-registration always creates a `VIEWER`. Password: 10–72 bytes.

```json
{ "name": "Ada", "email": "ada@example.com", "password": "correct-horse-battery" }
```

`201`:

```json
{
  "success": true,
  "message": "Account created",
  "data": {
    "user": { "id": "…", "name": "Ada", "email": "ada@example.com", "role": "VIEWER", "createdAt": "…" },
    "accessToken": "eyJ…",
    "expiresIn": "1d"
  },
  "meta": null
}
```

`409` if the email exists. Auth endpoints have a stricter rate limit (`AUTH_RATE_LIMIT_MAX`).

### `POST /auth/login`

Body `{ "email": "…", "password": "…" }` → same `data` as register. `401` with an identical message
for an unknown email or a wrong password.

### `GET /auth/me` 🔒

Returns the current user (`PublicUser`).

### `PATCH /auth/users/:id/role` 🔒 ADMIN

Body `{ "role": "ANALYST" }`. You cannot change your own role.

---

## Incidents

`Incident` matches `frontend/src/types/domain.ts`:

```json
{
  "id": "CL-2401",
  "title": "River levels rise along the Brahmaputra",
  "description": "…",
  "category": "Flood",
  "severity": "Critical",
  "evidenceStatus": "Corroborated",
  "lifecycleStatus": "Monitoring",
  "location": { "city": "Guwahati", "state": "Assam", "district": "Guwahati" },
  "coordinates": [26.1445, 91.7362],
  "firstDetectedAt": "2026-11-22T05:25:00.000Z",
  "lastUpdatedAt": "2026-11-22T06:21:00.000Z",
  "sourceCount": 4,
  "summary": "…",
  "relatedEvidenceIds": ["ev-0-s1", "ev-0-s2", "ev-0-s3", "ev-0-s4"],
  "mode": "live"
}
```

`sourceCount` and `relatedEvidenceIds` are derived from stored evidence, so they cannot drift.
`coordinates` is `[latitude, longitude]` and is a reference point, not an impact boundary.

Allowed values — `category`: Flood, Cyclone, Earthquake, Landslide, Heatwave, Fire, Severe weather,
Industrial · `severity`: Critical, High, Medium, Low, Unknown · `evidenceStatus`: Corroborated,
Developing, Unverified · `lifecycleStatus`: Active, Monitoring, Resolved.

### `GET /incidents`

| Query             | Notes                                                              |
| ----------------- | ------------------------------------------------------------------ |
| `search`          | Case-insensitive match on title, id, city, state                   |
| `categories`      | `Flood,Fire` or repeated `categories=Flood&categories=Fire`        |
| `severities`      | Same list syntax                                                   |
| `evidence`        | One evidence status                                                |
| `lifecycleStatus` | One lifecycle status                                               |
| `state`, `district` | Exact match                                                      |
| `sourceId`        | Incidents with evidence from that source                           |
| `from`, `to`      | ISO datetimes, applied to `firstDetectedAt`                        |
| `sort`            | `newest` (default), `severity` (Critical first), `updated`         |
| `page`, `pageSize`| Pagination                                                         |

```bash
curl "http://localhost:5000/api/v1/incidents?categories=Flood&severities=Critical,High&sort=severity"
```

### `GET /incidents/:id`

`404` if unknown. Returns an `Incident`.

### `POST /incidents` 🔒 ANALYST+

```json
{
  "title": "Flooding in Surat",
  "description": "Waterlogging reported in low-lying areas.",
  "category": "Flood",
  "severity": "High",
  "evidenceStatus": "Unverified",
  "lifecycleStatus": "Active",
  "location": { "city": "Surat", "state": "Gujarat", "district": "Surat" },
  "coordinates": [21.17, 72.83],
  "summary": "Initial reports; extent unverified."
}
```

`severity`, `evidenceStatus`, `lifecycleStatus` are optional (defaults `Unknown`, `Unverified`,
`Active`). Unknown fields are rejected. `201` with the new `Incident`; emits `incident:created`.

### `PATCH /incidents/:id` 🔒 ANALYST+

Any of `title`, `description`, `severity`, `evidenceStatus`, `lifecycleStatus`, `summary`.
Sets `lastUpdatedAt`. Emits `incident:resolved` when `lifecycleStatus` becomes `Resolved`,
otherwise `incident:updated`.

### `GET /incidents/:id/evidence`

Returns `Evidence[]` ordered by `availableAt`.

```json
{
  "id": "ev-0-s1",
  "incidentId": "CL-2401",
  "sourceId": "s1",
  "title": "Illustrative initial observation — Guwahati",
  "sourceUrl": null,
  "publishedAt": "2026-11-22T05:25:00.000Z",
  "availableAt": "2026-11-22T05:25:00.000Z",
  "ingestedAt": "2026-11-22T05:26:00.000Z",
  "content": "…",
  "verificationStatus": "Corroborated"
}
```

`publishedAt` (when the source said it), `availableAt` (when it may be used) and `ingestedAt` (when we
stored it) are deliberately separate.

### `POST /incidents/:id/evidence` 🔒 ANALYST+

```json
{
  "sourceId": "s1",
  "title": "Local bulletin",
  "sourceUrl": "https://example.com/report",
  "publishedAt": "2026-11-22T07:00:00Z",
  "content": "Excerpt of the report.",
  "verificationStatus": "Unverified"
}
```

`availableAt` defaults to the ingestion time. `409` if the same `sourceUrl` is already attached to the
incident (re-ingesting is idempotent). `400` for an unknown `sourceId`. The incident's `lastUpdatedAt`
and the source's `reports` counter are updated in the same transaction. Emits `evidence:added` and
`incident:updated`.

---

## Sources

### `GET /sources`

```json
{
  "id": "s3",
  "name": "NDMA alert bulletin",
  "type": "Official alerts",
  "url": "https://ndma.gov.in",
  "status": "Delayed",
  "enabled": true,
  "lastSync": "2026-11-22T06:25:00.000Z",
  "lastAttempt": "2026-11-22T06:29:00.000Z",
  "frequency": "Every 10 minutes",
  "reports": 186,
  "error": "Simulated timeout on the last ingestion attempt."
}
```

### `PATCH /sources/:id`

Body `{ "enabled": false }`. Returns the `Source`; emits `source:health`.
See [Authentication](#authentication) for the anonymous-toggle exception.

---

## Replay

### `GET /replay/scenarios`

Returns `ReplayScenario[]`, each including its `events` ordered by `availableAt`:

```json
{
  "id": "mumbai-2005",
  "title": "Mumbai Floods · July 2005",
  "description": "…",
  "location": "Mumbai",
  "startTime": "2005-07-26T03:30:00.000Z",
  "endTime": "2005-07-26T08:30:00.000Z",
  "dataQualityNotes": "…",
  "evaluation": "…",
  "events": [
    { "id": "mumbai-2005-1", "scenarioId": "mumbai-2005", "availableAt": "2005-07-26T03:40:00.000Z",
      "eventType": "incident", "payload": { "…": "Incident" } }
  ]
}
```

`eventType` is `incident` (payload: `Incident`), `update` (payload: `{ incidentId, severity, summary,
evidenceStatus, lifecycleStatus? }`) or `evidence` (payload: `Evidence` plus `category`, `location`,
`relatedIncidentId`). Replay data lives in separate tables and never appears in `/incidents`.

### `GET /replay/scenarios/:id?asOf=<ISO datetime>`

Without `asOf`, all events are returned (what the current frontend expects, since it gates events in
the browser). With `asOf`, only events where `availableAt <= asOf` are returned, filtered in the
database query. This is the building block for server-side gating, so a client never receives evidence
from after the virtual clock.

---

## Reports

`IntelligenceReport` matches the frontend type: `id, incidentId, title, generatedAt, mode, summary,
findings[], limitations[], sources[]` (`sources` are evidence ids).

### `GET /reports?incidentId=&page=&pageSize=`

Newest first.

### `GET /reports/:id`

### `POST /reports` 🔒 ANALYST+

Body `{ "incidentId": "CL-2401" }` → `201` with the stored report.

The text is assembled from the incident and its evidence using a **fixed template; no AI model is
involved**, and the report's `limitations` say so. Replace `composeReport` in
`src/modules/reports/reports.service.ts` when an LLM pipeline exists.

---

## Ingestion (SerpApi)

Both endpoints require an ADMIN/ANALYST token (a run spends SerpApi quota).

### `GET /ingestion/status`

```json
{ "configured": true, "running": false, "pollMinutes": 0, "defaultQueries": ["India flood", "India cyclone", "…"] }
```

### `POST /ingestion/run`

Body (optional): `{ "queries": ["India flood", "Odisha cyclone"] }` (1–10 queries; default is one per hazard type).
`409` if a run is already in progress or the News discovery source is disabled; `503` if no API key is set.

```json
{
  "startedAt": "2026-11-22T10:07:13.499Z",
  "finishedAt": "2026-11-22T10:07:16.991Z",
  "queries": 8,
  "queriesFailed": 0,
  "articlesSeen": 558,
  "skipped": { "duplicate": 0, "stale": 374, "notCrisis": 33, "noLocation": 70 },
  "evidenceAdded": 81,
  "incidentsCreated": 12,
  "incidentsUpdated": 69,
  "errors": []
}
```

Rules: articles older than 7 days are skipped; headlines must match a hazard category; the location is taken from
the **headline only** (state-only matches are labelled "(state-level)"); reports cluster into an open live incident
of the same category and state from the last 72 hours. Created incidents are `mode: "live"`, id `LV-XXXXXXXX`,
severity `Unknown`. `errors` never contains internal details.

## Realtime (Socket.IO)

Connect to the server origin (not `/api/v1`). CORS follows `FRONTEND_URL`. Events are broadcast to all
clients and carry the same DTOs as the REST API.

| Event               | Payload    | Emitted when                                          |
| ------------------- | ---------- | ----------------------------------------------------- |
| `incident:created`  | `Incident` | `POST /incidents`                                     |
| `incident:updated`  | `Incident` | `PATCH /incidents/:id`, or evidence is added          |
| `incident:resolved` | `Incident` | `PATCH` moves `lifecycleStatus` to `Resolved`         |
| `evidence:added`    | `Evidence` | `POST /incidents/:id/evidence`                        |
| `source:health`     | `Source`   | `PATCH /sources/:id`                                  |

These names match `ServerEvents` in `frontend/src/lib/realtime/socket-client.ts`.
