# change-requests

Mentors ask for a lesson change; admins approve or reject. Admins and mentors only.

| Method | Path | Roles | Input | Returns |
|---|---|---|---|---|
| GET | `/change-requests` | admin, mentor | `status` (`pending`, `approved`, `rejected`), `page`, `page_size` | page of requests; mentors see their own |
| POST | `/change-requests` | mentor | `lesson_id`, `reason`, `proposed_change: { summary, step_index? }` | request |
| GET | `/change-requests/:id` | admin, mentor | | request |
| POST | `/change-requests/:id/review` | admin | `decision` (`approve`, `reject`), `review_note` (required to reject) | request; approval creates (or reuses) a draft of the lesson |

## Errors (`exception/index.js`)
- `requestNotFound` 404
- `alreadyReviewed`, `noPublishedVersion` 409

Files: `route/index.js`, `controller/index.js`, `service/index.js`, `validation/index.js`, `constants/index.js`, `exception/index.js`. Covered by `test/scoping.test.js`.
