import { audit } from '../../../../../common-service/audit/service/index.js'
import { SERIAL } from '../../../../../common-service/db/constants/index.js'
import { db } from '../../../../../common-service/db/service/index.js'
import { CONSENT_VERSION } from '../../children/constants/index.js'
import { emailTaken } from '../exception/index.js'

const SOURCE = { source: 'google_signup' }
const SENSORY = { motion: 'reduced', sound: 'normal', colour: 'low' }

export function createFamily(google, body, ctx) {
  return db.$transaction(async (tx) => {
    if (await tx.users.findFirst({ where: { email: google.email }, select: { id: true } })) {
      throw emailTaken()
    }
    const parent = await tx.users.create({
      data: {
        firebase_uid: google.uid,
        email: google.email,
        full_name: google.name?.trim() || google.email.split('@')[0],
        role: 'parent',
        status: 'active',
        metadata: SOURCE
      },
      select: { id: true, role: true }
    })
    const lessons = await tx.lessons.findMany({
      where: { status: 'published' },
      select: { slug: true },
      orderBy: { slug: 'asc' }
    })
    const child = await tx.children.create({
      data: {
        parent_id: parent.id,
        display_name: body.child_name,
        sensory_settings: SENSORY,
        consent_version: CONSENT_VERSION,
        assigned_lessons: lessons.map((lesson) => lesson.slug),
        metadata: SOURCE
      },
      select: { id: true, display_name: true }
    })
    await audit(tx, {
      actor: parent,
      action: 'user.signed_up',
      entityType: 'user',
      entityId: parent.id,
      diff: { role: 'parent', provider: 'google.com' },
      ctx
    })
    await audit(tx, {
      actor: parent,
      action: 'child.created',
      entityType: 'child',
      entityId: child.id,
      diff: { consent_version: CONSENT_VERSION, lessons: lessons.length },
      ctx
    })
    return { child }
  }, SERIAL)
}
