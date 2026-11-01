import {
  ASSESSABLE_PLAYERS,
  ASSESS_STEP,
  CONTEXT_PLAYERS,
  CONTEXT_SIZE,
  DEFAULT_SETTINGS,
  ITEM_LINES
} from '../constants/index.js'

export function withDefaults(settings = {}) {
  return Object.fromEntries(
    Object.entries(DEFAULT_SETTINGS).map(([group, defaults]) => [
      group,
      { ...defaults, ...settings[group] }
    ])
  )
}

export const playerOf = (content) => content?.player ?? 'story'

export function contextFor(steps, index) {
  return Array.from(
    { length: Math.min(CONTEXT_SIZE, steps.length - 1) },
    (_, offset) => steps[(index + 1 + offset) % steps.length]
  )
}

export function snapshotItem(lesson, index, points) {
  const player = playerOf(lesson.content)
  const steps = lesson.content?.steps ?? []
  const step = steps[index]
  if (!step || !ASSESSABLE_PLAYERS.includes(player)) return null
  if (CONTEXT_PLAYERS.includes(player) && steps.length <= CONTEXT_SIZE) return null
  const lines = Object.fromEntries(
    ITEM_LINES.filter((name) => lesson.content.lines?.[name]).map((name) => [
      name,
      lesson.content.lines[name]
    ])
  )
  return {
    lesson_id: lesson.id,
    lesson_slug: lesson.slug,
    lesson_version: lesson.version,
    lesson_title: lesson.title,
    step_index: index,
    player,
    contrast: lesson.content.contrast ?? null,
    step,
    context: CONTEXT_PLAYERS.includes(player) ? contextFor(steps, index) : [],
    lines,
    ...(points ? { points } : {})
  }
}

export const itemPoints = (item, settings) => item.points ?? settings.scoring.points

export const maxScore = (items, settings) =>
  items.reduce((sum, item) => sum + itemPoints(item, settings), 0)

export function pointsFor(event, item, settings) {
  if (!event?.correct) return 0
  if (!event.wrongs) return itemPoints(item, settings)
  return event.wrongs < settings.scoring.tries
    ? Math.min(settings.scoring.retry_points, itemPoints(item, settings))
    : 0
}

export function lastAnswers(events) {
  const answers = new Map()
  for (const event of events) {
    if (event.step === ASSESS_STEP) answers.set(event.index, event)
  }
  return answers
}

export function scoreAttempt(events, items, settings) {
  const answers = lastAnswers(events)
  const score = items.reduce((sum, item, index) => {
    const answer = answers.get(index)
    return sum + (answer?.points ?? pointsFor(answer, item, settings))
  }, 0)
  const max = maxScore(items, settings)
  const percent = max ? Math.round((score / max) * 100) : 0
  return {
    score,
    max_score: max,
    percent,
    answered: answers.size,
    passed: settings.scoring.pass_percent === null ? null : percent >= settings.scoring.pass_percent
  }
}

export function keepCollected(event, settings) {
  const { choice, latency_ms: latency, wrongs, ...kept } = event
  return {
    ...kept,
    ...(settings.collect.answers && choice !== undefined ? { choice } : {}),
    ...(settings.collect.time ? { latency_ms: latency } : {}),
    ...(settings.collect.tries ? { wrongs } : {})
  }
}

export function questionStats(items, attempts) {
  return items.map((item, index) => {
    const answers = attempts
      .map((attempt) => lastAnswers(attempt.events).get(index))
      .filter(Boolean)
    const firstTry = answers.filter((answer) => answer.correct && !answer.wrongs).length
    return {
      index,
      text: item.step.text,
      lesson_title: item.lesson_title,
      player: item.player,
      answered: answers.length,
      right_first_try: firstTry,
      accuracy: answers.length ? Math.round((firstTry / answers.length) * 100) : null
    }
  })
}

export const assignmentOf = (child, assessmentId) =>
  (child.assigned_assessments ?? []).find((entry) => entry.assessment_id === assessmentId) ?? null

export function resultOf(attempts) {
  const completed = attempts.filter((attempt) => attempt.status === 'completed')
  const latest = completed[0] ?? null
  return {
    status: latest ? 'completed' : attempts.length ? 'in_progress' : 'not_started',
    attempts: completed.length,
    latest: latest
      ? { attempt_id: latest.id, completed_at: latest.completed_at, ...latest.metadata?.result }
      : null
  }
}

export function hideScore(result) {
  if (!result.latest) return result
  const {
    score: _score,
    max_score: _max,
    percent: _percent,
    passed: _passed,
    ...rest
  } = result.latest
  return { ...result, latest: rest }
}
