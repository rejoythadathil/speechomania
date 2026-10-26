# Runbook: deploy to prod

Normal releases go through CI. This page covers what CI does and how to run it by hand if CI is down.

## Normal release
1. Pull request into `main`. CI runs lint, tests, migrations on a fresh database and SonarQube. A lead approves.
2. Merge. CI builds the API image, tags it `:<git-sha>` and `:prod`, and pushes it to GHCR. The frontend repo builds with `vite build`.
3. Approve the manual "deploy to prod" step in CI.
4. CI runs `deploy-images.sh` on the VM and uploads the frontend build to `/var/www/app.<domain>`.

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
scp app-dist.tar.gz deploy@<vm>:/tmp/
ssh deploy@<vm> "sudo sh /opt/speechomania/deploy.speechomania/scripts/deploy-app.sh /tmp/app-dist.tar.gz"
```
The previous five frontend releases are kept in `/var/www/app.<domain>/releases/`.

## Check after every deploy
- [ ] `https://api.<domain>/health` is OK
- [ ] No new errors in the API logs (Dozzle) for 15 minutes
- [ ] Dozzle shows `speechomania-api-1` and `speechomania-api-2` running with no restart loop
- [ ] Sign in as a test admin and open one child record

If any check fails, roll back ([rollback.md](rollback.md)).
