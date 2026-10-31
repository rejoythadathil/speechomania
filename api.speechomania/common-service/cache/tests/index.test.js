import { expect, test } from 'bun:test'
import { valkey } from '../service/index.js'

test('valkey stores, reads and expires a key', async () => {
  const key = `test:${crypto.randomUUID()}`
  await valkey.set(key, 'ok')
  await valkey.expire(key, 5)
  expect(await valkey.get(key)).toBe('ok')
  await valkey.del(key)
  expect(await valkey.get(key)).toBeNull()
})
