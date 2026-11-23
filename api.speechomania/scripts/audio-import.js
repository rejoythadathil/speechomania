import { readdir, readFile } from 'node:fs/promises'
import { ensureMediaBucket, media } from '../common-service/storage/service/index.js'
import { config } from '../config/index.js'

const from = process.argv[2]
if (!from || !media) {
  console.error('Usage: bun run audio:import <folder> (needs the S3_* settings in .env)')
  process.exit(1)
}
const manifest = JSON.parse(await readFile(`${from}/manifest.json`, 'utf8'))
if (
  manifest.voice_id !== config.ELEVENLABS_VOICE_ID ||
  manifest.model !== config.ELEVENLABS_MODEL
) {
  console.error(
    `These recordings use voice ${manifest.voice_id} (${manifest.model}), but this server is set to ${config.ELEVENLABS_VOICE_ID} (${config.ELEVENLABS_MODEL}). Set ELEVENLABS_VOICE_ID and ELEVENLABS_MODEL in .env to match, then run this again.`
  )
  process.exit(1)
}
await ensureMediaBucket()

let uploaded = 0
let present = 0
for (const name of await readdir(`${from}/audio`)) {
  const key = `audio/${name}`
  const file = media.file(key)
  if (await file.exists()) {
    present += 1
    continue
  }
  const type = name.endsWith('.json') ? 'application/json' : 'audio/mpeg'
  await media.write(key, await readFile(`${from}/audio/${name}`), { type })
  uploaded += 1
}
console.log(`${uploaded} files uploaded, ${present} already there`)
process.exit(0)
