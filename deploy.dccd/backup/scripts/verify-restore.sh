#!/bin/sh
. "$(dirname "$0")/common.sh"
NAME="dccd-restore-check"
docker rm -f "$NAME" >/dev/null 2>&1 || true

info "Restoring the latest backup into a throwaway container"
if ! docker run --rm --name "$NAME" --network dccd-network \
  -e PGBACKREST_REPO1_S3_ENDPOINT="$BACKUP_S3_ENDPOINT" \
  -e PGBACKREST_REPO1_S3_REGION="$BACKUP_S3_REGION" \
  -e PGBACKREST_REPO1_S3_BUCKET="$BACKUP_S3_BUCKET" \
  -e PGBACKREST_REPO1_S3_KEY="$BACKUP_S3_ACCESS_KEY_ID" \
  -e PGBACKREST_REPO1_S3_KEY_SECRET="$BACKUP_S3_SECRET_ACCESS_KEY" \
  -e PGBACKREST_REPO1_CIPHER_PASS="$BACKUP_ENCRYPTION_PASSPHRASE" \
  -v "$DEPLOY_DIR/database/config/pgbackrest.conf:/etc/pgbackrest/pgbackrest.conf:ro" \
  --entrypoint sh dccd-postgres:18 -c '
    set -e
    mkdir -p /tmp/restore && chown postgres:postgres /tmp/restore && chmod 700 /tmp/restore
    su postgres -c "pgbackrest --stanza=dccd --pg1-path=/tmp/restore --type=immediate --target-action=promote restore"
    su postgres -c "pg_ctl -D /tmp/restore -o \"-c archive_mode=off -c port=5433\" -w -t 600 start"
    psql -h /var/run/postgresql -p 5433 -U '"$PG_ADMIN_USER"' -d '"$PG_DB_NAME"' -Atc "SELECT (SELECT count(*) FROM users) || \" users, \" || (SELECT count(*) FROM children) || \" children, \" || (SELECT count(*) FROM audit_logs) || \" audit rows\""
  '; then
  notify "Monthly restore check FAILED. Treat backups as untrusted until it passes."
  fail "Restore check failed"
fi
notify "Monthly restore check passed"
ok "Restore check passed"
