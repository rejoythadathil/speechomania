# Folder / codebase structure
One repository (github.com/rejoyt/autismsynergies) with the three apps side by side, these notes, a root `.githooks/pre-commit` (env files, comments in CSS/SQL/Prisma/configs, gitleaks, eslint for the app that changed) and root `.github/workflows/` (`api-ci`, `api-release`, `app-ci`, `app-release`; each runs only when its folder changes, and deploy jobs run only when the repository variable `DEPLOY_ENABLED` is `true`). Feature folders use the feature name as the file prefix, for example `children/children.service.js`. A `.constant.js` file exists only when a feature has constants.

## api.speechomania (Bun + Hono)
```
api.speechomania/
  package.json                   #scripts: dev, start, migrate, migrate:new, migrate:check, migrate:status, seed, test, lint, check-env
  bunfig.toml                    #bun test preloads test/setup.js
  eslint.config.js               #includes the no-comments rule
  Dockerfile                     #bun alpine image, runs as the bun user, health check on /health
  docker-compose.yml             #prod: api-1 (:4001), api-2 (:4002), migrate (one-shot profile); joins speechomania-network
  .env.example                   #local values
  .env.production.example        #prod shape (APP_ENV=prod, pgbouncer, TRUST_PROXY=true)
  config/index.js                #reads env, validates with Joi, refuses prod/local mix-ups
  prisma.config.mjs              #Prisma config in plain JS: schema path, migrations path, DATABASE_OWNER_URL
  prisma/
    schema.prisma                #the 7-table schema (source of truth)
    migrations/                  #comment-free SQL, applied by prisma migrate deploy
  scripts/
    migration-new.js             #bun run migrate:new <name>: prisma migrate dev --create-only, then strips Prisma's comments
    check-env.js                 #used by deploy-images.sh before any restart
  seeds/dev.js                   #local only: 6 accounts, 4 children, 3 lessons, remarks, a change request
  server.js                      #starts the HTTP server, graceful shutdown
  utils.js                       #HttpError, json(), paging and search helpers
  common-service/
    db/                          #Bun.sql pool (prepare: false)
    cache/                       #Valkey client
    logger/                      #pino with personal data redacted
    firebase/                    #token verification, invites, disable accounts
    audit/                       #audit() helper used inside every write transaction
  src/
    app.js                       #middleware order: request id, context, security headers, CORS, body limit, rate limit
    middleware/
      context.js                 #client IP (X-Real-IP behind nginx) and request log
      auth.js                    #verifies the Firebase token, loads the user, activates invited users
      rbac.js                    #allow('admin', 'mentor')
      validate.js                #Joi for params, query and body
      rate-limit.js              #per-IP per-minute counter in Valkey
      error.js                   #maps errors and Postgres codes to clean JSON
    routes/v1/
      index.js                   #every route requires sign-in
      auth/                      #GET /auth/me
      dashboard/                 #role-aware counts
      users/                     #admin: invite, list, edit, remove mentors, parents, admins
      children/                  #scoped list and detail, create, edit, mentor, lessons, archive
      remarks/                   #per child; parents see shared only; unread inbox for admins
      lessons/                   #versions, publish, new draft, archive
      change-requests/           #mentor requests, admin review (approval creates a draft)
      audit/                     #admin: read the audit log
  test/                          #25 integration tests against Postgres and the Firebase emulator
```

## app.speechomania (Vite + React 19 + Tailwind v4 + BoardUI)
```
app.speechomania/
  package.json                   #scripts: dev, build, lint, boardui:add, boardui:jsx
  vite.config.js                 #react + @tailwindcss/vite, @ alias to src
  eslint.config.js               #no-comments, react hooks, BoardUI / mochi-icons boundary
  index.html                     #Plus Jakarta Sans + Bricolage Grotesque
  .env.development               #local API and Firebase emulator (public values only)
  .env.production                #prod API URL and Firebase web config (public values only)
  AGENTS.md                      #BoardUI's design rules for coding agents
  scripts/boardui-to-jsx.js      #converts components added by the BoardUI CLI from TSX to JSX
  src/
    main.jsx                     #providers: direction, auth, toasts, router
    routes.jsx                   #RequireAuth and RequireRole guards
    index.css                    #BoardUI styles + brand.css
    assets/speechomania-mark.svg
    styles/
      globals.css, theme.css, typography.css   #BoardUI (comments stripped)
      brand.css                  #Speechomania colours and fonts on top of BoardUI tokens
    components/
      base/                      #BoardUI free components (JSX)
      foundations/               #BoardUI internals (direction, icons)
      shared/                    #ours for work views: modal, panel, stat card, toast, select field, status chip
      child/                     #(child mode, next phase) our touch components with mochi-icons
    layout/
      work-layout/               #sidebar shell for admin, mentor and parent; menu in navigation.js
      learning-layout/           #(child mode, next phase)
    hooks/                       #use-auth, use-resource, use-debounced
    services/                    #api.js (fetch + Firebase token), firebase.js
    utils/                       #format.js (ours), cx.js and helpers (BoardUI)
    views/
      auth/login.jsx
      admin/                     #people (mentors, parents, admins), audit log
      shared/                    #dashboard, children, child detail, lessons, lesson editor, change requests
      child/                     #(child mode, next phase)
```

## deploy.speechomania (same layout as xam-reloaded/server)
```
deploy.speechomania/
  .env.example                   #prod VM env; setup.sh copies it and generates the passwords
  dev/                           #local: postgres 18, valkey, rustfs, firebase auth emulator (ports 7101–7106)
  database/
    docker-compose.yml           #postgres (with pgBackRest), pgbouncer, valkey
    postgres/Dockerfile          #postgres:18 + pgbackrest
    config/                      #postgresql.conf, pg_hba.conf, pgbackrest.conf, init/01-roles.sh, profiles/{small,medium,large}.conf
  backup/scripts/
    init-stanza.sh               #first-time: create stanza, check archiving, first full backup
    backup.sh                    #full (Sunday) or diff (other days), from cron
    pg-dump-fallback.sh          #nightly second copy to S3
    verify-restore.sh            #monthly: restore latest backup in a throwaway container, count rows, post to Discord
    restore-pitr.sh              #restore to a timestamp
    health-check.sh              #every 15 min: disk, WAL archiving, both API replicas
  monitoring/docker-compose.yml  #autoheal, dozzle, beszel hub + agent
  nginx/
    conf.d/                      #websocket map; upstream speechomania_api (least_conn, api-1 + api-2) and rate-limit zone
    snippets/                    #security headers, Cloudflare real IP, TLS
    templates/                   #http-redirect, api (load balanced), proxy (dozzle, beszel), static (SPA with CSP)
  scripts/
    lib/common.sh                #env loading, service list, Discord notify
    setup.sh, issue-certs.sh, install-nginx-sites.sh, install-cron.sh
    start.sh, stop.sh
    build-push.sh                #workstation fallback for CI: build and push the API image
    deploy-images.sh             #pull, validate env, migrate, rolling restart with health checks
    deploy-app.sh                #unpack a frontend build into releases/<sha> and switch the symlink
```

## Not built yet (next phases)
- Child mode: `learning-layout`, `views/child`, `components/child` with Mochi Icons, lesson player, attempts and rewards.
- Worker and queue: ElevenLabs audio generation, EJS → PDF reports, daily remark digest email.
- Media uploads to S3 through presigned URLs.
- Email delivery for invites (today the admin copies the link).
- Data export and erasure actions.
- Sentry error reporting (planned in Architecture; not wired yet).
