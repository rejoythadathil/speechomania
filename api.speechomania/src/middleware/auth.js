import { db } from '../../common-service/db/service/index.js'
import { verifyToken } from '../../common-service/firebase/service/index.js'
import {
  accountInactive,
  sessionExpired,
  signInRequired
} from '../../common-service/http/exception/index.js'

export async function requireAuth(c, next) {
  const [scheme, token] = (c.req.header('authorization') ?? '').split(' ')
  if (scheme !== 'Bearer' || !token) throw signInRequired()
  let decoded
  try {
    decoded = await verifyToken(token)
  } catch {
    throw sessionExpired()
  }
  const user = await db.users.findFirst({
    where: { firebase_uid: decoded.uid, deleted_at: null },
    select: { id: true, email: true, full_name: true, role: true, status: true }
  })
  if (!user || user.status === 'disabled') throw accountInactive()
  if (user.status === 'invited') {
    await db.users.update({
      where: { id: user.id },
      data: { status: 'active', updated_at: new Date() }
    })
    user.status = 'active'
  }
  c.set('user', user)
  await next()
}
