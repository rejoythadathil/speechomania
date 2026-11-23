# Deployment (modelled on `xam-reloaded/server`)

```
                        internet
                           │
                Cloudflare (DNS, CDN, WAF, DDoS)
                           │
                   :80, :443 only (UFW: 22, 80, 443)
                           │
         host nginx: TLS, reverse proxy, load balancer
          │                 │                    │
   app.<domain>        api.<domain>       logs / stats.<domain>
   static SPA from     upstream speechomania_api   Dozzle, Beszel
   /var/www            least_conn          (behind auth)
                      ┌────┴────┐
                   api-1      api-2       worker (later: audio, reports)
                   :4001      :4002       (no port)
                      └────┬────┘            │
                 docker network: speechomania-network
              ┌────────────┼─────────────┐
          PgBouncer ──► Postgres 18     Valkey
```

**Reverse proxy and TLS**
- nginx runs on the host, not in a container, so certificate renewal and per-site changes are one command each. Everything else runs in Docker.
- Wildcard Let's Encrypt certificate through Cloudflare DNS-01 (`certbot-dns-cloudflare`), renewed automatically.
- Site files are rendered from templates (`reverse-proxy.conf.tmpl`, `static.conf.tmpl`) by `install-nginx-sites.sh`, driven by one service list in `scripts/lib/common.sh`.
- Shared snippets:
  - `security-headers.conf`: HSTS, nosniff, referrer policy, frame-ancestors none.
  - `cloudflare-realip.conf`: trusts only Cloudflare ranges for the real client IP, so rate limits key on the user and not on a Cloudflare edge.
- Containers bind to `127.0.0.1` only. Docker-published ports bypass UFW, so nothing binds to `0.0.0.0`.

**Load balancer**
- nginx `upstream speechomania_api` with `least_conn` across two API containers (`api-1`, `api-2`), `max_fails=3 fail_timeout=10s`, keep-alive connections to the upstream.
- Two replicas use more than one CPU core (Bun runs one main thread per process), and one replica keeps serving while the other restarts.
- **Rolling deploy:** recreate `api-1`, wait for `/health`, then recreate `api-2`. No downtime.
- nginx `limit_req` on `/v1/auth/*` as a first rate-limit layer, before the app's Valkey limiter.
- Scaling past one VM later: Cloudflare Load Balancing or a cloud load balancer in front of two VMs, with Postgres on a managed service or its own VM.

**Subdomains**

| Subdomain | Behind | Access |
|---|---|---|
| `api` | `upstream speechomania_api` (api-1, api-2) | public |
| `app` | static SPA in `/var/www/app.<domain>` | public |
| `www` | static landing page | public |
| `logs` | Dozzle | Dozzle auth |
| `stats` | Beszel | Beszel account |

No pgweb or redis-commander on a public subdomain: the database holds children's data, so database access is by SSH tunnel only.

**Build and release** (same as xam)
- Images are built in CI from a clean checkout and pushed to GHCR, tagged `:<git-sha>` (immutable) plus `:dev` or `:prod` (see Release flow). VMs never build.
- `deploy-images.sh` on the VM: pull → validate `.env` with Joi inside the new image → run migrations as a one-shot container connected straight to Postgres (not PgBouncer) → rolling restart of `api-1`, then `api-2`, each waiting for its health check. The worker joins this list when audio and report jobs are built.
- Rollback: `deploy-images.sh --tag <sha>`. Rollback does not undo migrations, so migrations are written to be backward compatible with the previous release.
- Server size profiles (`small`, `medium`, `large`) set Postgres, PgBouncer and Valkey memory and pool sizes.
- Valkey runs with `maxmemory-policy noeviction`, because it is also the BullMQ broker and evicting queue keys would silently drop jobs.

