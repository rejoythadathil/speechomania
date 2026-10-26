set -eu

DEPLOY_DIR="${DEPLOY_DIR:-$(cd "$(dirname "$0")/.." && pwd)}"
ENV_FILE="$DEPLOY_DIR/.env"
API_DIR="${API_DIR:-/opt/speechomania/api.speechomania}"

SERVICES="api:api: app:static: www:static: logs:proxy:DOZZLE_PORT stats:proxy:BESZEL_PORT"

info() { printf '\033[1;34m→ %s\033[0m\n' "$*"; }
ok() { printf '\033[1;32m✓ %s\033[0m\n' "$*"; }
fail() { printf '\033[1;31m✗ %s\033[0m\n' "$*" >&2; exit 1; }

require_root() {
  [ "$(id -u)" -eq 0 ] || fail "Run as root (sudo)."
}

load_env() {
  [ -f "$ENV_FILE" ] || fail "Missing $ENV_FILE. Run scripts/setup.sh first."
  set -a
  . "$ENV_FILE"
  set +a
}

notify() {
  [ -n "${DISCORD_WEBHOOK_URL:-}" ] || return 0
  curl -fsS -H 'content-type: application/json' -d "{\"content\":\"[speechomania $(hostname -s)] $*\"}" "$DISCORD_WEBHOOK_URL" >/dev/null || true
}

compose() {
  stack="$1"
  shift
  docker compose --project-directory "$DEPLOY_DIR/$stack" --env-file "$ENV_FILE" "$@"
}
