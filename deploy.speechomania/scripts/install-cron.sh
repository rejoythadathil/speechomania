#!/bin/sh
. "$(dirname "$0")/lib/common.sh"
require_root

cat > /etc/cron.d/speechomania <<CRON
SHELL=/bin/sh
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
0 2 * * 0 root $DEPLOY_DIR/backup/scripts/backup.sh full >> /var/log/speechomania/backup.log 2>&1
0 2 * * 1-6 root $DEPLOY_DIR/backup/scripts/backup.sh diff >> /var/log/speechomania/backup.log 2>&1
30 3 * * * root $DEPLOY_DIR/backup/scripts/pg-dump-fallback.sh >> /var/log/speechomania/pg-dump.log 2>&1
0 4 1 * * root $DEPLOY_DIR/backup/scripts/verify-restore.sh >> /var/log/speechomania/verify-restore.log 2>&1
*/15 * * * * root $DEPLOY_DIR/backup/scripts/health-check.sh >> /var/log/speechomania/health.log 2>&1
CRON
chmod 644 /etc/cron.d/speechomania
ok "Cron installed at /etc/cron.d/speechomania"
