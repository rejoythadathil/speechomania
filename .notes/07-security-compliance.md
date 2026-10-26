# Security (built in from the start)
- **Role and ownership checks (the biggest risk):**
  - `rbac.js` middleware checks the role on every route.
  - Ownership is enforced inside the query, not only in the UI: a mentor's queries filter by `children.mentor_id`, and a parent's queries filter by `children.parent_id`.
  - Every role/ownership rule has a test that tries to read another user's child and expects a 403.
- **Auth:**
  - Verify the Firebase ID token on every request (firebase-admin) and check revocation on sensitive actions.
  - Middleware loads the user and role from Postgres.
- **Input:**
  - Joi on every route.
  - Rate limiting on auth and on expensive endpoints (report generation, audio generation).
  - Strict CORS and a CSP header.
- **EJS:** only `<%= %>` (escaped) for any user-entered data, such as remarks and names. `<%- %>` is allowed only for trusted partials.
- **Secrets:**
  - The ElevenLabs, Firebase admin and S3 keys live only on the server.
  - `.env` is never committed (gitleaks in pre-commit).
  - Production secrets are stored outside the repo.
- **Audit log:** append-only record of who created, changed, deleted or viewed child records, remarks, assignments and lessons.
- **Children's data:** child records are personal data about minors and include health information (diagnosis). Access is need-to-know only.

# Compliance
Speechomania operates in India, so the Digital Personal Data Protection Act 2023 applies:
- Verifiable parental consent before any child data is stored. Consent is recorded with timestamp and version.
- No behavioural tracking, profiling or targeted ads on children.
- Parents can export their child's data and request erasure.
- A defined retention period for archived children, after which data is deleted.
- Confirm with Speechomania whether they also serve users outside India (GDPR/COPPA would then apply).
