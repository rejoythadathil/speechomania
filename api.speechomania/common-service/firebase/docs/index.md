# firebase

Firebase Authentication through `firebase-admin`. Local and tests use the Auth emulator (`FIREBASE_AUTH_EMULATOR_HOST`, `demo-` project); prod uses application default credentials.

| File | Exports |
|---|---|
| `service/index.js` | `verifyToken(token)`, `createAuthUser({ email, fullName })` (returns the existing uid if the email is taken), `inviteLink(email)`, `setAuthUserDisabled(uid, disabled)` |
| `constants/index.js` | `EMAIL_EXISTS` error code |

Roles never come from Firebase: `src/middleware/auth.js` loads the user from Postgres after verifying the token.

Tests: `tests/index.test.js` (idempotent create, bad token rejected).
