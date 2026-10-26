import { audit } from '../../../../common-service/audit/index.js'
import { sql } from '../../../../common-service/db/index.js'
import { createAuthUser, inviteLink, setAuthUserDisabled } from '../../../../common-service/firebase/index.js'
import { HttpError, json, likePattern, notFound, pageOf } from '../../../../utils.js'

export function listUsers({ role, status, q, ...window }) {
  return pageOf(sql, sql`
    SELECT id, email, full_name, phone, role, status, metadata, created_at, updated_at
    FROM users
    WHERE deleted_at IS NULL
      ${role ? sql`AND role = ${role}` : sql``}
      ${status ? sql`AND status = ${status}` : sql``}
      ${q ? sql`AND (full_name ILIKE ${likePattern(q)} OR email ILIKE ${likePattern(q)})` : sql``}
  `, sql`list.created_at DESC, list.id`, window)
}

export async function getUser(id) {
  const [user] = await sql`
    SELECT id, email, full_name, phone, role, status, metadata, created_at, updated_at
    FROM users
    WHERE id = ${id} AND deleted_at IS NULL
  `
  if (!user) throw notFound('User')
  return user
}

export async function createUser(actor, body, ctx) {
  const firebaseUid = await createAuthUser({ email: body.email, fullName: body.full_name })
  const user = await sql.begin(async (tx) => {
    const [created] = await tx`
      INSERT INTO users (firebase_uid, email, full_name, phone, role, metadata)
      VALUES (${firebaseUid}, ${body.email}, ${body.full_name}, ${body.phone || null}, ${body.role}, ${json(body.metadata ?? {})}::jsonb)
      RETURNING id, email, full_name, phone, role, status, metadata, created_at, updated_at
    `
    await audit(tx, { actor, action: 'user.created', entityType: 'user', entityId: created.id, diff: { role: created.role }, ctx })
    return created
  })
  return { user, inviteLink: await inviteLink(body.email) }
}

export async function updateUser(actor, id, body, ctx) {
  if (actor.id === id && body.status === 'disabled') throw new HttpError(400, 'You cannot disable your own account')
  const { before, after, firebaseUid } = await sql.begin(async (tx) => {
    const [current] = await tx`SELECT * FROM users WHERE id = ${id} AND deleted_at IS NULL FOR UPDATE`
    if (!current) throw notFound('User')
    const [updated] = await tx`
      UPDATE users SET
        full_name = ${body.full_name ?? current.full_name},
        phone = ${body.phone === undefined ? current.phone : body.phone || null},
        status = ${body.status ?? current.status},
        metadata = metadata || ${json(body.metadata ?? {})}::jsonb,
        updated_at = now()
      WHERE id = ${id}
      RETURNING id, email, full_name, phone, role, status, metadata, created_at, updated_at
    `
    await audit(tx, {
      actor,
      action: 'user.updated',
      entityType: 'user',
      entityId: id,
      diff: { status: [current.status, updated.status], full_name_changed: current.full_name !== updated.full_name },
      ctx
    })
    return { before: current, after: updated, firebaseUid: current.firebase_uid }
  })
  if (firebaseUid && before.status !== after.status) await setAuthUserDisabled(firebaseUid, after.status === 'disabled')
  return after
}

export async function deleteUser(actor, id, ctx) {
  if (actor.id === id) throw new HttpError(400, 'You cannot remove your own account')
  const firebaseUid = await sql.begin(async (tx) => {
    const [current] = await tx`SELECT * FROM users WHERE id = ${id} AND deleted_at IS NULL FOR UPDATE`
    if (!current) throw notFound('User')
    if (current.role === 'parent') {
      const [{ count }] = await tx`SELECT count(*)::int AS count FROM children WHERE parent_id = ${id} AND deleted_at IS NULL`
      if (count > 0) throw new HttpError(409, "Remove this parent's children first")
    }
    const unassigned = current.role === 'mentor'
      ? await tx`UPDATE children SET mentor_id = NULL, updated_at = now() WHERE mentor_id = ${id} RETURNING id`
      : []
    await tx`UPDATE users SET deleted_at = now(), status = 'disabled', updated_at = now() WHERE id = ${id}`
    await audit(tx, {
      actor,
      action: 'user.deleted',
      entityType: 'user',
      entityId: id,
      diff: { role: current.role, unassigned_children: unassigned.map((row) => row.id) },
      ctx
    })
    return current.firebase_uid
  })
  if (firebaseUid) await setAuthUserDisabled(firebaseUid, true)
}
