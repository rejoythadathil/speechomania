import { PAIRS_PER_BOARD } from '../../lessons/constants/index.js'
import { BADGE_SHARE, FRIENDS, MEDAL_SHARE, STARS_PER_FRIEND } from '../constants/index.js'

const PAGE_PLAYERS = ['story', 'pick']

export function stepsTotal(content) {
  const steps = content.steps?.length ?? 0
  if (content.player === 'pick') return steps
  if (!content.player || PAGE_PLAYERS.includes(content.player)) return steps
  const available = content.player === 'match' ? Math.floor(steps / PAIRS_PER_BOARD) : steps
  return Math.min(content.rounds ?? available, available)
}

export function starsFor(events) {
  const scored = events.filter((event) => event.step === 'check' || event.step === 'play')
  return scored.length ? scored.filter((event) => event.correct && !event.wrongs).length : 1
}

export const badgeStars = (maxStars) => Math.max(1, Math.ceil(maxStars * BADGE_SHARE))

export function maxStars(content) {
  const steps = content.steps?.length ?? 0
  if (!content.player || content.player === 'story') return 1
  if (content.player === 'pick') return steps
  const available = content.player === 'match' ? Math.floor(steps / PAIRS_PER_BOARD) : steps
  return Math.min(content.rounds ?? available, available)
}

export const coverOf = (content) =>
  content.player === 'pick' ? (content.steps?.[0]?.choices ?? null) : null

export const firstStep = (content, field) =>
  content.steps?.find((step) => step[field] !== undefined)?.[field] ?? null

export function bestBySlug(groups, slugOf) {
  const best = new Map()
  for (const group of groups) {
    const slug = slugOf.get(group.lesson_id)?.toLowerCase()
    const current = best.get(slug) ?? { times: 0, stars: null }
    best.set(slug, {
      times: current.times + group._count._all,
      stars: Math.max(current.stars ?? 0, group._max.stars ?? 0)
    })
  }
  return best
}

export function prizeOf(best, max) {
  if (best === null) return null
  const share = best / Math.max(max, 1)
  return share >= BADGE_SHARE ? 'trophy' : share >= MEDAL_SHARE ? 'medal' : 'star'
}

export function friendsFor(stars) {
  const count = Math.min(Math.floor(stars / STARS_PER_FRIEND), FRIENDS.length)
  return {
    earned: FRIENDS.slice(0, count),
    next: FRIENDS[count] ?? null,
    stars_to_next: count < FRIENDS.length ? (count + 1) * STARS_PER_FRIEND - stars : 0,
    total: FRIENDS.length
  }
}

export function newFriend(before, gained) {
  const had = friendsFor(before).earned.length
  const now = friendsFor(before + gained).earned
  return now.length > had ? now[now.length - 1] : null
}

export function rewardOf(stars, before, max) {
  const badge = badgeStars(max)
  return {
    new_best: before.times > 0 && stars > before.best,
    new_badge: stars >= badge && (before.times === 0 || before.best < badge)
  }
}

export function lockedAfter(content, assigned, best) {
  const after = content.after
  if (!after || !assigned.includes(after)) return null
  return best.get(after)?.times ? null : after
}

export function quizResult(events) {
  const quiz = events.filter((event) => event.step === 'quiz')
  if (!quiz.length) return null
  return {
    right: quiz.filter((event) => event.correct && !event.wrongs).length,
    total: quiz.length
  }
}
