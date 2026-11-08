import { beforeAll, describe, expect, test } from 'bun:test'
import { db } from '../../../../../common-service/db/service/index.js'
import { STALE_DAYS } from '../constants/index.js'
import {
  caseload,
  enrolmentSeries,
  learningSeries,
  monthKeys,
  quietDays,
  rank,
  reasons,
  remarkSeries,
  weekKey,
  weekKeys
} from '../utils/index.js'
import { call, makeChild, makePublishedLesson, makeUser } from '../../../../../test/helpers.js'

let admin, mentor, otherMentor, parent, fresh, stale

beforeAll(async () => {
  admin = await makeUser('admin')
  mentor = await makeUser('mentor')
  otherMentor = await makeUser('mentor')
  parent = await makeUser('parent')
  fresh = await makeChild(parent, admin, mentor)
  stale = await makeChild(parent, admin, otherMentor)
  await makeChild(parent, admin, null)
  await call(mentor, 'POST', `/children/${fresh.id}/remarks`, {
    body: 'Weekly note',
    visibility: 'shared'
  })
  const lesson = await makePublishedLesson(admin)
  await db.attempts.create({
    data: {
      child_id: fresh.id,
      lesson_id: lesson.id,
      status: 'completed',
      steps_total: 2,
      steps_completed: 2,
      completed_at: new Date()
    }
  })
  await db.children.update({
    where: { id: stale.id },
    data: { created_at: new Date(Date.now() - 30 * 86400000) }
  })
})

const reasonsFor = (body, id) =>
  body.items.find((item) => item.id === id)?.reasons.map((reason) => reason.code) ?? []

describe('dashboard', () => {
  test('admin sees who needs follow-up and why', async () => {
    const { status, body } = await call(admin, 'GET', '/dashboard')
    expect(status).toBe(200)
    expect(body.enrolments_by_month).toHaveLength(12)
    expect(body.remarks_by_week).toHaveLength(12)
    expect(body.learning_by_week).toHaveLength(12)
    expect(body.learning_by_week.at(-1).games).toBeGreaterThanOrEqual(1)
    expect(body.kpis.learning_this_week).toBeGreaterThanOrEqual(1)
    expect(body.kpis.waiting_for_mentor).toBeGreaterThanOrEqual(1)
    expect(body.follow_up_total).toBeGreaterThanOrEqual(2)
    expect(body.caseload.find((row) => row.id === mentor.id)).toMatchObject({
      recent: 1,
      overdue: 0
    })
    expect(body.caseload.find((row) => row.id === otherMentor.id)).toMatchObject({
      recent: 0,
      overdue: 1
    })
  })

  test('mentor numbers only count their own children and remarks', async () => {
    const { body } = await call(mentor, 'GET', '/dashboard')
    expect(body.kpis.children).toBe(1)
    expect(body.kpis.needs_remark).toBe(0)
    expect(body.caseload).toBeNull()
    expect(body.remarks_by_week.at(-1).shared).toBe(1)
    const other = await call(otherMentor, 'GET', '/dashboard')
    expect(other.body.kpis.needs_remark).toBe(1)
    const otherFollowUp = await call(otherMentor, 'GET', '/dashboard/follow-up')
    expect(reasonsFor(otherFollowUp.body, stale.id)).toEqual(['never_remarked', 'no_lessons'])
    const mineFollowUp = await call(mentor, 'GET', '/dashboard/follow-up')
    expect(reasonsFor(mineFollowUp.body, fresh.id)).toEqual(['no_lessons'])
    expect(mineFollowUp.body).toMatchObject({ page: 1, page_size: 25, total: 1, total_pages: 1 })
    expect(other.body.remarks_by_week.at(-1).shared).toBe(0)
    expect(body.learning_by_week.at(-1)).toMatchObject({ games: 1, children: 1 })
    expect(other.body.learning_by_week.at(-1)).toMatchObject({ games: 0, children: 0 })
  })

  test('badges are scoped and parents get none', async () => {
    const mine = await call(otherMentor, 'GET', '/dashboard/badges')
    expect(mine.body['/children']).toBe(1)
    const none = await call(parent, 'GET', '/dashboard/badges')
    expect(none.body).toEqual({})
  })

  test('parents get their own small summary', async () => {
    const { body } = await call(parent, 'GET', '/dashboard')
    expect(body.my_children).toBe(3)
    expect(body.shared_remarks).toBe(1)
  })
})

