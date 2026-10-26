#!/bin/sh
. "$(dirname "$0")/common.sh"
require_root
TARGET="${2:-}"
[ "${1:-}" = "--time" ] && [ -n "$TARGET" ] || fail 'usage: restore-pitr.sh --time "2026-11-02 10:41:00+00"'

info "Stopping the API so nothing writes during the restore"
docker compose --project-directory "$API_DIR" stop api-1 api-2 2>/dev/null || true
info "Stopping Postgres"
compose database stop db

info "Restoring to $TARGET"
compose database run --rm --no-deps --entrypoint sh db -c "chown -R postgres:postgres /var/lib/postgresql && su postgres -c \"pgbackrest --stanza=speechomania --delta --type=time --target='$TARGET' --target-action=promote restore\""

info "Starting Postgres"
compose database up -d db
for _ in $(seq 1 60); do
  [ "$(docker inspect -f '{{.State.Health.Status}}' speechomania-db)" = healthy ] && break
  sleep 5
done
docker exec speechomania-db psql -U "$PG_ADMIN_USER" -d "$PG_DB_NAME" -Atc "SELECT 'latest audit entry: ' || max(created_at) FROM audit_logs"

notify "Point-in-time restore to $TARGET finished. API is still stopped."
ok "Restored. Check the data (runbook step 5), then start the API with: sh scripts/deploy-images.sh --tag <last good sha> --no-migrate"
