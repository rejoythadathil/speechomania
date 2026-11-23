import { longDate, wordsOf } from '../../../../../common-service/reports/utils/index.js'

const MAX_REMARKS = 20

function checkResult(row) {
  if (row.status !== 'completed') return '—'
  if (row.score_hidden) return 'Seen by the mentor'
  const latest = row.latest ?? {}
  return `${latest.score} of ${latest.max_score} (${latest.percent}%)`
}

export function progressData({ learner, lessons, assessments, remarks, parentName, today }) {
  const day = longDate(today)
  return {
    child: { name: learner.display_name },
    parent: { name: parentName },
    today: day,
    watermark: `Prepared for ${parentName} · ${day}`,
    stars: learner.stars,
    played: learner.games_played,
    total: learner.games_total,
    trophies: learner.trophies.length,
    levels: learner.levels.map((level) => ({
      name: wordsOf(level.level),
      played: level.played,
      total: level.total
    })),
    lessons: lessons.map((lesson) => ({
      title: lesson.title,
      level: wordsOf(lesson.level) ?? '—',
      times: lesson.times_completed,
      stars: lesson.times_completed ? `${lesson.best_stars} of ${lesson.max_stars}` : '—'
    })),
    assessments: assessments.map((row) => ({
      title: row.title,
      status: wordsOf(row.status),
      result: checkResult(row)
    })),
    remarks: remarks.slice(0, MAX_REMARKS).map((remark) => ({
      date: longDate(remark.created_at),
      author: remark.author_name,
      body: remark.body
    }))
  }
}
