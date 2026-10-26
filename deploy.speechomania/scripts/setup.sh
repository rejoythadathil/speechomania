#!/bin/sh
. "$(dirname "$0")/lib/common.sh"
require_root

if [ -f "$ENV_FILE" ]; then
  fail "$ENV_FILE already exists. Setup runs once; edit the file instead."
fi

info "Installing host packages"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq ca-certificates curl gnupg nginx certbot python3-certbot-dns-cloudflare gettext-base ufw rsync unzip jq

if ! command -v docker >/dev/null 2>&1; then
  info "Installing Docker"
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" > /etc/apt/sources.list.d/docker.list
  apt-get update -qq
  apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-compose-plugin
fi

if ! command -v aws >/dev/null 2>&1; then
  info "Installing AWS CLI"
  curl -fsSL "https://awscli.amazonaws.com/awscli-exe-linux-$(uname -m).zip" -o /tmp/awscli.zip
  unzip -q /tmp/awscli.zip -d /tmp && /tmp/aws/install && rm -rf /tmp/aws /tmp/awscli.zip
fi

info "Writing $ENV_FILE with generated secrets"
secret() { openssl rand -hex 24; }
sed -e "s/^PG_ADMIN_PASSWORD=$/PG_ADMIN_PASSWORD=$(secret)/" \
    -e "s/^PG_APP_PASSWORD=$/PG_APP_PASSWORD=$(secret)/" \
    -e "s/^VALKEY_PASSWORD=$/VALKEY_PASSWORD=$(secret)/" \
    -e "s/^BACKUP_ENCRYPTION_PASSPHRASE=$/BACKUP_ENCRYPTION_PASSPHRASE=$(secret)/" \
    "$DEPLOY_DIR/.env.example" > "$ENV_FILE"
chmod 600 "$ENV_FILE"

info "Creating the Dozzle login"
DOZZLE_PASSWORD=$(secret)
docker run --rm amir20/dozzle:v10.5.1 generate admin --password "$DOZZLE_PASSWORD" --name "Speechomania admin" > "$DEPLOY_DIR/monitoring/dozzle-users.yml"
chmod 600 "$DEPLOY_DIR/monitoring/dozzle-users.yml"

info "Firewall: SSH, HTTP, HTTPS only"
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

docker network inspect speechomania-network >/dev/null 2>&1 || docker network create speechomania-network
install -d -m 700 /opt/speechomania/secrets
install -d -m 755 /var/log/speechomania

ok "Setup done. Next:"
echo "  1. Fill the empty values in $ENV_FILE (domain, S3 backup keys, Cloudflare token, Discord webhook)."
echo "  2. Store BACKUP_ENCRYPTION_PASSPHRASE in the team password manager. Backups cannot be restored without it."
echo "     Dozzle login (logs.<domain>): admin / $DOZZLE_PASSWORD  (store it now; it is not saved anywhere else)"
echo "  3. Put the Firebase service account key at /opt/speechomania/secrets/firebase-admin.json (chmod 600)."
echo "  4. sudo sh scripts/issue-certs.sh && sudo sh scripts/install-nginx-sites.sh && sudo sh scripts/start.sh"
