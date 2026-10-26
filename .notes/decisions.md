# Decision log

The codebase has zero comments, so the reasons behind choices live here. Newest last. Add a row when a decision changes; don't edit old rows.

| Date | Decision | Why |
|---|---|---|
| 2026-10-25 | JavaScript, not TypeScript | Team choice. |
| 2026-10-25 | Zero comments in the codebase, enforced by pre-commit | Team choice. Reasons go in these notes instead. |
| 2026-10-25 | Bun runtime + Hono framework for API and worker | Fast and lightweight; Hono also runs on Node if Bun ever blocks us. Firebase admin, BullMQ and Playwright must be checked on Bun in phase 0. |
| 2026-10-25 | One organisation, role-based access only; no multi-tenancy | Speechomania is a single organisation. Roles: admin, mentor, parent; children are profiles owned by a parent. |
| 2026-10-25 | Admins can write remarks too | `remarks.author_id` can be a mentor or an admin. |
| 2026-10-25 | 7 tables: users, children, lessons, attempts, remarks, change_requests, audit_logs | Keep the schema minimal; use columns, the queue, S3 and the audit log before adding tables. |
| 2026-10-25 | `metadata jsonb NOT NULL DEFAULT '{}'` on every table | Room for extra values and future data transfer without a migration. |
| 2026-10-25 | Single prod VM; recovery built in phase 0 (PITR, RPO 5 min, RTO 1 h) | Accept one VM only with tested recovery. |
| 2026-10-25 | Host nginx as reverse proxy and load balancer over `api-1` and `api-2` | Same pattern as xam; rolling deploys with no downtime and use of more than one CPU core. |
| 2026-10-25 | Two environments: local (development) and prod | No second VM. Local uses RustFS and the Firebase Auth Emulator, so it never touches prod resources. |
| 2026-10-25 | Tailwind v4 + CSS modules, React 19 | Needed for BoardUI. |
| 2026-10-25 | BoardUI free components only, no Pro | Missing components are built in `components/shared/`. |
| 2026-10-25 | Mochi Icons for child mode only | Child mode is interactive; work views stay professional. An ESLint rule keeps the two apart. |
| 2026-10-25 | RustFS replaces MinIO for local S3 | The `minio/minio` image can no longer be pulled. RustFS is S3-compatible and Apache-2.0. |
| 2026-10-25 | Own 25-line migration runner instead of dbmate | dbmate needs `-- migrate:up` comment markers, which the zero-comments rule forbids. |
| 2026-10-25 | `children.assigned_lessons` is `jsonb`, not `citext[]` | Bun's Postgres client sends array parameters incorrectly; JSON round-trips cleanly. |
| 2026-10-25 | BoardUI components converted from TSX to JSX | The codebase is JavaScript only. Conversion strips types and comments; re-run it after every `boardui add`. |
| 2026-10-25 | BoardUI application blocks removed (sidebar, stat cards, auth card, data table) | They are not in BoardUI's published free list. Our own sidebar, stat card and modal replace them. |
| 2026-10-25 | One `work-layout` for admin, mentor and parent | The three layouts would be identical apart from the menu, which comes from `navigation.js`. |
| 2026-10-25 | Multi-role pages live in `views/shared/`, admin-only pages in `views/admin/` | Children, child detail, lessons and change requests are one page each whose actions change by role. |
| 2026-10-25 | Unauthorised records return 404, not 403 | A mentor or parent cannot tell whether another family's child exists. Wrong-role actions still return 403. |
| 2026-10-25 | Invite links are shown to the admin to send | No email provider is chosen yet. Firebase creates the link; the admin copies it. Replace with email when a provider is chosen. |
| 2026-10-25 | pgBackRest runs inside the Postgres container | Postgres calls `archive_command` itself, so the tool must be in the same container. |
| 2026-10-25 | API port 4100 and local services on 7101–7106 | Ports 4000 and 6101–6102 are already used by the xam stack on the dev machines. |
| 2026-10-25 | Work views use a flat, dense style (hairlines, no shadows, small radius, joined stat strip) | The first version had too much space between cards. The team chose rightfit.so as the reference. Tokens live in `app.speechomania/src/styles/brand.css`. |
| 2026-10-25 | Dashboard charts are our own SVG components (`components/shared/charts/`), not BoardUI Pro or a chart library | BoardUI's dashboard templates are Pro. The charts keep the flat style, use one colour per chart, and each has keyboard tooltips and a table view. Mentors see only their own data. |
| 2026-10-25 | Dashboard answers "which child needs attention" instead of showing activity | Percent changes on small numbers and the audit-log heatmap didn't lead to any action. Follow-up rules (no mentor, no remark in 14+ days, no lessons) are computed in SQL so the sidebar badges and the dashboard agree. |
| 2026-10-25 | No mock data anywhere; demo data only from `api.speechomania/seeds/dev.js` | Recorded in the root `CLAUDE.md` so every session follows it. |
| 2026-10-25 | Staff avatars are DiceBear Gaze, generated locally, seed stored in `users.metadata.avatar` | The team picked Gaze. Rendering from the npm package avoids sending user ids to a third party and needs no CSP change (`data:` images are already allowed). No new column: it lives in `metadata`. |
| 2026-10-25 | One pagination contract for every list: `page`/`page_size` in, `{ items, page, page_size, total, total_pages }` out, count in a separate query | The old `count(*) OVER ()` returned `total: 0` when a page was past the end, and four lists (remarks per child, unread remarks, lesson versions, dashboard follow-up) were unbounded. Screens choose their own page size (max 100). |
| 2026-10-25 | Tighter domain scoping | Parents only see lessons assigned to their children; editing or deleting a remark rechecks that the child is still in the user's scope (so a mentor moved off a child loses access); mentors no longer receive parent emails. Covered by `test/scoping.test.js`. |
| 2026-10-25 | Global search in the header (`GET /v1/search`): pages, children, lessons, people (admins) | Built on the same scoped list services as the screens, so scoping can't drift. Keyboard-first (⌘K, arrows, Enter, Esc), with "See all" links into each filtered list. |
| 2026-10-25 | Every list shows a footer with "X–Y of Z", rows per page and a pager; page and size live in the URL | Lists that fit on one page used to show no count or pager, which looked unpaginated; refresh and Back lost the page. The rows selector is a native `<select>`: the BoardUI popover closed itself when it opened near the bottom of the page. |
| 2026-10-25 | Parent and mentor pickers search the server instead of loading 100 people | The old pickers would silently miss people once Speechomania has more than 100 parents. |
| 2026-10-26 | Prisma Migrate (7.10.1) for schema and migrations; queries stay on Bun.sql | The team wanted a typed schema file and standard migration tooling. Prisma Client is not used: the scoped Bun.sql services already work and are tested. Prisma's generated comments are stripped by `migrate:new`, and the pre-commit hook blocks comments in `.sql` and `.prisma`. The config is `prisma.config.mjs` (JS only). Stayed on 7.10.1 because `latest` on npm is an 8.0 release candidate. |
| 2026-10-26 | One repository instead of three | The team chose github.com/rejoythadathil/speechomania for everything. The three local repos had no commits, so nothing was lost. Hooks and CI moved to the root; workflows are filtered by folder. Release deploy jobs stay off until `DEPLOY_ENABLED` is set, because the prod VM and its secrets don't exist yet. |
| 2026-10-26 | The product is Speechomania, owned by Autism Synergies, not DCCD Global | The founder clarified that this is not DCCD Global and will be published on the Speechomania website under the Autism Synergies company. Visible text, page title, docs and every internal identifier (folders, containers, database, roles, image and project names) now say Speechomania; nothing was deployed, so no data or running system was affected. Still open: Speechomania's own logo and colours (the old mark was modelled on DCCD's logo and has been replaced by a placeholder), the consent wording (who is the data controller), and the production domain (`speechomania.example` is a placeholder). Older entries above keep the name that was current when they were written. |
| 2026-10-26 | The repository is github.com/rejoythadathil/speechomania | The first repo (rejoyt/autismsynergies) was deleted and replaced by this one. The remote and every doc reference were updated. |
