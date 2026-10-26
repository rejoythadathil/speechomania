#!/bin/sh
. "$(dirname "$0")/lib/common.sh"
load_env
docker network inspect speechomania-network >/dev/null 2>&1 || docker network create speechomania-network
info "Starting database stack"
compose database up -d --build
info "Starting monitoring stack"
compose monitoring up -d
if [ -f "$API_DIR/.env" ] && docker image inspect speechomania-api:current >/dev/null 2>&1; then
  info "Starting API"
  docker compose --project-directory "$API_DIR" up -d api-1 api-2
fi
ok "Running. Check: docker ps --format 'table {{.Names}}\t{{.Status}}'"
