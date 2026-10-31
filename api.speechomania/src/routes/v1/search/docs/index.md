# search

The global header search. It calls the same scoped list services as the screens, so it can never return more than the lists do.

| Method | Path | Roles | Input | Returns |
|---|---|---|---|---|
| GET | `/search` | all | `q` (1–100 characters) | `{ children, lessons, people }`, top 5 of each (`TOP`); lessons for admins and mentors, people for admins only |

Files: `route/index.js`, `controller/index.js`, `service/index.js`, `validation/index.js`, `constants/index.js`, `tests/index.test.js`.
