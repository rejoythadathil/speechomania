#!/bin/sh
. "$(dirname "$0")/common.sh"
info "Creating the pgBackRest stanza and checking WAL archiving"
pgbackrest stanza-create
pgbackrest check
info "Taking the first full backup"
pgbackrest --type=full backup
pgbackrest info
ok "Backups are running. Install cron next: sudo sh scripts/install-cron.sh"
