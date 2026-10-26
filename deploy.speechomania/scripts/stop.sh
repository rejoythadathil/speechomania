#!/bin/sh
. "$(dirname "$0")/lib/common.sh"
load_env
[ -f "$API_DIR/docker-compose.yml" ] && docker compose --project-directory "$API_DIR" stop api-1 api-2 || true
compose monitoring down
compose database down
ok "Stopped. Data volumes are kept."
