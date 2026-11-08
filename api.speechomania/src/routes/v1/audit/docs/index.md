# audit (feature)

Admins read the audit log. Writing to the log is `common-service/audit`.

| Method | Path | Roles | Input | Returns |
|---|---|---|---|---|
| GET | `/audit` | admin | `entity_type` (`user`, `child`, `lesson`, `remark`, `change_request`), `entity_id`, `actor_id`, `action`, `page`, `page_size` | page of audit rows, newest first; each row has `entity_label` (child name, lesson title, person name and so on) or `null` |

Files: `route/index.js`, `controller/index.js`, `service/index.js`, `validation/index.js`. Covered by `test/scoping.test.js` (pagination contract).
