import { expect, test } from 'bun:test'
import { sample, tallyOf } from './use-round.js'

const event = (step, correct, wrongs = 0) => ({ step, correct, wrongs })

test('tallyOf counts right answers and the first-try streak at the end', () => {
  expect(tallyOf([])).toEqual({ wins: 0, streak: 0 })
  expect(
    tallyOf([
      event('play', true),
      event('play', false, 1),
      event('card', true),
      event('play', true),
      event('check', true)
    ])
  ).toEqual({ wins: 3, streak: 2 })
  expect(tallyOf([event('play', true), event('play', true, 1)])).toEqual({ wins: 2, streak: 0 })
})

test('sample picks a set number from the pool, keeping the written order when asked', () => {
  const pool = Array.from({ length: 20 }, (_, index) => index)
  const five = sample(pool, 5, true)
  expect(five).toHaveLength(5)
  expect([...five].sort((a, b) => a - b)).toEqual(five)
  expect(new Set(five).size).toBe(5)
  expect(sample(pool, 40)).toHaveLength(20)
  expect(sample(pool, null, true)).toEqual(pool)
})
