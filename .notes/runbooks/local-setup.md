# Runbook: local development setup

Local is the development environment. It uses no cloud resource that prod uses, and never holds real data.

## Prerequisites
- Bun 1.3.14 or newer
- Docker with Compose
- gitleaks (`brew install gitleaks`), required by the pre-commit hooks

## Ports
| Port | Service |
|---|---|
| 4100 | API |
| 5173 | Frontend (Vite) |
| 7101 | Postgres |
| 7102 | Valkey |
| 7103 / 7104 | RustFS S3 API / console |
| 7105 / 7106 | Firebase Auth Emulator / emulator UI |

## Steps
1. Start the local services:
   ```bash
   cd deploy.dccd/dev
   cp .env.example .env
   docker compose up -d --build
   ```
2. Start the API (first terminal):
   ```bash
   cd api.dccd
   cp .env.example .env
   bun install
   bun run migrate
   bun run seed
   bun run dev
   ```
3. Start the frontend (second terminal):
   ```bash
   cd app.dccd
   bun install
   bun run dev
   ```
4. Open http://localhost:5173 and sign in. Every seed account uses the password `dccd-local-123`:

   | Email | Role |
   |---|---|
   | `admin@dccd.local` | Admin |
   | `mentor.rahul@dccd.local` | Mentor (Aarav, Diya) |
   | `mentor.fathima@dccd.local` | Mentor (Ethan) |
   | `parent.priya@dccd.local` | Parent (Aarav, Diya) |
   | `parent.joseph@dccd.local` | Parent (Ethan) |
   | `parent.lakshmi@dccd.local` | Parent (Meera, no mentor yet) |

## Checks before a pull request
```bash
cd api.dccd && bun run lint && bun test
cd app.dccd && bun run lint && bun run build
```
The API tests create their own `dccd_test` database and sign in through the emulator, so the local stack must be running.

## Adding a BoardUI component
```bash
cd app.dccd
bun run boardui:add select
bun run boardui:jsx
```
Only use components from BoardUI's free list. The second command converts the new files to JSX and strips comments.

## Rules
- Never copy a prod database, prod `.env` or prod bucket contents to a laptop.
- `APP_ENV` must be `local`. The API refuses to start if it sees prod settings.

## Reset
```bash
cd deploy.dccd/dev
docker compose down -v
docker compose up -d
cd ../../api.dccd && bun run migrate && bun run seed
```
