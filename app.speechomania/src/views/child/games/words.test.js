import { expect, test } from 'bun:test'
import { longForm } from './words.js'

test('longForm writes the sentence with the two long words', () => {
  const step = (text, answer, first, second) => ({ sentence: { text }, answer, first, second })
  expect(longForm(step('I’ll go to school.', 'I’ll', 'I', 'will'))).toBe('I will go to school.')
  expect(longForm(step('Don’t touch the fire.', 'don’t', 'do', 'not'))).toBe(
    'Do not touch the fire.'
  )
  expect(longForm(step('He isn’t awake.', 'isn’t', 'is', 'not'))).toBe('He is not awake.')
  expect(longForm({ answer: 'I’m' })).toBeNull()
})
