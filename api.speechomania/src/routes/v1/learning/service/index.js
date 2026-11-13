import { audit } from '../../../../../common-service/audit/service/index.js'
import { SERIAL } from '../../../../../common-service/db/constants/index.js'
import { db } from '../../../../../common-service/db/service/index.js'
import { mediaUrl } from '../../../../../common-service/storage/service/index.js'
import { signAudio } from '../../../../../common-service/voice/service/index.js'
import { pageArray, pageOf } from '../../../../../common-service/http/utils/index.js'
import { MAX_EVENTS_PER_ATTEMPT } from '../constants/index.js'
import { ASSESS_STEP } from '../../assessments/constants/index.js'
import {
  keepCollected,
  maxScore,
  pointsFor,
  resultOf,
  scoreAttempt,
  withDefaults
} from '../../assessments/utils/index.js'
import {
  alreadyDone,
  assessmentNotFound,
  attemptFinished,
  attemptNotFound,
  learnerNotFound,
  lessonLocked,
  lessonNotFound,
  tooManyEvents,
  wrongPin
} from '../exception/index.js'
import {
  badgeStars,
  bestBySlug,
  coverOf,
  firstStep,
  lockedAfter,
  friendsFor,
  maxStars,
  newFriend,
  prizeOf,
  rewardOf,
  shelfSlugs,
  quizResult,
  starsFor,
  stepsTotal
} from '../utils/index.js'
import { checkOf, learnCards } from '../../lessons/utils/index.js'

const attemptFields = {
  id: true,
  status: true,
  steps_total: true,
  steps_completed: true,
  stars: true,
  started_at: true,
  completed_at: true
}

async function findLearner(tx, user, id) {
  const child = await tx.children.findFirst({
    where: { id, parent_id: user.id, deleted_at: null, status: 'active' },
    select: {
      id: true,
      display_name: true,
      sensory_settings: true,
      pin_hash: true,
      assigned_lessons: true,
      assigned_assessments: true
    }
  })
  if (!child) throw learnerNotFound()
  return child
}

const playable = (child) => ({ status: 'published', slug: { in: child.assigned_lessons ?? [] } })

async function bestScores(childId) {
  const groups = await db.attempts.groupBy({
    by: ['lesson_id'],
    where: { child_id: childId, status: 'completed', lesson_id: { not: null } },
    _count: { _all: true },
    _max: { stars: true }
  })
  const lessons = await db.lessons.findMany({
    where: { id: { in: groups.map((group) => group.lesson_id) } },
    select: { id: true, slug: true }
  })
  return bestBySlug(groups, new Map(lessons.map((lesson) => [lesson.id, lesson.slug])))
}

const gamePlayer = (content) => content.player ?? 'story'

export async function getLearner(user, id) {
  const child = await findLearner(db, user, id)
  const [{ _sum }, lessons, best] = await Promise.all([
    db.attempts.aggregate({ where: { child_id: id }, _sum: { stars: true } }),
    db.lessons.findMany({
      where: playable(child),
      select: { slug: true, title: true, content: true },
      orderBy: { title: 'asc' }
    }),
    bestScores(id)
  ])
  const games = lessons.map((lesson) => ({
    slug: lesson.slug,
    title: lesson.title,
    player: gamePlayer(lesson.content),
    cover: coverOf(lesson.content),
    max_stars: maxStars(lesson.content),
    best: best.get(lesson.slug.toLowerCase())?.stars ?? null
  }))
  return {
    id: child.id,
    display_name: child.display_name,
    sensory_settings: child.sensory_settings,
    has_pin: Boolean(child.pin_hash),
    stars: _sum.stars ?? 0,
    games_total: games.length,
    games_played: games.filter((game) => game.best !== null).length,
    badges: games
      .filter((game) => game.best !== null && game.best >= badgeStars(game.max_stars))
      .map(({ slug, title, player, cover }) => ({ slug, title, player, cover })),
    trophies: games.map(({ slug, title, player, cover, best, max_stars }) => ({
      slug,
      title,
      player,
      cover,
      prize: prizeOf(best, max_stars)
    })),
    friends: friendsFor(_sum.stars ?? 0)
  }
}