describe('follow-up rules', () => {
  test('reasons come from mentor, remarks and lessons', () => {
    expect(reasons({ mentor_id: null, quiet_days: 0, lessons: 1 })).toEqual([
      { code: 'no_mentor', days: null }
    ])
    expect(
      reasons({ mentor_id: 'm', quiet_days: STALE_DAYS, last_remark_at: null, lessons: 0 }).map(
        (reason) => reason.code
      )
    ).toEqual(['never_remarked', 'no_lessons'])
    expect(
      reasons({ mentor_id: 'm', quiet_days: STALE_DAYS - 1, last_remark_at: 'x', lessons: 2 })
    ).toEqual([])
  })

  test('no mentor outranks no lessons, which outranks a long silence', () => {
    const noMentor = { reasons: [{ code: 'no_mentor', days: null }] }
    const noLessons = { reasons: [{ code: 'no_lessons', days: null }] }
    const quiet = { reasons: [{ code: 'no_recent_remark', days: 300 }] }
    expect([quiet, noLessons, noMentor].sort((a, b) => rank(b) - rank(a))).toEqual([
      noMentor,
      noLessons,
      quiet
    ])
  })

  test('caseload splits each mentor into recent and overdue', () => {
    const rows = [
      { mentor_id: 'a', quiet_days: 1 },
      { mentor_id: 'a', quiet_days: STALE_DAYS },
      { mentor_id: 'b', quiet_days: 2 },
      { mentor_id: null, quiet_days: 99 }
    ]
    expect(
      caseload(rows, [
        { id: 'b', full_name: 'Bea' },
        { id: 'a', full_name: 'Ann' }
      ])
    ).toEqual([
      { id: 'a', name: 'Ann', recent: 1, overdue: 1 },
      { id: 'b', name: 'Bea', recent: 1, overdue: 0 }
    ])
  })
})

describe('series helpers', () => {
  const now = new Date('2026-03-04T10:00:00Z')

  test('months and weeks end at the current one', () => {
    expect(monthKeys(now, 3)).toEqual(['2026-01', '2026-02', '2026-03'])
    expect(weekKeys(now, 2)).toEqual(['2026-02-23', '2026-03-02'])
    expect(weekKey(new Date('2026-03-08T23:00:00Z'))).toBe('2026-03-02')
  })

  test('series count into their bucket and ignore the rest', () => {
    expect(
      enrolmentSeries(
        ['2026-02', '2026-03'],
        [new Date('2026-03-01T00:00:00Z'), new Date('2025-01-01T00:00:00Z')]
      )
    ).toEqual([
      { month: '2026-02', count: 0 },
      { month: '2026-03', count: 1 }
    ])
    expect(
      remarkSeries(
        ['2026-03-02'],
        [{ created_at: new Date('2026-03-03T00:00:00Z'), visibility: 'shared' }]
      )
    ).toEqual([{ week: '2026-03-02', shared: 1, internal: 0 }])
    expect(
      learningSeries(
        ['2026-02-23', '2026-03-02'],
        [
          { child_id: 'a', completed_at: new Date('2026-03-03T00:00:00Z') },
          { child_id: 'a', completed_at: new Date('2026-03-04T00:00:00Z') },
          { child_id: 'b', completed_at: new Date('2026-03-04T00:00:00Z') },
          { child_id: 'c', completed_at: new Date('2025-01-01T00:00:00Z') }
        ]
      )
    ).toEqual([
      { week: '2026-02-23', games: 0, children: 0 },
      { week: '2026-03-02', games: 3, children: 2 }
    ])
    expect(quietDays(new Date('2026-03-01T10:00:00Z'), now)).toBe(3)
  })
})
