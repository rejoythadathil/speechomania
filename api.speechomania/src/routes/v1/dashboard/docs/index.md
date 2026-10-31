# dashboard

Role-aware counts built around "which child needs attention today".

| Method | Path | Roles | Input | Returns |
|---|---|---|---|---|
| GET | `/dashboard` | all | | admin and mentor: KPIs, caseload, remarks per week, enrolments; parent: their summary |
| GET | `/dashboard/badges` | all | | sidebar counts `{ '/children': n, '/change-requests': n }` (empty for parents) |
| GET | `/dashboard/follow-up` | admin, mentor | `page`, `page_size` | page of children needing follow-up, most urgent first |

## Rules (`utils/index.js`, `constants/index.js`)
- Reasons: `no_mentor`, `no_recent_remark` / `never_remarked` (no remark for `STALE_DAYS` = 14 days), `no_lessons`.
- Ranking: no mentor first, then no lessons, then the longest silence (`FOLLOW_UP_WEIGHT`).
- Caseload: per mentor, children with a recent remark vs overdue.
- Mentors only see their own children, remarks and requests.

Files: `route/index.js`, `controller/index.js`, `service/index.js`, `validation/index.js`, `constants/index.js`, `utils/index.js`, `tests/index.test.js`.
