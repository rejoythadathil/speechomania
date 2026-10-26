#!/bin/sh
. "$(dirname "$0")/common.sh"
USED=$(df --output=pcent / | tail -1 | tr -dc '0-9')
[ "$USED" -lt 80 ] || notify "Disk is ${USED}% full"
pgbackrest check >/dev/null 2>&1 || notify "WAL archiving check FAILED"
curl -fsS -o /dev/null --max-time 5 http://127.0.0.1:4001/health || notify "api-1 health check failed"
curl -fsS -o /dev/null --max-time 5 http://127.0.0.1:4002/health || notify "api-2 health check failed"
