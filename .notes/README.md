# Speechomania platform notes

The plan and runbooks for the Speechomania autism learning platform. The codebase has zero comments, so this folder is where decisions, flows and procedures live.

## Built so far (2026-10-25)
- **Foundation:** one repo, github.com/rejoythadathil/speechomania, holding `api.speechomania`, `app.speechomania` and `deploy.speechomania`, with a root Git hook and CI workflows.
- **Docker:** local stack (Postgres 18, Valkey, RustFS, Firebase Auth Emulator) and the prod layout (database with pgBackRest, PgBouncer, Valkey, monitoring, nginx reverse proxy and load balancer, backup and deploy scripts).
- **Role-based access with full create, read, update and delete:** people, children, lessons with versions, remarks, change requests, audit log. Backend and frontend, with 25 API integration tests.
- **Not built yet:** child mode, audio and report workers, media uploads, invite emails. See [10-folder-structure.md](10-folder-structure.md#not-built-yet-next-phases).

Live diagrams of roles, schema, flows and infra: https://claude.ai/artifact/D8tf1JVd6dCtNDvGS3ioGi

## Plan
1. [Product, roles and permissions](01-product.md)
2. [Core flows](02-flows.md)
3. [Views: BoardUI and child mode](03-views.md)
4. [Architecture](04-architecture.md)
5. [Environments: local and prod](05-environments.md)
6. [Deployment: nginx, load balancer, releases](06-deployment.md)
7. [Security and compliance](07-security-compliance.md)
8. [Backup and recovery](08-backup-recovery.md)
9. [Database](09-database.md) and [schema.sql](schema.sql)
10. [Folder structure](10-folder-structure.md)
11. [Tooling](11-tooling.md)

[Decision log](decisions.md)

## Runbooks
| When | Runbook |
|---|---|
| Setting up a laptop | [local-setup.md](runbooks/local-setup.md) |
| Building the prod VM the first time | [prod-first-setup.md](runbooks/prod-first-setup.md) |
| Releasing | [deploy.md](runbooks/deploy.md) |
| A release broke something | [rollback.md](runbooks/rollback.md) |
| Data lost, corrupted, or the VM is gone | [restore.md](runbooks/restore.md) |
