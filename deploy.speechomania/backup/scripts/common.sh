BACKUP_SCRIPTS=$(cd "$(dirname "$0")" && pwd)
DEPLOY_DIR=$(cd "$BACKUP_SCRIPTS/../.." && pwd)
. "$DEPLOY_DIR/scripts/lib/common.sh"
load_env
pgbackrest() { docker exec -u postgres speechomania-db pgbackrest --stanza=speechomania "$@"; }
