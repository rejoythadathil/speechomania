# Sign-up

Self sign-up for families who sign in with Google and are not on Speechomania yet.

| Method | Path | Body | Returns |
|---|---|---|---|
| POST | `/v1/signup` | `{ child_name, consent_given: true }` | 201 `{ child: { id, display_name } }` |

- `requireNewGoogle` (`src/middleware/auth.js`) needs a verified Firebase token from `google.com` with a verified email whose uid matches no `users` row; anything else is 401 or 403.
- One transaction creates an active `parent` (email and name from the Google token, `metadata.source = 'google_signup'`) and their child: no mentor, consent `CONSENT_VERSION`, calm sensory defaults, every published lesson assigned.
- An email that already has an account is 409: that person signs in with the account they were sent.
- After sign-up the family uses the normal parent endpoints; a mentor or admin can assign a mentor later.
