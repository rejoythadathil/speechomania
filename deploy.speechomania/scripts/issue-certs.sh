#!/bin/sh
. "$(dirname "$0")/lib/common.sh"
require_root
load_env

if [ "${SINGLE_HOST:-0}" = 1 ]; then
  if [ -n "${LETSENCRYPT_EMAIL:-}" ]; then contact="--email $LETSENCRYPT_EMAIL"; else contact="--register-unsafely-without-email"; fi
  certbot certonly --non-interactive --agree-tos $contact --standalone \
    --pre-hook "systemctl stop nginx" --post-hook "systemctl start nginx" \
    --cert-name "$BASE_DOMAIN" -d "$BASE_DOMAIN" $(for alias in ${SITE_ALIASES:-}; do printf -- "-d %s " "$alias"; done)
  ok "Certificate issued for $BASE_DOMAIN. Renewal runs from certbot's timer."
  exit 0
fi

[ -n "${CLOUDFLARE_API_TOKEN:-}" ] || fail "CLOUDFLARE_API_TOKEN is empty in $ENV_FILE"
install -m 600 /dev/null /etc/letsencrypt/cloudflare.ini
printf 'dns_cloudflare_api_token = %s\n' "$CLOUDFLARE_API_TOKEN" > /etc/letsencrypt/cloudflare.ini

certbot certonly --non-interactive --agree-tos --email "$LETSENCRYPT_EMAIL" \
  --dns-cloudflare --dns-cloudflare-credentials /etc/letsencrypt/cloudflare.ini \
  --dns-cloudflare-propagation-seconds 30 \
  --cert-name "$BASE_DOMAIN" -d "$BASE_DOMAIN" -d "*.$BASE_DOMAIN"

ok "Certificate issued for $BASE_DOMAIN and *.$BASE_DOMAIN. Renewal runs from certbot's timer."
