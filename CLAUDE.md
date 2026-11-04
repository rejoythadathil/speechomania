# Speechomania platform

One repo (github.com/rejoythadathil/speechomania) with three apps: `api.speechomania` (Bun + Hono), `app.speechomania` (React 19 + Vite + Tailwind v4 + BoardUI free), `deploy.speechomania` (Docker, nginx, backups). Plans and runbooks live in `.notes/`. The pre-commit hook is `.githooks/pre-commit` at the root (`git config core.hooksPath .githooks`); CI is `.github/workflows/` at the root, one CI and one release workflow per app.

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
- Prettier formats both apps (`.prettierrc.json`: no semicolons, single quotes, 100 columns). `bun run format` rewrites; `bun run lint` fails on unformatted files. Long calls and objects break onto indented lines, one argument or property per line.
- 8 tables only (`users`, `children`, `lessons`, `attempts`, `remarks`, `change_requests`, `audit_logs`, `assessments`), each with `metadata jsonb`. The schema lives in `api.speechomania/prisma/schema.prisma`; migrations in `api.speechomania/prisma/migrations/`.
- Schema change: edit `schema.prisma`, run `bun run migrate:new <name>` (diffs against your local database and creates a comment-free migration), add any CHECK constraint or grant Prisma can't express to that `migration.sql`, then `bun run migrate`. Never edit a migration that has been applied anywhere. `bun run migrate:check` must report no difference.
- All database access goes through Prisma Client (`db` from `common-service/db/service/`, driver adapter `@prisma/adapter-pg`). No raw SQL in app code: no `$queryRaw`, `$executeRaw` or Bun.sql. Raw SQL lives only in migrations and the test database setup. Rules and scores that read lesson content are JavaScript in a feature's `utils/` with unit tests, never `CASE` logic in a query. Read-modify-write transactions run `Serializable` (`SERIAL` from `common-service/db/constants`).
- BoardUI free components only, never Pro. BoardUI never in child mode. Child-mode icons and pictures are all OpenMoji, one style, from `components/child/child-icons.jsx` and `art.jsx`. Child mode may reuse `components/shared` pieces (`Panel`, `StatCard`, `BrandMark`) for its grown-up-style summary areas.
- Work views stay flat: hairlines, no shadows, tight gaps (tokens in `app.speechomania/src/styles/brand.css`).
- Ownership is enforced in the query's `where` clause. Records the user can't access return 404; actions the role can't take return 403.
- Every list endpoint is paginated on the server with `pageQuery` + `pageOf(model, args, window)` (or `pageArray`) from `api.speechomania/common-service/http/` (`validation/index.js`, `utils/index.js`): `page` and `page_size` (max 100) in, `{ items, page, page_size, total, total_pages }` out. The screen asks for the page size it shows. No unbounded lists.
- Every query is scoped by role and ownership (mentor: own children and own requests; parent: own children, shared remarks, lessons assigned to their children). Writes recheck the child's scope, not just authorship. Send only the fields a role needs (mentors don't get parent emails).
- Every new endpoint gets a scoping test in its feature's `tests/index.test.js`.
- API modules (`common-service/<name>/`, `src/routes/v1/<feature>/`) keep one concern per file, each kind in its own sub-folder like `common-service/voice/`: `route/`, `controller/`, `service/`, `validation/`, `constants/`, `exception/`, `utils/`, `tests/`, `docs/`, each file is `index.js` (tests `tests/index.test.js`, docs `docs/index.md`) (see `.notes/10-folder-structure.md`). Services throw named errors from `exception/`; pure helpers go in `utils/` with unit tests. Update the module's `docs/index.md` when its endpoints or behaviour change.
- Every list screen shows `ListFooter` ("X–Y of Z", rows per page, pager). Full-page lists keep `page`/`size` in the URL via `usePageParams`; panels inside a page use local state.
- Global search (`GET /v1/search`) reuses the scoped list services, so it can never return more than the lists do. Pickers for people use `PersonPicker` (server search), never a preloaded list.
- `.env` files are never committed.
- A parent signs in straight to `/learn`: one active child opens that child's learning path, several show a picker. Grown-up screens are one tap away ("Grown-up area", or Grown-ups inside child mode).
- Child mode lives in `layout/learning-layout`, `views/child` and `components/child`, talks only to `/v1/learning` (parent only) and `/v1/children` for the picker, and takes every icon from `components/child/child-icons.jsx`. Illustrations come from `components/child/art.jsx` (downloaded OpenMoji files in `src/assets/openmoji/`); a new character, action or game needs its art there and its value in the lessons `constants/index.js`. Each game is one file in `views/child/games/` registered in `games/index.js`, with its own theme (background, scenery and how-to-play tips) in `components/child/scenes.js`, and lesson pictures are illustrations named in the lesson content (`art`, names of files in that library); photos are never used in child mode.
- Lesson audio is generated with `bun run audio <slug>` into a draft, never into a published row.
- Assessments (`.notes/11-assessments.md`): admins build and configure them, mentors assign and monitor, parents see scores when allowed. Questions are copied from published lessons when saved. Every scoring, play, data-collection and visibility option is a per-assessment setting, enforced by the API (the API drops data points that are switched off). Scoring rules live in `assessments/utils`, never in a query.
- The lesson and assessment pages have a "Play preview" that runs the child's game in `PreviewStage` and saves nothing.

## Assets: download, never hand-draw. Strictly.
- Decoration in child mode belongs to the game's world and stays still: one to three pieces at the edges, no floating or drifting pictures, no random extras. Movement only where it is the game.
- Never hand-draw art: no hand-written SVG paths, CSS-drawn characters, shapes posing as illustrations, or canvas-drawn graphics. This covers characters, animals, scenes, backgrounds, icons, stickers and decorations.
- Use downloaded assets only: openly licensed packs (for example Kenney CC0, OpenMoji) and the lesson material in `lessons/`. Effects such as confetti come from a library (`canvas-confetti`), not custom code.
- Record each asset's source, licence and download URL in `.notes/assets.md` when it is added. No licence, no use.
- Missing an asset? Find and download one, or ask. Never draw a stand-in.

## Local
- Stack: `deploy.speechomania/dev` (Postgres :7101, Valkey :7102, RustFS :7103, Firebase emulator :7105).
- API :4100 (`bun server.js`), app :5173 (`bun run dev`).
- Seed accounts: `admin@speechomania.local`, `mentor.rahul@speechomania.local`, `parent.priya@speechomania.local`, all with password `speechomania-local-123`.
- Before calling work done: `bun test` and `bun run lint` in `api.speechomania`; `bun run lint` and `bun run build` in `app.speechomania`.
