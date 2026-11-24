# backup

Deleted children, people, mentor notes, lesson drafts and assessment drafts wait here for the retention period (60 or 90 days, default 90), where an admin can restore them. After that they are deleted for good. Admin only.

| Method | Path | Input | Returns |
|---|---|---|---|
| GET | `/backup` | | `{ retention_days, counts: { children, people, notes, lessons, assessments } }` |
| GET | `/backup/settings` | | `{ retention_days }` |
| PUT | `/backup/settings` | `{ retention_days: 60 \| 90 }` | `{ retention_days }`; written as a `settings.backup_updated` audit entry, and the latest one is the setting |
| GET | `/backup/:type` | `page`, `page_size` | page of `{ id, type, title, detail, deleted_at, deleted_by, purge_on, days_left }`, newest first |
| POST | `/backup/:type/:id/restore` | | `{ id, type, restored }`; audited as `backup.restored`. 404 if the item is not in Backup |

States: active → soft deleted (in Backup) → restored (active again) or, once `days_left` reaches 0, deleted (gone from the database).

- Soft deleted means `deleted_at` set for children, people and notes (as before), and `status: 'soft_deleted'` for lesson and assessment drafts. Every delete also writes `metadata.deleted` (`at`, `by`, the status before, and for mentors the children that lost them).
- Restore puts the previous status back. A child whose parent is deleted, or a note whose child is deleted, is 409 until that is restored first; a lesson draft is 409 if the lesson has a newer draft. A restored person can sign in again, and a restored mentor gets back the children that still have no mentor.
- Deleted for good: notes and lesson and assessment drafts are removed; a child is removed with its game results and notes; a person's row is reduced to "Deleted account" with no email, phone or sign-in (the row stays because the activity history points at it), and their Firebase account is deleted. Each run writes `backup.purged` with the ids.
- The purge runs in the API every hour (`startPurgeSchedule` from `server.js`); a Valkey lock lets only one container run it. Shortening the period purges the older items on the next run.
- A parent's erasure request (`POST /users/:id/erase`) is immediate and never goes to Backup.

Files: `route/index.js`, `controller/index.js`, `service/index.js`, `validation/index.js`, `constants/index.js`, `exception/index.js`, `utils/index.js` (`deletedMark`, `withoutMark`, `daysLeft`, `purgeOn`, `cutoff`), `tests/index.test.js`.
