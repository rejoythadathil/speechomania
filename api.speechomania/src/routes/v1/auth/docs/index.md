# auth

The signed-in user's own profile. Mounted at `/v1/auth`; every route needs a Firebase ID token (`Authorization: Bearer …`).

| Method | Path | Roles | Input | Returns |
|---|---|---|---|---|
| GET | `/auth/me` | all | | profile (`id`, `email`, `full_name`, `phone`, `role`, `status`, `avatar`, `created_at`) and role stats |
| PATCH | `/auth/me` | admin, mentor | `full_name`, `phone`, `avatar` (DiceBear seed, `[A-Za-z0-9-]{1,64}`), at least one | the updated profile |

- Email and role are never changed here; only an admin changes them through `users`.
- `avatar` is stored in `users.metadata.avatar`; it defaults to the user id.
- Profile changes are audited as `user.profile_updated`.

Files: `route/index.js`, `controller/index.js`, `service/index.js`, `validation/index.js`, `tests/index.test.js`.
