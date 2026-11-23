import { expect, test } from 'bun:test'
import { inSets } from './sets.js'

const pages = (count) => Array.from({ length: count }, (_, index) => ({ step: 'play', index }))
const shape = (list) => list.map((page) => (page.step === 'break' ? '|' : page.set)).join('')

test('a game plays in sets of five with a break between sets', () => {
  expect(shape(inSets(pages(15)))).toBe('11111|22222|33333')
  expect(shape(inSets(pages(5)))).toBe('11111')
})

test('a short last set joins the one before it', () => {
  expect(shape(inSets(pages(12)))).toBe('11111|2222222')
  expect(shape(inSets(pages(4)))).toBe('1111')
})
