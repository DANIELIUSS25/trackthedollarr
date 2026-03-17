# TrackTheDollar Backend

Production-grade backend for `TrackTheDollar.com`, built as a standalone TypeScript service with Fastify, Prisma, PostgreSQL, strict Zod validation, scheduled ingestion, proxy metric derivation, and admin/internal ops endpoints.

## Quick Start

1. Copy `.env.example` to `.env` and fill in secrets.
2. Run `npm install`.
3. Generate Prisma client with `npm run prisma:generate`.
4. Run migrations with `npm run prisma:migrate:dev`.
5. Seed the canonical source catalog with `npm run seed`.
6. Start the API with `npm run dev`.

## Useful Commands

- `npm run typecheck`
- `npm test`
- `npm run seed`
- `npm run ingest`
- `npm run ingest:source -- fred`
- `npm run derive`
- `npm run freshness`

## Docs

See [docs/backend-architecture.md](/Users/solg/Documents/Playground/docs/backend-architecture.md) for the full architecture overview, environment contract, Prisma model design, source adapters, security notes, deployment guidance, testing strategy, and example responses.
