import { sql } from '../../common-service/db/index.js'
import { verifyToken } from '../../common-service/firebase/index.js'
import { HttpError } from '../../utils.js'

export async function requireAuth(c, next) {
  const [scheme, token] = (c.req.header('authorization') ?? '').split(' ')
  if (scheme !== 'Bearer' || !token) throw new HttpError(401, 'Sign in to continue')
  let decoded
  try {
    decoded = await verifyToken(token)
  } catch {
    throw new HttpError(401, 'Your session has expired. Sign in again.')
  }
  const [user] = await sql`
    SELECT id, email, full_name, role, status
    FROM users
    WHERE firebase_uid = ${decoded.uid} AND deleted_at IS NULL
  `
  if (!user || user.status === 'disabled') throw new HttpError(403, 'This account is not active. Contact Speechomania.')
  if (user.status === 'invited') {
    await sql`UPDATE users SET status = 'active', updated_at = now() WHERE id = ${user.id}`
    user.status = 'active'
  }
  c.set('user', user)
  await next()
}
