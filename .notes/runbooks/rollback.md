# Runbook: roll back a release

## App rollback (most cases)
1. Find the last good commit sha (GHCR tags or `git log main`).
2. On the VM:
   ```bash
   sudo sh /opt/dccd/deploy.dccd/scripts/deploy-images.sh --tag <sha> --no-migrate
   ```
3. If the UI changed, point the frontend back at the previous release:
   ```bash
   ls -1t /var/www/app.<domain>/releases/
   sudo ln -sfn /var/www/app.<domain>/releases/<previous> /var/www/app.<domain>/current
   ```
4. Run the post-deploy checks from [deploy.md](deploy.md).

Rollback only swaps containers. It does **not** undo migrations, which is why every migration must stay compatible with the previous release (add columns, don't rename or drop in the same release).

## A migration damaged data
1. Stop writes: `docker compose --project-directory /opt/dccd/api.dccd stop api-1 api-2`.
2. Prefer a forward fix: a new migration that repairs the data, released through [deploy.md](deploy.md).
3. Only if data is lost and can't be repaired: point-in-time restore to just before the migration ([restore.md](restore.md)). Everything written after that moment is lost, so record the time window in the incident note.
