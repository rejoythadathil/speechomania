# db

The Postgres pool (`sql`, Bun.sql) and the mapping from Postgres errors to HTTP errors.

| File | Exports |
|---|---|
| `service/index.js` | `sql`, connected with `DATABASE_URL` as the app role, `prepare: false`, pool size `DATABASE_POOL_MAX` |
| `constants/index.js` | `PG_ERRORS`: Postgres error code → `[status, message]` |
| `exception/index.js` | `fromPostgres(error)` → `HttpError` or `null` (used by the error middleware) |

## Rules
- `prepare: false` so it works behind PgBouncer in transaction mode.
- Send JSON as text and cast it: `${json(value)}::jsonb`. Use `now()` in SQL rather than JavaScript dates.
- Postgres error codes are on `error.errno` (`23505` duplicate, `23503` still referenced, `22P02` bad format, `42501` not allowed, for example writing `audit_logs`).

Tests: `tests/index.test.js` (connection, jsonb round trip, error mapping).
