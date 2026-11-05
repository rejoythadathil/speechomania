import { audit } from '../../../../../common-service/audit/service/index.js'
import { SERIAL } from '../../../../../common-service/db/constants/index.js'
import { db } from '../../../../../common-service/db/service/index.js'
import { signAudio } from '../../../../../common-service/voice/service/index.js'
import { containsText, pageOf } from '../../../../../common-service/http/utils/index.js'
import {
  alreadyDraft,
  cannotRemove,
  draftExists,
  lessonNotFound,
  noSteps,
  tooFewActivities,
  onlyDraftsEditable,
  onlyDraftsPublishable,
  slugTaken
} from '../exception/index.js'
import { MIN_ACTIVITIES } from '../constants/index.js'
import { assignedSlugs, lessonView, stepCount, versionSummary } from '../utils/index.js'

const fields = {
  id: true,
  slug: true,
  version: true,
  title: true,
  content: true,
  status: true,
  metadata: true,
  created_at: true,
  published_at: true,
  creator: { select: { full_name: true } },
  publisher: { select: { full_name: true } }
}

async function visible(tx, user) {
  if (user.role === 'admin') return {}
  if (user.role === 'mentor') return { status: 'published' }
  const children = await tx.children.findMany({
    where: { parent_id: user.id, deleted_at: null },
    select: { assigned_lessons: true }
  })
  return { status: 'published', slug: { in: assignedSlugs(children) } }
}

export async function findLesson(tx, user, id) {
  const lesson = await tx.lessons.findFirst({
    where: { id, ...(await visible(tx, user)) },
    select: fields
  })
  if (!lesson) throw lessonNotFound()
  return lessonView(lesson)
}

async function currentOnly(tx) {
  const published = await tx.lessons.findMany({
    where: { status: 'published' },
    select: { slug: true }
  })
  return {
    OR: [
      { status: { in: ['published', 'archived'] } },
      { status: 'draft', slug: { notIn: published.map((row) => row.slug) } }
    ]
  }
}

export async function listLessons(user, { status, q, ...window }) {
  const page = await pageOf(
    db.lessons,
    {
      where: {
        AND: [
          await visible(db, user),
          status ? { status } : await currentOnly(db),
          q ? { OR: [{ title: containsText(q) }, { slug: containsText(q) }] } : {}
        ]
      },
      select: {
        id: true,
        slug: true,
        version: true,
        title: true,
        status: true,
        created_at: true,
        published_at: true,
        content: true
      },
      orderBy: [{ slug: 'asc' }, { version: 'desc' }]
    },
    window
  )
  const counts = await db.lessons.groupBy({
    by: ['slug', 'status'],
    where: { slug: { in: page.items.map((lesson) => lesson.slug) } },
    _count: { _all: true }
  })
  return {
    ...page,
    items: page.items.map(({ content, ...lesson }) => ({
      ...lesson,
      player: content?.player ?? 'story',
      step_count: stepCount(content),
      ...versionSummary(counts, lesson.slug)
    }))
  }
}

export async function listVersions(user, id, window) {
  const lesson = await findLesson(db, user, id)
  return pageOf(
    db.lessons,
    {
      where: { slug: lesson.slug },
      select: {
        id: true,
        version: true,
        status: true,
        title: true,
        created_at: true,
        published_at: true
      },
      orderBy: { version: 'desc' }
    },
    window
  )
}

export function createLesson(user, body, ctx) {
  return db.$transaction(async (tx) => {
    if (await tx.lessons.count({ where: { slug: body.slug } })) throw slugTaken()
    const { id } = await tx.lessons.create({
      data: {
        slug: body.slug,
        version: 1,
        title: body.title,
        content: body.content,
        created_by: user.id,
        metadata: body.metadata ?? {}
      },
      select: { id: true }
    })
    await audit(tx, {
      actor: user,
      action: 'lesson.created',
      entityType: 'lesson',
      entityId: id,
      diff: { slug: body.slug },
      ctx
    })
    return findLesson(tx, user, id)
  })
}

async function findRaw(tx, id) {
  const lesson = await tx.lessons.findUnique({ where: { id } })
  if (!lesson) throw lessonNotFound()
  return lesson
}

export function updateLesson(user, id, body, ctx) {
  return db.$transaction(async (tx) => {
    const current = await findRaw(tx, id)
    if (current.status !== 'draft') throw onlyDraftsEditable()
    await tx.lessons.update({
      where: { id },
      data: {
        title: body.title,
        content: body.content,
        metadata: { ...current.metadata, ...body.metadata }
      }
    })
    await audit(tx, {
      actor: user,
      action: 'lesson.updated',
      entityType: 'lesson',
      entityId: id,
      diff: { fields: Object.keys(body) },
      ctx
    })
    return findLesson(tx, user, id)
  }, SERIAL)
}

export function publishLesson(user, id, ctx) {
  return db.$transaction(async (tx) => {
    const current = await findRaw(tx, id)
    if (current.status !== 'draft') throw onlyDraftsPublishable()
    const steps = stepCount(current.content)
    if (!steps) throw noSteps()
    if (steps < MIN_ACTIVITIES) throw tooFewActivities(steps, MIN_ACTIVITIES)
    await tx.lessons.updateMany({
      where: { slug: current.slug, status: 'published' },
      data: { status: 'superseded' }
    })
    await tx.lessons.update({
      where: { id },
      data: { status: 'published', published_by: user.id, published_at: new Date() }
    })
    await audit(tx, {
      actor: user,
      action: 'lesson.published',
      entityType: 'lesson',
      entityId: id,
      diff: { slug: current.slug, version: current.version },
      ctx
    })
    return findLesson(tx, user, id)
  }, SERIAL)
}

export async function createDraftFrom(tx, user, source, ctx) {
  const draft = await tx.lessons.findFirst({
    where: { slug: source.slug, status: 'draft' },
    select: { id: true }
  })
  if (draft) return { id: draft.id, created: false }
  const { _max } = await tx.lessons.aggregate({
    where: { slug: source.slug },
    _max: { version: true }
  })
  const { id } = await tx.lessons.create({
    data: {
      slug: source.slug,
      version: _max.version + 1,
      title: source.title,
      content: source.content,
      created_by: user.id
    },
    select: { id: true }
  })
  await audit(tx, {
    actor: user,
    action: 'lesson.version_created',
    entityType: 'lesson',
    entityId: id,
    diff: { from: source.id },
    ctx
  })
  return { id, created: true }
}

export function newVersion(user, id, ctx) {
  return db.$transaction(async (tx) => {
    const source = await findRaw(tx, id)
    if (source.status === 'draft') throw alreadyDraft()
    const { id: draftId, created } = await createDraftFrom(tx, user, source, ctx)
    if (!created) throw draftExists()
    return findLesson(tx, user, draftId)
  }, SERIAL)
}

export async function removeLesson(user, id, ctx) {
  await db.$transaction(async (tx) => {
    const current = await findRaw(tx, id)
    if (current.status === 'draft') {
      await tx.lessons.delete({ where: { id } })
    } else if (current.status === 'published') {
      await tx.lessons.update({ where: { id }, data: { status: 'archived' } })
    } else {
      throw cannotRemove()
    }
    await audit(tx, {
      actor: user,
      action: current.status === 'draft' ? 'lesson.draft_deleted' : 'lesson.archived',
      entityType: 'lesson',
      entityId: id,
      diff: { slug: current.slug, version: current.version },
      ctx
    })
  }, SERIAL)
}

export async function getLesson(user, id) {
  const lesson = await findLesson(db, user, id)
  signAudio(lesson.content)
  return lesson
}
