#!/bin/sh
. "$(dirname "$0")/lib/common.sh"
require_root
load_env

[ -n "${CLOUDFLARE_API_TOKEN:-}" ] || fail "CLOUDFLARE_API_TOKEN is empty in $ENV_FILE"
install -m 600 /dev/null /etc/letsencrypt/cloudflare.ini
printf 'dns_cloudflare_api_token = %s\n' "$CLOUDFLARE_API_TOKEN" > /etc/letsencrypt/cloudflare.ini

certbot certonly --non-interactive --agree-tos --email "$LETSENCRYPT_EMAIL" \
  --dns-cloudflare --dns-cloudflare-credentials /etc/letsencrypt/cloudflare.ini \
  --dns-cloudflare-propagation-seconds 30 \
  --cert-name "$BASE_DOMAIN" -d "$BASE_DOMAIN" -d "*.$BASE_DOMAIN"

ok "Certificate issued for $BASE_DOMAIN and *.$BASE_DOMAIN. Renewal runs from certbot's timer."
