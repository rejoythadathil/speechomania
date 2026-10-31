# storage

The private media bucket (`S3_MEDIA_BUCKET`) through Bun's S3 client. Locally it is RustFS on `S3_ENDPOINT`; in prod an S3 bucket behind a CDN.

| File | Exports |
|---|---|
| `service/index.js` | `media` (S3 client, or `null` when S3 is not configured), `mediaReady`, `mediaUrl(key)` (signed GET URL valid for `MEDIA_URL_TTL_SECONDS`), `ensureMediaBucket()` (local setup) |
| `utils/index.js` | `createBucketRequest(settings, now)`: a SigV4-signed `CreateBucket` request |
| `constants/index.js` | signature algorithm, the "bucket already exists" status |
| `exception/index.js` | `storageNotConfigured()`, `bucketNotCreated(bucket, status, detail)` |

Children only ever get signed URLs; the bucket is never public. `ensureMediaBucket` exists because Bun's client cannot create buckets; prod buckets are created by the first-setup runbook.

Tests: `tests/index.test.js` (signing is deterministic; with S3 configured, bucket creation is repeatable and signed URLs serve the file).
