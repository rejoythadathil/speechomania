import { describe, expect, test } from 'bun:test'
import { deviceVoice } from './use-voice.js'

const voice = (name, lang) => ({ name, lang })

describe('deviceVoice', () => {
  test('prefers an American female voice', () => {
    const voices = [
      voice('Rishi', 'en-IN'),
      voice('Alex', 'en-US'),
      voice('Samantha', 'en-US'),
      voice('Daniel', 'en-GB')
    ]
    expect(deviceVoice(voices).name).toBe('Samantha')
  })

  test('falls back to any American voice, then none', () => {
    expect(deviceVoice([voice('Rishi', 'en-IN'), voice('Fred', 'en_US')]).name).toBe('Fred')
    expect(deviceVoice([voice('Rishi', 'en-IN')])).toBeNull()
  })
})
