#!/bin/sh
. "$(dirname "$0")/lib/common.sh"
require_root

cat > /etc/cron.d/dccd <<CRON
SHELL=/bin/sh
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
0 2 * * 0 root $DEPLOY_DIR/backup/scripts/backup.sh full >> /var/log/dccd/backup.log 2>&1
0 2 * * 1-6 root $DEPLOY_DIR/backup/scripts/backup.sh diff >> /var/log/dccd/backup.log 2>&1
30 3 * * * root $DEPLOY_DIR/backup/scripts/pg-dump-fallback.sh >> /var/log/dccd/pg-dump.log 2>&1
0 4 1 * * root $DEPLOY_DIR/backup/scripts/verify-restore.sh >> /var/log/dccd/verify-restore.log 2>&1
*/15 * * * * root $DEPLOY_DIR/backup/scripts/health-check.sh >> /var/log/dccd/health.log 2>&1
CRON
chmod 644 /etc/cron.d/dccd
ok "Cron installed at /etc/cron.d/dccd"
