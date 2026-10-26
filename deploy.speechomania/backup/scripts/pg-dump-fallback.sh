#!/bin/sh
. "$(dirname "$0")/common.sh"
KEY="pg-dump/$(date -u +%Y/%m/%d)/speechomania-$(date -u +%H%M%S).dump"
if docker exec speechomania-db pg_dump -U "$PG_ADMIN_USER" -d "$PG_DB_NAME" -Fc \
  | AWS_ACCESS_KEY_ID="$BACKUP_S3_ACCESS_KEY_ID" AWS_SECRET_ACCESS_KEY="$BACKUP_S3_SECRET_ACCESS_KEY" \
    aws s3 cp - "s3://$BACKUP_S3_BUCKET/$KEY" --region "$BACKUP_S3_REGION" --endpoint-url "https://$BACKUP_S3_ENDPOINT" --sse AES256; then
  ok "pg_dump uploaded to $KEY"
else
  notify "Nightly pg_dump FAILED"
  fail "pg_dump failed"
fi
