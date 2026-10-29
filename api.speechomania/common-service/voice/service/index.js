import { config } from '../../../config/index.js'
import { media } from '../../storage/service/index.js'
import { ELEVENLABS_URL, OUTPUT_FORMAT, VOICE_SETTINGS } from '../constants/index.js'
import { voiceFailed, voiceNotConfigured } from '../exception/index.js'
import { audioBase, wordTimings } from '../utils/index.js'

export const voiceReady = Boolean(config.ELEVENLABS_API_KEY && media)

export const audioKey = (text) => `${audioBase(text, { voiceId: config.ELEVENLABS_VOICE_ID, model: config.ELEVENLABS_MODEL })}.mp3`

export async function speechFor(text) {
  if (!voiceReady) throw voiceNotConfigured()
  const base = audioKey(text).replace(/\.mp3$/, '')
  const timings = media.file(`${base}.json`)
  if (await timings.exists()) return { key: `${base}.mp3`, ...(await timings.json()), generated: false }
  const response = await fetch(`${ELEVENLABS_URL}/${config.ELEVENLABS_VOICE_ID}/with-timestamps?output_format=${OUTPUT_FORMAT}`, {
    method: 'POST',
    headers: { 'xi-api-key': config.ELEVENLABS_API_KEY, 'content-type': 'application/json' },
    body: JSON.stringify({ text, model_id: config.ELEVENLABS_MODEL, voice_settings: VOICE_SETTINGS })
  })
  if (!response.ok) throw voiceFailed(response.status, text)
  const body = await response.json()
  const alignment = body.normalized_alignment ?? body.alignment
  const result = { duration: alignment.character_end_times_seconds.at(-1), words: wordTimings(text, alignment) }
  await media.write(`${base}.mp3`, Buffer.from(body.audio_base64, 'base64'), { type: 'audio/mpeg' })
  await media.write(`${base}.json`, JSON.stringify(result), { type: 'application/json' })
  return { key: `${base}.mp3`, ...result, generated: true }
}
