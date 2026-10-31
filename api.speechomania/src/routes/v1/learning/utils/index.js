import { PAIRS_PER_BOARD } from '../../lessons/constants/index.js'
import { BADGE_SHARE } from '../constants/index.js'

const PAGE_PLAYERS = ['story', 'pick']

export function stepsTotal(content) {
  const steps = content.steps?.length ?? 0
  if (content.player === 'pick') return steps * 2
  if (!content.player || PAGE_PLAYERS.includes(content.player)) return steps
  const available = content.player === 'match' ? Math.floor(steps / PAIRS_PER_BOARD) : steps
  return Math.min(content.rounds ?? available, available)
}

export function starsFor(events) {
  const scored = events.filter((event) => event.step === 'check' || event.step === 'play')
  return scored.length ? scored.filter((event) => event.correct && !event.wrongs).length : 1
}

export const badgeStars = (maxStars) => Math.max(1, Math.ceil(maxStars * BADGE_SHARE))
