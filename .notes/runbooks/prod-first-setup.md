# Runbook: first-time prod VM setup

One-time setup of the prod VM, following the `xam-reloaded/server` pattern. See [06-deployment.md](../06-deployment.md) for the layout.

## Before you start
- [ ] Ubuntu 24.04 LTS VM with a public IP, and a `deploy` user with sudo
- [ ] Domain on Cloudflare, plus an API token with `Zone:DNS:Edit`
- [ ] S3 buckets: `dccd-prod-media`, `dccd-prod-reports` (versioning on, media replicated to a second region)
- [ ] Backup bucket in a **different region and a different account** from prod, with its own access key
- [ ] Firebase project `dccd-prod`: enable Email/Password sign-in and download a service account key
- [ ] Discord webhook URL for alerts
- [ ] GitHub: an environment named `production` with required reviewers, and secrets `PROD_SSH_KEY`, `PROD_SSH_HOST`, `PROD_SSH_KNOWN_HOSTS` in both repos

## Steps
1. Clone the repo (it holds `deploy.dccd` and `api.dccd`, so the paths below match):
   ```bash
   sudo mkdir -p /opt/dccd && sudo chown deploy:deploy /opt/dccd
   git clone https://github.com/rejoyt/autismsynergies.git /opt/dccd
   cd /opt/dccd/deploy.dccd
   ```
2. Install packages, generate `.env` with fresh passwords, create the Dozzle login and turn on the firewall (22, 80, 443 only):
   ```bash
   sudo sh scripts/setup.sh
   ```
   Store the printed Dozzle password and `BACKUP_ENCRYPTION_PASSPHRASE` in the team password manager now.
3. Fill the empty values in `/opt/dccd/deploy.dccd/.env`: domain, backup S3 keys, Cloudflare token, Discord webhook.
4. Put the Firebase key in place:
   ```bash
   sudo install -m 600 firebase-admin.json /opt/dccd/secrets/firebase-admin.json
   ```
5. Point DNS at the VM in Cloudflare (`api`, `app`, `www`, `logs`, `stats` and the apex), proxied.
6. Certificate and nginx sites (reverse proxy, load balancer upstream, security headers):
   ```bash
   sudo sh scripts/issue-certs.sh
   sudo sh scripts/install-nginx-sites.sh
   ```
7. Start the database and monitoring stacks:
   ```bash
   sudo sh scripts/start.sh
   ```
8. Start backups and check that WAL archiving reaches S3:
   ```bash
   sudo sh backup/scripts/init-stanza.sh
   sudo sh scripts/install-cron.sh
   ```
9. Create the API env file (mode 600, never committed) from `api.dccd/.env.production.example`, using the passwords from step 2:
   ```bash
   install -m 600 /opt/dccd/api.dccd/.env.production.example /opt/dccd/api.dccd/.env
   ```
10. First deploy: log in to GHCR, then deploy the API and the frontend ([deploy.md](deploy.md)).
11. Create the first admin. Invite them from the Firebase console, then insert the matching row:
    ```bash
    docker exec -it dccd-db psql -U dccd_owner -d dccd -c "INSERT INTO users (firebase_uid, email, full_name, role, status) VALUES ('<uid>', '<email>', '<name>', 'admin', 'active')"
    ```
    Everyone else is invited from the app.
12. Finish first-run setup in Beszel (`stats.<domain>`): add the system (host `beszel-agent`), copy its key into `BESZEL_KEY` in `.env`, then `sudo sh scripts/start.sh` again.
13. Run a full restore drill ([restore.md](restore.md)) **before launch** and record the time it took.

## Done when
- [ ] `https://api.<domain>/health` returns `{"status":"ok"}`, and still does with `api-1` stopped
- [ ] The app loads at `https://app.<domain>` and the first admin can sign in
- [ ] `sudo sh backup/scripts/verify-restore.sh` passes and posts to Discord
- [ ] Restore drill completed within 1 hour
