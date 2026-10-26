#!/bin/sh
. "$(dirname "$0")/common.sh"
TYPE="${1:?usage: backup.sh full|diff}"
if pgbackrest --type="$TYPE" backup; then
  ok "$TYPE backup finished"
else
  notify "pgBackRest $TYPE backup FAILED"
  fail "$TYPE backup failed"
fi