## Single-host mode (current prod)
Prod runs on one DigitalOcean Droplet (`speechomania-prod`, BLR1, 2 vCPU, 2 GB, 60 GB, $18 a month) at `speechomania.com` (DNS on GoDaddy: `@` A record to the Droplet, `www` CNAME to `@`, no Cloudflare in front). `www.speechomania.com` and the old `speechomania.deadendengineers.co.in` are served by the same site through `SITE_ALIASES`.
- `SINGLE_HOST=1` in the deploy `.env`: one nginx site (`single.conf.tmpl`) serves the SPA at `/` and proxies `/v1/` and `/health` to the API upstream. The app's `VITE_API_URL` is empty, so it calls the API on whichever name it was opened from.
- `SITE_ALIASES` (space-separated) adds names to that site and to its certificate.
- Certificate: Let's Encrypt HTTP-01 (`certbot --standalone`, nginx stopped for a few seconds by certbot's hooks), one certificate named after `BASE_DOMAIN` covering it and every alias. No wildcard and no Cloudflare token.
- `SERVER_PROFILE=tiny` (Postgres 256 MB shared buffers), PgBouncer pool 15, Valkey 128 MB, 2 GB swap.
- `scripts/harden.sh <admin> <admin.pub>` runs first: a named admin with sudo, SSH keys only, no root login, fail2ban on SSH, automatic security updates.
- Every merge to `main` deploys: CI pushes `speechomania-api:prod` and `speechomania-app:prod` to GHCR and the VM's `auto-deploy.sh` cron (every 2 minutes) pulls and deploys whichever changed. No production environment and no SSH secrets in GitHub.
- Dozzle and Beszel are not public: `ssh -L 8080:127.0.0.1:8080 -L 8083:127.0.0.1:8083 speechomania`.
- Media is stored on the Droplet in RustFS (`storage/` stack, S3 API on `127.0.0.1:9000`, bucket `MEDIA_BUCKET`). nginx serves `/<bucket>/` on the same host, so the API's signed URLs (`S3_ENDPOINT=https://<domain>`) work in the browser. The bucket stays private; only signed URLs read it. Media and database backups off the box come later.

**Demo data on prod** (until real families join). The seed is not in the image, so it is mounted:
```bash
cd /opt/speechomania/api.speechomania
sudo docker compose run --rm --no-deps -T -v $PWD/seeds:/app/seeds:ro api-1 bun seeds/dev.js --demo
sudo docker compose run --rm --no-deps -T -v $PWD/seeds:/app/seeds:ro api-1 sh -c 'DATABASE_URL=$DATABASE_OWNER_URL bun seeds/demo-remove.js'
```
Removal runs as the database owner because the app role cannot delete audit entries.

**Lesson audio on prod.** Audio is stored by a hash of the text and voice (`audio/<hash>.mp3` plus `.json` word timings), so clips recorded locally are reused on prod at no ElevenLabs cost. The server's `ELEVENLABS_VOICE_ID` and `ELEVENLABS_MODEL` must match the machine that recorded them (default Jessica, `cgSgspJ2msm6clMCkdW9`, `eleven_multilingual_v2`); `grep ELEVENLABS .env` on the server shows any override.
1. Locally, after `bun run audio <slug>` for every changed lesson: `cd api.speechomania && bun run audio:export ~/voice` (every recording the published lessons use, plus `manifest.json` naming the voice).
2. Copy it up: `rsync -a ~/voice/ <server>:/opt/speechomania/voice/`.
3. On the server, from `/opt/speechomania/api.speechomania`:
```bash
sudo docker compose run --rm --no-deps -T -v /opt/speechomania/voice:/voice:ro api-1 bun scripts/audio-import.js /voice
sudo docker compose run --rm --no-deps -T -v $PWD/seeds:/app/seeds:ro -e ELEVENLABS_API_KEY=reuse-only api-1 bun scripts/lessons-sync.js --voice --publish --assign
```
The import refuses to run when the manifest's voice differs from the server's and skips files already in the bucket. `--voice` attaches stored recordings to every line missing them and never calls ElevenLabs (also on lessons the sync keeps because they were edited in the admin screens); a line with no recording stays on the device voice and the sync prints `(N lines without voice)`. Assignments are by slug, so children keep their lessons and progress. Assessments copy their questions when saved, so re-save any assessment built before the voice arrived.
