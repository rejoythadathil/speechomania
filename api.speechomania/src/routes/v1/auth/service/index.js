import { audit } from '../../../../../common-service/audit/service/index.js'
import { SERIAL } from '../../../../../common-service/db/constants/index.js'
import { db } from '../../../../../common-service/db/service/index.js'

async function stats(user) {
  if (user.role === 'mentor') {
    const [children, remarks, changeRequests] = await Promise.all([
      db.children.count({ where: { mentor_id: user.id, deleted_at: null } }),
      db.remarks.count({ where: { author_id: user.id, deleted_at: null } }),
      db.change_requests.count({ where: { requested_by: user.id } })
    ])
    return { children, remarks, change_requests: changeRequests }
  }
  if (user.role === 'admin') {
    const [remarks, reviews] = await Promise.all([
      db.remarks.count({ where: { author_id: user.id, deleted_at: null } }),
      db.change_requests.count({ where: { reviewed_by: user.id } })
    ])
    return { remarks, reviews }
  }
  return { children: await db.children.count({ where: { parent_id: user.id, deleted_at: null } }) }
}

export async function profile(user) {
  const [row, counts] = await Promise.all([
    db.users.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        full_name: true,
        phone: true,
        role: true,
        status: true,
        metadata: true,
        created_at: true
      }
    }),
    stats(user)
  ])
  const { metadata, ...rest } = row
  return { ...rest, avatar: metadata?.avatar ?? row.id, stats: counts }
}

export async function updateProfile(user, body, ctx) {
  await db.$transaction(async (tx) => {
    const current = await tx.users.findUnique({
      where: { id: user.id },
      select: { metadata: true }
    })
    await tx.users.update({
      where: { id: user.id },
      data: {
        full_name: body.full_name,
        phone: body.phone === undefined ? undefined : body.phone || null,
        metadata: body.avatar ? { ...current.metadata, avatar: body.avatar } : undefined,
        updated_at: new Date()
      }
    })
    await audit(tx, {
      actor: user,
      action: 'user.profile_updated',
      entityType: 'user',
      entityId: user.id,
      diff: { fields: Object.keys(body) },
      ctx
    })
  }, SERIAL)
  return profile(user)
}
