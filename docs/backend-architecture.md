# TrackTheDollar Backend

## 1. Architecture Overview

This backend is implemented as a standalone Node.js/TypeScript service optimized for deployment on Vercel-compatible serverless backends, Railway, Fly.io, Render, or a VPS with a separate cron worker. The core layers are:

- `src/core`: environment validation, logging, SSRF-aware outbound HTTP, cache abstractions, Prisma bootstrap, and security helpers.
- `src/modules/sources`: upstream adapter layer with one adapter per source, shared response schemas, and a canonical source catalog.
- `src/modules/ingestion`: catalog seeding, run tracking, observation revision handling, source health scoring, and cron-compatible orchestration.
- `src/modules/metrics`: derived metric snapshots and reusable series analytics.
- `src/modules/api`: public `v1` endpoints, input validation, response envelopes, caching, and admin/internal routes.
- `src/modules/admin` and `src/modules/health`: audit logging and diagnostics.

Key design choices:

- All external ingress is validated with Zod before normalization.
- Derived metrics are explicitly labeled as proxies and carry methodology warnings.
- Observations support revisions instead of destructive overwrite semantics.
- Public endpoints are rate limited, cacheable, and stale-aware.
- Admin operations are gated by `x-admin-key` and written to `AdminAuditLog`.

## 2. Folder Structure

```text
.
├── prisma/
│   └── schema.prisma
├── src/
│   ├── app.ts
│   ├── server.ts
│   ├── workers/
│   │   └── ingestion-worker.ts
│   ├── core/
│   │   ├── cache/
│   │   ├── config/
│   │   ├── db/
│   │   ├── errors/
│   │   ├── http/
│   │   ├── logging/
│   │   ├── security/
│   │   ├── types/
│   │   └── utils/
│   └── modules/
│       ├── admin/
│       ├── api/
│       │   ├── routes/
│       │   ├── schemas/
│       │   ├── serializers/
│       │   └── services/
│       ├── health/
│       ├── ingestion/
│       │   ├── jobs/
│       │   ├── repositories/
│       │   └── services/
│       ├── metrics/
│       │   └── services/
│       ├── observability/
│       └── sources/
│           ├── adapters/
│           ├── definitions/
│           ├── registry/
│           └── schemas/
├── tests/
└── docs/
```

## 3. Environment Variables

Defined in [`.env.example`](/Users/solg/Documents/Playground/.env.example).

Required core variables:

- `DATABASE_URL`
- `ADMIN_API_KEY`
- `IP_HASH_SALT`
- `APP_BASE_URL`
- `FRED_API_KEY`

Optional / conditional:

- `REDIS_URL`
- `BLS_API_KEY`
- `ENABLE_BEA`
- `BEA_API_KEY` when `ENABLE_BEA=true`

Operational controls:

- `API_RATE_LIMIT_MAX`
- `API_RATE_LIMIT_WINDOW_SECONDS`
- `CACHE_DEFAULT_TTL_SECONDS`
- `CACHE_STALE_TTL_SECONDS`
- `INGESTION_CONCURRENCY`
- `INGESTION_RETRY_ATTEMPTS`
- `INGESTION_TIMEOUT_MS`
- `DISABLE_SCHEDULES`
- `CRON_SYNC_*`
- `CRON_DERIVE_METRICS`

Local runtime note:

- The env loader will consume a local `.env` file automatically on modern Node runtimes, while still honoring deployed environment variables in production.

## 4. Prisma Schema

The normalized data model lives in [`prisma/schema.prisma`](/Users/solg/Documents/Playground/prisma/schema.prisma).

Primary models:

