import { audit } from '../../../../../common-service/audit/service/index.js'
import { SERIAL } from '../../../../../common-service/db/constants/index.js'
import { db } from '../../../../../common-service/db/service/index.js'
import { deletionOf, isPending, withDeletion } from '../utils/index.js'

const metadataOf = async (tx, id) =>
  (await tx.users.findUnique({ where: { id }, select: { metadata: true } })).metadata

export async function getDeletion(user) {
  return { request: deletionOf(await metadataOf(db, user.id)) }
}

export function requestDeletion(user, { reason }, ctx) {
  return db.$transaction(async (tx) => {
    const metadata = await metadataOf(tx, user.id)
    if (isPending(metadata)) return { request: deletionOf(metadata) }
    const request = {
      status: 'pending',
      requested_at: new Date().toISOString(),
      reason: reason || null
    }
    await tx.users.update({
      where: { id: user.id },
      data: { metadata: withDeletion(metadata, request), updated_at: new Date() }
    })
    await audit(tx, {
      actor: user,
      action: 'user.deletion_requested',
      entityType: 'user',
      entityId: user.id,
      diff: { has_reason: Boolean(reason) },
      ctx
    })
    return { request }
  }, SERIAL)
}

export function cancelDeletion(user, ctx) {
  return db.$transaction(async (tx) => {
    const metadata = await metadataOf(tx, user.id)
    if (!deletionOf(metadata)) return { request: null }
    await tx.users.update({
      where: { id: user.id },
      data: { metadata: withDeletion(metadata, null), updated_at: new Date() }
    })
    await audit(tx, {
      actor: user,
      action: 'user.deletion_cancelled',
      entityType: 'user',
      entityId: user.id,
      ctx
    })
    return { request: null }
  }, SERIAL)
}
