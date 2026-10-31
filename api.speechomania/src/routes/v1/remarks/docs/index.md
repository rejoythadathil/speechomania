# remarks

Notes about a child from mentors and admins, internal or shared with the parent.

| Method | Path | Roles | Input | Returns |
|---|---|---|---|---|
| GET | `/children/:childId/remarks` | all | `page`, `page_size` | page of remarks, newest first; parents get `shared` only |
| POST | `/children/:childId/remarks` | admin, mentor | `body`, `visibility` (`internal` default, `shared`), `metadata` | remark |
| PATCH | `/remarks/:id` | admin, mentor | `body`, `visibility` | remark (authors only) |
| DELETE | `/remarks/:id` | admin, mentor | | 204 (author or admin) |
| GET | `/remarks/unread` | admin | `page`, `page_size` | page of unseen remarks |
| POST | `/remarks/:id/seen` | admin | | remark marked seen |

Every write rechecks that the child is still in the user's scope, so a mentor moved off a child loses edit access too.

## Errors (`exception/index.js`)
- `remarkNotFound` 404; editing someone else's remark is 403.

Files: `route/index.js`, `controller/index.js`, `service/index.js`, `validation/index.js`, `exception/index.js`, `tests/index.test.js`.
