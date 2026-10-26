#!/bin/sh
. "$(dirname "$0")/lib/common.sh"
require_root
load_env

NGINX="$DEPLOY_DIR/nginx"
install -d /etc/nginx/snippets
install -m 644 "$NGINX/conf.d/connection-upgrade.conf" /etc/nginx/conf.d/connection-upgrade.conf
install -m 644 "$NGINX/conf.d/speechomania-api.conf" /etc/nginx/conf.d/speechomania-api.conf
install -m 644 "$NGINX/snippets/security-headers.conf" /etc/nginx/snippets/security-headers.conf
install -m 644 "$NGINX/snippets/cloudflare-realip.conf" /etc/nginx/snippets/cloudflare-realip.conf
BASE_DOMAIN="$BASE_DOMAIN" envsubst '${BASE_DOMAIN}' < "$NGINX/snippets/tls.conf" > /etc/nginx/snippets/speechomania-tls.conf
rm -f /etc/nginx/sites-enabled/default

for entry in $SERVICES; do
  name=$(echo "$entry" | cut -d: -f1)
  kind=$(echo "$entry" | cut -d: -f2)
  port_var=$(echo "$entry" | cut -d: -f3)
  if [ "$name" = "www" ]; then fqdn="$BASE_DOMAIN www.$BASE_DOMAIN"; root="www.$BASE_DOMAIN"; else fqdn="$name.$BASE_DOMAIN"; root="$fqdn"; fi
  port=""
  [ -n "$port_var" ] && port=$(eval "echo \${$port_var:-}")
  target="/etc/nginx/sites-available/speechomania-$name.conf"
  SERVICE_FQDN="$fqdn" envsubst '${SERVICE_FQDN}' < "$NGINX/templates/http-redirect.conf.tmpl" > "$target"
  SERVICE_FQDN="$fqdn" UPSTREAM_PORT="$port" BASE_DOMAIN="$BASE_DOMAIN" envsubst '${SERVICE_FQDN} ${UPSTREAM_PORT} ${BASE_DOMAIN}' < "$NGINX/templates/$kind.conf.tmpl" >> "$target"
  if [ "$kind" = "static" ]; then
    sed -i "s#root /var/www/$fqdn/current;#root /var/www/$root/current;#" "$target"
    install -d -m 755 "/var/www/$root/releases"
  fi
  ln -sf "$target" "/etc/nginx/sites-enabled/speechomania-$name.conf"
done

nginx -t
systemctl reload nginx
ok "nginx sites installed and reloaded"
