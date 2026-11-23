# exports

Excel files for admins and mentors, built on the server from the same scoped list services the screens use. Parents get 403. Each export is audited (`export.<kind>`, with the row count and filters) and limited (see `common-service/reports`).

| Method | Path | Roles | Input | Returns |
|---|---|---|---|---|
| GET | `/exports/children` | admin, mentor | `status`, `unassigned`, `q` (the Children list filters) | `.xlsx`: Name, Age, Parent, Mentor (admin only), Lessons assigned, Status, Added. Mentors get only their children |
| GET | `/exports/assessments/:id/results` | admin, mentor | `status`, `q` | `.xlsx` with two sheets: Children (child, mentor, status, score, out of, percent, passed, attempts, due) and Questions (accuracy per question). Mentors get only their children |

Files are named `speechomania_<what>_<filters>_<YYYY-MM-DD>.xlsx` and sent with `Content-Disposition: attachment` and `Cache-Control: no-store`.

## Errors
- 400 over 5,000 rows, 429 over 10 exports a minute, 503 when the server is already rendering its limit.

Files: `route/index.js`, `controller/index.js`, `service/index.js`, `validation/index.js`, `tests/index.test.js`.