- `DataSource`: upstream provider registry and operational metadata.
- `Dataset`: source-specific dataset metadata, freshness rules, and methodology linkage.
- `Series`: canonical frontend-facing metric series with unit, frequency, source code, and category.
- `Observation`: revision-aware numeric/text/JSON observations with provenance and stale markers.
- `DerivedMetricDefinition` and `DerivedMetricSnapshot`: methodology-backed proxy and derived metric storage.
- `MethodologyNote`: compliance-grade explanations, limitations, and disclosures.
- `IngestRun` and `IngestRunEvent`: orchestration history and partial failure traceability.
- `SourceHealth`: score, freshness lag, success rate, and recent error context.
- `CacheEntry`: endpoint/source/metric cache metadata for operations and traceability.
- `AdminAuditLog`: protected-route audit trail.

Schema highlights:

- Unique constraints prevent duplicate series definitions and duplicate metric snapshots per timestamp.
- Observation revisions preserve historical corrections with `revisionOrdinal` and `isLatestRevision`.
- Indexes support chart-heavy reads on `(seriesId, observedAt, isLatestRevision)` and operational reads on source/run health.

## 5. Source Adapter Implementations

Adapters live in [`src/modules/sources/adapters`](/Users/solg/Documents/Playground/src/modules/sources/adapters).

Implemented adapters:

- [`fred-adapter.ts`](/Users/solg/Documents/Playground/src/modules/sources/adapters/fred-adapter.ts)
  - Official FRED API with API-key auth.
  - Ingests broad dollar index, M2, Fed funds, Treasury yields, and breakeven inflation.
- [`treasury-adapter.ts`](/Users/solg/Documents/Playground/src/modules/sources/adapters/treasury-adapter.ts)
  - Treasury Fiscal Data API.
  - Ingests Debt to the Penny and Daily Treasury Statement TGA balance context.
- [`federal-reserve-adapter.ts`](/Users/solg/Documents/Playground/src/modules/sources/adapters/federal-reserve-adapter.ts)
  - DDP-ready design with current FRED-mirror fallback for Fed balance-sheet/reserve series.
- [`usaspending-adapter.ts`](/Users/solg/Documents/Playground/src/modules/sources/adapters/usaspending-adapter.ts)
  - DoD budgetary resources, obligations, outlays, awards, and award-category obligations.
- [`foreign-assistance-adapter.ts`](/Users/solg/Documents/Playground/src/modules/sources/adapters/foreign-assistance-adapter.ts)
  - USAID open-data mirror used for ForeignAssistance.gov-aligned yearly totals and security-sector breakdowns.
  - Includes field discovery heuristics to handle schema drift more safely.
- [`bls-adapter.ts`](/Users/solg/Documents/Playground/src/modules/sources/adapters/bls-adapter.ts)
  - Official BLS public API for CPI and core CPI.
- [`bea-adapter.ts`](/Users/solg/Documents/Playground/src/modules/sources/adapters/bea-adapter.ts)
  - Optional BEA GDP context adapter behind `ENABLE_BEA`.

Common source protections:

- SSRF-aware allowlisted fetch client in [`safe-http-client.ts`](/Users/solg/Documents/Playground/src/core/http/safe-http-client.ts)
- Retry with exponential backoff
- Request timeout handling
- Zod-validated payload parsing
- No client-side secret exposure

## 6. Ingestion Orchestration Code

Core ingestion modules:

- [`catalog-seeder.ts`](/Users/solg/Documents/Playground/src/modules/ingestion/services/catalog-seeder.ts)
  - Seeds canonical source, dataset, series, methodology, and derived metric definitions.
- [`observation-repository.ts`](/Users/solg/Documents/Playground/src/modules/ingestion/repositories/observation-repository.ts)
  - Persists revision-aware observations, performs canonical unit normalization, and updates freshness markers.
- [`run-tracker.ts`](/Users/solg/Documents/Playground/src/modules/ingestion/services/run-tracker.ts)
  - Creates ingest runs, events, and final status summaries.
- [`source-health-service.ts`](/Users/solg/Documents/Playground/src/modules/ingestion/services/source-health-service.ts)
  - Computes source health score, freshness lag, and recent success rates.
