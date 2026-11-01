import { audit } from '../../../../../common-service/audit/service/index.js'
import { SERIAL } from '../../../../../common-service/db/constants/index.js'
import { db } from '../../../../../common-service/db/service/index.js'
import { forbidden } from '../../../../../common-service/http/exception/index.js'
import { pageOf } from '../../../../../common-service/http/utils/index.js'
import { findScopedChild } from '../../children/service/index.js'
import { PREVIEW_LENGTH } from '../constants/index.js'
import { remarkNotFound } from '../exception/index.js'
import { avatarOf, remarkView } from '../utils/index.js'

const author = { select: { id: true, full_name: true, role: true, metadata: true } }

const fields = {
  id: true,
  child_id: true,
  body: true,
  visibility: true,
  seen_at: true,
  created_at: true,
  updated_at: true,
  author_id: true,
  author
}

const byId = async (tx, id) =>
  remarkView(await tx.remarks.findUnique({ where: { id }, select: fields }))

export async function listForChild(user, childId, window) {
  await findScopedChild(db, user, childId)
  const page = await pageOf(
    db.remarks,
    {
      where: {
        child_id: childId,
        deleted_at: null,
        ...(user.role === 'parent' ? { visibility: 'shared' } : {})
      },
      select: fields,
      orderBy: [{ created_at: 'desc' }, { id: 'asc' }]
    },
    window
  )
  return { ...page, items: page.items.map(remarkView) }
}

export function createRemark(user, childId, body, ctx) {
  return db.$transaction(async (tx) => {
    await findScopedChild(tx, user, childId)
    const { id } = await tx.remarks.create({
      data: {
        child_id: childId,
        author_id: user.id,
        body: body.body,
        visibility: body.visibility,
        seen_at: user.role === 'admin' ? new Date() : null,
        metadata: body.metadata ?? {}
      },
      select: { id: true }
    })
    await audit(tx, {
      actor: user,
      action: 'remark.created',
      entityType: 'remark',
      entityId: id,
      diff: { child_id: childId, visibility: body.visibility },
      ctx
    })
    return byId(tx, id)
  })
}

async function findRemark(tx, user, id) {
  const remark = await tx.remarks.findFirst({ where: { id, deleted_at: null } })
  if (!remark) throw remarkNotFound()
  await findScopedChild(tx, user, remark.child_id)
  return remark
}

export function updateRemark(user, id, body, ctx) {
  return db.$transaction(async (tx) => {
    const current = await findRemark(tx, user, id)
    if (current.author_id !== user.id) throw forbidden()
    await tx.remarks.update({
      where: { id },
      data: { body: body.body, visibility: body.visibility, updated_at: new Date() }
    })
    await audit(tx, {
      actor: user,
      action: 'remark.updated',
      entityType: 'remark',
      entityId: id,
      diff: { fields: Object.keys(body) },
      ctx
    })
    return byId(tx, id)
  }, SERIAL)
}

export async function deleteRemark(user, id, ctx) {
  await db.$transaction(async (tx) => {
    const current = await findRemark(tx, user, id)
    if (current.author_id !== user.id && user.role !== 'admin') throw forbidden()
    await tx.remarks.update({ where: { id }, data: { deleted_at: new Date() } })
    await audit(tx, {
      actor: user,
      action: 'remark.deleted',
      entityType: 'remark',
      entityId: id,
      diff: { child_id: current.child_id },
      ctx
    })
  }, SERIAL)
}

export async function markSeen(user, id) {
  await db.remarks.updateMany({
    where: { id, deleted_at: null, seen_at: null },
    data: { seen_at: new Date() }
  })
  const remark = await db.remarks.findFirst({
    where: { id, deleted_at: null },
    select: { id: true, seen_at: true }
  })
  if (!remark) throw remarkNotFound()
  return remark
}

export async function unread(window) {
  const page = await pageOf(
    db.remarks,
    {
      where: { seen_at: null, deleted_at: null, child: { deleted_at: null } },
      select: {
        id: true,
        child_id: true,
        body: true,
        visibility: true,
        created_at: true,
        author,
        child: { select: { display_name: true } }
      },
      orderBy: [{ created_at: 'desc' }, { id: 'asc' }]
    },
    window
  )
  return {
    ...page,
    items: page.items.map(({ body, author: by, child, ...row }) => ({
      ...row,
      child_name: child.display_name,
      preview: body.slice(0, PREVIEW_LENGTH),
      author_name: by.full_name,
      author_avatar: avatarOf(by)
    }))
  }
}
