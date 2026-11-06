import { expect, test } from 'bun:test'
import { tallyOf } from './use-round.js'

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