export async function listShelf(user, id, window) {
  const child = await findLearner(db, user, id)
  const assigned = child.assigned_lessons ?? []
  const best = await bestScores(id)
  const cards = ['cards', 'games'].includes(window.show)
    ? await db.lessons.findMany({
        where: { ...playable(child), content: { path: ['player'], equals: 'cards' } },
        select: { slug: true }
      })
    : []
  const slugs = shelfSlugs(
    assigned,
    window.show,
    new Set(best.keys()),
    new Set(cards.map((lesson) => lesson.slug))
  )
  const page = await pageOf(
    db.lessons,
    {
      where: {
        status: 'published',
        slug: { in: slugs },
        ...(window.q ? { title: { contains: window.q, mode: 'insensitive' } } : {})
      },
      select: { id: true, slug: true, title: true, content: true },
      orderBy: [{ title: 'asc' }, { id: 'asc' }]
    },
    window
  )
  const afters = [
    ...new Set(
      page.items.map((item) => lockedAfter(item.content, assigned, best, item.slug)).filter(Boolean)
    )
  ]
  const titles = new Map(
    (
      await db.lessons.findMany({
        where: { status: 'published', slug: { in: afters } },
        select: { slug: true, title: true }
      })
    ).map((lesson) => [lesson.slug, lesson.title])
  )
  return {
    ...page,
    items: page.items.map(({ content, ...lesson }) => {
      const score = best.get(lesson.slug.toLowerCase())
      const after = lockedAfter(content, assigned, best, lesson.slug)
      return {
        locked_after: after ? { slug: after, title: titles.get(after) ?? after } : null,
        ...lesson,
        player: gamePlayer(content),
        contrast: content.contrast ?? null,
        step_count: content.steps?.length ?? 0,
        cover: coverOf(content),
        max_stars: maxStars(content),
        cover_art: firstStep(content, 'art'),
        cover_url: mediaUrl(firstStep(content, 'image_key')),
        times_completed: score?.times ?? 0,
        best_stars: score?.stars ?? 0
      }
    })
  }
}

async function findPlayable(tx, child, lessonId) {
  const lesson = await tx.lessons.findFirst({
    where: { id: lessonId, ...playable(child) },
    select: { id: true, slug: true, version: true, title: true, content: true, metadata: true }
  })
  if (!lesson) throw lessonNotFound()
  return lesson
}

export async function getPlayableLesson(user, id, lessonId) {
  const { metadata, ...lesson } = await findPlayable(db, await findLearner(db, user, id), lessonId)
  const cards = learnCards(lesson.content)
  signAudio(lesson.content)
  return { ...lesson, cards, check: checkOf(metadata), steps_total: stepsTotal(lesson.content) }
}

const assignedIds = (child) =>
  (child.assigned_assessments ?? []).map((entry) => entry.assessment_id)

async function findAssigned(tx, child, assessmentId) {
  if (!assignedIds(child).includes(assessmentId)) throw assessmentNotFound()
  const assessment = await tx.assessments.findFirst({
    where: { id: assessmentId, status: 'published' }
  })
  if (!assessment) throw assessmentNotFound()
  return { ...assessment, settings: withDefaults(assessment.settings) }
}

export async function listLearnerAssessments(user, id, window) {
  const child = await findLearner(db, user, id)
  const assessments = await db.assessments.findMany({
    where: { id: { in: assignedIds(child) }, status: 'published' },
    select: { id: true, title: true, items: true, settings: true }
  })
  const attempts = await db.attempts.findMany({
    where: { child_id: id, assessment_id: { in: assessments.map((assessment) => assessment.id) } },
    select: {
      id: true,
      assessment_id: true,
      status: true,
      metadata: true,
      started_at: true,
      completed_at: true
    },
    orderBy: [{ completed_at: { sort: 'desc', nulls: 'last' } }, { started_at: 'desc' }]
  })
  const byId = new Map(assessments.map((assessment) => [assessment.id, assessment]))
  const rows = (child.assigned_assessments ?? [])
    .filter((entry) => byId.has(entry.assessment_id))
    .map((entry) => {
      const assessment = byId.get(entry.assessment_id)
      const settings = withDefaults(assessment.settings)
      const result = resultOf(attempts.filter((attempt) => attempt.assessment_id === assessment.id))
      return {
        id: assessment.id,
        title: assessment.title,
        question_count: assessment.items.length,
        players: [...new Set(assessment.items.map((item) => item.player))],
        due_on: entry.due_on ?? null,
        done: result.status === 'completed',
        can_start: result.status !== 'completed' || settings.play.retakes,
        score:
          settings.visibility.child_score && result.latest
            ? { score: result.latest.score, max_score: maxScore(assessment.items, settings) }
            : null
      }
    })
  return pageArray(rows, window)
}

export async function getPlayableAssessment(user, id, assessmentId) {
  const assessment = await findAssigned(db, await findLearner(db, user, id), assessmentId)
  for (const item of assessment.items)
    signAudio({ lines: item.lines, steps: [item.step, ...(item.context ?? [])] })
  return {
    id: assessment.id,
    title: assessment.title,
    items: assessment.items,
    settings: {
      tries: assessment.settings.scoring.tries,
      hints: assessment.settings.play.hints,
      shuffle: assessment.settings.play.shuffle,
      child_score: assessment.settings.visibility.child_score
    }
  }
}

async function startAssessment(tx, child, assessmentId) {
  const assessment = await findAssigned(tx, child, assessmentId)
  if (!assessment.settings.play.retakes) {
    const done = await tx.attempts.count({
      where: { child_id: child.id, assessment_id: assessmentId, status: 'completed' }
    })
    if (done) throw alreadyDone()
  }
  return { assessment_id: assessmentId, steps_total: assessment.items.length }
}

