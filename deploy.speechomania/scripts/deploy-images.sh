#!/bin/sh
. "$(dirname "$0")/lib/common.sh"
load_env

TAG=prod
MIGRATE=1
while [ $# -gt 0 ]; do
  case "$1" in
    --tag) TAG="$2"; shift ;;
    --no-migrate) MIGRATE=0 ;;
    *) fail "Unknown option $1" ;;
  esac
  shift
done

IMAGE="ghcr.io/$GHCR_OWNER/speechomania-api:$TAG"
api() { docker compose --project-directory "$API_DIR" "$@"; }

wait_healthy() {
  for _ in $(seq 1 30); do
    status=$(docker inspect -f '{{.State.Health.Status}}' "$1" 2>/dev/null || echo missing)
    [ "$status" = "healthy" ] && return 0
    sleep 2
  done
  return 1
}

info "Pulling $IMAGE"
docker pull "$IMAGE"
PREVIOUS=$(docker image inspect -f '{{.Id}}' speechomania-api:current 2>/dev/null || true)
docker tag "$IMAGE" speechomania-api:current

info "Validating $API_DIR/.env against the new image"
if ! api run --rm --no-deps api-1 bun scripts/check-env.js; then
  [ -n "$PREVIOUS" ] && docker tag "$PREVIOUS" speechomania-api:current
  fail "Env check failed. Nothing was restarted."
fi

if [ "$MIGRATE" -eq 1 ]; then
  info "Running migrations"
  api --profile migrate run --rm migrate || { [ -n "$PREVIOUS" ] && docker tag "$PREVIOUS" speechomania-api:current; notify "Migration failed for $TAG"; fail "Migration failed. Nothing was restarted."; }
fi

for service in api-1 api-2; do
  info "Restarting $service (the other replica keeps serving)"
  api up -d --no-deps --force-recreate "$service"
  if ! wait_healthy "speechomania-$service"; then
    notify "Deploy of $TAG stopped: speechomania-$service is not healthy"
    fail "speechomania-$service did not become healthy. The other replica is still on the previous image. Roll back with --tag <previous sha>."
  fi
  ok "$service healthy"
done

notify "Deployed api $TAG"
ok "Deployed $TAG"
