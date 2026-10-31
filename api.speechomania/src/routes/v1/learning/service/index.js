import { audit } from '../../../../../common-service/audit/service/index.js'
import { sql } from '../../../../../common-service/db/service/index.js'
import { mediaUrl } from '../../../../../common-service/storage/service/index.js'
import { lessonLines } from '../../../../../common-service/voice/utils/index.js'
import { json, pageOf } from '../../../../../common-service/http/utils/index.js'
import { MAX_EVENTS_PER_ATTEMPT } from '../constants/index.js'
import { attemptFinished, attemptNotFound, learnerNotFound, lessonNotFound, tooManyEvents, wrongPin } from '../exception/index.js'
import { starsFor, stepsTotal } from '../utils/index.js'

async function findLearner(db, user, id) {
  const [child] = await db`
    SELECT id, display_name, sensory_settings, pin_hash
    FROM children
    WHERE id = ${id} AND parent_id = ${user.id} AND deleted_at IS NULL AND status = 'active'
  `
  if (!child) throw learnerNotFound()
  return child
}

function playable(db, childId) {
  return db`
    FROM lessons l
    JOIN children c ON c.id = ${childId}
    WHERE l.status = 'published' AND l.slug::text IN (SELECT jsonb_array_elements_text(c.assigned_lessons))
  `
}

export async function getLearner(user, id) {
  const child = await findLearner(sql, user, id)
  const [{ stars }] = await sql`SELECT coalesce(sum(stars), 0)::int AS stars FROM attempts WHERE child_id = ${id}`
  return { id: child.id, display_name: child.display_name, sensory_settings: child.sensory_settings, has_pin: Boolean(child.pin_hash), stars }
}

export async function listShelf(user, id, window) {
  await findLearner(sql, user, id)
  return pageOf(sql, sql`
    SELECT l.id, l.slug, l.title, coalesce(l.content ->> 'player', 'story') AS player, l.content ->> 'contrast' AS contrast,
      jsonb_array_length(l.content -> 'steps') AS step_count, l.content -> 'steps' -> 0 -> 'choices' AS cover,
      (SELECT count(*)::int FROM attempts a JOIN lessons v ON v.id = a.lesson_id
        WHERE a.child_id = c.id AND v.slug = l.slug AND a.status = 'completed') AS times_completed,
      (SELECT coalesce(max(a.stars), 0)::int FROM attempts a JOIN lessons v ON v.id = a.lesson_id
        WHERE a.child_id = c.id AND v.slug = l.slug AND a.status = 'completed') AS best_stars
    ${playable(sql, id)}
  `, sql`list.title, list.id`, window)
}

export async function getPlayableLesson(user, id, lessonId) {
  await findLearner(sql, user, id)
  const [lesson] = await sql`SELECT l.id, l.slug, l.version, l.title, l.content ${playable(sql, id)} AND l.id = ${lessonId}`
  if (!lesson) throw lessonNotFound()
  for (const line of lessonLines(lesson.content)) {
    if (line.audio?.key) line.audio.url = mediaUrl(line.audio.key)
  }
  return { ...lesson, steps_total: stepsTotal(lesson.content) }
}

export async function startAttempt(user, id, lessonId, ctx) {
  return sql.begin(async (tx) => {
    await findLearner(tx, user, id)
    const [lesson] = await tx`SELECT l.id, l.content ${playable(tx, id)} AND l.id = ${lessonId}`
    if (!lesson) throw lessonNotFound()
    const [attempt] = await tx`
      INSERT INTO attempts (child_id, lesson_id, steps_total)
      VALUES (${id}, ${lessonId}, ${stepsTotal(lesson.content)})
      RETURNING id, status, steps_total, steps_completed, stars, started_at
    `
    await audit(tx, { actor: user, action: 'attempt.started', entityType: 'attempt', entityId: attempt.id, diff: { child_id: id, lesson_id: lessonId }, ctx })
    return attempt
  })
}

export async function recordProgress(user, attemptId, body, ctx) {
  return sql.begin(async (tx) => {
    const [attempt] = await tx`
      SELECT a.id, a.status, a.steps_total, a.steps_completed, a.events
      FROM attempts a
      JOIN children c ON c.id = a.child_id
      WHERE a.id = ${attemptId} AND c.parent_id = ${user.id} AND c.deleted_at IS NULL
      FOR UPDATE OF a
    `
    if (!attempt) throw attemptNotFound()
    if (attempt.status !== 'in_progress') throw attemptFinished()
    const events = [...attempt.events, ...body.events]
    if (events.length > MAX_EVENTS_PER_ATTEMPT) throw tooManyEvents()
    const stepsCompleted = Math.min(attempt.steps_total, Math.max(attempt.steps_completed, body.steps_completed))
    const stars = body.completed ? starsFor(events) : 0
    const [saved] = await tx`
      UPDATE attempts SET
        events = ${json(events)}::jsonb,
        steps_completed = ${stepsCompleted},
        status = ${body.completed ? 'completed' : 'in_progress'},
        completed_at = ${body.completed ? tx`now()` : null},
        stars = ${stars}
      WHERE id = ${attemptId}
      RETURNING id, status, steps_total, steps_completed, stars, started_at, completed_at
    `
    if (body.completed) {
      await audit(tx, { actor: user, action: 'attempt.completed', entityType: 'attempt', entityId: attemptId, diff: { stars, steps_completed: stepsCompleted }, ctx })
    }
    return saved
  })
}

export async function exitLearning(user, id, pin) {
  const child = await findLearner(sql, user, id)
  if (child.pin_hash && !(pin && await Bun.password.verify(pin, child.pin_hash))) throw wrongPin()
  return { ok: true }
}
