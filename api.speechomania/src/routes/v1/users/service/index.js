import { audit } from '../../../../../common-service/audit/service/index.js'
import { SERIAL } from '../../../../../common-service/db/constants/index.js'
import { db } from '../../../../../common-service/db/service/index.js'
import {
  createAuthUser,
  inviteLink,
  setAuthUserDisabled
} from '../../../../../common-service/firebase/service/index.js'
import { containsText, pageOf } from '../../../../../common-service/http/utils/index.js'
import {
  cannotDisableSelf,
  cannotRemoveSelf,
  parentHasChildren,
  userNotFound
} from '../exception/index.js'

const fields = {
  id: true,
  email: true,
  full_name: true,
  phone: true,
  role: true,
  status: true,
  metadata: true,
  created_at: true,
  updated_at: true
}

export function listUsers({ role, status, q, ...window }) {
  return pageOf(
    db.users,
    {
      where: {
        deleted_at: null,
        role,
        status,
        ...(q ? { OR: [{ full_name: containsText(q) }, { email: containsText(q) }] } : {})
      },
      select: fields,
      orderBy: [{ created_at: 'desc' }, { id: 'asc' }]
    },
    window
  )
}

export async function getUser(id) {
  const user = await db.users.findFirst({ where: { id, deleted_at: null }, select: fields })
  if (!user) throw userNotFound()
  return user
}

export async function createUser(actor, body, ctx) {
  const firebaseUid = await createAuthUser({ email: body.email, fullName: body.full_name })
  const user = await db.$transaction(async (tx) => {
    const created = await tx.users.create({
      data: {
        firebase_uid: firebaseUid,
        email: body.email,
        full_name: body.full_name,
        phone: body.phone || null,
        role: body.role,
        metadata: body.metadata ?? {}
      },
      select: fields
    })
    await audit(tx, {
      actor,
      action: 'user.created',
      entityType: 'user',
      entityId: created.id,
      diff: { role: created.role },
      ctx
    })
    return created
  })
  return { user, inviteLink: await inviteLink(body.email) }
}

export async function updateUser(actor, id, body, ctx) {
  if (actor.id === id && body.status === 'disabled') throw cannotDisableSelf()
  const { before, after } = await db.$transaction(async (tx) => {
    const current = await tx.users.findFirst({ where: { id, deleted_at: null } })
    if (!current) throw userNotFound()
    const updated = await tx.users.update({
      where: { id },
      data: {
        full_name: body.full_name,
        phone: body.phone === undefined ? undefined : body.phone || null,
        status: body.status,
        metadata: { ...current.metadata, ...body.metadata },
        updated_at: new Date()
      },
      select: fields
    })
    await audit(tx, {
      actor,
      action: 'user.updated',
      entityType: 'user',
      entityId: id,
      diff: {
        status: [current.status, updated.status],
        full_name_changed: current.full_name !== updated.full_name
      },
      ctx
    })
    return { before: current, after: updated }
  }, SERIAL)
  if (before.firebase_uid && before.status !== after.status)
    await setAuthUserDisabled(before.firebase_uid, after.status === 'disabled')
  return after
}

export async function deleteUser(actor, id, ctx) {
  if (actor.id === id) throw cannotRemoveSelf()
  const firebaseUid = await db.$transaction(async (tx) => {
    const current = await tx.users.findFirst({ where: { id, deleted_at: null } })
    if (!current) throw userNotFound()
    if (
      current.role === 'parent' &&
      (await tx.children.count({ where: { parent_id: id, deleted_at: null } }))
    )
      throw parentHasChildren()
    const unassigned =
      current.role === 'mentor'
        ? await tx.children.findMany({ where: { mentor_id: id }, select: { id: true } })
        : []
    if (unassigned.length)
      await tx.children.updateMany({
        where: { mentor_id: id },
        data: { mentor_id: null, updated_at: new Date() }
      })
    await tx.users.update({
      where: { id },
      data: { deleted_at: new Date(), status: 'disabled', updated_at: new Date() }
    })
    await audit(tx, {
      actor,
      action: 'user.deleted',
      entityType: 'user',
      entityId: id,
      diff: { role: current.role, unassigned_children: unassigned.map((row) => row.id) },
      ctx
    })
    return current.firebase_uid
  }, SERIAL)
  if (firebaseUid) await setAuthUserDisabled(firebaseUid, true)
}
