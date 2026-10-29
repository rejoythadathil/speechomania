import { sql } from '../../../../../common-service/db/service/index.js'
import { audit } from '../../../../../common-service/audit/service/index.js'
import { json } from '../../../../../common-service/http/utils/index.js'

function stats(user) {
  if (user.role === 'mentor') {
    return sql`
      SELECT
        (SELECT count(*)::int FROM children WHERE mentor_id = ${user.id} AND deleted_at IS NULL) AS children,
        (SELECT count(*)::int FROM remarks WHERE author_id = ${user.id} AND deleted_at IS NULL) AS remarks,
        (SELECT count(*)::int FROM change_requests WHERE requested_by = ${user.id}) AS change_requests
    `
  }
  if (user.role === 'admin') {
    return sql`
      SELECT
        (SELECT count(*)::int FROM remarks WHERE author_id = ${user.id} AND deleted_at IS NULL) AS remarks,
        (SELECT count(*)::int FROM change_requests WHERE reviewed_by = ${user.id}) AS reviews
    `
  }
  return sql`SELECT (SELECT count(*)::int FROM children WHERE parent_id = ${user.id} AND deleted_at IS NULL) AS children`
}

export async function profile(user) {
  const [[row], [counts]] = await Promise.all([
    sql`SELECT id, email, full_name, phone, role, status, coalesce(metadata->>'avatar', id::text) AS avatar, created_at FROM users WHERE id = ${user.id}`,
    stats(user)
  ])
  return { ...row, stats: counts }
}

export async function updateProfile(user, body, ctx) {
  await sql.begin(async (tx) => {
    const [current] = await tx`SELECT full_name, phone, metadata->>'avatar' AS avatar FROM users WHERE id = ${user.id} FOR UPDATE`
    await tx`
      UPDATE users SET
        full_name = ${body.full_name ?? current.full_name},
        phone = ${body.phone === undefined ? current.phone : body.phone || null},
        metadata = metadata || ${json({ avatar: body.avatar ?? current.avatar ?? undefined })}::jsonb,
        updated_at = now()
      WHERE id = ${user.id}
    `
    await audit(tx, { actor: user, action: 'user.profile_updated', entityType: 'user', entityId: user.id, diff: { fields: Object.keys(body) }, ctx })
  })
  return profile(user)
}
