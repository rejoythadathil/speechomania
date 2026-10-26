# Database schema
The schema is defined in `api.dccd/prisma/schema.prisma`; the first migration (`prisma/migrations/20261025000000_init`) is the SQL in [`schema.sql`](schema.sql). It has **7 tables**; anything a column, the queue, S3 or the audit log can hold does not get its own table.

| Table | Holds | Replaces |
|-------|-------|----------|
| `users` | Admins, mentors, parents. `role` column; `status = invited` until the Firebase invite is accepted. | invites |
| `children` | Profile, parent, current mentor, sensory settings, PIN, assigned lesson slugs (a JSON array), consent version and date. | consents, mentor assignments, lesson assignments |
| `lessons` | One row per version (`slug` + `version`). At most one draft and one published per slug; published rows never change. | separate versions table |
| `attempts` | One row per lesson attempt, pinned to the exact lesson version. Step events as JSON, stars earned. | attempt events, reward ledger |
| `remarks` | Notes on a child written by a mentor or an admin, internal or shared. `seen_at` drives the unread count. | notifications |
| `change_requests` | Mentor requests to change a lesson, with admin review. | |
| `audit_logs` | Append-only record of every change and every view of a child's data. Also the history of mentor reassignments. | |

Not in the database:
- **Media and generated audio:** S3 only. The audio file name is a hash of text + voice + settings, which is the cache.
- **Reports and background jobs:** BullMQ job state in Valkey, PDFs in S3.
- **Data export and erasure:** an admin action, written to `audit_logs`.

Rules:
- **IDs:** UUID v7 (`uuidv7()`, built into Postgres 18), so IDs are time-ordered and index-friendly.
- **App DB role:** the API connects as `dccd_app` (not the table owner) and cannot update or delete `audit_logs`. Migrations run as a separate owner role.
- **`metadata` column:** every table has `metadata jsonb NOT NULL DEFAULT '{}'` for extra values that don't have a column yet (imports, migrations, data transfer). Anything that is filtered, joined or must be valid gets a real column instead. Joi validates what goes into it, and personal data is not dumped there.
- **Soft delete:** `deleted_at` on users, children and remarks. Hard delete only through the erasure action.
- **Total stars** for a child are `SUM(attempts.stars)`; badges are computed from attempts, not stored.

Add a table only when a column stops being enough, for example a child who needs two mentors at once.

Analytics (mentor performance, child progress) will be read from materialized views refreshed by the worker, not computed live on every page load. The current dashboard counts are simple live queries; they move to materialized views when the data grows.

Prisma Migrate adds one bookkeeping table, `_prisma_migrations`, which holds no product data and is revoked from the app role.

Prisma cannot express CHECK constraints, the `citext` extension or grants, so those live as hand-written SQL inside the migration files. Partial unique indexes are in `schema.prisma` (preview feature `partialIndexes`). `bun run migrate:check` fails CI if `schema.prisma` and the migrations disagree.
