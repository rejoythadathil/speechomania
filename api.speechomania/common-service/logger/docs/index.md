# logger

`logger`, a pino JSON logger tagged with `service: api` and the environment.

| File | Exports |
|---|---|
| `service/index.js` | `logger` |
| `utils/index.js` | `loggerOptions(config)` |
| `constants/index.js` | `REDACT_PATHS`: fields that never reach the logs (`authorization`, `email`, `phone`, `body`) |

Never log personal data; add a field to `REDACT_PATHS` rather than trusting call sites.

Tests: `tests/index.test.js` (redaction).
