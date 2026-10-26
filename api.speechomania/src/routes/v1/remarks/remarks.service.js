import { audit } from '../../../../common-service/audit/index.js'
import { sql } from '../../../../common-service/db/index.js'
import { forbidden, json, notFound, pageOf } from '../../../../utils.js'
import { findScopedChild } from '../children/children.service.js'

function select(db) {
  return db`
    SELECT r.id, r.child_id, r.body, r.visibility, r.seen_at, r.created_at, r.updated_at,
      r.author_id, u.full_name AS author_name, u.role AS author_role, coalesce(u.metadata->>'avatar', u.id::text) AS author_avatar
    FROM remarks r
    JOIN users u ON u.id = r.author_id
  `
}

export async function listForChild(user, childId, window) {
  await findScopedChild(sql, user, childId)
  return pageOf(sql, sql`
    ${select(sql)}
    WHERE r.child_id = ${childId} AND r.deleted_at IS NULL
      ${user.role === 'parent' ? sql`AND r.visibility = 'shared'` : sql``}
  `, sql`list.created_at DESC, list.id`, window)
}

export async function createRemark(user, childId, body, ctx) {
  return sql.begin(async (tx) => {
    await findScopedChild(tx, user, childId)
    const [{ id }] = await tx`
      INSERT INTO remarks (child_id, author_id, body, visibility, seen_at, metadata)
      VALUES (${childId}, ${user.id}, ${body.body}, ${body.visibility}, CASE WHEN ${user.role} = 'admin' THEN now() END, ${json(body.metadata ?? {})}::jsonb)
      RETURNING id
    `
    await audit(tx, { actor: user, action: 'remark.created', entityType: 'remark', entityId: id, diff: { child_id: childId, visibility: body.visibility }, ctx })
    const [remark] = await tx`${select(tx)} WHERE r.id = ${id}`
    return remark
  })
}

async function lockRemark(tx, user, id) {
  const [remark] = await tx`SELECT * FROM remarks WHERE id = ${id} AND deleted_at IS NULL FOR UPDATE`
  if (!remark) throw notFound('Remark')
  await findScopedChild(tx, user, remark.child_id)
  return remark
}

export async function updateRemark(user, id, body, ctx) {
  return sql.begin(async (tx) => {
    const current = await lockRemark(tx, user, id)
    if (current.author_id !== user.id) throw forbidden()
    await tx`
      UPDATE remarks SET body = ${body.body ?? current.body}, visibility = ${body.visibility ?? current.visibility}, updated_at = now()
      WHERE id = ${id}
    `
    await audit(tx, { actor: user, action: 'remark.updated', entityType: 'remark', entityId: id, diff: { fields: Object.keys(body) }, ctx })
    const [remark] = await tx`${select(tx)} WHERE r.id = ${id}`
    return remark
  })
}

export async function deleteRemark(user, id, ctx) {
  await sql.begin(async (tx) => {
    const current = await lockRemark(tx, user, id)
    if (current.author_id !== user.id && user.role !== 'admin') throw forbidden()
    await tx`UPDATE remarks SET deleted_at = now() WHERE id = ${id}`
    await audit(tx, { actor: user, action: 'remark.deleted', entityType: 'remark', entityId: id, diff: { child_id: current.child_id }, ctx })
  })
}

export async function markSeen(user, id) {
  const [remark] = await sql`UPDATE remarks SET seen_at = COALESCE(seen_at, now()) WHERE id = ${id} AND deleted_at IS NULL RETURNING id, seen_at`
  if (!remark) throw notFound('Remark')
  return remark
}

export function unread(window) {
  return pageOf(sql, sql`
    SELECT r.id, r.child_id, c.display_name AS child_name, left(r.body, 200) AS preview, r.visibility, r.created_at,
      u.full_name AS author_name, coalesce(u.metadata->>'avatar', u.id::text) AS author_avatar
    FROM remarks r
    JOIN users u ON u.id = r.author_id
    JOIN children c ON c.id = r.child_id
    WHERE r.seen_at IS NULL AND r.deleted_at IS NULL AND c.deleted_at IS NULL
  `, sql`list.created_at DESC, list.id`, window)
}
