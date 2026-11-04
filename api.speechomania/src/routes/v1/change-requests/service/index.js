import { audit } from '../../../../../common-service/audit/service/index.js'
import { SERIAL } from '../../../../../common-service/db/constants/index.js'
import { db } from '../../../../../common-service/db/service/index.js'
import { pageOf } from '../../../../../common-service/http/utils/index.js'
import { createDraftFrom, findLesson } from '../../lessons/service/index.js'
import { alreadyReviewed, noPublishedVersion, requestNotFound } from '../exception/index.js'

const fields = {
  id: true,
  reason: true,
  proposed_change: true,
  status: true,
  review_note: true,
  reviewed_at: true,
  created_at: true,
  metadata: true,
  lesson_id: true,
  requested_by: true,
  lesson: { select: { slug: true, title: true, version: true } },
  author: { select: { full_name: true } },
  reviewer: { select: { full_name: true } }
}

function requestView({ lesson, author, reviewer, ...request }) {
  return {
    ...request,
    lesson_slug: lesson.slug,
    lesson_title: lesson.title,
    lesson_version: lesson.version,
    requested_by_name: author.full_name,
    reviewed_by_name: reviewer?.full_name ?? null
  }
}

const scope = (user) => (user.role === 'admin' ? {} : { requested_by: user.id })

export async function listRequests(user, { status, ...window }) {
  const page = await pageOf(
    db.change_requests,
    {
      where: { ...scope(user), status },
      select: fields,
      orderBy: [{ created_at: 'desc' }, { id: 'asc' }]
    },
    window
  )
  return { ...page, items: page.items.map(requestView) }
}

export async function getRequest(user, id, tx = db) {
  const request = await tx.change_requests.findFirst({
    where: { id, ...scope(user) },
    select: fields
  })
  if (!request) throw requestNotFound()
  return requestView(request)
}

export function createRequest(user, body, ctx) {
  return db.$transaction(async (tx) => {
    const lesson = await findLesson(tx, { role: 'mentor' }, body.lesson_id)
    const { id } = await tx.change_requests.create({
      data: {
        lesson_id: lesson.id,
        requested_by: user.id,
        reason: body.reason,
        proposed_change: body.proposed_change
      },
      select: { id: true }
    })
    await audit(tx, {
      actor: user,
      action: 'change_request.created',
      entityType: 'change_request',
      entityId: id,
      diff: { lesson_id: lesson.id },
      ctx
    })
    return getRequest(user, id, tx)
  })
}

export function reviewRequest(user, id, { decision, review_note }, ctx) {
  return db.$transaction(async (tx) => {
    const current = await tx.change_requests.findUnique({
      where: { id },
      include: { lesson: { select: { slug: true } } }
    })
    if (!current) throw requestNotFound()
    if (current.status !== 'pending') throw alreadyReviewed()
    let draft = null
    if (decision === 'approve') {
      const source = await tx.lessons.findFirst({
        where: { slug: current.lesson.slug, status: { in: ['published', 'draft'] } },
        orderBy: { version: 'desc' }
      })
      if (!source) throw noPublishedVersion()
      draft =
        source.status === 'draft' ? { id: source.id } : await createDraftFrom(tx, user, source, ctx)
    }
    await tx.change_requests.update({
      where: { id },
      data: {
        status: decision === 'approve' ? 'approved' : 'rejected',
        reviewed_by: user.id,
        review_note: review_note || null,
        reviewed_at: new Date(),
        metadata: { ...current.metadata, ...(draft ? { draft_lesson_id: draft.id } : {}) }
      }
    })
    await audit(tx, {
      actor: user,
      action: `change_request.${decision === 'approve' ? 'approved' : 'rejected'}`,
      entityType: 'change_request',
      entityId: id,
      diff: { draft_lesson_id: draft?.id ?? null },
      ctx
    })
    return getRequest(user, id, tx)
  }, SERIAL)
}