- [`stale-data-service.ts`](/Users/solg/Documents/Playground/src/modules/ingestion/services/stale-data-service.ts)
  - Recomputes series, dataset, source, and derived-metric freshness, and exposes stale alert views for internal ops.
- [`unit-normalizer.ts`](/Users/solg/Documents/Playground/src/modules/ingestion/services/unit-normalizer.ts)
  - Converts supported upstream units into canonical series units while preserving raw source unit provenance in observation metadata.
- [`ingestion-orchestrator.ts`](/Users/solg/Documents/Playground/src/modules/ingestion/services/ingestion-orchestrator.ts)
  - Source-by-source sync, partial failure handling, freshness refresh, and metric derivation follow-up.
- [`scheduler.ts`](/Users/solg/Documents/Playground/src/modules/ingestion/jobs/scheduler.ts)
  - Cron-compatible scheduling for each source, freshness sweeps, and metric derivation.
- [`ingestion-worker.ts`](/Users/solg/Documents/Playground/src/workers/ingestion-worker.ts)
  - CLI worker for `sync-all`, `sync-source`, `derive`, and `freshness`.

Operational behavior:

- Catalog is seeded before syncs to keep adapters and database metadata aligned.
- Source sync failures do not collapse the full `syncAll` batch.
- Observation writes are idempotent at the value/revision level.
- Revised historical values are preserved as new revisions instead of overwriting the old record.
- Treasury Fiscal Data ingestion now covers Debt to the Penny, Daily Treasury Statement, and Monthly Treasury Statement table extracts.

## 7. Derived Metric Logic

Implemented in [`derived-metric-service.ts`](/Users/solg/Documents/Playground/src/modules/metrics/services/derived-metric-service.ts).

Persisted derived metrics:

- `debt-growth-velocity`
- `dollar-strength-zscore`
- `monetary-expansion-proxy`
- `war-spending-proxy`

Series analytics available to API responses:

- `7d`, `30d`, `90d`, `1y` deltas
- rolling averages
- annualized change
- percentile
- z-score

Proxy design notes:

- `monetary-expansion-proxy` blends Fed assets, reserve balances, M2, and debt acceleration.
- `war-spending-proxy` blends DoD obligations, contract-heavy award share, and public security assistance.
- Both proxies are stored and returned with explicit warnings and methodology links.

## 8. API Routes / Handlers

Public routes in [`public.ts`](/Users/solg/Documents/Playground/src/modules/api/routes/public.ts):

- `GET /api/v1/overview`
- `GET /api/v1/dollar-strength`
- `GET /api/v1/debt`
- `GET /api/v1/inflation`
- `GET /api/v1/rates`
- `GET /api/v1/money-supply`
- `GET /api/v1/money-printing-proxy`
- `GET /api/v1/war-spending-proxy`
- `GET /api/v1/defense-spending`
- `GET /api/v1/foreign-assistance`
- `GET /api/v1/series/:slug`
- `GET /api/v1/methodology`
- `GET /api/v1/source-health`

Admin/internal routes in [`admin.ts`](/Users/solg/Documents/Playground/src/modules/api/routes/admin.ts):

- `POST /api/internal/refresh`
- `POST /api/internal/freshness/refresh`
- `GET /api/internal/stale-alerts`
- `GET /api/internal/source-health`
- `GET /api/internal/ingest-runs`
- `POST /api/internal/cache/invalidate`
- `GET /api/internal/diagnostics`

Validation and safety:

- Query/body schemas in [`query-schemas.ts`](/Users/solg/Documents/Playground/src/modules/api/schemas/query-schemas.ts)
- Error handling and safe response messages in [`request-hooks.ts`](/Users/solg/Documents/Playground/src/modules/observability/request-hooks.ts)
- Admin auth guard via [`admin-auth.ts`](/Users/solg/Documents/Playground/src/core/security/admin-auth.ts)
- Generic series responses now honor `compare=previous|1y|5y` by returning a bounded comparison object instead of silently ignoring the parameter.

## 9. Caching Strategy

