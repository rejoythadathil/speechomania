# verify

Public check for documents the API issues (no sign-in; the global per-IP rate limit applies). Responses hold only the status, document kind, code and date, never names or ids.

| Method | Path | Input | Returns |
|---|---|---|---|
| GET | `/verify/:code` | code `SPM-XXXX-XXXX` (any case) | `{ status: 'issued' \| 'unknown', code, kind, issued_on }` |
| POST | `/verify` | `{ sha256, code? }` (the browser hashes the PDF; the file is never uploaded) | `genuine` when the hash matches an issued file; `changed` when the code was issued but the hash differs (writes a `report.flagged` audit entry against the child); otherwise `unknown` |

Issued files are the `report.issued` audit entries written by `issuePdf` in `common-service/reports`.

Files: `route/index.js`, `controller/index.js`, `service/index.js`, `validation/index.js`, `utils/index.js` (`verdict`, `issuedSummary`), `tests/index.test.js`.
