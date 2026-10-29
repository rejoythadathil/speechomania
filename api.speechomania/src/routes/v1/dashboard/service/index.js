import { sql } from '../../../../../common-service/db/service/index.js'
import { pageArray } from '../../../../../common-service/http/utils/index.js'
import { STALE_DAYS } from '../constants/index.js'
import { caseload, rank, reasons } from '../utils/index.js'

function childScope(user) {
  return user.role === 'mentor' ? sql`AND c.mentor_id = ${user.id}` : sql``
}

function remarkScope(user) {
  return user.role === 'mentor' ? sql`AND r.author_id = ${user.id}` : sql``
}

function requestScope(user) {
  return user.role === 'mentor' ? sql`AND cr.requested_by = ${user.id}` : sql``
}

function careRows(user) {
  return sql`
    SELECT c.id, c.display_name, c.mentor_id, c.created_at, m.full_name AS mentor_name,
      jsonb_array_length(c.assigned_lessons) AS lessons,
      last.at AS last_remark_at,
      floor(extract(epoch FROM now() - coalesce(last.at, c.created_at)) / 86400)::int AS quiet_days
    FROM children c
    LEFT JOIN users m ON m.id = c.mentor_id
    LEFT JOIN LATERAL (SELECT max(r.created_at) AS at FROM remarks r WHERE r.child_id = c.id AND r.deleted_at IS NULL) last ON true
    WHERE c.deleted_at IS NULL AND c.status = 'active' ${childScope(user)}
  `
}

async function followUp(user) {
  const rows = await careRows(user)
  const items = rows
    .map((row) => ({ id: row.id, display_name: row.display_name, mentor_name: row.mentor_name, last_remark_at: row.last_remark_at, reasons: reasons(row) }))
    .filter((item) => item.reasons.length)
    .sort((a, b) => rank(b) - rank(a))
  return { rows, items }
}

function enrolmentsByMonth(user) {
  return sql`
    SELECT to_char(m, 'YYYY-MM') AS month, count(c.id)::int AS count
    FROM generate_series(date_trunc('month', now()) - interval '11 months', date_trunc('month', now()), interval '1 month') AS m
    LEFT JOIN children c ON date_trunc('month', c.created_at) = m AND c.deleted_at IS NULL ${childScope(user)}
    GROUP BY m
    ORDER BY m
  `
}

function remarksByWeek(user) {
  return sql`
    SELECT to_char(w, 'YYYY-MM-DD') AS week,
      count(r.id) FILTER (WHERE r.visibility = 'shared')::int AS shared,
      count(r.id) FILTER (WHERE r.visibility = 'internal')::int AS internal
    FROM generate_series(date_trunc('week', now()) - interval '11 weeks', date_trunc('week', now()), interval '1 week') AS w
    LEFT JOIN remarks r ON date_trunc('week', r.created_at) = w AND r.deleted_at IS NULL ${remarkScope(user)}
    GROUP BY w
    ORDER BY w
  `
}

async function pendingRequests(user) {
  const [{ count }] = await sql`SELECT count(*)::int AS count FROM change_requests cr WHERE cr.status = 'pending' ${requestScope(user)}`
  return count
}

async function parentSummary(user) {
  const [row] = await sql`
    SELECT
      (SELECT count(*)::int FROM children WHERE parent_id = ${user.id} AND deleted_at IS NULL) AS my_children,
      (SELECT count(*)::int FROM remarks r JOIN children c ON c.id = r.child_id
        WHERE c.parent_id = ${user.id} AND r.visibility = 'shared' AND r.deleted_at IS NULL AND c.deleted_at IS NULL) AS shared_remarks
  `
  return row
}

export async function summary(user) {
  if (user.role === 'parent') return parentSummary(user)
  const [care, enrolments, remarks, pending, mentors] = await Promise.all([
    followUp(user),
    enrolmentsByMonth(user),
    remarksByWeek(user),
    pendingRequests(user),
    user.role === 'admin' ? sql`SELECT id, full_name FROM users WHERE role = 'mentor' AND deleted_at IS NULL` : null
  ])
  const count = (code) => care.items.filter((item) => item.reasons.some((reason) => reason.code === code)).length
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
