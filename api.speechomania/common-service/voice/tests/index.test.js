import { describe, expect, test } from 'bun:test'
import { media } from '../../storage/service/index.js'
import { audioKey, speechFor, voiceReady } from '../service/index.js'
import { audioBase, lessonLines, wordTimings } from '../utils/index.js'

const alignment = (text, step = 0.1) => ({
  characters: [...text],
  character_start_times_seconds: [...text].map((_, index) => index * step),
  character_end_times_seconds: [...text].map((_, index) => (index + 1) * step)
})

describe('voice utils', () => {
  test('word timings follow the characters and keep the displayed words', () => {
    const words = wordTimings('Who can’t swim?', alignment('Who can’t swim?'))
    expect(words.map((word) => word.word)).toEqual(['Who', 'can’t', 'swim?'])
    expect(words[1].start).toBeCloseTo(0.4)
    expect(words[1].end).toBeCloseTo(0.9)
  })

  test('timings are dropped when the words do not line up', () => {
    expect(wordTimings('Who can swim?', alignment('Who can'))).toEqual([])
  })

  test('the audio name depends on voice, model and text', () => {
    const base = audioBase('Hello', { voiceId: 'v', model: 'm' })
    expect(base).toMatch(/^audio\/[0-9a-f]{24}$/)
    expect(audioBase('Hello', { voiceId: 'v', model: 'm' })).toBe(base)
    expect(audioBase('Hello!', { voiceId: 'v', model: 'm' })).not.toBe(base)
    expect(audioBase('Hello', { voiceId: 'w', model: 'm' })).not.toBe(base)
  })

  test('every spoken line of a lesson is collected', () => {
    const content = { lines: { intro: { text: 'a' } }, steps: [{ text: 'b', praise: { text: 'c' }, teach: { text: 'd' } }, { text: 'e' }] }
    expect(lessonLines(content).map((line) => line.text)).toEqual(['a', 'b', 'c', 'd', 'e'])
  })
})

describe.if(voiceReady)('speechFor', () => {
  test('a line already in storage is reused without calling ElevenLabs', async () => {
    const text = `Test line ${crypto.randomUUID()}`
    const key = audioKey(text)
    const base = key.replace(/\.mp3$/, '')
    await media.write(key, 'mp3')
    await media.write(`${base}.json`, JSON.stringify({ duration: 1, words: [] }))
    expect(await speechFor(text)).toEqual({ key, duration: 1, words: [], generated: false })
    await media.delete(key)
    await media.delete(`${base}.json`)
  })
})
