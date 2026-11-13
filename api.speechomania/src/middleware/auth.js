import { db } from '../../common-service/db/service/index.js'
import { verifyToken } from '../../common-service/firebase/service/index.js'
import {
  accountInactive,
  accountUnknown,
  forbidden,
  sessionExpired,
  signInRequired
} from '../../common-service/http/exception/index.js'

async function decodedToken(c) {
  const [scheme, token] = (c.req.header('authorization') ?? '').split(' ')
  if (scheme !== 'Bearer' || !token) throw signInRequired()
  try {
    return await verifyToken(token)
  } catch {
    throw sessionExpired()
  }
}

export async function requireAuth(c, next) {
  const decoded = await decodedToken(c)
  const user = await db.users.findFirst({
    where: { firebase_uid: decoded.uid, deleted_at: null },
    select: { id: true, email: true, full_name: true, role: true, status: true }
  })
  if (!user) throw accountUnknown()
  if (user.status === 'disabled') throw accountInactive()
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

export async function requireNewGoogle(c, next) {
  const decoded = await decodedToken(c)
  if (decoded.firebase?.sign_in_provider !== 'google.com' || !decoded.email_verified) {
    throw accountUnknown()
  }
  const member = await db.users.findFirst({
    where: { firebase_uid: decoded.uid },
    select: { id: true }
  })
  if (member) throw forbidden()
  c.set('google', { uid: decoded.uid, email: decoded.email, name: decoded.name ?? null })
  await next()
}
