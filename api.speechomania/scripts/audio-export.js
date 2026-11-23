import { mkdir, writeFile } from 'node:fs/promises'
import { db } from '../common-service/db/service/index.js'
import { media } from '../common-service/storage/service/index.js'
import { config } from '../config/index.js'

const out = process.argv[2]
if (!out || !media) {
  console.error('Usage: bun run audio:export <folder> (needs the S3_* settings in .env)')
  process.exit(1)
}

const keys = new Set()
const collect = (value) => {
  if (Array.isArray(value)) return value.forEach(collect)
  if (!value || typeof value !== 'object') return
  if (typeof value.audio?.key === 'string') keys.add(value.audio.key)
  Object.values(value).forEach(collect)
}
const lessons = await db.lessons.findMany({
  where: { status: 'published' },
  select: { content: true }
})
const assessments = await db.assessments.findMany({
  where: { status: 'published' },
  select: { items: true }
})
lessons.forEach((row) => collect(row.content))
assessments.forEach((row) => collect(row.items))

await mkdir(`${out}/audio`, { recursive: true })
let missing = 0
for (const key of keys) {
  for (const name of [key, key.replace(/\.mp3$/, '.json')]) {
    const file = media.file(name)
    if (!(await file.exists())) {
      missing += 1
      console.error(`missing    ${name}`)
      continue
    }
    await writeFile(`${out}/${name}`, Buffer.from(await file.arrayBuffer()))
  }
}
await writeFile(
  `${out}/manifest.json`,
  JSON.stringify(
    { voice_id: config.ELEVENLABS_VOICE_ID, model: config.ELEVENLABS_MODEL, recordings: keys.size },
    null,
    2
  )
)
console.log(
  `${keys.size} recordings exported to ${out}${missing ? `, ${missing} files missing` : ''}`
)
await db.$disconnect()
process.exit(missing ? 1 : 0)
