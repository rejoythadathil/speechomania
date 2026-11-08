import { FOLLOW_UP_WEIGHT, STALE_DAYS } from '../constants/index.js'

export function reasons(row) {
  const list = []
  if (!row.mentor_id) list.push({ code: 'no_mentor', days: null })
  if (row.mentor_id && row.quiet_days >= STALE_DAYS)
    list.push({
      code: row.last_remark_at ? 'no_recent_remark' : 'never_remarked',
      days: row.quiet_days
    })
  if (!row.lessons) list.push({ code: 'no_lessons', days: null })
  return list
}

export function rank(item) {
  const codes = item.reasons.map((reason) => reason.code)
  return (
    (codes.includes('no_mentor') ? FOLLOW_UP_WEIGHT.no_mentor : 0) +
    (codes.includes('no_lessons') ? FOLLOW_UP_WEIGHT.no_lessons : 0) +
    (item.reasons.find((reason) => reason.days)?.days ?? 0)
  )
}

export function caseload(rows, mentors) {
  const byMentor = new Map(
    mentors.map((mentor) => [
      mentor.id,
      { id: mentor.id, name: mentor.full_name, recent: 0, overdue: 0 }
    ])
  )
  for (const row of rows) {
    const entry = byMentor.get(row.mentor_id)
    if (entry) entry[row.quiet_days >= STALE_DAYS ? 'overdue' : 'recent'] += 1
  }
  return [...byMentor.values()].sort(
    (a, b) => b.recent + b.overdue - (a.recent + a.overdue) || a.name.localeCompare(b.name)
  )
}

const DAY = 86400000

export const quietDays = (since, now) => Math.floor((now - since) / DAY)

export function monthKeys(now, count) {
  return Array.from({ length: count }, (_, index) =>
    new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - count + 1 + index, 1))
      .toISOString()
      .slice(0, 7)
  )
}

export function weekKey(date) {
  const day = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  return new Date(day - ((day.getUTCDay() + 6) % 7) * DAY).toISOString().slice(0, 10)
}

export function weekKeys(now, count) {
  const last = new Date(weekKey(now))
  return Array.from({ length: count }, (_, index) =>
    new Date(last - (count - 1 - index) * 7 * DAY).toISOString().slice(0, 10)
  )
}

export function enrolmentSeries(keys, dates) {
  const counts = new Map(keys.map((key) => [key, 0]))
  for (const date of dates) {
    const key = date.toISOString().slice(0, 7)
    if (counts.has(key)) counts.set(key, counts.get(key) + 1)
  }
  return keys.map((month) => ({ month, count: counts.get(month) }))
}

export function remarkSeries(keys, remarks) {
  const rows = new Map(keys.map((week) => [week, { week, shared: 0, internal: 0 }]))
  for (const remark of remarks) {
    const row = rows.get(weekKey(remark.created_at))
    if (row && remark.visibility in row) row[remark.visibility] += 1
  }
  return [...rows.values()]
}

export function learningSeries(keys, plays) {
  const rows = new Map(keys.map((week) => [week, { week, games: 0, children: new Set() }]))
  for (const play of plays) {
    const row = rows.get(weekKey(play.completed_at))
    if (!row) continue
    row.games += 1
    row.children.add(play.child_id)
  }
  return [...rows.values()].map((row) => ({ ...row, children: row.children.size }))
}
