# Airtable Helper Server

This small Express server proxies Airtable `Goal_Mapping` and `Content_Blocks` tables and adds simple caching.

Environment variables

- `AIRTABLE_API_KEY` (required): your Airtable API key
- `AIRTABLE_BASE_ID` (required): Airtable base ID (e.g. `appXXXX...`)
- `PORT` (optional): port to run the helper server on (default 4000)
- `REDIS_URL` (optional): if set, the server will use Redis for caching (e.g. `redis://:password@host:6379/0`). If not set, an in-memory cache is used (suitable for local dev only).

Install & run

```bash
npm install
npm run server
```

Notes

- The Redis cache is optional but recommended for production or multi-instance deployments. The in-memory cache is only valid per-process.
- The server exposes:
  - `GET /api/goal-mapping?lifeStage=...&goals=goal1,goal2`
  - `GET /api/content-blocks?blockTypes=type1,type2&lifeStage=...&ageBand=...&focusBucket=...&strainLevel=...&symptom=...`

Caching behavior

- Responses are cached for 5 minutes by default.
- When `REDIS_URL` is provided, the server writes JSON values to Redis with TTL.

Postgres persistence (quiz results)

- This server can persist quiz results to Postgres using the `pg` client.
- Create the DB user and grant privileges (example):

  CREATE USER blissmi_user WITH PASSWORD 'strongpassword';
  GRANT ALL PRIVILEGES ON DATABASE blissmi_db TO blissmi_user;

- Provide connection either via `DATABASE_URL` (recommended) or the `PGHOST`/`PGUSER`/`PGPASSWORD`/`PGDATABASE` env vars. See `.env.example` in the project root.
- The server will ensure the `quiz_results` table exists on startup. The table stores `answers`, `meta`, and the raw payload as JSONB and indexes `created_at` and `user_id`.
- Endpoint: `POST /api/results` accepts a JSON payload (e.g. `{ "userId": "...", "sessionId": "...", "answers": [...], "meta": {...}, "score": 12 }`) and returns `201` with `{ id, createdAt }` on success.


*** End Patch