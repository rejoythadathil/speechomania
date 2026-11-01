import { audit } from '../../../../../common-service/audit/service/index.js'
import { SERIAL } from '../../../../../common-service/db/constants/index.js'
import { db } from '../../../../../common-service/db/service/index.js'
import { signAudio } from '../../../../../common-service/voice/service/index.js'
import { containsText, pageArray, pageOf } from '../../../../../common-service/http/utils/index.js'
import { findScopedChild } from '../../children/service/index.js'
import { childScope } from '../../children/utils/index.js'
import {
  assessmentNotFound,
  attemptNotFound,
  cannotRemove,
  noItems,
  notAssignable,
  onlyDraftsEditable,
  onlyDraftsPublishable,
  questionsUnavailable
} from '../exception/index.js'
import {
  assignmentOf,
  hideScore,
  itemPoints,
  lastAnswers,
  maxScore,
  questionStats,
  resultOf,
  snapshotItem,
  withDefaults
} from '../utils/index.js'

const people = {
  creator: { select: { full_name: true } },
  publisher: { select: { full_name: true } }
}

const visible = (user) =>
  user.role === 'admin' ? {} : { status: { in: ['published', 'archived'] } }

const assignedTo = (id) => ({ assigned_assessments: { array_contains: [{ assessment_id: id }] } })

function assessmentView({ creator, publisher, ...assessment }) {
  const settings = withDefaults(assessment.settings)
  return {
    ...assessment,
    settings,
    question_count: assessment.items.length,
    max_score: maxScore(assessment.items, settings),
    created_by_name: creator?.full_name ?? null,
    published_by_name: publisher?.full_name ?? null
  }
}

async function findAssessment(tx, user, id) {
  const assessment = await tx.assessments.findFirst({
    where: { id, ...visible(user) },
    include: people
  })
  if (!assessment) throw assessmentNotFound()
  return assessmentView(assessment)
}

async function assignedChildren(tx, user, id, q) {
  return tx.children.findMany({
    where: {
      deleted_at: null,
      AND: [childScope(user), assignedTo(id), q ? { display_name: containsText(q) } : {}]
    },
    select: {
      id: true,
      display_name: true,
      assigned_assessments: true,
      mentor: { select: { full_name: true } }
    },
    orderBy: [{ display_name: 'asc' }, { id: 'asc' }]
  })
}

function attemptsFor(tx, assessmentIds, childIds) {
  return tx.attempts.findMany({
    where: { assessment_id: { in: assessmentIds }, child_id: { in: childIds } },
    select: {
      id: true,
      child_id: true,
      assessment_id: true,
      status: true,
      events: true,
      metadata: true,
      started_at: true,
      completed_at: true
    },
    orderBy: [{ completed_at: { sort: 'desc', nulls: 'last' } }, { started_at: 'desc' }]
  })
}

const groupBy = (rows, key) =>
  rows.reduce((map, row) => map.set(row[key], [...(map.get(row[key]) ?? []), row]), new Map())

async function resolveItems(tx, inputs) {
  const lessons = await tx.lessons.findMany({
    where: { id: { in: [...new Set(inputs.map((input) => input.lesson_id))] }, status: 'published' }
  })
  const byId = new Map(lessons.map((lesson) => [lesson.id, lesson]))
  const problems = []
  const items = inputs.map((input, index) => {
    const lesson = byId.get(input.lesson_id)
    const item = lesson ? snapshotItem(lesson, input.step_index, input.points) : null
    if (!item)
      problems.push({
        field: `items.${index}`,
        message: lesson
          ? 'This question cannot be used in an assessment'
          : 'Pick questions from published lessons'
      })
    return item
  })
  if (problems.length) throw questionsUnavailable(problems)
  return items
}

export async function listAssessments(user, { status, q, ...window }) {
  const page = await pageOf(
    db.assessments,
    {
      where: {
        AND: [visible(user), status ? { status } : {}, q ? { title: containsText(q) } : {}]
      },
      include: people,
      orderBy: [{ created_at: 'desc' }, { id: 'asc' }]
    },
    window
  )
  const ids = page.items.map((assessment) => assessment.id)
  const [assigned, completed] = await Promise.all([
    Promise.all(
      ids.map((id) =>
        db.children.count({ where: { deleted_at: null, ...childScope(user), ...assignedTo(id) } })
      )
    ),
    db.attempts.groupBy({
      by: ['assessment_id', 'child_id'],
      where: {
        assessment_id: { in: ids },
        status: 'completed',
        child: { deleted_at: null, ...childScope(user) }
      }
    })
  ])
  const done = groupBy(completed, 'assessment_id')
  return {
    ...page,
    items: page.items.map((assessment, index) => {
      const { items: _items, settings: _settings, ...view } = assessmentView(assessment)
      return { ...view, assigned: assigned[index], completed: done.get(assessment.id)?.length ?? 0 }
    })
  }
}

