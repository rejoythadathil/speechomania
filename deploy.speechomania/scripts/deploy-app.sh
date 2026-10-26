#!/bin/sh
. "$(dirname "$0")/lib/common.sh"
require_root
load_env

ARCHIVE="${1:?usage: deploy-app.sh <app-dist.tar.gz> [release-name]}"
RELEASE="${2:-$(date -u +%Y%m%d%H%M%S)}"
SITE="/var/www/app.$BASE_DOMAIN"

install -d -m 755 "$SITE/releases/$RELEASE"
tar -xzf "$ARCHIVE" -C "$SITE/releases/$RELEASE"
[ -f "$SITE/releases/$RELEASE/index.html" ] || fail "The archive has no index.html at its root"
ln -sfn "$SITE/releases/$RELEASE" "$SITE/current.next"
mv -T "$SITE/current.next" "$SITE/current"
ls -1dt "$SITE"/releases/* | tail -n +6 | xargs -r rm -rf
ok "app.$BASE_DOMAIN now serves release $RELEASE"
