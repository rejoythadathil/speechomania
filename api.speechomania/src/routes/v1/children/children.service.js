import { audit } from '../../../../common-service/audit/index.js'
import { sql } from '../../../../common-service/db/index.js'
import { HttpError, forbidden, json, likePattern, notFound, pageOf } from '../../../../utils.js'
import { CONSENT_VERSION } from './children.constant.js'

function scope(db, user) {
  if (user.role === 'admin') return db``
  if (user.role === 'mentor') return db`AND c.mentor_id = ${user.id}`
  return db`AND c.parent_id = ${user.id}`
}

function select(db, user) {
  return db`
    SELECT c.id, c.display_name, to_char(c.date_of_birth, 'YYYY-MM-DD') AS date_of_birth, c.avatar_key,
      c.sensory_settings, c.assigned_lessons, c.consent_version, c.consent_at, c.status, c.metadata,
      c.created_at, c.updated_at, c.parent_id, p.full_name AS parent_name,
      ${user.role === 'mentor' ? db`NULL::text` : db`p.email`} AS parent_email,
      c.mentor_id, m.full_name AS mentor_name
    FROM children c
    JOIN users p ON p.id = c.parent_id
    LEFT JOIN users m ON m.id = c.mentor_id
  `
}

export async function findScopedChild(db, user, id) {
  const [child] = await db`${select(db, user)} WHERE c.id = ${id} AND c.deleted_at IS NULL ${scope(db, user)}`
  if (!child) throw notFound('Child')
  return child
}

export function listChildren(user, { status, mentor_id, parent_id, unassigned, q, ...window }) {
  return pageOf(sql, sql`
    ${select(sql, user)}
    WHERE c.deleted_at IS NULL ${scope(sql, user)}
      ${status ? sql`AND c.status = ${status}` : sql``}
      ${mentor_id ? sql`AND c.mentor_id = ${mentor_id}` : sql``}
      ${parent_id ? sql`AND c.parent_id = ${parent_id}` : sql``}
      ${unassigned ? sql`AND c.mentor_id IS NULL` : sql``}
      ${q ? sql`AND c.display_name ILIKE ${likePattern(q)}` : sql``}
  `, sql`list.display_name, list.id`, window)
}

export async function getChild(user, id, ctx) {
  return sql.begin(async (tx) => {
    const child = await findScopedChild(tx, user, id)
    await audit(tx, { actor: user, action: 'child.viewed', entityType: 'child', entityId: id, ctx })
    return child
  })
}

async function requireRole(db, id, role, label) {
  const [row] = await db`SELECT id FROM users WHERE id = ${id} AND role = ${role} AND status <> 'disabled' AND deleted_at IS NULL`
  if (!row) throw new HttpError(400, `Choose an active ${label}`)
}

export async function createChild(user, body, ctx) {
  const parentId = user.role === 'parent' ? user.id : body.parent_id
  if (!parentId) throw new HttpError(400, 'Choose the parent for this child')
  if (user.role === 'parent' && body.parent_id && body.parent_id !== user.id) throw forbidden()
  return sql.begin(async (tx) => {
    await requireRole(tx, parentId, 'parent', 'parent')
    const [{ id }] = await tx`
      INSERT INTO children (parent_id, display_name, date_of_birth, avatar_key, sensory_settings, consent_version, metadata)
      VALUES (${parentId}, ${body.display_name}, ${body.date_of_birth ?? null}, ${body.avatar_key || null},
        ${json(body.sensory_settings)}::jsonb, ${CONSENT_VERSION}, ${json(body.metadata ?? {})}::jsonb)
      RETURNING id
    `
    await audit(tx, { actor: user, action: 'child.created', entityType: 'child', entityId: id, diff: { consent_version: CONSENT_VERSION }, ctx })
    return findScopedChild(tx, user, id)
  })
}

export async function updateChild(user, id, body, ctx) {
  if (user.role !== 'admin' && body.status !== undefined) throw forbidden()
  return sql.begin(async (tx) => {
    const current = await findScopedChild(tx, user, id)
    await tx`
      UPDATE children SET
        display_name = ${body.display_name ?? current.display_name},
        date_of_birth = ${body.date_of_birth === undefined ? current.date_of_birth : body.date_of_birth},
        avatar_key = ${body.avatar_key === undefined ? current.avatar_key : body.avatar_key || null},
        sensory_settings = sensory_settings || ${json(body.sensory_settings ?? {})}::jsonb,
        status = ${body.status ?? current.status},
        metadata = metadata || ${json(body.metadata ?? {})}::jsonb,
        updated_at = now()
      WHERE id = ${id}
    `
    await audit(tx, { actor: user, action: 'child.updated', entityType: 'child', entityId: id, diff: { fields: Object.keys(body) }, ctx })
    return findScopedChild(tx, user, id)
  })
}

export async function assignMentor(user, id, mentorId, ctx) {
  return sql.begin(async (tx) => {
    const current = await findScopedChild(tx, user, id)
    if (mentorId) await requireRole(tx, mentorId, 'mentor', 'mentor')
    await tx`UPDATE children SET mentor_id = ${mentorId}, updated_at = now() WHERE id = ${id}`
    await audit(tx, { actor: user, action: 'child.mentor_assigned', entityType: 'child', entityId: id, diff: { from: current.mentor_id, to: mentorId }, ctx })
    return findScopedChild(tx, user, id)
  })
}

export async function assignLessons(user, id, slugs, ctx) {
  return sql.begin(async (tx) => {
    const current = await findScopedChild(tx, user, id)
    const found = await tx`
      SELECT slug::text AS slug FROM lessons
      WHERE status = 'published' AND slug::text IN (SELECT jsonb_array_elements_text(${json(slugs)}::jsonb))
    `
    const published = new Set(found.map((row) => row.slug))
    const missing = slugs.filter((slug) => !published.has(slug))
    if (missing.length) throw new HttpError(400, `These lessons are not published: ${missing.join(', ')}`)
    await tx`UPDATE children SET assigned_lessons = ${json(slugs)}::jsonb, updated_at = now() WHERE id = ${id}`
    await audit(tx, { actor: user, action: 'child.lessons_assigned', entityType: 'child', entityId: id, diff: { from: current.assigned_lessons, to: slugs }, ctx })
    return findScopedChild(tx, user, id)
  })
}

export async function deleteChild(user, id, ctx) {
  await sql.begin(async (tx) => {
    await findScopedChild(tx, user, id)
    await tx`UPDATE children SET deleted_at = now(), status = 'archived', updated_at = now() WHERE id = ${id}`
    await audit(tx, { actor: user, action: 'child.deleted', entityType: 'child', entityId: id, ctx })
  })
}