export async function getAssessment(user, id) {
  const assessment = await findAssessment(db, user, id)
  for (const item of assessment.items)
    signAudio({ lines: item.lines, steps: [item.step, ...(item.context ?? [])] })
  return assessment
}

export function createAssessment(user, body, ctx) {
  return db.$transaction(async (tx) => {
    const items = await resolveItems(tx, body.items)
    const { id } = await tx.assessments.create({
      data: {
        title: body.title,
        description: body.description || null,
        settings: body.settings,
        items,
        created_by: user.id
      },
      select: { id: true }
    })
    await audit(tx, {
      actor: user,
      action: 'assessment.created',
      entityType: 'assessment',
      entityId: id,
      diff: { questions: items.length },
      ctx
    })
    return findAssessment(tx, user, id)
  })
}

async function findDraft(tx, id) {
  const assessment = await tx.assessments.findUnique({ where: { id } })
  if (!assessment) throw assessmentNotFound()
  return assessment
}

export function updateAssessment(user, id, body, ctx) {
  return db.$transaction(async (tx) => {
    const current = await findDraft(tx, id)
    if (current.status !== 'draft') throw onlyDraftsEditable()
    await tx.assessments.update({
      where: { id },
      data: {
        title: body.title,
        description: body.description === undefined ? undefined : body.description || null,
        settings: body.settings,
        items: body.items ? await resolveItems(tx, body.items) : undefined,
        updated_at: new Date()
      }
    })
    await audit(tx, {
      actor: user,
      action: 'assessment.updated',
      entityType: 'assessment',
      entityId: id,
      diff: { fields: Object.keys(body) },
      ctx
    })
    return findAssessment(tx, user, id)
  }, SERIAL)
}

export function publishAssessment(user, id, ctx) {
  return db.$transaction(async (tx) => {
    const current = await findDraft(tx, id)
    if (current.status !== 'draft') throw onlyDraftsPublishable()
    if (!current.items.length) throw noItems()
    await tx.assessments.update({
      where: { id },
      data: {
        status: 'published',
        published_by: user.id,
        published_at: new Date(),
        updated_at: new Date()
      }
    })
    await audit(tx, {
      actor: user,
      action: 'assessment.published',
      entityType: 'assessment',
      entityId: id,
      diff: { questions: current.items.length },
      ctx
    })
    return findAssessment(tx, user, id)
  }, SERIAL)
}

export async function removeAssessment(user, id, ctx) {
  await db.$transaction(async (tx) => {
    const current = await findDraft(tx, id)
    if (current.status === 'draft') {
      await tx.assessments.delete({ where: { id } })
    } else if (current.status === 'published') {
      await tx.assessments.update({
        where: { id },
        data: { status: 'archived', updated_at: new Date() }
      })
    } else {
      throw cannotRemove()
    }
    await audit(tx, {
      actor: user,
      action: current.status === 'draft' ? 'assessment.draft_deleted' : 'assessment.archived',
      entityType: 'assessment',
      entityId: id,
      ctx
    })
  }, SERIAL)
}

export function assignAssessment(user, id, { child_ids: childIds, due_on: dueOn }, ctx) {
  return db.$transaction(async (tx) => {
    const assessment = await findAssessment(tx, user, id)
    if (assessment.status !== 'published') throw notAssignable()
    for (const childId of childIds) {
      const child = await findScopedChild(tx, user, childId)
      const others = (child.assigned_assessments ?? []).filter(
        (entry) => entry.assessment_id !== id
      )
      const previous = assignmentOf(child, id)
      await tx.children.update({
        where: { id: childId },
        data: {
          assigned_assessments: [
            ...others,
            {
              assessment_id: id,
              due_on: dueOn ?? null,
              assigned_by: previous?.assigned_by ?? user.id,
              assigned_at: previous?.assigned_at ?? new Date().toISOString()
            }
          ],
          updated_at: new Date()
        }
      })
    }
    await audit(tx, {
      actor: user,
      action: 'assessment.assigned',
      entityType: 'assessment',
      entityId: id,
      diff: { child_ids: childIds, due_on: dueOn ?? null },
      ctx
    })
    return { assessment_id: id, assigned: childIds.length }
  }, SERIAL)
}

export async function unassignAssessment(user, id, childId, ctx) {
  await db.$transaction(async (tx) => {
    await findAssessment(tx, user, id)
    const child = await findScopedChild(tx, user, childId)
    await tx.children.update({
      where: { id: childId },
      data: {
        assigned_assessments: (child.assigned_assessments ?? []).filter(
          (entry) => entry.assessment_id !== id
        ),
        updated_at: new Date()
      }
    })
    await audit(tx, {
      actor: user,
      action: 'assessment.unassigned',
      entityType: 'assessment',
      entityId: id,
      diff: { child_id: childId },
      ctx
    })
  }, SERIAL)
}