async function startLesson(tx, child, lessonId) {
  const lesson = await findPlayable(tx, child, lessonId)
  if (lesson.content.after && (child.assigned_lessons ?? []).includes(lesson.content.after)) {
    const finished = (slug) =>
      tx.attempts.count({ where: { child_id: child.id, status: 'completed', lesson: { slug } } })
    if (!(await finished(lesson.content.after)) && !(await finished(lesson.slug)))
      throw lessonLocked()
  }
  return { lesson_id: lesson.id, steps_total: stepsTotal(lesson.content) }
}

export function startAttempt(user, id, { lesson_id: lessonId, assessment_id: assessmentId }, ctx) {
  return db.$transaction(async (tx) => {
    const child = await findLearner(tx, user, id)
    const source = assessmentId
      ? await startAssessment(tx, child, assessmentId)
      : await startLesson(tx, child, lessonId)
    const attempt = await tx.attempts.create({
      data: { child_id: id, ...source },
      select: {
        id: true,
        status: true,
        steps_total: true,
        steps_completed: true,
        stars: true,
        started_at: true
      }
    })
    await audit(tx, {
      actor: user,
      action: 'attempt.started',
      entityType: 'attempt',
      entityId: attempt.id,
      diff: { child_id: id, lesson_id: lessonId ?? null, assessment_id: assessmentId ?? null },
      ctx
    })
    return attempt
  })
}

function assessmentEvents(events, assessment) {
  const settings = withDefaults(assessment.settings)
  return events
    .filter((event) => event.step === ASSESS_STEP && assessment.items[event.index])
    .map((event) =>
      keepCollected(
        { ...event, points: pointsFor(event, assessment.items[event.index], settings) },
        settings
      )
    )
}

export function recordProgress(user, attemptId, body, ctx) {
  return db.$transaction(async (tx) => {
    const attempt = await tx.attempts.findFirst({
      where: { id: attemptId, child: { parent_id: user.id, deleted_at: null } },
      select: {
        id: true,
        status: true,
        steps_total: true,
        steps_completed: true,
        events: true,
        metadata: true,
        child_id: true,
        lesson: { select: { slug: true, content: true } },
        assessment: { select: { items: true, settings: true } }
      }
    })
    if (!attempt) throw attemptNotFound()
    if (attempt.status !== 'in_progress') throw attemptFinished()
    const incoming = attempt.assessment
      ? assessmentEvents(body.events, attempt.assessment)
      : body.events
    const events = [...attempt.events, ...incoming]
    if (events.length > MAX_EVENTS_PER_ATTEMPT) throw tooManyEvents()
    const stepsCompleted = Math.min(
      attempt.steps_total,
      Math.max(attempt.steps_completed, body.steps_completed)
    )
    const settings = attempt.assessment ? withDefaults(attempt.assessment.settings) : null
    const result =
      attempt.assessment && body.completed
        ? scoreAttempt(events, attempt.assessment.items, settings)
        : null
    const stars = body.completed && !attempt.assessment ? starsFor(events) : 0
    const quiz = body.completed && !attempt.assessment ? quizResult(events) : null
    const before =
      body.completed && attempt.lesson
        ? await tx.attempts.aggregate({
            where: {
              child_id: attempt.child_id,
              status: 'completed',
              lesson: { slug: attempt.lesson.slug }
            },
            _count: { _all: true },
            _max: { stars: true }
          })
        : null
    const starsBefore =
      body.completed && attempt.lesson
        ? ((
            await tx.attempts.aggregate({
              where: { child_id: attempt.child_id },
              _sum: { stars: true }
            })
          )._sum.stars ?? 0)
        : 0
    const saved = await tx.attempts.update({
      where: { id: attemptId },
      data: {
        events,
        steps_completed: stepsCompleted,
        status: body.completed ? 'completed' : 'in_progress',
        completed_at: body.completed ? new Date() : null,
        stars,
        metadata: result
          ? { ...attempt.metadata, result }
          : quiz
            ? { ...attempt.metadata, check: quiz }
            : undefined
      },
      select: attemptFields
    })
    if (body.completed) {
      await audit(tx, {
        actor: user,
        action: 'attempt.completed',
        entityType: 'attempt',
        entityId: attemptId,
        diff: { stars, steps_completed: stepsCompleted, score: result?.score ?? null },
        ctx
      })
    }
    const reward = before
      ? {
          ...rewardOf(
            stars,
            { times: before._count._all, best: before._max.stars ?? 0 },
            maxStars(attempt.lesson.content)
          ),
          new_friend: newFriend(starsBefore, stars)
        }
      : null
    if (result && settings.visibility.child_score) return { ...saved, result }
    return reward ? { ...saved, reward } : saved
  }, SERIAL)
}

export async function exitLearning(user, id, pin) {
  const child = await findLearner(db, user, id)
  if (child.pin_hash && !(pin && (await Bun.password.verify(pin, child.pin_hash)))) throw wrongPin()
  return { ok: true }
}
