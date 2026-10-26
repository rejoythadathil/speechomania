# Foundation: Backup & Recovery (done in phase 0, before features)
We run on a single VM, so it is a single point of failure. We accept that only with a tested recovery plan.

**Targets**
- RPO (max data loss): 5 minutes.
- RTO (max downtime): 1 hour to restore on a fresh VM.

**Postgres**
- This is the one place we go further than xam. xam takes a nightly `pg_dump`, which means up to 24 hours of lost data. Speechomania uses pgBackRest (or WAL-G) with continuous WAL archiving to object storage. This gives point-in-time recovery to any second within the retention window.
- A full backup weekly and differential backups daily.
- Retention: 30 days of point-in-time recovery.
- Backups go to a different region **and** a different account from production, so one compromised credential can't delete both.
- Backups are encrypted.

**Media and reports**
- S3 versioning on, plus cross-region replication for the lesson-media bucket.

**Valkey**
- AOF persistence on, so queued jobs survive a restart. Valkey holds nothing that can't be rebuilt.

**The VM itself**
- The VM is disposable: everything needed to rebuild it lives in `deploy.speechomania` (Docker Compose, provisioning script, config templates).
- Production secrets are backed up separately in a secrets store.
- Nightly VM disk snapshots are a convenience on top of this, not the recovery plan.
- A nightly `pg_dump` to S3 is kept as a second, independent copy (as in xam).

**Proof**
- pgBackRest is installed inside the Postgres image (`deploy.speechomania/database/postgres/Dockerfile`), because Postgres itself runs `archive_command` to push WAL. There is no separate backup container.
- `deploy.speechomania/backup/scripts/restore-pitr.sh` restores Postgres to a given timestamp on a fresh VM.
- `verify-restore.sh` runs from cron on the 1st of every month: restores the latest backup into a scratch database, checks row counts, drops it and posts the result to Discord (as in xam).
- A full restore drill on a fresh VM before launch and then quarterly. Each drill records the actual RTO in the wiki.
- Alerts:
  - a backup or WAL archive job failed
  - disk is above 80%
  - the uptime check failed

**Later (not phase 0):** a warm standby VM with streaming replication, once the business needs an RTO under 1 hour.
