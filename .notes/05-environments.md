# Environments (separated from day one)
Two environments: **local** is development, **prod** is the one deployment. There is no shared dev server; everything is tested locally before it reaches `main`.

| | Local (development) | Prod |
|---|---|---|
| Where | Each developer's laptop: `deploy.dccd/dev` | One VM |
| Domains | `localhost` | `*.<domain>` |
| Database | Docker Postgres with seed data | Postgres with real data |
| Auth | Firebase Auth Emulator (no real accounts) | Firebase project `dccd-prod` |
| Media storage | RustFS container (S3-compatible, same code path as `Bun.s3`; the MinIO image is no longer published) | S3 buckets `dccd-prod-media`, `dccd-prod-reports` |
| ElevenLabs | Separate low-quota dev key | Prod key |
| Backups | None | Full plan in Foundation: Backup & Recovery |
| Sentry | Off | On |
| Deploys | `docker compose up` + `bun run dev` | Merge to `main` + manual approval |

Rules:
- **Real data never leaves prod.** No prod database copies on laptops, not even to debug. Local uses seed data from `api.dccd/seeds/` and generated fake children.
- **Local touches no cloud resource that prod uses.** Auth is the emulator, storage is RustFS, so a local mistake cannot reach a real account or bucket.
- **Secrets are per environment.** Local `.env` files hold only local values; the prod `.env` lives only on the VM (mode 600).
- **`APP_ENV`** (`local` or `prod`) is a required env var, validated by Joi at boot. The app refuses to start if `APP_ENV=prod` points at a local database or the emulator, and refuses `APP_ENV=local` with prod credentials.
- **The frontend uses Vite's defaults:** `.env.development` for `vite` locally, `.env.production` for `vite build`.

**Release flow**
1. Feature branch, developed and tested locally.
2. Pull request into `main`. CI runs lint, tests and SonarQube; a lead approves.
3. Merge: CI builds images tagged `:<git-sha>` and `:prod` and pushes them to GHCR.
4. After a manual approval step in CI, `deploy-images.sh` runs on the prod VM: validate env, migrate, rolling restart.
5. Rollback: `deploy-images.sh --tag <sha>`.

With no shared test server, two habits matter: every migration is applied to an empty database in CI before merge (`bun run migrate`), and every pull request has tests for the role and ownership rules it touches.
