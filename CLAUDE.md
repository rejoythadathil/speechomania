# Speechomania platform

One repo (github.com/rejoyt/autismsynergies) with three apps: `api.speechomania` (Bun + Hono), `app.speechomania` (React 19 + Vite + Tailwind v4 + BoardUI free), `deploy.speechomania` (Docker, nginx, backups). Plans and runbooks live in `.notes/`. The pre-commit hook is `.githooks/pre-commit` at the root (`git config core.hooksPath .githooks`); CI is `.github/workflows/` at the root, one CI and one release workflow per app.

## Commits
- Commits and pull requests carry no AI co-author or "generated with" lines.

## No mock data. Strictly.
- Every value on screen comes from the database through the API. No hardcoded people, children, lessons, remarks, numbers, chart series, sample rows or placeholder records in `app.speechomania` or `api.speechomania`.
- Need more or different data to show something? Add it to `api.speechomania/seeds/dev.js` and reseed (`bun run seed`). The seed is the only source of demo data.
- Need a new number or chart? Add the query to the API service and a test for it. Never compute fake values or fill gaps in the UI.
- Empty data shows an empty state. Never a fake fallback.
- Allowed in the UI: copy (labels, headings, help text) and option lists that mirror database values, for example status filters matching a `CHECK` constraint.
- The seed runs locally only. It must never run against prod and never contain real children's or parents' data.

## Fixed rules
- JavaScript only, no TypeScript.
- Zero comments in code, CSS and configs. Reasons go in `.notes/decisions.md`.
- 7 tables only, each with `metadata jsonb`. The schema lives in `api.speechomania/prisma/schema.prisma`; migrations in `api.speechomania/prisma/migrations/`.
- Schema change: edit `schema.prisma`, run `bun run migrate:new <name>` (creates a comment-free migration), add any CHECK constraint or grant Prisma can't express to that `migration.sql`, then `bun run migrate`. Never edit a migration that has been applied anywhere. `bun run migrate:check` must report no difference.
- Prisma is used for schema and migrations only. Queries stay on Bun.sql; do not add Prisma Client.
- BoardUI free components only, never Pro. Mochi Icons only in child mode, BoardUI never in child mode.
- Work views stay flat: hairlines, no shadows, tight gaps (tokens in `app.speechomania/src/styles/brand.css`).
- Ownership is enforced in SQL. Records the user can't access return 404; actions the role can't take return 403.
- Every list endpoint is paginated on the server with `pageQuery` + `pageOf` (or `pageArray`) from `api.speechomania/utils.js`: `page` and `page_size` (max 100) in, `{ items, page, page_size, total, total_pages }` out. The screen asks for the page size it shows. No unbounded lists.
- Every query is scoped by role and ownership (mentor: own children and own requests; parent: own children, shared remarks, lessons assigned to their children). Writes recheck the child's scope, not just authorship. Send only the fields a role needs (mentors don't get parent emails).
- Every new endpoint gets a scoping test in `api.speechomania/test/`.
- Every list screen shows `ListFooter` ("X–Y of Z", rows per page, pager). Full-page lists keep `page`/`size` in the URL via `usePageParams`; panels inside a page use local state.
- Global search (`GET /v1/search`) reuses the scoped list services, so it can never return more than the lists do. Pickers for people use `PersonPicker` (server search), never a preloaded list.
- `.env` files are never committed.

## Local
- Stack: `deploy.speechomania/dev` (Postgres :7101, Valkey :7102, RustFS :7103, Firebase emulator :7105).
- API :4100 (`bun server.js`), app :5173 (`bun run dev`).
- Seed accounts: `admin@speechomania.local`, `mentor.rahul@speechomania.local`, `parent.priya@speechomania.local`, all with password `speechomania-local-123`.
- Before calling work done: `bun test` and `bun run lint` in `api.speechomania`; `bun run lint` and `bun run build` in `app.speechomania`.
