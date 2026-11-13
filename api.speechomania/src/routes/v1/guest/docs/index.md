# Guest

A Google sign-in that matches no invited user gets a look at the child learning view for one shared demo child. Nothing is saved.

| Method | Path | Returns |
|---|---|---|
| GET | `/v1/guest` | `{ id, display_name }` of the guest child (oldest active child with `metadata.guest = true`), 404 if none |
| GET | `/v1/guest/learning/children/:id` | same as `/v1/learning/children/:id` |
| GET | `/v1/guest/learning/children/:id/lessons` | same as the learning shelf |
| GET | `/v1/guest/learning/children/:id/lessons/:lessonId` | same as the learning lesson |
| GET | `/v1/guest/learning/children/:id/assessments` | same as the learning check-ins |
| GET | `/v1/guest/learning/children/:id/assessments/:assessmentId` | same as the learning check-in |

- `requireGuest` (`src/middleware/auth.js`) needs a verified Firebase token from `google.com` whose uid matches no `users` row; invited accounts get 403.
- Only children tagged `metadata.guest` are visible (404 otherwise). There are no write routes: attempts, progress and exit stay on `/v1/learning` for parents.
- The seed tags its first demo child as the guest child; `seeds/demo-remove.js` removes it with the rest of the demo.
