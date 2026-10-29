# audit

`audit(db, { actor, action, entityType, entityId, diff, ctx })` writes one row to `audit_logs`. Call it inside the same transaction as the change (`tx`), so the change and its record commit together.

- `action` is `<entity>.<verb>`, for example `child.updated`, `lesson.published`, `attempt.completed`.
- `diff` holds field names or from/to values, never secrets (the learning PIN is recorded as the field name `pin` only).
- `ctx` comes from `requestCtx(c)`: client IP and request id.
- The app database role can insert but cannot update or delete audit rows.

The admin read API for this table is the `audit` feature in `src/routes/v1/audit`.

Tests: `tests/index.test.js` (row written, app role cannot change or delete it).
