# Runbook: deploy to prod

Normal releases go through CI. This page covers what CI does and how to run it by hand if CI is down.

## Normal release
1. Pull request into `main`. CI runs lint, tests and migrations on a fresh database.
2. Merge. CI builds the API image and the app image (the `vite build` output as `app-dist.tar.gz` in a `scratch` image), tags each `:<git-sha>` and `:prod`, and pushes them to GHCR.
3. Within two minutes the VM's cron job (`auto-deploy.sh`, installed once with `--install`) sees the new `:prod` image, runs `deploy-images.sh` for the API and `deploy-app.sh` for the app. CI holds no SSH key. Log: `/var/log/speechomania/deploy.log`.

## What `deploy-images.sh` does
1. Pulls the image.
2. Validates `.env` with Joi inside the new image. A missing or wrong value stops the deploy before anything changes.
3. Runs `prisma migrate deploy` as a one-shot container connected directly to Postgres (not PgBouncer).
4. Rolling restart: recreate `api-1`, wait for its health check; then `api-2`. nginx keeps serving from whichever replica is up. If a replica fails its health check the script stops, the other replica keeps serving the previous version, and Discord gets an alert.

## By hand (CI down)
On a workstation, from the repo root:
```bash
sh deploy.speechomania/scripts/build-push.sh
```
On the VM:
```bash
sudo sh /opt/speechomania/deploy.speechomania/scripts/deploy-images.sh
```
Frontend: build locally (`bun run build`), then copy `dist` as a tarball and switch to it:
```bash
tar -czf app-dist.tar.gz -C dist .
scp app-dist.tar.gz speechomania:/tmp/
ssh speechomania "sudo sh /opt/speechomania/deploy.speechomania/scripts/deploy-app.sh /tmp/app-dist.tar.gz"
```
The previous five frontend releases are kept in `/var/www/<app host>/releases/`.

## Check after every deploy
- [ ] `https://<domain>/health` (single host) or `https://api.<domain>/health` is OK
- [ ] No new errors in the API logs (Dozzle) for 15 minutes
- [ ] Dozzle shows `speechomania-api-1` and `speechomania-api-2` running with no restart loop
- [ ] Sign in as a test admin and open one child record

If any check fails, roll back ([rollback.md](rollback.md)).
