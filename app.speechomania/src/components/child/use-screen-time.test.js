import { expect, test } from 'bun:test'
import { NUDGE_EVERY, PLAY_LIMIT, REST, nextTime, nudgeDue } from './use-screen-time.js'

const play = (state, ms) => {
  let current = state
  for (let at = 1000; at <= ms; at += 1000) current = nextTime(current, current.last + 1000)
  return current
}

test('nudges every fifteen minutes of play', () => {
  const start = nextTime(null, 0)
  const later = play(start, NUDGE_EVERY)
  expect(nudgeDue(later)).toBe(true)
  expect(nudgeDue({ ...later, nudged: 1 })).toBe(false)
})

test('forces a rest at the hour, then starts fresh after it', () => {
  const tired = play(nextTime(null, 0), PLAY_LIMIT)
  expect(tired.rest_until).toBe(tired.last + REST)
  expect(nudgeDue(tired)).toBe(false)
  expect(nextTime(tired, tired.last + 1000).rest_until).toBe(tired.rest_until)
  expect(nextTime(tired, tired.rest_until).used).toBe(0)
})

test('time away does not count, and a long time away is a rest', () => {
  const start = play(nextTime(null, 0), 10000)
  expect(nextTime(start, start.last + 60000).used).toBe(start.used + 5000)
  expect(nextTime(start, start.last + REST).used).toBe(0)
})