Caching modules:

- [`cache-service.ts`](/Users/solg/Documents/Playground/src/core/cache/cache-service.ts)
- [`memory-cache.ts`](/Users/solg/Documents/Playground/src/core/cache/memory-cache.ts)
- [`redis-cache.ts`](/Users/solg/Documents/Playground/src/core/cache/redis-cache.ts)
- [`runtime.ts`](/Users/solg/Documents/Playground/src/core/cache/runtime.ts)

Strategy:

- Public endpoints use cache keys derived from validated query payloads.
- `Cache-Control` sends `max-age` plus `stale-while-revalidate`.
- Redis is used when `REDIS_URL` is configured; otherwise the service falls back to in-memory caching.
- Cache metadata is mirrored into `CacheEntry` for operations and auditability.
- Admin routes can invalidate a single key or a prefix.

Recommended production tuning:

- Keep endpoint TTL short for daily macro data, longer for annual public spending datasets.
- Keep source-level caches separate from endpoint caches to avoid cross-contamination of freshness assumptions.
- Use Redis in production; in-memory mode is for local development only.

## 10. Security Hardening Notes

Implemented protections:

- Boot-time env validation with Zod in [`env.ts`](/Users/solg/Documents/Playground/src/core/config/env.ts)
- Server-only adapters; no secrets exposed to client code
- Strict query/body validation on all API inputs
- Rate limiting on public endpoints
- Admin key protection for internal routes
- Structured safe errors without stack leakage
- SSRF-aware allowlisted outbound fetches with HTTPS-only enforcement
- Timeout and retry handling for upstream calls
- Prisma-only persistence patterns with no raw string interpolation
- Audit logging for admin actions
- IP hashing rather than raw IP storage in audit logs

Likely attack surface:

- Public chart endpoints with abusive query volume
- Admin routes if API key handling is weak
- Upstream data poisoning or malformed payload attacks
- Cache stampedes on expensive overview endpoints
- Stale data being shown as fresh if freshness metadata is ignored by the frontend

Mitigations recommended:

- Put the API behind WAF/rate limiting at the edge in production.
- Rotate `ADMIN_API_KEY` and `IP_HASH_SALT` through a secrets manager.
- Add network egress restrictions so the app can only reach approved upstream hosts.
- Pin frontend consumption to `metadata.freshness` and route warnings.
- Add centralized alerting for ingest failures and stale `SourceHealth` scores.

Production hardening checklist:

- Enforce TLS end to end.
- Restrict Postgres and Redis network access to application subnets.
- Use separate credentials for runtime and migrations.
- Add backups and retention policy for Postgres.
- Monitor `IngestRun` failure rate and `SourceHealth.score`.
- Review `npm audit` findings before production deploy.
- Add SSO/auth for admin routes if the platform moves beyond a single internal key model.

## 11. Production Deployment Notes

Suitable deployment shapes:

- Vercel for HTTP + cron-triggered worker endpoints, with managed Postgres and Upstash Redis
- Railway / Fly.io / Render with web + worker processes
- VPS with `systemd` or container orchestration for web and cron worker separation

Recommended process split:

- Web/API process: serves public and admin routes
- Worker process: runs scheduled ingestion and derivation

Database and infra notes:

- Run `prisma migrate deploy` during deploys
- Run `npm run prisma:generate` in build pipelines
- Run `npm run seed` during first-time environment bootstrap to register canonical sources, datasets, series, and methodologies
- Prefer Redis over memory cache in multi-instance deployments
- Keep cron execution single-homed to avoid duplicate ingestion unless you add distributed locking

## 12. Testing Strategy

Current tests:

- [`tests/query-schemas.spec.ts`](/Users/solg/Documents/Playground/tests/query-schemas.spec.ts)
- [`tests/math.spec.ts`](/Users/solg/Documents/Playground/tests/math.spec.ts)
- [`tests/unit-normalizer.spec.ts`](/Users/solg/Documents/Playground/tests/unit-normalizer.spec.ts)