async function childResults(user, assessment, q) {
  const children = await assignedChildren(db, user, assessment.id, q)
  const attempts = groupBy(
    await attemptsFor(
      db,
      [assessment.id],
      children.map((child) => child.id)
    ),
    'child_id'
  )
  return children.map((child) => {
    const assignment = assignmentOf(child, assessment.id)
    return {
      child_id: child.id,
      display_name: child.display_name,
      mentor_name: child.mentor?.full_name ?? null,
      due_on: assignment?.due_on ?? null,
      assigned_at: assignment?.assigned_at ?? null,
      ...resultOf(attempts.get(child.id) ?? []),
      latest_attempt:
        (attempts.get(child.id) ?? []).find((attempt) => attempt.status === 'completed') ?? null
    }
  })
}

export async function listResults(user, id, { status, q, ...window }) {
  const assessment = await findAssessment(db, user, id)
  const rows = (await childResults(user, assessment, q))
    .filter((row) => !status || row.status === status)
    .map(({ latest_attempt: _attempt, ...row }) => row)
  return pageArray(rows, window)
}

export async function resultSummary(user, id) {
  const assessment = await findAssessment(db, user, id)
  const rows = await childResults(user, assessment)
  const finished = rows.filter((row) => row.latest)
  const average = (values) =>
    values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : null
  const graded = finished.filter(
    (row) => row.latest.passed !== null && row.latest.passed !== undefined
  )
  return {
    assigned: rows.length,
    started: rows.filter((row) => row.status !== 'not_started').length,
    completed: finished.length,
    average_percent: average(finished.map((row) => row.latest.percent ?? 0)),
    pass_rate: graded.length
      ? Math.round((graded.filter((row) => row.latest.passed).length / graded.length) * 100)
      : null,
    questions: questionStats(
      assessment.items,
      finished.map((row) => row.latest_attempt)
    )
  }
}

export async function listForChild(user, childId, window) {
  const child = await findScopedChild(db, user, childId)
  const entries = child.assigned_assessments ?? []
  const assessments = await db.assessments.findMany({
    where: {
      id: { in: entries.map((entry) => entry.assessment_id) },
      status: { in: ['published', 'archived'] }
    }
  })
  const byId = new Map(assessments.map((assessment) => [assessment.id, assessment]))
  const attempts = groupBy(
    await attemptsFor(
      db,
      assessments.map((assessment) => assessment.id),
      [childId]
    ),
    'assessment_id'
  )
  const rows = entries
    .filter((entry) => byId.has(entry.assessment_id))
    .map((entry) => {
      const assessment = byId.get(entry.assessment_id)
      const settings = withDefaults(assessment.settings)
      const result = resultOf(attempts.get(assessment.id) ?? [])
      const hidden = user.role === 'parent' && !settings.visibility.parent_score
      return {
        assessment_id: assessment.id,
        title: assessment.title,
        status: assessment.status,
        question_count: assessment.items.length,
        max_score: maxScore(assessment.items, settings),
        due_on: entry.due_on ?? null,
        assigned_at: entry.assigned_at ?? null,
        score_hidden: hidden,
        ...(hidden ? hideScore(result) : result)
      }
    })
  return pageArray(rows, window)
}

export async function getAttemptResult(user, attemptId) {
  const attempt = await db.attempts.findFirst({
    where: { id: attemptId, assessment_id: { not: null } },
    include: { assessment: true, child: { select: { display_name: true } } }
  })
  if (!attempt) throw attemptNotFound()
  await findScopedChild(db, user, attempt.child_id)
  if (user.role !== 'admin' && attempt.assessment.status === 'draft') throw attemptNotFound()
  const settings = withDefaults(attempt.assessment.settings)
  const hidden = user.role === 'parent' && !settings.visibility.parent_score
  const answers = lastAnswers(attempt.events)
  return {
    id: attempt.id,
    assessment_id: attempt.assessment_id,
    title: attempt.assessment.title,
    child_id: attempt.child_id,
    child_name: attempt.child.display_name,
    status: attempt.status,
    started_at: attempt.started_at,
    completed_at: attempt.completed_at,
    score_hidden: hidden,
    result: hidden ? null : (attempt.metadata?.result ?? null),
    collected: settings.collect,
    questions: attempt.assessment.items.map((item, index) => {
      const answer = answers.get(index) ?? null
      return {
        index,
        text: item.step.text,
        lesson_title: item.lesson_title,
        player: item.player,
        answer: item.step.answer ?? item.step.word ?? null,
        max_points: itemPoints(item, settings),
        response: hidden ? null : answer
      }
    })
  }
}
