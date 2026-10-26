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
