#!/bin/sh
. "$(dirname "$0")/lib/common.sh"
require_root
load_env

if [ "${1:-}" = "--install" ]; then
  printf 'SHELL=/bin/sh\nPATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin\n*/2 * * * * root flock -n /run/speechomania-deploy.lock sh %s/scripts/auto-deploy.sh >> /var/log/speechomania/deploy.log 2>&1\n' "$DEPLOY_DIR" > /etc/cron.d/speechomania-deploy
  chmod 644 /etc/cron.d/speechomania-deploy
  ok "Auto-deploy runs every 2 minutes. Log: /var/log/speechomania/deploy.log"
  exit 0
fi

STATE=/var/lib/speechomania
install -d -m 700 "$STATE"

changed() {
  docker pull -q "$1" >/dev/null 2>&1 || return 1
  id=$(docker image inspect -f '{{.Id}}' "$1")
  [ "$id" != "$(cat "$STATE/$2" 2>/dev/null)" ]
}

API_IMAGE="ghcr.io/$GHCR_OWNER/speechomania-api:prod"
if changed "$API_IMAGE" api; then
  info "$(date -u +%FT%TZ) new api image"
  sh "$DEPLOY_DIR/scripts/deploy-images.sh" --tag prod && echo "$id" > "$STATE/api"
fi

APP_IMAGE="ghcr.io/$GHCR_OWNER/speechomania-app:prod"
if changed "$APP_IMAGE" app; then
  info "$(date -u +%FT%TZ) new app image"
  container=$(docker create "$APP_IMAGE" none)
  docker cp "$container:/app-dist.tar.gz" /tmp/app-dist.tar.gz
  docker rm "$container" >/dev/null
  sh "$DEPLOY_DIR/scripts/deploy-app.sh" /tmp/app-dist.tar.gz "$(echo "$id" | cut -c8-19)" && echo "$id" > "$STATE/app"
  rm -f /tmp/app-dist.tar.gz
fi
