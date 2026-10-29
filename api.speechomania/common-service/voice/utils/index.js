import { createHash } from 'node:crypto'
import { AUDIO_FOLDER, VOICE_SETTINGS } from '../constants/index.js'

export function audioBase(text, { voiceId, model }) {
  const hash = createHash('sha256').update(JSON.stringify([voiceId, model, VOICE_SETTINGS, text])).digest('hex').slice(0, 24)
  return `${AUDIO_FOLDER}/${hash}`
}

export function wordTimings(text, alignment) {
  const words = []
  let current = ''
  let start = 0
  let end = 0
  alignment.characters.forEach((char, index) => {
    if (/\s/.test(char)) {
      if (current) words.push({ word: current, start, end })
      current = ''
      return
    }
    if (!current) start = alignment.character_start_times_seconds[index]
    current += char
    end = alignment.character_end_times_seconds[index]
  })
  if (current) words.push({ word: current, start, end })
  const shown = text.trim().split(/\s+/)
  if (words.length !== shown.length) return []
  return words.map((word, index) => ({ ...word, word: shown[index] }))
}

export function lessonLines(content) {
  const lines = Object.values(content.lines ?? {})
  for (const step of content.steps ?? []) {
    lines.push(step)
    if (step.praise) lines.push(step.praise)
    if (step.teach) lines.push(step.teach)
  }
  return lines
}
