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

*** End Patch