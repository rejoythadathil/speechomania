# account

A parent asks for their account and their children's data to be erased. An admin then erases or declines it from `users` (`POST /users/:id/erase`, `POST /users/:id/deletion/decline`). Every route is parent only.

| Method | Path | Input | Returns |
|---|---|---|---|
| GET | `/account/deletion` | | `{ request }`: null, or `{ status: 'pending' \| 'declined', requested_at, reason, declined_at?, note? }` |
| POST | `/account/deletion` | `reason` (optional) | 201 `{ request }`; asking again while pending returns the first request |
| DELETE | `/account/deletion` | | `{ request: null }`; cancels a pending request or clears a declined one |

The request lives in `users.metadata.deletion_request`. Nothing is removed until an admin erases it. Each step is logged (`user.deletion_requested`, `user.deletion_cancelled`, `user.deletion_declined`, `user.erased`) without personal details.

Files: `route/index.js`, `controller/index.js`, `service/index.js`, `validation/index.js`, `constants/index.js`, `utils/index.js`, `tests/index.test.js`.