Recommended next tests:

- Adapter contract tests with recorded official payload fixtures
- Ingestion repository tests for revision handling and deduplication
- Route tests using `fastify.inject`
- Snapshot tests for example API payload shapes
- Health-score regression tests

## 13. Example Responses

### `GET /api/v1/money-printing-proxy`

```json
{
  "data": {
    "metric": {
      "slug": "monetary-expansion-proxy",
      "name": "Monetary Expansion Proxy",
      "description": "Composite proxy score combining balance sheet growth, reserve balances, M2 growth, and debt acceleration.",
      "category": "monetary",
      "unit": "score_0_100",
      "formula": "Weighted composite of z-scored changes in Fed total assets, reserve balances, M2, and debt growth velocity.",
      "isProxy": true
    },
    "snapshot": {
      "asOf": "2026-03-13T00:00:00.000Z",
      "value": 63.42,
      "freshnessStatus": "FRESH",
      "stale": false,
      "sourceTimestamps": {
        "fedTotalAssets": "2026-03-11T00:00:00.000Z",
        "reserveBalances": "2026-03-11T00:00:00.000Z",
        "m2MoneyStock": "2026-02-01T00:00:00.000Z",
        "debtGrowthVelocity": "2026-03-13T00:00:00.000Z"
      },
      "payload": {
        "components": {
          "fedAssetsZ": 1.12,
          "reservesZ": 0.88,
          "m2Z": 0.31,
          "debtVelocityNormalized": 0.55
        },
        "compositeZ": 0.81
      }
    },
    "methodology": {
      "slug": "money-printing-proxy",
      "title": "Monetary Expansion Proxy Methodology",
      "summary": "Composite proxy based on official balance sheet, reserve, money-stock, and debt-growth signals. It is not an official money-printing counter.",
      "limitations": "M2, reserve balances, and Fed assets move for multiple reasons. The metric should be treated as directional context rather than a direct accounting measure."
    },
    "warnings": [
      "Proxy metric. Not an official money-printing counter."
    ]
  },
  "metadata": {
    "version": "v1"
  },
  "warnings": [
    "Derived proxy. Not an official money-printing counter."
  ]
}
```

### `GET /api/v1/debt`

```json
{
  "data": {
    "totalDebt": {
      "series": {
        "slug": "total-public-debt-outstanding",
        "sourceCode": "tot_pub_debt_out_amt",
        "name": "Total Public Debt Outstanding",
        "unit": "usd",
        "frequency": "DAILY",
        "source": "U.S. Treasury Fiscal Data"
      },
      "observations": [
        {
          "observedAt": "2026-03-12T00:00:00.000Z",
          "value": 36123456789012.12,
          "valueStatus": "FINAL",
          "sourceUpdatedAt": null,
          "warnings": []
        }
      ],
      "analytics": {
        "latest": {
          "observedAt": "2026-03-12T00:00:00.000Z",
          "value": 36123456789012.12
        },
        "deltas": {
          "7d": 0.18,
          "30d": 0.71,
          "90d": 1.92,
          "1y": 5.48
        },
        "rollingAverage": 36081234000000.55,
        "annualizedChange": 5.48,
        "percentile": 94.12,
        "zScore": 1.87
      },
      "freshness": {
        "freshnessStatus": "FRESH",
        "stale": false,
        "lastObservationAt": "2026-03-12T00:00:00.000Z",
        "lastSuccessfulSyncAt": "2026-03-13T01:30:00.000Z"
      },
      "methodology": {
        "slug": "fiscal-data-limitations",
        "title": "Treasury Fiscal Data Notes",
        "summary": "Debt and cash figures come from Treasury fiscal datasets and can be revised, reclassified, or subject to reporting lags.",
        "limitations": "Do not combine daily and monthly datasets without respecting their native cadence and revision behavior."
      }
    }
  },
  "metadata": {
    "version": "v1"
  },
  "warnings": []
}
```
