#!/bin/sh
. "$(dirname "$0")/lib/common.sh"
require_root

ADMIN_USER="${1:?usage: harden.sh <admin-user> <admin-key.pub>}"
ADMIN_KEY="${2:?usage: harden.sh <admin-user> <admin-key.pub>}"

info "Installing fail2ban and automatic security updates"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq fail2ban python3-systemd unattended-upgrades
printf 'APT::Periodic::Update-Package-Lists "1";\nAPT::Periodic::Unattended-Upgrade "1";\n' > /etc/apt/apt.conf.d/20auto-upgrades
printf '[sshd]\nenabled = true\nbackend = systemd\nmaxretry = 5\nfindtime = 10m\nbantime = 1h\n' > /etc/fail2ban/jail.d/speechomania.local
systemctl enable --now fail2ban >/dev/null
systemctl restart fail2ban

if ! swapon --show | grep -q /swapfile; then
  info "Adding 2 GB swap"
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile >/dev/null
  swapon /swapfile
fi
grep -q '^/swapfile ' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
printf 'vm.swappiness = 10\n' > /etc/sysctl.d/90-speechomania.conf
sysctl -q --system

add_user() {
  id "$1" >/dev/null 2>&1 || adduser --disabled-password --gecos "" "$1" >/dev/null
  install -d -m 700 -o "$1" -g "$1" "/home/$1/.ssh"
  install -m 600 -o "$1" -g "$1" "$2" "/home/$1/.ssh/authorized_keys"
}

info "Creating $ADMIN_USER (full sudo)"
add_user "$ADMIN_USER" "$ADMIN_KEY"
printf '%s ALL=(ALL) NOPASSWD:ALL\n' "$ADMIN_USER" > /etc/sudoers.d/90-admin
chmod 440 /etc/sudoers.d/90-admin
visudo -cq

info "SSH: keys only, no root login"
cat > /etc/ssh/sshd_config.d/10-speechomania.conf <<SSHD
PermitRootLogin no
PasswordAuthentication no
KbdInteractiveAuthentication no
PubkeyAuthentication yes
AllowUsers $ADMIN_USER
MaxAuthTries 3
X11Forwarding no
AllowAgentForwarding no
SSHD
sshd -t
systemctl reload ssh

ok "Hardened. Connect as $ADMIN_USER from now on; root login is off."
