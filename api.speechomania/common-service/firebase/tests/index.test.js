import { expect, test } from 'bun:test'
import { createAuthUser, verifyToken } from '../service/index.js'

test('creating the same auth user twice returns the same uid', async () => {
  const email = `firebase.${crypto.randomUUID().slice(0, 8)}@test.speechomania.local`
  const first = await createAuthUser({ email, fullName: 'Test person' })
  expect(await createAuthUser({ email, fullName: 'Test person' })).toBe(first)
})

test('a made-up token is rejected', async () => {
  await expect(verifyToken('not-a-token')).rejects.toBeDefined()
})
