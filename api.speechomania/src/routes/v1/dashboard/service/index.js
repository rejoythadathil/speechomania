import { db } from '../../../../../common-service/db/service/index.js'
import { pageArray } from '../../../../../common-service/http/utils/index.js'
import { SERIES_LENGTH, STALE_DAYS } from '../constants/index.js'
import {
  caseload,
  enrolmentSeries,
  monthKeys,
  quietDays,
  rank,
  reasons,
  remarkSeries,
  weekKeys
} from '../utils/index.js'

const childScope = (user) => (user.role === 'mentor' ? { mentor_id: user.id } : {})
const remarkScope = (user) => (user.role === 'mentor' ? { author_id: user.id } : {})
const requestScope = (user) => (user.role === 'mentor' ? { requested_by: user.id } : {})

async function careRows(user) {
  const children = await db.children.findMany({
    where: { deleted_at: null, status: 'active', ...childScope(user) },
    select: {
      id: true,
      display_name: true,
      mentor_id: true,
      created_at: true,
      assigned_lessons: true,
      mentor: { select: { full_name: true } }
    }
  })
  const latest = await db.remarks.groupBy({
    by: ['child_id'],
    where: { child_id: { in: children.map((child) => child.id) }, deleted_at: null },
    _max: { created_at: true }
  })
  const lastAt = new Map(latest.map((row) => [row.child_id, row._max.created_at]))
  const now = new Date()
  return children.map(({ mentor, assigned_lessons: lessons, ...child }) => {
    const last = lastAt.get(child.id) ?? null
    return {
      ...child,
      mentor_name: mentor?.full_name ?? null,
      lessons: lessons?.length ?? 0,
      last_remark_at: last,
      quiet_days: quietDays(last ?? child.created_at, now)
    }
  })
}

async function followUp(user) {
  const rows = await careRows(user)
  const items = rows
    .map((row) => ({
      id: row.id,
      display_name: row.display_name,
      mentor_name: row.mentor_name,
      last_remark_at: row.last_remark_at,
      reasons: reasons(row)
    }))
    .filter((item) => item.reasons.length)
    .sort((a, b) => rank(b) - rank(a))
  return { rows, items }
}

async function enrolmentsByMonth(user) {
  const keys = monthKeys(new Date(), SERIES_LENGTH)
  const children = await db.children.findMany({
    where: {
      deleted_at: null,
      created_at: { gte: new Date(`${keys[0]}-01T00:00:00Z`) },
      ...childScope(user)
    },
    select: { created_at: true }
  })
  return enrolmentSeries(
    keys,
    children.map((child) => child.created_at)
  )
}

async function remarksByWeek(user) {
  const keys = weekKeys(new Date(), SERIES_LENGTH)
  const remarks = await db.remarks.findMany({
    where: {
      deleted_at: null,
      created_at: { gte: new Date(`${keys[0]}T00:00:00Z`) },
      ...remarkScope(user)
    },
    select: { created_at: true, visibility: true }
  })
  return remarkSeries(keys, remarks)
}

const pendingRequests = (user) =>
  db.change_requests.count({ where: { status: 'pending', ...requestScope(user) } })

async function parentSummary(user) {
  const [myChildren, sharedRemarks] = await Promise.all([
    db.children.count({ where: { parent_id: user.id, deleted_at: null } }),
    db.remarks.count({
      where: {
        visibility: 'shared',
        deleted_at: null,
        child: { parent_id: user.id, deleted_at: null }
      }
    })
  ])
  return { my_children: myChildren, shared_remarks: sharedRemarks }
}

export async function summary(user) {
  if (user.role === 'parent') return parentSummary(user)
  const [care, enrolments, remarks, pending, mentors] = await Promise.all([
    followUp(user),
    enrolmentsByMonth(user),
    remarksByWeek(user),
    pendingRequests(user),
    user.role === 'admin'
      ? db.users.findMany({
          where: { role: 'mentor', deleted_at: null },
          select: { id: true, full_name: true }
        })
      : null
  ])
  const count = (code) =>
    care.items.filter((item) => item.reasons.some((reason) => reason.code === code)).length
  return {
    stale_days: STALE_DAYS,
    kpis: {
      children: care.rows.length,
      waiting_for_mentor: count('no_mentor'),
      needs_remark: count('no_recent_remark') + count('never_remarked'),
      no_lessons: count('no_lessons'),
      pending_requests: pending
    },
    follow_up_total: care.items.length,
    caseload: mentors ? caseload(care.rows, mentors) : null,
    enrolments_by_month: enrolments,
    remarks_by_week: remarks
  }
}

export async function followUpPage(user, window) {
  const { items } = await followUp(user)
  return pageArray(items, window)
}

export async function badges(user) {
  if (user.role === 'parent') return {}
  const [care, pending] = await Promise.all([followUp(user), pendingRequests(user)])
  return { '/children': care.items.length, '/change-requests': pending }
}
