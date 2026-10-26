# Runbook: restore Postgres

Targets: lose at most 5 minutes of data (RPO), back up within 1 hour on a fresh VM (RTO). Point-in-time recovery covers the last 30 days. See [08-backup-recovery.md](../08-backup-recovery.md).

## Automatic monthly check
`verify-restore.sh` runs from cron on the 1st of each month. It restores the latest backup into a scratch database, checks row counts, drops it and posts the result to Discord. A failure there is treated as an incident: backups are not trusted until it passes again.

## Point-in-time restore
Use when data is lost or corrupted, or the VM is gone.

1. **Pick the target time** (UTC), just before the bad event. Write it down.
2. **Stop writes** on the old VM if it still runs. The restore script also stops `api-1` and `api-2` itself.
3. **Get a VM:** the existing one, or a fresh one set up with [prod-first-setup.md](prod-first-setup.md) steps 1–5.
4. **Restore:**
   ```bash
   sudo sh /opt/dccd/deploy.dccd/backup/scripts/restore-pitr.sh --time "2026-11-02 10:41:00+00"
   ```
5. **Verify** before opening traffic:
   - [ ] row counts for `users`, `children`, `attempts`, `remarks` look right
   - [ ] the latest `audit_logs` entry is just before the target time
   - [ ] sign in as a test admin and open one child record
6. **Start the app:** `deploy-images.sh --tag <last good sha> --no-migrate`.
7. **Point DNS** at the new VM if it changed (Cloudflare, proxied).
8. **Re-enable backups** and take a fresh full backup.
9. **Record** the start and end times and the actual RTO in the wiki.

## If pgBackRest is unusable
Restore the nightly `pg_dump` from the backup bucket (`s3://<bucket>/pg-dump/YYYY/MM/DD/`) with `pg_restore`. This loses everything since that dump (up to 24 hours), so it is the last resort.

## Drills
- Before launch: full restore on a fresh VM.
- Then quarterly. A drill that takes longer than 1 hour is a bug to fix.
