# Speechomania

A learning platform for autistic children. Therapists' lessons become calm, picture-based games that a child plays at home. Mentors follow each child's progress, and parents see remarks and scores.

Live: https://speechomania.deadendengineers.co.in

## What it does
| Role | Can |
|---|---|
| **Admin** | Manage people and children, build and publish lessons, build and configure assessments, review change requests, read the audit log |
| **Mentor** | Follow their own children, write remarks (shared with parents or internal), assign lessons and assessments, see results, request lesson changes |
| **Parent** | Signs in straight to child mode: the child picks a game and plays. "Parent area" opens remarks, progress and scores for their own children |

**Child mode** has 12 games (Feed the shark, Balloon pop, Word bubbles, Memory cards, Word squish, Weigh it up, Put it there, Word train, Ask me, Why?, Who can't?, Story).
- **Sensory-safe:** reduced motion, quiet sound and low colour, set per child.
- **Voice:** recorded lines with word-by-word captions.
- **Feedback:** no timers and no negative feedback. Stars and badges reward play.

**Assessments** are built from published lesson questions. Scoring, tries, hints, retakes, the data collected and who sees the score are all set per assessment.

## Repository
| Folder | What |
|---|---|
| `api.speechomania/` | API: Bun, Hono, Prisma Client on Postgres, Valkey, Firebase Admin, S3 storage, ElevenLabs voice |
| `app.speechomania/` | Web app: React 19, Vite, Tailwind v4, BoardUI (free) for work views, its own components for child mode |
| `deploy.speechomania/` | Docker stacks (Postgres with pgBackRest, PgBouncer, Valkey, RustFS storage, monitoring), host nginx, deploy and backup scripts, local dev stack |
| `.notes/` | Product plan, architecture, decisions and runbooks. The code has no comments, so the reasons live here |
| `.github/workflows/` | CI and release workflow for each app |
| `.githooks/` | Pre-commit: env-file guard, comment check, gitleaks, lint |

Lesson source material (`lessons/`) and generated art originals (`images-generated/`) stay on your machine and are never committed.

## Run it locally
You need Bun 1.3.14+, Docker with Compose and gitleaks (`brew install gitleaks`).

```bash
cd deploy.speechomania/dev && cp .env.example .env && docker compose up -d --build

cd api.speechomania && cp .env.example .env && bun install
bun run migrate && bun run seed && bun run dev

cd app.speechomania && bun install && bun run dev
```

Open http://localhost:5173. Local seed accounts all use the password `speechomania-local-123` (local only, never on prod):

| Email | Role |
|---|---|
| `admin@speechomania.local` | Admin |
| `mentor.rahul@speechomania.local` | Mentor |
| `parent.priya@speechomania.local` | Parent (child mode for Aarav and Diya) |

| Service | Port |
|---|---|
| API | 4100 |
| App | 5173 |
| Postgres | 7101 |
| Valkey | 7102 |
| RustFS (S3) | 7103 |
| Firebase Auth emulator | 7105 |

The full local setup is in [.notes/runbooks/local-setup.md](.notes/runbooks/local-setup.md).

## Everyday commands
| Where | Command | Does |
|---|---|---|
| api | `bun run dev` | API with reload |
| api | `bun test` | Integration and unit tests (needs the local stack) |
| api | `bun run lint` / `bun run format` | ESLint and Prettier check / rewrite |
| api | `bun run seed` | Demo data (local; `--demo` adds tagged, sign-in-free demo data on prod) |
| api | `bun run migrate:new <name>` then `bun run migrate` | New migration from `prisma/schema.prisma`, then apply |
| api | `bun run migrate:check` | Fails if the schema and migrations differ |
| api | `bun run audio <slug>` | Record a lesson's voice into a new draft |
| app | `bun run dev` / `bun run build` | Dev server / production build |
| app | `bun run lint` / `bun run format` | ESLint and Prettier |

Before a pull request: `bun test` and `bun run lint` in `api.speechomania`, and `bun run lint` and `bun run build` in `app.speechomania`.

## Deploying
Prod runs on one DigitalOcean Droplet (2 vCPU, 2 GB) with host nginx, Let's Encrypt and Docker. The app and API share one host: the app at `/` and the API at `/v1`.

1. Merge to `main`.
2. CI builds `speechomania-api:prod` and `speechomania-app:prod` and pushes them to GHCR.
3. Within two minutes, the server's `auto-deploy.sh` cron pulls the new images. It runs migrations, restarts the two API replicas one at a time and switches the app release.

GitHub holds no server keys. Server setup, hardening, demo data, lesson audio and rollback are covered in [.notes/06-deployment.md](.notes/06-deployment.md) and [.notes/runbooks/](.notes/runbooks/).

## House rules
These are the short version; [CLAUDE.md](CLAUDE.md) has the full list.
- JavaScript only, with no comments in code. Reasons go in [.notes/decisions.md](.notes/decisions.md).
- No mock data: every value on screen comes from the database through the API. Demo data comes only from the seed.
- 8 tables, all queries through Prisma Client, scoped by role and ownership. Every list is paginated on the server.
- Child mode uses downloaded or generated art only, never hand-drawn. Each asset's source and licence are in [.notes/assets.md](.notes/assets.md).
- `.env` files are never committed. Commits and pull requests carry no AI co-author lines.

## Documentation
| Topic | File |
|---|---|
| Product, roles, flows | [01-product](.notes/01-product.md), [02-flows](.notes/02-flows.md) |
| Screens and child mode | [03-views](.notes/03-views.md) |
| Architecture and environments | [04-architecture](.notes/04-architecture.md), [05-environments](.notes/05-environments.md) |
| Deployment, security, backups | [06-deployment](.notes/06-deployment.md), [07-security-compliance](.notes/07-security-compliance.md), [08-backup-recovery](.notes/08-backup-recovery.md) |
| Database and folder layout | [09-database](.notes/09-database.md), [10-folder-structure](.notes/10-folder-structure.md) |
| Assessments | [11-assessments](.notes/11-assessments.md) |
| Art prompts | [image-prompts](.notes/image-prompts.md), [sprite-prompts](.notes/sprite-prompts.md) |
| Decisions | [decisions](.notes/decisions.md) |
