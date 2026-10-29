import { sql } from '../../common-service/db/service/index.js'
import { verifyToken } from '../../common-service/firebase/service/index.js'
import { accountInactive, sessionExpired, signInRequired } from '../../common-service/http/exception/index.js'

export async function requireAuth(c, next) {
  const [scheme, token] = (c.req.header('authorization') ?? '').split(' ')
  if (scheme !== 'Bearer' || !token) throw signInRequired()
  let decoded
  try {
    decoded = await verifyToken(token)
  } catch {
    throw sessionExpired()
  }
  const [user] = await sql`
    SELECT id, email, full_name, role, status
    FROM users
    WHERE firebase_uid = ${decoded.uid} AND deleted_at IS NULL
  `
  if (!user || user.status === 'disabled') throw accountInactive()
  if (user.status === 'invited') {
    await sql`UPDATE users SET status = 'active', updated_at = now() WHERE id = ${user.id}`
    user.status = 'active'
  }
  c.set('user', user)
  await next()
}
