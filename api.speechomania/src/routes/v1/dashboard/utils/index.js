import { FOLLOW_UP_WEIGHT, STALE_DAYS } from '../constants/index.js'

export function reasons(row) {
  const list = []
  if (!row.mentor_id) list.push({ code: 'no_mentor', days: null })
  if (row.mentor_id && row.quiet_days >= STALE_DAYS) list.push({ code: row.last_remark_at ? 'no_recent_remark' : 'never_remarked', days: row.quiet_days })
  if (!row.lessons) list.push({ code: 'no_lessons', days: null })
  return list
}

export function rank(item) {
  const codes = item.reasons.map((reason) => reason.code)
  return (codes.includes('no_mentor') ? FOLLOW_UP_WEIGHT.no_mentor : 0) + (codes.includes('no_lessons') ? FOLLOW_UP_WEIGHT.no_lessons : 0) + (item.reasons.find((reason) => reason.days)?.days ?? 0)
}

export function caseload(rows, mentors) {
  const byMentor = new Map(mentors.map((mentor) => [mentor.id, { id: mentor.id, name: mentor.full_name, recent: 0, overdue: 0 }]))
  for (const row of rows) {
    const entry = byMentor.get(row.mentor_id)
    if (entry) entry[row.quiet_days >= STALE_DAYS ? 'overdue' : 'recent'] += 1
  }
  return [...byMentor.values()].sort((a, b) => b.recent + b.overdue - (a.recent + a.overdue) || a.name.localeCompare(b.name))
}
