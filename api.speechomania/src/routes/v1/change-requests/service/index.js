import { audit } from '../../../../../common-service/audit/service/index.js'
import { sql } from '../../../../../common-service/db/service/index.js'
import { json, pageOf } from '../../../../../common-service/http/utils/index.js'
import { createDraftFrom, findLesson } from '../../lessons/service/index.js'
import { alreadyReviewed, noPublishedVersion, requestNotFound } from '../exception/index.js'

function select(db) {
  return db`
    SELECT cr.id, cr.reason, cr.proposed_change, cr.status, cr.review_note, cr.reviewed_at, cr.created_at, cr.metadata,
      cr.lesson_id, l.slug AS lesson_slug, l.title AS lesson_title, l.version AS lesson_version,
      cr.requested_by, ru.full_name AS requested_by_name, rv.full_name AS reviewed_by_name
    FROM change_requests cr
    JOIN lessons l ON l.id = cr.lesson_id
    JOIN users ru ON ru.id = cr.requested_by
    LEFT JOIN users rv ON rv.id = cr.reviewed_by
  `
}

const scope = (db, user) => (user.role === 'admin' ? db`` : db`AND cr.requested_by = ${user.id}`)

export function listRequests(user, { status, ...window }) {
  return pageOf(sql, sql`
    ${select(sql)}
    WHERE true ${scope(sql, user)} ${status ? sql`AND cr.status = ${status}` : sql``}
  `, sql`list.created_at DESC, list.id`, window)
}

export async function getRequest(user, id, db = sql) {
  const [request] = await db`${select(db)} WHERE cr.id = ${id} ${scope(db, user)}`
  if (!request) throw requestNotFound()
  return request
}

export async function createRequest(user, body, ctx) {
  return sql.begin(async (tx) => {
    const lesson = await findLesson(tx, { role: 'mentor' }, body.lesson_id)
    const [{ id }] = await tx`
      INSERT INTO change_requests (lesson_id, requested_by, reason, proposed_change)
      VALUES (${lesson.id}, ${user.id}, ${body.reason}, ${json(body.proposed_change)}::jsonb)
      RETURNING id
    `
    await audit(tx, { actor: user, action: 'change_request.created', entityType: 'change_request', entityId: id, diff: { lesson_id: lesson.id }, ctx })
    return getRequest(user, id, tx)
  })
}

export async function reviewRequest(user, id, { decision, review_note }, ctx) {
  return sql.begin(async (tx) => {
    const [current] = await tx`SELECT * FROM change_requests WHERE id = ${id} FOR UPDATE`
    if (!current) throw requestNotFound()
    if (current.status !== 'pending') throw alreadyReviewed()
    let draft = null
    if (decision === 'approve') {
      const [source] = await tx`
        SELECT * FROM lessons
        WHERE slug = (SELECT slug FROM lessons WHERE id = ${current.lesson_id}) AND status IN ('published', 'draft')
        ORDER BY version DESC LIMIT 1
      `
      if (!source) throw noPublishedVersion()
      draft = source.status === 'draft' ? { id: source.id } : await createDraftFrom(tx, user, source, ctx)
    }
    await tx`
      UPDATE change_requests SET
        status = ${decision === 'approve' ? 'approved' : 'rejected'},
        reviewed_by = ${user.id},
        review_note = ${review_note || null},
        reviewed_at = now(),
        metadata = metadata || ${json(draft ? { draft_lesson_id: draft.id } : {})}::jsonb
      WHERE id = ${id}
    `
    await audit(tx, { actor: user, action: `change_request.${decision === 'approve' ? 'approved' : 'rejected'}`, entityType: 'change_request', entityId: id, diff: { draft_lesson_id: draft?.id ?? null }, ctx })
    return getRequest(user, id, tx)
  })
}
