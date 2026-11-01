# db

Prisma Client and the mapping from Postgres errors to HTTP errors.

| File | Exports |
|---|---|
| `service/index.js` | `db`, a Prisma Client on the `@prisma/adapter-pg` driver adapter, connected with `DATABASE_URL` as the app role, pool size `DATABASE_POOL_MAX` |
| `constants/index.js` | `PG_ERRORS`: Postgres error code → `[status, message]`; `SERIAL`, the options for a `Serializable` transaction |
| `exception/index.js` | `fromPostgres(error)` → `HttpError` or `null` (used by the error middleware) |

## Rules
- No raw SQL in app code. Use the model APIs (`db.children.findMany`, `tx.lessons.update`, …).
- Transactions: `db.$transaction(async (tx) => …)`. Pass `SERIAL` when the transaction reads a row and writes it back.
- jsonb columns take plain objects and arrays. Merge `metadata` in JavaScript.
- The client is generated into `node_modules/.prisma-client` by `bun run generate` (also on install).
- Postgres error codes are on `error.meta.driverAdapterError.cause.originalCode` (`23505` duplicate, `23503` still referenced, `23514` check, `22P02` bad format, `42501` not allowed, for example writing `audit_logs`). A `Serializable` clash (`P2034`) is 409.

Tests: `tests/index.test.js` (jsonb round trip, error mapping).
