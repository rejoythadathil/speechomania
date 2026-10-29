# http

Shared HTTP building blocks for every feature: the error type, paging, and small request helpers.

| File | Exports |
|---|---|
| `exception/index.js` | `HttpError(status, message, details)`, `notFound(what)`, `forbidden()`, and the middleware errors `invalidJson`, `invalidFields(details)`, `signInRequired`, `sessionExpired`, `accountInactive`, `tooManyRequests` |
| `utils/index.js` | `json(value)` (send JSON to Postgres as `${json(v)}::jsonb`), `requestCtx(c)` (ip and request id for the audit log), `likePattern(text)` (escaped `ILIKE` pattern), `pageMeta`, `pageOf(db, base, order, window)`, `pageArray(all, window)` |
| `validation/index.js` | `pageQuery`: `page` 1–10000 (default 1), `page_size` 1–100 (default 25) |
| `constants/index.js` | `PAGE` limits used by `pageQuery` |

## Contracts
- Every list returns `{ items, page, page_size, total, total_pages }`. `pageOf` runs the count as a separate query, so a page past the end still reports the real total.
- Errors reach the client as `{ error: { message, details? } }` through `src/middleware/error.js`. Unauthorised records are 404, wrong-role actions 403.

Tests: `tests/index.test.js`.
