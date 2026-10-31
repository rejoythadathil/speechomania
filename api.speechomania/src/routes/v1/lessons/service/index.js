import { audit } from '../../../../../common-service/audit/service/index.js'
import { sql } from '../../../../../common-service/db/service/index.js'
import { json, likePattern, pageOf } from '../../../../../common-service/http/utils/index.js'
import { alreadyDraft, cannotRemove, draftExists, lessonNotFound, noSteps, onlyDraftsEditable, onlyDraftsPublishable, slugTaken } from '../exception/index.js'

function visible(db, user) {
  if (user.role === 'admin') return db``
  if (user.role === 'mentor') return db`AND l.status = 'published'`
  return db`AND l.status = 'published' AND l.slug::text IN (
    SELECT jsonb_array_elements_text(c.assigned_lessons) FROM children c WHERE c.parent_id = ${user.id} AND c.deleted_at IS NULL
  )`
}

function select(db) {
  return db`
    SELECT l.id, l.slug, l.version, l.title, l.content, l.status, l.metadata, l.created_at, l.published_at,
      jsonb_array_length(l.content -> 'steps') AS step_count,
      cu.full_name AS created_by_name, pu.full_name AS published_by_name
    FROM lessons l
    JOIN users cu ON cu.id = l.created_by
    LEFT JOIN users pu ON pu.id = l.published_by
  `
}

export async function findLesson(db, user, id) {
  const [lesson] = await db`${select(db)} WHERE l.id = ${id} ${visible(db, user)}`
  if (!lesson) throw lessonNotFound()
  return lesson
}

export function listLessons(user, { status, q, ...window }) {
  return pageOf(sql, sql`
    SELECT l.id, l.slug, l.version, l.title, l.status, l.created_at, l.published_at,
      jsonb_array_length(l.content -> 'steps') AS step_count
    FROM lessons l
    WHERE true ${visible(sql, user)}
      ${status ? sql`AND l.status = ${status}` : sql``}
      ${q ? sql`AND (l.title ILIKE ${likePattern(q)} OR l.slug::text ILIKE ${likePattern(q)})` : sql``}
  `, sql`list.slug, list.version DESC`, window)
}

export async function listVersions(user, id, window) {
  const lesson = await findLesson(sql, user, id)
  return pageOf(sql, sql`
    SELECT l.id, l.version, l.status, l.title, l.created_at, l.published_at
    FROM lessons l
    WHERE l.slug = ${lesson.slug}
  `, sql`list.version DESC`, window)
}

export async function createLesson(user, body, ctx) {
  return sql.begin(async (tx) => {
    const [existing] = await tx`SELECT id FROM lessons WHERE slug = ${body.slug} LIMIT 1`
    if (existing) throw slugTaken()
    const [{ id }] = await tx`
      INSERT INTO lessons (slug, version, title, content, created_by, metadata)
      VALUES (${body.slug}, 1, ${body.title}, ${json(body.content)}::jsonb, ${user.id}, ${json(body.metadata ?? {})}::jsonb)
      RETURNING id
    `
    await audit(tx, { actor: user, action: 'lesson.created', entityType: 'lesson', entityId: id, diff: { slug: body.slug }, ctx })
    return findLesson(tx, user, id)
  })
}

export async function updateLesson(user, id, body, ctx) {
  return sql.begin(async (tx) => {
    const [current] = await tx`SELECT * FROM lessons WHERE id = ${id} FOR UPDATE`
    if (!current) throw lessonNotFound()
    if (current.status !== 'draft') throw onlyDraftsEditable()
    await tx`
      UPDATE lessons SET
        title = ${body.title ?? current.title},
        content = ${json(body.content ?? current.content)}::jsonb,
        metadata = metadata || ${json(body.metadata ?? {})}::jsonb
      WHERE id = ${id}
    `
    await audit(tx, { actor: user, action: 'lesson.updated', entityType: 'lesson', entityId: id, diff: { fields: Object.keys(body) }, ctx })
    return findLesson(tx, user, id)
  })
}

export async function publishLesson(user, id, ctx) {
  return sql.begin(async (tx) => {
    const [current] = await tx`SELECT * FROM lessons WHERE id = ${id} FOR UPDATE`
    if (!current) throw lessonNotFound()
    if (current.status !== 'draft') throw onlyDraftsPublishable()
    if (!current.content?.steps?.length) throw noSteps()
    await tx`UPDATE lessons SET status = 'superseded' WHERE slug = ${current.slug} AND status = 'published'`
    await tx`UPDATE lessons SET status = 'published', published_by = ${user.id}, published_at = now() WHERE id = ${id}`
    await audit(tx, { actor: user, action: 'lesson.published', entityType: 'lesson', entityId: id, diff: { slug: current.slug, version: current.version }, ctx })
    return findLesson(tx, user, id)
  })
}

export async function createDraftFrom(tx, user, source, ctx) {
  const [draft] = await tx`SELECT id FROM lessons WHERE slug = ${source.slug} AND status = 'draft'`
  if (draft) return { id: draft.id, created: false }
  const [{ id }] = await tx`
    INSERT INTO lessons (slug, version, title, content, created_by)
    SELECT slug, (SELECT max(version) + 1 FROM lessons WHERE slug = ${source.slug}), title, content, ${user.id}
    FROM lessons WHERE id = ${source.id}
    RETURNING id
  `
  await audit(tx, { actor: user, action: 'lesson.version_created', entityType: 'lesson', entityId: id, diff: { from: source.id }, ctx })
  return { id, created: true }
}

export async function newVersion(user, id, ctx) {
  return sql.begin(async (tx) => {
    const [source] = await tx`SELECT * FROM lessons WHERE id = ${id}`
    if (!source) throw lessonNotFound()
    if (source.status === 'draft') throw alreadyDraft()
    const { id: draftId, created } = await createDraftFrom(tx, user, source, ctx)
    if (!created) throw draftExists()
    return findLesson(tx, user, draftId)
  })
}

export async function removeLesson(user, id, ctx) {
  await sql.begin(async (tx) => {
    const [current] = await tx`SELECT * FROM lessons WHERE id = ${id} FOR UPDATE`
    if (!current) throw lessonNotFound()
    if (current.status === 'draft') {
      await tx`DELETE FROM lessons WHERE id = ${id}`
    } else if (current.status === 'published') {
      await tx`UPDATE lessons SET status = 'archived' WHERE id = ${id}`
    } else {
      throw cannotRemove()
    }
    await audit(tx, { actor: user, action: current.status === 'draft' ? 'lesson.draft_deleted' : 'lesson.archived', entityType: 'lesson', entityId: id, diff: { slug: current.slug, version: current.version }, ctx })
  })
}

export const getLesson = (user, id) => findLesson(sql, user, id)
