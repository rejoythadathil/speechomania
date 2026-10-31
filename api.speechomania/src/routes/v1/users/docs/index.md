# users

Admins manage staff and parent accounts. Every route is admin only.

| Method | Path | Input | Returns |
|---|---|---|---|
| GET | `/users` | `role`, `status`, `q` (name or email), `page`, `page_size` | page of users |
| POST | `/users` | `email`, `full_name`, `phone`, `role` (`admin`, `mentor`, `parent`), `metadata` | `{ user, inviteLink }`: the Firebase link the admin sends |
| GET | `/users/:id` | | user |
| PATCH | `/users/:id` | `full_name`, `phone`, `status` (`active`, `disabled`), `metadata` | user; disabling also disables the Firebase account |
| DELETE | `/users/:id` | | 204, soft delete |

## Errors (`exception/index.js`)
- `userNotFound` 404
- `cannotDisableSelf`, `cannotRemoveSelf` 400
- `parentHasChildren` 409: a parent with children cannot be removed

Files: `route/index.js`, `controller/index.js`, `service/index.js`, `validation/index.js`, `constants/index.js`, `exception/index.js`, `tests/index.test.js`.
