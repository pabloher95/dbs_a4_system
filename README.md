# a4_system

Monorepo for a multi-service weather monitoring system:

- `apps/worker`: Node.js polling worker for Open-Meteo, intended for Railway.
- `apps/web`: Next.js frontend for Vercel, with Supabase auth and realtime updates.
- `supabase/`: schema and SQL helpers for tables, RLS, and seed data.

## Architecture

`Open-Meteo -> Railway worker -> Supabase Postgres + Realtime -> Next.js frontend on Vercel`

## Setup

1. Create a Supabase project.
2. Apply [`supabase/schema.sql`](./supabase/schema.sql) and [`supabase/functions.sql`](./supabase/functions.sql).
3. Enable email auth in Supabase.
4. Copy `.env.example` into `.env` at the repo root.
5. Copy `apps/web/.env.example` into `apps/web/.env.local`.
6. Copy `apps/worker/.env.example` into `apps/worker/.env`.
7. Run `npm install`.

## Local development

- Frontend: `npm run dev:web`
- Worker: `npm run dev:worker`

The worker reads city coordinates from the `cities` table, polls Open-Meteo, and upserts into `weather_snapshots`.
The frontend uses magic-link login, lets each user select cities, and subscribes to realtime inserts.
The worker loads its local env vars from `apps/worker/.env`.

## Supabase notes

- Add `public.weather_snapshots` to the `supabase_realtime` publication if your project does not already include it.
- Use the same project URL for both `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_URL`.

## Deployment

### Railway worker

- Root directory: repo root
- Start command: `npm run start -w @a4-system/worker`
- Build command: `npm run build:worker`
- Required env vars: `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `OPEN_METEO_BASE_URL`, `WEATHER_POLL_INTERVAL_MS`

### Vercel frontend

- Root directory: `apps/web`
- Build command: `npm run build`
- Required env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
