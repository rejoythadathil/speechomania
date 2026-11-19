# users

Admins manage staff and parent accounts. Every route is admin only.

| Method | Path | Input | Returns |
|---|---|---|---|
| GET | `/users` | `role`, `status`, `q` (name or email), `deletion` (`pending`, `declined`), `page`, `page_size` | page of users; `metadata.deletion_request` carries a parent's deletion request |
| POST | `/users` | `email`, `full_name`, `phone`, `role` (`admin`, `mentor`, `parent`), `metadata` | `{ user, inviteLink }`: the Firebase link the admin sends |
| GET | `/users/:id` | | user |
| PATCH | `/users/:id` | `full_name`, `phone`, `status` (`active`, `disabled`), `metadata` | user; disabling also disables the Firebase account |
| DELETE | `/users/:id` | | 204, soft delete |
| POST | `/users/:id/erase` | | 204; only for a parent with a pending deletion request (see `account`). Deletes their children and every attempt and remark about them, replaces the parent's email, name, phone and metadata, removes the Firebase account, and logs `user.erased` with counts only |
| POST | `/users/:id/deletion/decline` | `note` | user; the request becomes `declined` with the note, which the parent sees. They can ask again |

## Errors (`exception/index.js`)
- `userNotFound` 404
- `cannotDisableSelf`, `cannotRemoveSelf` 400
- `parentHasChildren` 409: a parent with children cannot be removed
- `noDeletionRequest` 409: erase or decline without a pending request

Files: `route/index.js`, `controller/index.js`, `service/index.js`, `validation/index.js`, `constants/index.js`, `exception/index.js`, `tests/index.test.js`.
