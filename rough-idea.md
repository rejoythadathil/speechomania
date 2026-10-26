## Product idea
We are building an autism learning platform for DCCD (https://dccdglobal.com/), a client of deadend-engineers. It has 3 roles (RBAC): Admin, Mentor and Parent (who manages one or more Child profiles). Lessons are designed for autistic learners: every chapter or lesson is visual and creative, with audio. Audio is generated with ElevenLabs and stored. The MVP in the `dccd-mvp` folder shows the intended experience; run it before starting.

## Open decisions (settle before writing code)
| # | Decision | Proposed default |
|---|----------|------------------|
| 1 | Is the curriculum the same for every child? | Admin publishes lessons. A mentor assigns lessons per child from the published library. |
| 2 | Can parents see remarks? | Only remarks marked "shared with parent". Internal remarks stay between admins and mentors. |
| 3 | Notification channel | In-app counters come from data that already exists (unseen remarks, pending change requests); no notifications table. Email digest to admins once a day. |
| 4 | Mentor performance metrics | Remarks per child per week, child progress rate, change requests raised/approved. |

## Members
One organisation (DCCD), three roles. This is role-based access control only; there is no multi-tenancy.

- ***Admin***: Owners of the DCCD organisation. Full access.
- ***Mentor***: Each mentor is assigned N children. A mentor sees only their assigned children.
- ***Parent***: A parent account owns one or more ***Child*** profiles. The child does not have their own login; the child enters "learning mode" from the parent's session using a simple picture/PIN switch. Settings, progress and remarks stay behind the parent view.

### Permissions per role

#### Admin
- CRUD on lessons (with draft → published states and versions)
- CRUD on mentors
- CRUD on parents and child profiles (soft delete; hard delete only through the erasure flow)
- Assign and reassign children to mentors
- Analytics on every child and their mentor
- Mentor performance and contributions (metrics from Open decision 4)
- Report generation on mentors and children
- System analytics and data
- Approve or reject lesson change requests from mentors
- Write remarks on any child (internal or shared with parent). The child's mentor sees them.
- View the audit log

#### Mentor
- Read their assigned children's progress
- Add remarks on an assigned child (internal or shared with parent). Admins are notified.
- Request a change to a lesson, with a reason. It goes to admins as a request; the admin approves or rejects it.
- Assign published lessons to their children

#### Parent
- Manage their child profiles (name, avatar, sensory settings)
- View each child's progress and shared remarks
- Start a learning session for a child

#### Child (learning mode)
- Take lessons and earn rewards. The reward system only adds; nothing is lost or punished.

## Core flows

### Onboarding
1. There is no public sign-up. An admin creates a mentor or parent account, and the system sends an invite email (Firebase email link).
2. The person sets a password and logs in.
3. The parent records consent (see Compliance) and adds child profiles.
4. The admin assigns each child to a mentor.

### Lesson lifecycle
1. An admin creates a lesson as a **draft**: visuals plus the script text.
2. The admin requests audio generation. A job is queued; the worker calls ElevenLabs, stores the audio in S3 and puts the S3 key into the lesson content. The S3 key is a hash of (text + voice + settings), so before calling ElevenLabs the worker checks whether that file already exists; the same audio is never generated or paid for twice.
3. The admin previews and **publishes**. Each version is its own row in `lessons` (same `slug`, next `version`). A published row is never edited.
4. A child's progress always points at the lesson version they took, so later edits never corrupt history.
5. Editing a published lesson creates a new draft version. It goes live only when published.

### Lesson change request
1. A mentor submits a request: lesson, version, proposed change and reason.
2. Admins are notified. The admin approves or rejects it with a note.
3. On approval, the admin applies the change as a new draft version and publishes it (step 5 above). The mentor sees the outcome on their request.

### Mentor reassignment
- The old mentor loses access immediately.
- Remarks and history stay with the child and are visible to the new mentor.
- `children.mentor_id` holds the current mentor; every change is written to `audit_logs`, which is the assignment history.

### Child lifecycle
`active → inactive → archived`. Archived children are hidden but kept for the retention period. Erasure is a separate flow (see Compliance).

### Reports
1. A user requests one of the fixed report templates (2–3 templates; layouts never vary).
2. The job goes onto the queue.
3. A worker renders the EJS template to HTML, then converts it to PDF using headless Chromium (Playwright) with network access disabled.
4. The PDF is stored in a private S3 bucket under the job id. The app polls the job and then downloads it through a short-lived signed link. There is no reports table; the queue and S3 hold everything.

## Views
There are two visual worlds, and they never mix.

| | Work views | Child mode |
|---|---|---|
| Who | Admin, mentor, parent (incl. parent settings and child progress) | The child, inside a parent session |
| Look | Professional, clean, light theme | Interactive, playful, calm |
| Components | [BoardUI](https://www.boardui.com/) free MIT components only, no Pro (React Aria based, so keyboard and screen-reader support come built in): tables, forms, charts, sidebar, calendar | Our own components in `components/child/`, built for touch |
| Icons | BoardUI's icon set | [Mochi Icons](https://mochi-icons.com/) (`mochi-icons`, MIT, sticker style) |
| Layouts | `admin-layout`, `mentor-layout`, `parent-layout` | `learning-layout` (full screen) |

**Keeping them apart**
- Code lives in separate folders: `components/ui/` (BoardUI, added through its CLI) and `components/child/` (ours).
- If a work-view component isn't in BoardUI's free set, we build it ourselves in `components/ui/` with the same Tailwind v4 tokens, rather than buying Pro.
- An ESLint `no-restricted-imports` rule enforces it: `views/child/` and `components/child/` cannot import BoardUI, and nothing outside them can import `mochi-icons`. CI fails on a violation.
- The switch between worlds happens in one place only: the parent's "Start learning" action opens `learning-layout`, and leaving child mode needs the parent's PIN.

**Using Mochi Icons in child mode**
- Every icon has a word and a spoken audio label next to it. An icon is never the only way to understand a button.
- One icon means one thing everywhere: the same icon for "next", "replay audio" and "done" on every screen.
- Icon colour follows the child's sensory setting: the `primaryColor` prop uses a muted palette when "colour intensity" is low.
- Large touch targets (at least 64 × 64 px) and a limited number of icons per screen.

- The child's learning mode is interactive (lessons, games, rewards). Parent settings are not part of learning mode.
- Accessibility for autistic learners is a requirement, not a polish item:
  - sensory-safe: reduced motion, no flashing, no autoplay surprises
  - volume/mute control and captions alongside every audio clip
  - predictable, consistent layouts; no countdown timers; no negative feedback
  - large tap targets, tablet-first
  - WCAG 2.2 AA
  - per-child sensory settings (motion, sound level, colour intensity) set by the parent
- Reports use 2–3 fixed templates.

## Architecture
- **Runtime:** Bun (API and worker), with Hono as the HTTP framework.
  - Bun gives fast startup, a built-in test runner and built-in clients for Postgres (`Bun.sql`), S3 (`Bun.s3`) and Valkey/Redis (`Bun.redis`), so fewer dependencies.
  - Hono is small, fast and runtime-agnostic. If Bun ever blocks us, the same routes run on Node.
  - Spike these on Bun before committing (phase 0): `firebase-admin` token verification, BullMQ, Playwright PDF rendering. If Playwright misbehaves, only the report worker runs on Node.
  - `Bun.sql` behind PgBouncer (transaction mode) must have prepared statements turned off.
- **Language:** JavaScript, not TypeScript.
- **Database:** Postgres 18 + PgBouncer. Migrations are plain `.sql` files applied with dbmate.
- **Valkey:** queues (BullMQ), rate limiting and short-lived cache only. Lesson assets are not cached here; the CDN handles them.
- **Frontend:** Vite + React 19 with Tailwind CSS v4 + CSS modules (`.module.css`). Components from BoardUI's free MIT set only; no Pro components. Landing page: static (Next.js only if it grows beyond a few pages).
- **Validation:** Joi on every route (body, params, query).
- **Reports:** EJS → Playwright PDF, through the queue.
- **Media:** a private S3 bucket behind a CDN. Children get media through signed URLs/cookies. Admin uploads use presigned URLs with MIME type and size checks.
- **Auth:** Firebase Authentication. Each user's role lives in Postgres, never in what the client sends.
- **Logging and monitoring** (same stack as xam):
  - structured JSON logs (pino), with no personal data in logs
  - Dozzle for live container logs
  - Beszel for host and per-container CPU, RAM and network history
  - Autoheal restarts containers whose health check fails
  - Sentry for errors
  - Discord webhook for backup, restore-check and health alerts
- **Hosting:** a single Ubuntu VM. See Deployment and Foundation: Backup & Recovery.

## Environments (separated from day one)
Two environments: **local** is development, **prod** is the one deployment. There is no shared dev server; everything is tested locally before it reaches `main`.

| | Local (development) | Prod |
|---|---|---|
| Where | Each developer's laptop: `deploy.dccd/dev` | One VM |
| Domains | `localhost` | `*.<domain>` |
| Database | Docker Postgres with seed data | Postgres with real data |
| Auth | Firebase Auth Emulator (no real accounts) | Firebase project `dccd-prod` |
| Media storage | MinIO container (S3-compatible, same code path as `Bun.s3`) | S3 buckets `dccd-prod-media`, `dccd-prod-reports` |
| ElevenLabs | Separate low-quota dev key | Prod key |
| Backups | None | Full plan in Foundation: Backup & Recovery |
| Sentry | Off | On |
| Deploys | `docker compose up` + `bun run dev` | Merge to `main` + manual approval |

Rules:
- **Real data never leaves prod.** No prod database copies on laptops, not even to debug. Local uses seed data from `api.dccd/seeds/` and generated fake children.
- **Local touches no cloud resource that prod uses.** Auth is the emulator, storage is MinIO, so a local mistake cannot reach a real account or bucket.
- **Secrets are per environment.** Local `.env` files hold only local values; the prod `.env` lives only on the VM (mode 600).
- **`APP_ENV`** (`local` or `prod`) is a required env var, validated by Joi at boot. The app refuses to start if `APP_ENV=prod` points at a local database or the emulator, and refuses `APP_ENV=local` with prod credentials.
- **The frontend uses Vite's defaults:** `.env.development` for `vite` locally, `.env.production` for `vite build`.

**Release flow**
1. Feature branch, developed and tested locally.
2. Pull request into `main`. CI runs lint, tests and SonarQube; a lead approves.
3. Merge: CI builds images tagged `:<git-sha>` and `:prod` and pushes them to GHCR.
4. After a manual approval step in CI, `deploy-images.sh` runs on the prod VM: validate env, migrate, rolling restart.
5. Rollback: `deploy-images.sh --tag <sha>`.

With no shared test server, two habits matter: every migration is run against a fresh local database (`dbmate up` on the seed) in CI before merge, and every pull request has tests for the role and ownership rules it touches.

## Deployment (modelled on `xam-reloaded/server`)

```
                        internet
                           │
                Cloudflare (DNS, CDN, WAF, DDoS)
                           │
                   :80, :443 only (UFW: 22, 80, 443)
                           │
         host nginx: TLS, reverse proxy, load balancer
          │                 │                    │
   app.<domain>        api.<domain>       logs / stats.<domain>
   static SPA from     upstream dccd_api   Dozzle, Beszel
   /var/www            least_conn          (behind auth)
                      ┌────┴────┐
                   api-1      api-2       worker
                   :4001      :4002       (no port)
                      └────┬────┘            │
                 docker network: dccd-network
              ┌────────────┼─────────────┐
          PgBouncer ──► Postgres 18     Valkey
```

**Reverse proxy and TLS**
- nginx runs on the host, not in a container, so certificate renewal and per-site changes are one command each. Everything else runs in Docker.
- Wildcard Let's Encrypt certificate through Cloudflare DNS-01 (`certbot-dns-cloudflare`), renewed automatically.
- Site files are rendered from templates (`reverse-proxy.conf.tmpl`, `static.conf.tmpl`) by `install-nginx-sites.sh`, driven by one service list in `scripts/lib/common.sh`.
- Shared snippets:
  - `security-headers.conf`: HSTS, nosniff, referrer policy, frame-ancestors none.
  - `cloudflare-realip.conf`: trusts only Cloudflare ranges for the real client IP, so rate limits key on the user and not on a Cloudflare edge.
- Containers bind to `127.0.0.1` only. Docker-published ports bypass UFW, so nothing binds to `0.0.0.0`.

**Load balancer**
- nginx `upstream dccd_api` with `least_conn` across two API containers (`api-1`, `api-2`), `max_fails=3 fail_timeout=10s`, keep-alive connections to the upstream.
- Two replicas use more than one CPU core (Bun runs one main thread per process), and one replica keeps serving while the other restarts.
- **Rolling deploy:** recreate `api-1`, wait for `/health`, then recreate `api-2`. No downtime.
- nginx `limit_req` on `/v1/auth/*` as a first rate-limit layer, before the app's Valkey limiter.
- Scaling past one VM later: Cloudflare Load Balancing or a cloud load balancer in front of two VMs, with Postgres on a managed service or its own VM.

**Subdomains**

| Subdomain | Behind | Access |
|---|---|---|
| `api` | `upstream dccd_api` (api-1, api-2) | public |
| `app` | static SPA in `/var/www/app.<domain>` | public |
| `www` | static landing page | public |
| `logs` | Dozzle | Dozzle auth |
| `stats` | Beszel | Beszel account |

No pgweb or redis-commander on a public subdomain: the database holds children's data, so database access is by SSH tunnel only.

**Build and release** (same as xam)
- Images are built in CI from a clean checkout and pushed to GHCR, tagged `:<git-sha>` (immutable) plus `:dev` or `:prod` (see Release flow). VMs never build.
- `deploy-images.sh` on the VM: pull → validate `.env` with Joi inside the new image → run migrations as a one-shot container connected straight to Postgres (not PgBouncer) → rolling restart of `api-1`, `api-2`, then `worker`.
- Rollback: `deploy-images.sh --tag <sha>`. Rollback does not undo migrations, so migrations are written to be backward compatible with the previous release.
- Server size profiles (`small`, `medium`, `large`) set Postgres, PgBouncer and Valkey memory and pool sizes.
- Valkey runs with `maxmemory-policy noeviction`, because it is also the BullMQ broker and evicting queue keys would silently drop jobs.

## Security (built in from the start)
- **Role and ownership checks (the biggest risk):**
  - `rbac.js` middleware checks the role on every route.
  - Ownership is enforced inside the query, not only in the UI: a mentor's queries filter by `children.mentor_id`, and a parent's queries filter by `children.parent_id`.
  - Every role/ownership rule has a test that tries to read another user's child and expects a 403.
- **Auth:**
  - Verify the Firebase ID token on every request (firebase-admin) and check revocation on sensitive actions.
  - Middleware loads the user and role from Postgres.
- **Input:**
  - Joi on every route.
  - Rate limiting on auth and on expensive endpoints (report generation, audio generation).
  - Strict CORS and a CSP header.
- **EJS:** only `<%= %>` (escaped) for any user-entered data, such as remarks and names. `<%- %>` is allowed only for trusted partials.
- **Secrets:**
  - The ElevenLabs, Firebase admin and S3 keys live only on the server.
  - `.env` is never committed (gitleaks in pre-commit).
  - Production secrets are stored outside the repo.
- **Audit log:** append-only record of who created, changed, deleted or viewed child records, remarks, assignments and lessons.
- **Children's data:** child records are personal data about minors and include health information (diagnosis). Access is need-to-know only.

## Compliance
DCCD operates in India, so the Digital Personal Data Protection Act 2023 applies:
- Verifiable parental consent before any child data is stored. Consent is recorded with timestamp and version.
- No behavioural tracking, profiling or targeted ads on children.
- Parents can export their child's data and request erasure.
- A defined retention period for archived children, after which data is deleted.
- Confirm with DCCD whether they also serve users outside India (GDPR/COPPA would then apply).

## Foundation: Backup & Recovery (done in phase 0, before features)
We run on a single VM, so it is a single point of failure. We accept that only with a tested recovery plan.

**Targets**
- RPO (max data loss): 5 minutes.
- RTO (max downtime): 1 hour to restore on a fresh VM.

**Postgres**
- This is the one place we go further than xam. xam takes a nightly `pg_dump`, which means up to 24 hours of lost data. DCCD uses pgBackRest (or WAL-G) with continuous WAL archiving to object storage. This gives point-in-time recovery to any second within the retention window.
- A full backup weekly and differential backups daily.
- Retention: 30 days of point-in-time recovery.
- Backups go to a different region **and** a different account from production, so one compromised credential can't delete both.
- Backups are encrypted.

**Media and reports**
- S3 versioning on, plus cross-region replication for the lesson-media bucket.

**Valkey**
- AOF persistence on, so queued jobs survive a restart. Valkey holds nothing that can't be rebuilt.

**The VM itself**
- The VM is disposable: everything needed to rebuild it lives in `deploy.dccd` (Docker Compose, provisioning script, config templates).
- Production secrets are backed up separately in a secrets store.
- Nightly VM disk snapshots are a convenience on top of this, not the recovery plan.
- A nightly `pg_dump` to S3 is kept as a second, independent copy (as in xam).

**Proof**
- `deploy.dccd/backup/scripts/restore-pitr.sh` restores Postgres to a given timestamp on a fresh VM.
- `verify-restore.sh` runs from cron on the 1st of every month: restores the latest backup into a scratch database, checks row counts, drops it and posts the result to Discord (as in xam).
- A full restore drill on a fresh VM before launch and then quarterly. Each drill records the actual RTO in the wiki.
- Alerts:
  - a backup or WAL archive job failed
  - disk is above 80%
  - the uptime check failed

**Later (not phase 0):** a warm standby VM with streaming replication, once the business needs an RTO under 1 hour.

## Database schema
The schema is in `schema.sql` (becomes `api.dccd/migrations/0001_init.sql`). It has **7 tables**; anything a column, the queue, S3 or the audit log can hold does not get its own table.

| Table | Holds | Replaces |
|-------|-------|----------|
| `users` | Admins, mentors, parents. `role` column; `status = invited` until the Firebase invite is accepted. | invites |
| `children` | Profile, parent, current mentor, sensory settings, PIN, assigned lesson slugs, consent version and date. | consents, mentor assignments, lesson assignments |
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

Analytics (mentor performance, child progress) are read from materialized views refreshed by the worker, not computed live on every page load.

## Folder / codebase structure
Feature folders use the feature name as the file prefix, for example `lessons/lessons.controller.js`.

```
api.dccd/
  package.json
  Dockerfile
  docker-compose.yml             #api-1, api-2, worker, migrate (one-shot profile); joins dccd-network
  .env.example                   #every env var the app reads, incl. APP_ENV
  .github/workflows/
    ci.yml                       #lint, test, SonarQube on every PR
    release.yml                  #main: build, push, deploy prod after manual approval
  bunfig.toml
  .env.example
  config/
    index.js                     #reads env, validates it with Joi, exports one config object
  migrations/
    0001_init.sql
  seeds/
    dev.sql
  src/
    app.js                       #Hono app: middleware + v1 router
    middleware/
      request-id.js
      error.js
      auth.js                    #verifies Firebase ID token
      rbac.js                    #allow(['admin','mentor']) + ownership helpers
      validate.js                #Joi for body/params/query
      rate-limit.js              #Valkey-backed
    routes/
      v1/
        index.js                 #mounts every feature router
        auth/                    #me, accept invite
        users/                   #admin CRUD for mentors and parents, invites
        children/                #profile, consent, mentor, assigned lessons
        lessons/                 #versions + publish
        media/                   #presigned upload, signed read URLs
        audio/                   #request ElevenLabs generation
        learning/                #attempts, events, stars (child mode)
        remarks/
        change-requests/
        reports/
        analytics/
        audit/
          <feature>.route.js
          <feature>.controller.js
          <feature>.service.js
          <feature>.validation.js
          <feature>.constant.js
    jobs/
      audio-generation.job.js
      report.job.js
      remark-digest.job.js
      analytics-refresh.job.js
  common-service/
    db/                          #Bun.sql pool, transaction helper
    cache/                       #Valkey client
    queue/                       #BullMQ queues and worker bootstrap
    logger/                      #pino
    storage/                     #Bun.s3, presigned and signed URLs
    firebase/                    #firebase-admin init and token verify
    elevenlabs/
    report/
      templates/
        child-progress.ejs
        mentor-performance.ejs
        organisation-summary.ejs
      render.js                  #EJS -> HTML -> PDF
    notification/
    audit/
  test/
    <feature>.test.js            #bun test
  utils.js
  server.js                      #starts the HTTP server
  worker.js                      #starts queue consumers (same codebase, separate container)

app.dccd/
  package.json
  .env.development               #local API URL, Firebase emulator (public values only)
  .env.production                #prod API URL, Firebase web config (public values only)
  eslint.config.js               #no-restricted-imports keeps BoardUI and mochi-icons apart
  .github/workflows/
    ci.yml
    release.yml                  #vite build, upload to the prod VM's /var/www
  index.html
  vite.config.js                 #react + @tailwindcss/vite plugins
  public/
  src/
    main.jsx
    app.jsx
    routes.jsx
    index.css                    #@import "tailwindcss" (v4, CSS-first config)
    assets/
    components/
      ui/                        #BoardUI components (added via its CLI), work views only
      child/                     #our touch components for child mode, uses mochi-icons
        <component-name>/
          <component-name>.jsx
          <component-name>.module.css
      shared/                    #neither BoardUI nor mochi: providers, error boundary, audio player core
        <component-name>/
          <component-name>.jsx
          <component-name>.module.css
    layout/
      admin-layout/
      mentor-layout/
      parent-layout/
      learning-layout/           #child mode: full screen, sensory settings applied
    views/
      auth/                      #login, accept-invite
      admin/                     #dashboard, lessons, lesson-editor, mentors, parents, children, assignments, change-requests, reports, analytics, audit
      mentor/                    #dashboard, children, child-detail, change-requests
      parent/                    #dashboard, children, child-progress, consent, settings
      child/                     #home, lesson-player, rewards
    services/
      api.js                     #fetch wrapper, attaches Firebase token
      firebase.js
    hooks/
    utils/

deploy.dccd/                     #same layout as xam-reloaded/server
  README.md
  .env.example                   #copied to .env on the prod VM, mode 600
  database/
    docker-compose.yml           #postgres 18, pgbouncer, valkey
    config/
      pg_hba.conf
      init/
        01-extensions.sql
        02-roles.sql             #owner role + dccd_app
        03-pgbouncer-auth.sh
      profiles/
        small.conf
        medium.conf
        large.conf
  backup/
    docker-compose.yml           #pgbackrest
    pgbackrest.conf
    scripts/
      pg-dump-fallback.sh
      valkey-rdb-backup.sh
      verify-restore.sh          #monthly, posts to Discord
      restore-pitr.sh            #restore to a timestamp on a fresh VM
  monitoring/
    docker-compose.yml           #dozzle, beszel hub + agent, autoheal
  nginx/
    conf.d/
      connection-upgrade.conf
      upstream-api.conf          #upstream dccd_api: api-1, api-2, least_conn
    snippets/
      security-headers.conf
      cloudflare-realip.conf
      rate-limit.conf
    templates/
      reverse-proxy.conf.tmpl
      static.conf.tmpl
  scripts/
    lib/common.sh                #service list, env loading, helpers
    setup.sh                     #fresh Ubuntu -> docker, nginx, certbot, ufw, .env
    issue-certs.sh               #wildcard cert via Cloudflare DNS-01
    install-nginx-sites.sh
    install-cron.sh              #backups + monthly restore check
    start.sh
    stop.sh
    upgrade.sh                   #pull pinned infra images
    build-push.sh                #workstation/CI: build, push to GHCR
    deploy-images.sh             #VM: pull, validate env, migrate, rolling restart
    check-security-headers.sh
  runbooks/
    deploy.md
    rollback.md
    restore.md
    cloudflare-realip.md
  dev/
    docker-compose.yml           #local: postgres, valkey, minio, firebase auth emulator
    .env.example                 #local values only

wiki.dccd/
  decisions/                     #one file per architecture decision
  flows/
  runbooks/
    restore.md
    deploy.md
```

## Tooling
- **Pre-commit:**
  - zero comments in the codebase
  - gitleaks (no secrets or `.env` files)
  - lint and format
- **CI (not pre-commit, too slow):**
  - tests with coverage (`bun test --coverage --coverage-reporter=lcov`), fed to SonarQube
  - SonarQube scan with a quality gate on coverage
  - the merge is blocked if the gate fails
