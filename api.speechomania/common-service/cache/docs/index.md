# cache

`valkey`, a `Bun.RedisClient` on `VALKEY_URL`. Used for rate limiting today and for queues later. Lesson media is never cached here (the CDN does that).

No constants, exceptions or utils: the client is used directly.

Tests: `tests/index.test.js` (set, read, expire, delete).
